import { NextResponse } from 'next/server';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';
import { syncCalendarEvents } from '@/lib/google-calendar';

export async function POST() {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Run calendar sync
    const result = await syncCalendarEvents(session.email);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[CALENDAR SYNC] Error:', error);
    return NextResponse.json(
      { error: 'Calendar sync failed', details: String(error) },
      { status: 500 }
    );
  }
}
