import { NextResponse } from 'next/server';
import { clearDNALeaderSession } from '@/lib/auth';

// POST /api/auth/logout-dna-leader
// Log out the current DNA leader
export async function POST() {
  try {
    await clearDNALeaderSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
