import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';
import { getAuthUrl } from '@/lib/google-calendar';

// GET - Start Google OAuth flow
export async function GET(request: NextRequest) {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Generate OAuth URL with admin email in state
    const authUrl = getAuthUrl(session.email);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('[GOOGLE AUTH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to start Google authentication' },
      { status: 500 }
    );
  }
}
