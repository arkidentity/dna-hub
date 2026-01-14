import { NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { syncCalendarEvents } from '@/lib/google-calendar';

export async function POST() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = await isAdmin(session.leader.email);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Run calendar sync
    const result = await syncCalendarEvents(session.leader.email);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[CALENDAR SYNC] Error:', error);
    return NextResponse.json(
      { error: 'Calendar sync failed', details: String(error) },
      { status: 500 }
    );
  }
}
