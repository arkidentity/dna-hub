import { NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { disconnectGoogleCalendar } from '@/lib/google-calendar';

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

    // Disconnect Google Calendar
    await disconnectGoogleCalendar(session.leader.email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CALENDAR DISCONNECT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect calendar' },
      { status: 500 }
    );
  }
}
