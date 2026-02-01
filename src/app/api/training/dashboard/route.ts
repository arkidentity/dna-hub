import { NextResponse } from 'next/server';
import {
  getUnifiedSession,
  isTrainingParticipant,
  isAdmin,
  getTrainingProgress,
  getContentUnlocks,
  getFlowAssessment
} from '@/lib/unified-auth';

export async function GET() {
  try {
    // Get current session
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has training access
    if (!isTrainingParticipant(session) && !isAdmin(session)) {
      return NextResponse.json(
        { error: 'Not a training participant' },
        { status: 403 }
      );
    }

    // Get training progress
    const progress = await getTrainingProgress(session.userId);

    // Get content unlocks
    const unlocks = await getContentUnlocks(session.userId);

    // Get flow assessment status
    const flowAssessment = await getFlowAssessment(session.userId);

    return NextResponse.json({
      id: session.userId,
      name: session.name,
      email: session.email,
      journey: {
        current_stage: progress?.currentStage || 'onboarding',
        milestones: progress?.milestones || {
          flow_assessment_complete: { completed: false },
          manual_complete: { completed: false },
          launch_guide_reviewed: { completed: false },
          first_group_created: { completed: false }
        }
      },
      unlocks: {
        flow_assessment: unlocks.flow_assessment || true, // Always unlocked
        manual_session_1: unlocks.manual_session_1 || false,
        manual_session_2: unlocks.manual_session_2 || false,
        manual_session_3: unlocks.manual_session_3 || false,
        manual_session_4: unlocks.manual_session_4 || false,
        manual_session_5: unlocks.manual_session_5 || false,
        manual_session_6: unlocks.manual_session_6 || false,
        launch_guide: unlocks.launch_guide || false,
        toolkit_90day: unlocks.toolkit_90day || false
      },
      flowAssessment: flowAssessment ? {
        exists: true,
        completed: flowAssessment.status === 'completed',
        completedAt: flowAssessment.completedAt,
        canRetake: flowAssessment.canRetake,
        daysUntilRetake: flowAssessment.daysUntilRetake
      } : null
    });

  } catch (error) {
    console.error('[Training Dashboard] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}
