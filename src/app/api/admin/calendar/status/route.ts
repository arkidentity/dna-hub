import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';
import { getGoogleCalendarStatus } from '@/lib/google-calendar';

export async function GET() {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get calendar connection status
    const status = await getGoogleCalendarStatus(session.email);

    // Get unmatched events if connected
    let unmatchedEvents: unknown[] = [];
    if (status.connected) {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('unmatched_calendar_events')
        .select('*')
        .is('matched_church_id', null)
        .order('event_start', { ascending: false })
        .limit(10);

      unmatchedEvents = data || [];
    }

    return NextResponse.json({ status, unmatchedEvents });
  } catch (error) {
    console.error('[CALENDAR STATUS] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get calendar status' },
      { status: 500 }
    );
  }
}
