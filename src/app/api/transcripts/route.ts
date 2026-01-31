// Church API: View Meeting Transcripts
// GET - Get transcripts for current church (only visible ones)

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUnifiedSession, getPrimaryChurch } from '@/lib/unified-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/transcripts
 * Get meeting transcripts for the authenticated church
 * Only returns transcripts that have visible_to_church = true
 */
export async function GET() {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const churchId = getPrimaryChurch(session);
    if (!churchId) {
      return NextResponse.json({ error: 'No church associated with session' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get scheduled calls with transcripts for this church
    const { data: calls, error } = await supabase
      .from('scheduled_calls')
      .select(`
        id,
        call_type,
        scheduled_at,
        completed,
        meet_link,
        fireflies_meeting_id,
        transcript_url,
        ai_summary,
        action_items,
        keywords,
        transcript_processed_at,
        visible_to_church
      `)
      .eq('church_id', churchId)
      .eq('visible_to_church', true)
      .not('fireflies_meeting_id', 'is', null)
      .order('scheduled_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch transcripts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transcripts' },
        { status: 500 }
      );
    }

    // Get full transcript data if available
    const callsWithTranscripts = await Promise.all(
      (calls || []).map(async (call) => {
        if (!call.fireflies_meeting_id) {
          return { ...call, full_transcript: null };
        }

        const { data: transcript } = await supabase
          .from('meeting_transcripts')
          .select('*')
          .eq('fireflies_meeting_id', call.fireflies_meeting_id)
          .single();

        return {
          ...call,
          full_transcript: transcript,
        };
      })
    );

    return NextResponse.json({
      transcripts: callsWithTranscripts,
    });
  } catch (error) {
    console.error('Failed to get transcripts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
