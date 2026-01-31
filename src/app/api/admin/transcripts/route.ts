// Admin API: Meeting Transcripts Management
// GET - List all transcripts
// PATCH - Update transcript (edit summary, approve for church viewing)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/transcripts
 * Get all meeting transcripts with church info
 *
 * Query params:
 * - church_id: Filter by church
 * - unmatched: If 'true', return only unmatched meetings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session || !isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const churchId = searchParams.get('church_id');
    const unmatchedOnly = searchParams.get('unmatched') === 'true';

    if (unmatchedOnly) {
      // Return unmatched meetings
      const { data, error } = await supabase
        .from('unmatched_fireflies_meetings')
        .select('*')
        .is('matched_church_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch unmatched meetings:', error);
        return NextResponse.json({ error: 'Failed to fetch unmatched meetings' }, { status: 500 });
      }

      return NextResponse.json({ unmatched_meetings: data });
    }

    // Build query for matched transcripts
    let query = supabase
      .from('meeting_transcripts')
      .select(`
        *,
        scheduled_call:scheduled_calls(
          id,
          call_type,
          scheduled_at,
          completed,
          visible_to_church,
          church:churches(
            id,
            name,
            status
          )
        )
      `)
      .order('processed_at', { ascending: false });

    // Filter by church if provided
    if (churchId) {
      query = query.eq('scheduled_calls.church_id', churchId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch transcripts:', error);
      return NextResponse.json({ error: 'Failed to fetch transcripts' }, { status: 500 });
    }

    return NextResponse.json({ transcripts: data });
  } catch (error) {
    console.error('Failed to get transcripts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/transcripts
 * Update transcript (edit summary, approve for viewing, etc.)
 *
 * Body:
 * {
 *   transcript_id?: string  // For meeting_transcripts table
 *   call_id?: string        // For scheduled_calls table
 *   ai_summary?: string
 *   action_items?: string[]
 *   visible_to_church?: boolean
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session || !isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const {
      transcript_id,
      call_id,
      ai_summary,
      action_items,
      visible_to_church,
    } = body;

    // Update meeting_transcripts if transcript_id provided
    if (transcript_id) {
      const updates: Record<string, unknown> = {};
      if (ai_summary !== undefined) updates.ai_summary = ai_summary;
      if (action_items !== undefined) updates.action_items = action_items;

      const { error } = await supabase
        .from('meeting_transcripts')
        .update(updates)
        .eq('id', transcript_id);

      if (error) {
        console.error('Failed to update transcript:', error);
        return NextResponse.json({ error: 'Failed to update transcript' }, { status: 500 });
      }
    }

    // Update scheduled_calls if call_id provided
    if (call_id) {
      const updates: Record<string, unknown> = {};
      if (ai_summary !== undefined) updates.ai_summary = ai_summary;
      if (action_items !== undefined) updates.action_items = action_items;
      if (visible_to_church !== undefined) updates.visible_to_church = visible_to_church;

      const { error } = await supabase
        .from('scheduled_calls')
        .update(updates)
        .eq('id', call_id);

      if (error) {
        console.error('Failed to update scheduled call:', error);
        return NextResponse.json({ error: 'Failed to update scheduled call' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Transcript updated successfully',
    });
  } catch (error) {
    console.error('Failed to update transcript:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
