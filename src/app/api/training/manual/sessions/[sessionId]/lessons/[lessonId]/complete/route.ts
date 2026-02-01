import { NextResponse } from 'next/server';
import { getUnifiedSession, isTrainingParticipant, isAdmin } from '@/lib/unified-auth';
import { supabase } from '@/lib/supabase';
import { getSession, getLesson } from '@/lib/dna-manual-data';

interface RouteParams {
  params: Promise<{ sessionId: string; lessonId: string }>;
}

/**
 * POST /api/training/manual/sessions/[sessionId]/lessons/[lessonId]/complete
 * Mark a lesson as complete
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const sessionId = parseInt(resolvedParams.sessionId);
    const lessonId = parseInt(resolvedParams.lessonId);

    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isTrainingParticipant(session) && !isAdmin(session)) {
      return NextResponse.json({ error: 'Not a training participant' }, { status: 403 });
    }

    // Validate session and lesson exist
    const sessionData = getSession(sessionId);
    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const lessonData = getLesson(sessionId, lessonId);
    if (!lessonData) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Get current session unlock state
    let { data: unlock } = await supabase
      .from('user_content_unlocks')
      .select('*')
      .eq('user_id', session.userId)
      .eq('content_type', `manual_session_${sessionId}`)
      .single();

    if (!unlock) {
      // Create if doesn't exist (shouldn't normally happen)
      const { data: newUnlock } = await supabase
        .from('user_content_unlocks')
        .insert({
          user_id: session.userId,
          content_type: `manual_session_${sessionId}`,
          unlocked_at: new Date().toISOString(),
          unlock_trigger: 'lesson_access',
          metadata: { lessonsCompleted: [], completed: false }
        })
        .select()
        .single();
      unlock = newUnlock;
    }

    // Check if previous lesson is completed (if not lesson 1)
    const lessonsCompleted = unlock?.metadata?.lessonsCompleted || [];
    if (lessonId > 1 && !lessonsCompleted.includes(lessonId - 1)) {
      return NextResponse.json(
        { error: 'Previous lesson must be completed first' },
        { status: 400 }
      );
    }

    // Add lesson to completed list if not already
    if (!lessonsCompleted.includes(lessonId)) {
      const updatedLessons = [...lessonsCompleted, lessonId].sort((a, b) => a - b);

      await supabase
        .from('user_content_unlocks')
        .update({
          metadata: {
            ...unlock?.metadata,
            lessonsCompleted: updatedLessons,
            lastAccessedAt: new Date().toISOString()
          }
        })
        .eq('id', unlock?.id);

      return NextResponse.json({
        success: true,
        progress: {
          completed: unlock?.metadata?.completed || false,
          lessonsCompleted: updatedLessons
        }
      });
    }

    return NextResponse.json({
      success: true,
      progress: {
        completed: unlock?.metadata?.completed || false,
        lessonsCompleted
      }
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    return NextResponse.json(
      { error: 'Failed to complete lesson' },
      { status: 500 }
    );
  }
}
