// Admin API: Manually Match Unmatched Meetings
// POST - Match an unmatched meeting to a church/call

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession, isAdmin } from '@/lib/auth';
import { fetchTranscript, saveTranscript, linkTranscriptToCall } from '@/lib/fireflies';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/admin/transcripts/match
 * Manually match an unmatched Fireflies meeting to a church and call
 *
 * Body:
 * {
 *   unmatched_meeting_id: string
 *   church_id: string
 *   call_id?: string  // Optional: link to existing scheduled_call
 *   create_call?: {   // Optional: create new scheduled_call
 *     call_type: string
 *     scheduled_at: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const {
      unmatched_meeting_id,
      church_id,
      call_id,
      create_call,
    } = body;

    if (!unmatched_meeting_id || !church_id) {
      return NextResponse.json(
        { error: 'unmatched_meeting_id and church_id are required' },
        { status: 400 }
      );
    }

    // Get unmatched meeting
    const { data: unmatchedMeeting, error: fetchError } = await supabase
      .from('unmatched_fireflies_meetings')
      .select('*')
      .eq('id', unmatched_meeting_id)
      .single();

    if (fetchError || !unmatchedMeeting) {
      return NextResponse.json(
        { error: 'Unmatched meeting not found' },
        { status: 404 }
      );
    }

    let finalCallId = call_id;

    // Create new scheduled_call if requested
    if (create_call && !call_id) {
      const { data: newCall, error: createError } = await supabase
        .from('scheduled_calls')
        .insert({
          church_id,
          call_type: create_call.call_type,
          scheduled_at: create_call.scheduled_at || unmatchedMeeting.meeting_date,
          completed: true, // Mark as completed since meeting already happened
        })
        .select('id')
        .single();

      if (createError || !newCall) {
        return NextResponse.json(
          { error: 'Failed to create scheduled call' },
          { status: 500 }
        );
      }

      finalCallId = newCall.id;
    }

    // Fetch full transcript from Fireflies
    const transcript = await fetchTranscript(unmatchedMeeting.fireflies_meeting_id);

    if (!transcript) {
      return NextResponse.json(
        { error: 'Failed to fetch transcript from Fireflies' },
        { status: 500 }
      );
    }

    // Save transcript to meeting_transcripts
    const { success, transcriptId } = await saveTranscript(transcript, finalCallId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save transcript' },
        { status: 500 }
      );
    }

    // Link to scheduled_call if we have one
    if (finalCallId) {
      await linkTranscriptToCall(
        finalCallId,
        unmatchedMeeting.fireflies_meeting_id,
        unmatchedMeeting.transcript_url || '',
        unmatchedMeeting.ai_summary,
      );
    }

    // Update unmatched_fireflies_meetings record
    await supabase
      .from('unmatched_fireflies_meetings')
      .update({
        matched_church_id: church_id,
        matched_call_id: finalCallId,
        matched_at: new Date().toISOString(),
        matched_by: session.user.email,
      })
      .eq('id', unmatched_meeting_id);

    return NextResponse.json({
      success: true,
      transcript_id: transcriptId,
      call_id: finalCallId,
      message: 'Meeting matched successfully',
    });
  } catch (error) {
    console.error('Failed to match meeting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
