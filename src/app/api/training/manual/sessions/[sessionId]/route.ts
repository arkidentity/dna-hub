import { NextResponse } from 'next/server';
import { getUnifiedSession, isTrainingParticipant, isAdmin } from '@/lib/unified-auth';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/dna-manual-data';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

/**
 * GET /api/training/manual/sessions/[sessionId]
 * Get progress for a specific session
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { sessionId: sessionIdStr } = await params;
    const sessionId = parseInt(sessionIdStr);

    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isTrainingParticipant(session) && !isAdmin(session)) {
      return NextResponse.json({ error: 'Not a training participant' }, { status: 403 });
    }

    // Validate session exists
    const sessionData = getSession(sessionId);
    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if previous session is completed (if not session 1)
    if (sessionId > 1) {
      const { data: prevUnlock } = await supabase
        .from('user_content_unlocks')
        .select('*')
        .eq('user_id', session.userId)
        .eq('content_type', `manual_session_${sessionId - 1}`)
        .single();

      if (!prevUnlock?.metadata?.completed) {
        return NextResponse.json(
          { error: 'Previous session must be completed first' },
          { status: 403 }
        );
      }
    }

    // Get or create session unlock record
    let { data: unlock } = await supabase
      .from('user_content_unlocks')
      .select('*')
      .eq('user_id', session.userId)
      .eq('content_type', `manual_session_${sessionId}`)
      .single();

    if (!unlock) {
      // Create unlock record if it doesn't exist
      const { data: newUnlock } = await supabase
        .from('user_content_unlocks')
        .insert({
          user_id: session.userId,
          content_type: `manual_session_${sessionId}`,
          unlocked_at: new Date().toISOString(),
          unlock_trigger: sessionId === 1 ? 'flow_assessment_complete' : `session_${sessionId - 1}_complete`,
          metadata: { lessonsCompleted: [], completed: false }
        })
        .select()
        .single();
      unlock = newUnlock;
    }

    // Get user's notes for this session
    const { data: notes } = await supabase
      .from('user_session_notes')
      .select('*')
      .eq('user_id', session.userId)
      .eq('session_id', sessionId)
      .single();

    // Get user's bookmark
    const { data: bookmark } = await supabase
      .from('user_bookmarks')
      .select('*')
      .eq('user_id', session.userId)
      .eq('content_type', 'manual_session')
      .eq('content_id', sessionId.toString())
      .single();

    return NextResponse.json({
      progress: {
        completed: unlock?.metadata?.completed || false,
        lessonsCompleted: unlock?.metadata?.lessonsCompleted || [],
        lastAccessedAt: unlock?.metadata?.lastAccessedAt || null
      },
      notes: notes?.content || null,
      bookmark: bookmark || null
    });
  } catch (error) {
    console.error('Error loading session:', error);
    return NextResponse.json(
      { error: 'Failed to load session' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/training/manual/sessions/[sessionId]/complete
 * Mark a session as complete
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { sessionId: sessionIdStr } = await params;
    const sessionId = parseInt(sessionIdStr);

    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isTrainingParticipant(session) && !isAdmin(session)) {
      return NextResponse.json({ error: 'Not a training participant' }, { status: 403 });
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
    const allLessonsComplete = sessionData.lessons.every(l => lessonsCompleted.includes(l.id));

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
