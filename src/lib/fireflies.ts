// Fireflies.ai GraphQL API Client
// Documentation: https://docs.fireflies.ai/

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import type { FirefliesTranscriptResponse, MeetingTranscript, TranscriptSentence, KeyMoment } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Fireflies GraphQL API endpoint
const FIREFLIES_API_URL = 'https://api.fireflies.ai/graphql';

// ============================================================================
// Settings Management
// ============================================================================

/**
 * Get Fireflies API key from database
 */
export async function getFirefliesApiKey(): Promise<string | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('fireflies_settings')
    .select('api_key')
    .single();

  if (error || !data) {
    console.error('Failed to get Fireflies API key:', error);
    return null;
  }

  return data.api_key;
}

/**
 * Check if Fireflies is connected
 */
export async function isFirefliesConnected(): Promise<boolean> {
  const apiKey = await getFirefliesApiKey();
  return !!apiKey;
}

/**
 * Get Fireflies settings
 */
export async function getFirefliesSettings() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('fireflies_settings')
    .select('*')
    .single();

  if (error) {
    console.error('Failed to get Fireflies settings:', error);
    return null;
  }

  return data;
}

/**
 * Save or update Fireflies API key
 */
export async function saveFirefliesApiKey(
  adminEmail: string,
  apiKey: string,
  webhookSecret?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase
    .from('fireflies_settings')
    .upsert({
      admin_email: adminEmail,
      api_key: apiKey,
      webhook_secret: webhookSecret,
      auto_process_enabled: true,
      auto_match_enabled: true,
      auto_share_with_churches: false, // Require manual approval by default
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'admin_email'
    });

  if (error) {
    console.error('Failed to save Fireflies API key:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Disconnect Fireflies
 */
export async function disconnectFireflies(adminEmail: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase
    .from('fireflies_settings')
    .delete()
    .eq('admin_email', adminEmail);

  if (error) {
    console.error('Failed to disconnect Fireflies:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================================================
// GraphQL API Client
// ============================================================================

/**
 * Make a GraphQL request to Fireflies API
 */
async function makeFirefliesRequest<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T | null> {
  const apiKey = await getFirefliesApiKey();

  if (!apiKey) {
    console.error('Fireflies API key not configured');
    return null;
  }

  try {
    const response = await fetch(FIREFLIES_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      console.error('Fireflies API request failed:', response.statusText);
      return null;
    }

    const result = await response.json();

    if (result.errors) {
      console.error('Fireflies GraphQL errors:', result.errors);
      return null;
    }

    return result as T;
  } catch (error) {
    console.error('Fireflies API request error:', error);
    return null;
  }
}

/**
 * Fetch AI summary and highlights from Fireflies (NOT full transcript)
 */
export async function fetchTranscript(meetingId: string): Promise<MeetingTranscript | null> {
  const query = `
    query GetTranscript($id: String!) {
      transcript(id: $id) {
        id
        title
        date
        duration
        participants {
          name
          email
        }
        transcript_url
        summary {
          overview
          action_items
          keywords
          key_moments {
            title
            description
            start_time
          }
        }
      }
    }
  `;

  const result = await makeFirefliesRequest<FirefliesTranscriptResponse>(query, { id: meetingId });

  if (!result || !result.data?.transcript) {
    return null;
  }

  const transcript = result.data.transcript;

  // Transform to our internal format
  // NOTE: We intentionally do NOT store full_transcript or sentences
  // Only store AI-generated summaries, action items, and highlights
  return {
    id: '', // Will be generated by database
    fireflies_meeting_id: transcript.id,
    title: transcript.title,
    duration: transcript.duration,
    meeting_date: transcript.date,
    participants: transcript.participants.map(p => p.email || p.name).filter(Boolean),
    full_transcript: undefined, // Don't store full transcript
    sentences: undefined, // Don't store sentence-by-sentence transcript
    ai_summary: transcript.summary?.overview,
    action_items: transcript.summary?.action_items,
    keywords: transcript.summary?.keywords,
    key_moments: transcript.summary?.key_moments?.map(km => ({
      title: km.title,
      description: km.description,
      start_time: km.start_time,
    })) as KeyMoment[],
    transcript_url: transcript.transcript_url, // Link to view on Fireflies if needed
    audio_url: undefined, // Don't store audio URL
    video_url: undefined, // Don't store video URL
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ============================================================================
// Webhook Validation
// ============================================================================

/**
 * Verify Fireflies webhook signature
 * Fireflies sends x-hub-signature header with SHA-256 HMAC
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

// ============================================================================
// Meeting Matching Logic
// ============================================================================

/**
 * Match a Fireflies meeting to a church, scheduled call, and milestone
 * Matching strategies:
 * 1. Match by participant email (church leader email)
 * 2. Match by meeting title (contains church name)
 * PRIMARY: Match by meeting date (within 24 hours)
 * BACKUP: Match by call type keywords in title
 */
export async function matchMeetingToChurch(
  meetingTitle: string,
  participants: string[],
  meetingDate: string
): Promise<{
  churchId: string | null;
  callId: string | null;
  callType: string | null;
  milestoneId: string | null;
}> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Strategy 1: Match by participant email
  if (participants.length > 0) {
    const { data: leaders } = await supabase
      .from('church_leaders')
      .select('church_id, email')
      .in('email', participants);

    if (leaders && leaders.length > 0) {
      const churchId = leaders[0].church_id;

      // PRIMARY: Try to match by date first (any call within 24 hours)
      const { data: callByDate } = await supabase
        .from('scheduled_calls')
        .select('id, call_type')
        .eq('church_id', churchId)
        .gte('scheduled_at', new Date(new Date(meetingDate).getTime() - 24 * 60 * 60 * 1000).toISOString()) // 1 day before
        .lte('scheduled_at', new Date(new Date(meetingDate).getTime() + 24 * 60 * 60 * 1000).toISOString()) // 1 day after
        .is('fireflies_meeting_id', null)
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .single();

      if (callByDate) {
        // Matched by date! Use the call's type
        const milestoneId = await matchCallTypeToMilestone(callByDate.call_type, churchId);

        return {
          churchId,
          callId: callByDate.id,
          callType: callByDate.call_type,
          milestoneId,
        };
      }

      // BACKUP: If no date match, try matching by call type keywords
      const callType = detectCallType(meetingTitle);
      const { data: callByType } = await supabase
        .from('scheduled_calls')
        .select('id')
        .eq('church_id', churchId)
        .eq('call_type', callType)
        .is('fireflies_meeting_id', null)
        .order('scheduled_at', { ascending: false })
        .limit(1)
        .single();

      // Match to milestone based on detected call type
      const milestoneId = await matchCallTypeToMilestone(callType, churchId);

      return {
        churchId,
        callId: callByType?.id || null,
        callType,
        milestoneId,
      };
    }
  }

  // Strategy 2: Match by church name in title
  const { data: churches } = await supabase
    .from('churches')
    .select('id, name');

  if (churches) {
    for (const church of churches) {
      if (meetingTitle.toLowerCase().includes(church.name.toLowerCase())) {

        // PRIMARY: Try to match by date first
        const { data: callByDate } = await supabase
          .from('scheduled_calls')
          .select('id, call_type')
          .eq('church_id', church.id)
          .gte('scheduled_at', new Date(new Date(meetingDate).getTime() - 24 * 60 * 60 * 1000).toISOString())
          .lte('scheduled_at', new Date(new Date(meetingDate).getTime() + 24 * 60 * 60 * 1000).toISOString())
          .is('fireflies_meeting_id', null)
          .order('scheduled_at', { ascending: true })
          .limit(1)
          .single();

        if (callByDate) {
          // Matched by date! Use the call's type
          const milestoneId = await matchCallTypeToMilestone(callByDate.call_type, church.id);

          return {
            churchId: church.id,
            callId: callByDate.id,
            callType: callByDate.call_type,
            milestoneId,
          };
        }

        // BACKUP: If no date match, try matching by call type keywords
        const callType = detectCallType(meetingTitle);
        const { data: callByType } = await supabase
          .from('scheduled_calls')
          .select('id')
          .eq('church_id', church.id)
          .eq('call_type', callType)
          .is('fireflies_meeting_id', null)
          .order('scheduled_at', { ascending: false })
          .limit(1)
          .single();

        // Match to milestone based on detected call type
        const milestoneId = await matchCallTypeToMilestone(callType, church.id);

        return {
          churchId: church.id,
          callId: callByType?.id || null,
          callType,
          milestoneId,
        };
      }
    }
  }

  // No match found
  return {
    churchId: null,
    callId: null,
    callType: detectCallType(meetingTitle),
    milestoneId: null,
  };
}

/**
 * Detect call type from meeting title
 */
function detectCallType(title: string): string {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes('discovery')) return 'discovery';
  if (lowerTitle.includes('proposal') || lowerTitle.includes('agreement')) return 'proposal';
  if (lowerTitle.includes('strategy')) return 'strategy';
  if (lowerTitle.includes('kick-off') || lowerTitle.includes('kickoff') || lowerTitle.includes('kick off')) return 'kickoff';
  if (lowerTitle.includes('assessment')) return 'assessment';
  if (lowerTitle.includes('onboarding')) return 'onboarding';
  if (lowerTitle.includes('check-in') || lowerTitle.includes('checkin') || lowerTitle.includes('check in')) return 'checkin';
  if (lowerTitle.includes('dna')) return 'discovery'; // Default DNA meetings to discovery

  return 'checkin'; // Default fallback
}

/**
 * Match call type to appropriate milestone
 * Maps common call types to their corresponding DNA Journey milestones
 */
async function matchCallTypeToMilestone(
  callType: string,
  churchId: string
): Promise<string | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Map call types to milestone titles (fuzzy matching)
  const milestoneMapping: Record<string, string[]> = {
    'discovery': ['Vision Alignment Meeting', 'Initial Discovery'],
    'proposal': ['Review Partnership Agreement', 'Proposal'],
    'strategy': ['Set Implementation Timeline', 'Strategy'],
    'kickoff': ['Kick-off Meeting', 'Launch', 'Begin'],
    'assessment': ['Complete Dam Assessment', 'Assessment'],
    'onboarding': ['Onboarding', 'Getting Started'],
    'checkin': ['Check-in', 'Follow-up', 'Review'],
  };

  const searchTerms = milestoneMapping[callType] || [];

  if (searchTerms.length === 0) {
    return null;
  }

  // Get church's current phase to narrow down milestone search
  const { data: church } = await supabase
    .from('churches')
    .select('current_phase')
    .eq('id', churchId)
    .single();

  if (!church) {
    return null;
  }

  // Get phases for the church's current phase (and adjacent phases for flexibility)
  const phaseNumbers = [
    church.current_phase - 1,
    church.current_phase,
    church.current_phase + 1,
  ].filter(p => p >= 0 && p <= 5);

  const { data: phases } = await supabase
    .from('phases')
    .select('id')
    .in('phase_number', phaseNumbers);

  if (!phases || phases.length === 0) {
    return null;
  }

  const phaseIds = phases.map(p => p.id);

  // Search for milestones matching the call type within relevant phases
  for (const searchTerm of searchTerms) {
    const { data: milestone } = await supabase
      .from('milestones')
      .select('id')
      .in('phase_id', phaseIds)
      .ilike('title', `%${searchTerm}%`)
      .order('display_order', { ascending: true })
      .limit(1)
      .single();

    if (milestone) {
      return milestone.id;
    }
  }

  return null;
}

// ============================================================================
// Database Operations
// ============================================================================


/**
 * Update scheduled_calls table with transcript info
 */
export async function linkTranscriptToCall(
  callId: string,
  firefliesMeetingId: string,
  transcriptUrl: string,
  aiSummary?: string,
  actionItems?: string[],
  keywords?: string[],
  milestoneId?: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase
    .from('scheduled_calls')
    .update({
      fireflies_meeting_id: firefliesMeetingId,
      transcript_url: transcriptUrl,
      ai_summary: aiSummary,
      action_items: actionItems,
      keywords: keywords,
      milestone_id: milestoneId,
      transcript_processed_at: new Date().toISOString(),
      visible_to_church: false, // Admin must approve before visible
    })
    .eq('id', callId);

  if (error) {
    console.error('Failed to link transcript to call:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

