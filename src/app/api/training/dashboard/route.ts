import { NextResponse } from 'next/server';
import {
  getUnifiedSession,
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

    // Run all independent queries in parallel for performance
    const [progress, unlocks, flowAssessment] = await Promise.all([
      getTrainingProgress(session.userId),
      getContentUnlocks(session.userId),
      getFlowAssessment(session.userId),
    ]);

    const milestones = progress?.milestones || {
      flow_assessment_complete: { completed: false },
      manual_complete: { completed: false },
      launch_guide_reviewed: { completed: false },
      first_group_created: { completed: false }
    };

    return NextResponse.json({
      id: session.userId,
      name: session.name,
      email: session.email,
      journey: {
        current_stage: progress?.currentStage || 'onboarding',
        milestones
      },
      unlocks: {
        flow_assessment: true,
        manual_session_1: true,
        manual_session_2: true,
        manual_session_3: true,
        manual_session_4: true,
        manual_session_5: true,
        manual_session_6: true,
        launch_guide: true,
        toolkit_90day: unlocks?.toolkit_90day || false
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
