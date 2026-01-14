import { NextRequest, NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';
import { getAuthUrl } from '@/lib/google-calendar';

// GET - Start Google OAuth flow
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = await isAdmin(session.leader.email);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Generate OAuth URL with admin email in state
    const authUrl = getAuthUrl(session.leader.email);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('[GOOGLE AUTH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to start Google authentication' },
      { status: 500 }
    );
  }
}
