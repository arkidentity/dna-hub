import { NextResponse } from 'next/server';
import { getUnifiedSession, isTrainingParticipant, isAdmin } from '@/lib/unified-auth';
import { supabase } from '@/lib/supabase';
import { getSessionCount } from '@/lib/dna-manual-data';

/**
 * GET /api/training/manual
 * Get user's manual progress and session unlocks
 */
export async function GET() {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isTrainingParticipant(session) && !isAdmin(session)) {
      return NextResponse.json({ error: 'Not a training participant' }, { status: 403 });
    }

    // Check if flow assessment is complete (required to access manual)
    const { data: flowAssessment } = await supabase
      .from('user_flow_assessments')
      .select('id, status')
      .eq('user_id', session.userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (!flowAssessment) {
      return NextResponse.json(
        { error: 'Flow Assessment must be completed first' },
        { status: 403 }
      );
    }

    // Get user's training progress
    const { data: trainingProgress } = await supabase
      .from('user_training_progress')
      .select('*')
      .eq('user_id', session.userId)
      .single();

    // Get user's content unlocks
    const { data: contentUnlocks } = await supabase
      .from('user_content_unlocks')
      .select('*')
      .eq('user_id', session.userId);

    // Build session progress from unlocks
    const totalSessions = getSessionCount();
    const sessions = [];
    let totalCompleted = 0;
    let currentSession = 1;

    for (let i = 1; i <= totalSessions; i++) {
      const unlock = contentUnlocks?.find(u => u.content_type === `manual_session_${i}`);
      const isCompleted = unlock?.unlocked_at != null && unlock?.metadata?.completed === true;

      sessions.push({
        sessionId: i,
        completed: isCompleted,
        completedAt: isCompleted ? unlock?.unlocked_at : null,
        lessonsCompleted: unlock?.metadata?.lessonsCompleted || []
      });

      if (isCompleted) {
        totalCompleted++;
        currentSession = Math.min(i + 1, totalSessions);
      }
    }

    // If no sessions completed yet, current session is 1
    if (totalCompleted === 0) {
      currentSession = 1;
    }

    // Check if all sessions are complete
    const isManualComplete = totalCompleted === totalSessions;

    // If manual is complete, update the training progress milestone
    if (isManualComplete && trainingProgress && !trainingProgress.milestones?.manual_complete?.completed) {
      await supabase
        .from('user_training_progress')
        .update({
          milestones: {
            ...trainingProgress.milestones,
            manual_complete: {
              completed: true,
              completed_at: new Date().toISOString()
            }
          },
          current_stage: 'launch_guide',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.userId);

      // Unlock launch guide
      await supabase
        .from('user_content_unlocks')
        .upsert({
          user_id: session.userId,
          content_type: 'launch_guide',
          unlocked_at: new Date().toISOString(),
          unlock_trigger: 'manual_complete'
        }, { onConflict: 'user_id,content_type' });
    }

    return NextResponse.json({
      name: session.name,
      progress: {
        sessions,
        currentSession,
        totalCompleted,
        isManualComplete
      }
    });
  } catch (error) {
    console.error('Error loading manual:', error);
    return NextResponse.json(
      { error: 'Failed to load manual' },
      { status: 500 }
    );
  }
}
