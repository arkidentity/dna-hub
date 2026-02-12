import { NextResponse } from 'next/server';
import {
  getUnifiedSession,
  isTrainingParticipant,
  isAdmin,
  hasRole,
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

    const isChurchLeader = hasRole(session, 'church_leader');
    const isDNALeader = hasRole(session, 'dna_leader');

    // Check if user has training access (training participants, church leaders, DNA leaders, admins)
    if (!isTrainingParticipant(session) && !isAdmin(session) && !isChurchLeader && !isDNALeader) {
      return NextResponse.json(
        { error: 'Not a training participant' },
        { status: 403 }
      );
    }

    // Church leaders get everything fully unlocked
    if (isChurchLeader && !isAdmin(session)) {
      return NextResponse.json({
        id: session.userId,
        name: session.name,
        email: session.email,
        journey: {
          current_stage: 'multiplying',
          milestones: {
            flow_assessment_complete: { completed: true },
            manual_complete: { completed: true },
            launch_guide_reviewed: { completed: true },
            first_group_created: { completed: true }
          }
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
          toolkit_90day: true
        },
        flowAssessment: null
      });
    }

    // Run all independent queries in parallel for performance
    const [progress, unlocks, flowAssessment] = await Promise.all([
      getTrainingProgress(session.userId),
      getContentUnlocks(session.userId),
      getFlowAssessment(session.userId),
    ]);

    const flowAssessmentComplete = flowAssessment?.status === 'completed';
    const manualComplete = progress?.milestones?.manual_complete?.completed || false;

    // DNA leaders: flow assessment + manual always available; launch guide + create group locked until flow + manual done
    const effectiveUnlocks = isDNALeader ? {
      flow_assessment: true,
      manual_session_1: true,
      manual_session_2: true,
      manual_session_3: true,
      manual_session_4: true,
      manual_session_5: true,
      manual_session_6: true,
      launch_guide: (flowAssessmentComplete && manualComplete) ? (unlocks.launch_guide || false) : false,
      toolkit_90day: unlocks.toolkit_90day || false
    } : {
      flow_assessment: unlocks.flow_assessment || true,
      manual_session_1: unlocks.manual_session_1 || false,
      manual_session_2: unlocks.manual_session_2 || false,
      manual_session_3: unlocks.manual_session_3 || false,
      manual_session_4: unlocks.manual_session_4 || false,
      manual_session_5: unlocks.manual_session_5 || false,
      manual_session_6: unlocks.manual_session_6 || false,
      launch_guide: unlocks.launch_guide || false,
      toolkit_90day: unlocks.toolkit_90day || false
    };

    // For DNA leaders, also override milestone visibility for launch guide + create group
    const effectiveMilestones = isDNALeader ? {
      ...(progress?.milestones || {}),
      flow_assessment_complete: { completed: flowAssessmentComplete },
      manual_complete: progress?.milestones?.manual_complete || { completed: false },
      launch_guide_reviewed: (flowAssessmentComplete && manualComplete)
        ? (progress?.milestones?.launch_guide_reviewed || { completed: false })
        : { completed: false },
      first_group_created: (flowAssessmentComplete && manualComplete)
        ? (progress?.milestones?.first_group_created || { completed: false })
        : { completed: false }
    } : (progress?.milestones || {
      flow_assessment_complete: { completed: false },
      manual_complete: { completed: false },
      launch_guide_reviewed: { completed: false },
      first_group_created: { completed: false }
    });

    return NextResponse.json({
      id: session.userId,
      name: session.name,
      email: session.email,
      journey: {
        current_stage: progress?.currentStage || 'onboarding',
        milestones: effectiveMilestones
      },
      unlocks: effectiveUnlocks,
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
