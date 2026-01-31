import { NextResponse } from 'next/server';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';
import { disconnectGoogleCalendar } from '@/lib/google-calendar';

export async function POST() {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Disconnect Google Calendar
    await disconnectGoogleCalendar(session.email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CALENDAR DISCONNECT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect calendar' },
      { status: 500 }
    );
  }
}
