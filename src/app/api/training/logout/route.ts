import { NextResponse } from 'next/server';
import { clearTrainingSession } from '@/lib/training-auth';

export async function POST() {
  try {
    await clearTrainingSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Training Logout] Error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
