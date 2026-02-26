import { NextResponse } from 'next/server';
import { getUnifiedSession } from '@/lib/unified-auth';
import { getSupabaseAdmin } from '@/lib/auth';
import { getSession } from '@/lib/dna-manual-data';

const supabase = getSupabaseAdmin();

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

/**
 * POST /api/training/manual/sessions/[sessionId]/complete
 * Mark a session as complete and unlock the next session.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { sessionId: sessionIdStr } = await params;
    const sessionId = parseInt(sessionIdStr);

    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate session exists
    const sessionData = getSession(sessionId);
    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get current unlock state
    const { data: unlock } = await supabase
      .from('user_content_unlocks')
      .select('*')
      .eq('user_id', session.userId)
      .eq('content_type', `manual_session_${sessionId}`)
      .single();

    if (!unlock) {
      return NextResponse.json({ error: 'Session not started' }, { status: 400 });
    }

    // Check all lessons are completed
    const lessonsCompleted = unlock.metadata?.lessonsCompleted || [];
    const allLessonsComplete = sessionData.lessons.every((l: { id: number }) => lessonsCompleted.includes(l.id));

    if (!allLessonsComplete) {
      return NextResponse.json(
        { error: 'All lessons must be completed first' },
        { status: 400 }
      );
    }

    // Mark session as complete
    await supabase
      .from('user_content_unlocks')
      .update({
        metadata: {
          ...unlock.metadata,
          completed: true,
          completedAt: new Date().toISOString()
        }
      })
      .eq('id', unlock.id);

    // Unlock next session if exists
    const nextSessionId = sessionId + 1;
    const nextSession = getSession(nextSessionId);
    if (nextSession) {
      await supabase
        .from('user_content_unlocks')
        .upsert({
          user_id: session.userId,
          content_type: `manual_session_${nextSessionId}`,
          unlocked: true,
          unlocked_at: new Date().toISOString(),
          unlock_trigger: `session_${sessionId}_complete`,
          metadata: { lessonsCompleted: [], completed: false }
        }, { onConflict: 'user_id,content_type' });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing session:', error);
    return NextResponse.json(
      { error: 'Failed to complete session' },
      { status: 500 }
    );
  }
}
