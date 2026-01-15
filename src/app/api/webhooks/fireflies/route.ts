// Fireflies.ai Webhook Handler
// Receives notifications when transcripts are ready

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  fetchTranscript,
  matchMeetingToChurch,
  saveTranscript,
  linkTranscriptToCall,
  saveUnmatchedMeeting,
  getFirefliesSettings,
  verifyWebhookSignature,
} from '@/lib/fireflies';
import type { FirefliesWebhookPayload } from '@/lib/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/webhooks/fireflies
 *
 * Receives webhook notifications from Fireflies when:
 * - Transcription is completed
 * - Audio is uploaded
 *
 * Workflow:
 * 1. Verify webhook signature
 * 2. Log webhook event
 * 3. Fetch transcript from Fireflies API
 * 4. Match to church and scheduled call
 * 5. Save transcript to database
 * 6. Link to scheduled_calls if matched
 */
export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Parse webhook payload
    const body = await request.text();
    const payload: FirefliesWebhookPayload = JSON.parse(body);

    console.log('Received Fireflies webhook:', payload);

    // Verify webhook signature if secret is configured
    const settings = await getFirefliesSettings();
    if (settings?.webhook_secret) {
      const signature = request.headers.get('x-hub-signature');
      if (!signature || !verifyWebhookSignature(body, signature, settings.webhook_secret)) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Log webhook event
    const { data: logEntry } = await supabase
      .from('fireflies_webhook_log')
      .insert({
        fireflies_meeting_id: payload.meetingId,
        event_type: payload.eventType,
        client_reference_id: payload.clientReferenceId,
        payload: payload as unknown as Record<string, unknown>,
        processed: false,
      })
      .select('id')
      .single();

    const logId = logEntry?.id;

    // Update last webhook received timestamp
    await supabase
      .from('fireflies_settings')
      .update({ last_webhook_received_at: new Date().toISOString() })
      .eq('admin_email', settings?.admin_email);

    // Only process transcription_completed events
    if (payload.eventType !== 'transcription_completed') {
      console.log('Ignoring non-transcription event:', payload.eventType);
      return NextResponse.json({
        success: true,
        message: 'Event logged, not processing'
      });
    }

    // Check if auto-processing is enabled
    if (!settings?.auto_process_enabled) {
      console.log('Auto-processing disabled, skipping');
      return NextResponse.json({
        success: true,
        message: 'Auto-processing disabled'
      });
    }

    // Fetch transcript from Fireflies
    console.log('Fetching transcript:', payload.meetingId);
    const transcript = await fetchTranscript(payload.meetingId);

    if (!transcript) {
      const errorMsg = 'Failed to fetch transcript from Fireflies';
      console.error(errorMsg);

      if (logId) {
        await supabase
          .from('fireflies_webhook_log')
          .update({
            processed: false,
            error_message: errorMsg,
            processed_at: new Date().toISOString(),
          })
          .eq('id', logId);
      }

      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    console.log('Transcript fetched:', transcript.title);

    // Match to church and scheduled call (if auto-matching enabled)
    let churchId: string | null = null;
    let callId: string | null = null;

    if (settings?.auto_match_enabled) {
      const match = await matchMeetingToChurch(
        transcript.title,
        transcript.participants || [],
        transcript.meeting_date || new Date().toISOString()
      );

      churchId = match.churchId;
      callId = match.callId;

      console.log('Match result:', { churchId, callId, callType: match.callType });
    }

    // Save transcript to meeting_transcripts table
    const { success: saveSuccess, transcriptId, error: saveError } = await saveTranscript(
      transcript,
      callId || undefined
    );

    if (!saveSuccess) {
      const errorMsg = `Failed to save transcript: ${saveError}`;
      console.error(errorMsg);

      if (logId) {
        await supabase
          .from('fireflies_webhook_log')
          .update({
            processed: false,
            error_message: errorMsg,
            processed_at: new Date().toISOString(),
          })
          .eq('id', logId);
      }

      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    console.log('Transcript saved:', transcriptId);

    // If matched to a call, link it
    if (callId) {
      await linkTranscriptToCall(
        callId,
        transcript.fireflies_meeting_id,
        transcript.transcript_url || '',
        transcript.ai_summary,
        transcript.action_items,
        transcript.keywords
      );

      console.log('Transcript linked to call:', callId);
    } else {
      // No match found - save to unmatched_fireflies_meetings
      await saveUnmatchedMeeting(transcript);
      console.log('Saved as unmatched meeting');
    }

    // Update webhook log as processed
    if (logId) {
      await supabase
        .from('fireflies_webhook_log')
        .update({
          processed: true,
          matched_church_id: churchId,
          matched_call_id: callId,
          processed_at: new Date().toISOString(),
        })
        .eq('id', logId);
    }

    return NextResponse.json({
      success: true,
      transcriptId,
      matched: !!callId,
      churchId,
      callId,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/fireflies
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/webhooks/fireflies',
    methods: ['POST'],
  });
}
