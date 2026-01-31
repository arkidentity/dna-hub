import { NextResponse } from 'next/server';
import { getTrainingSession, getContentUnlocks, getSupabaseAdmin } from '@/lib/training-auth';

export async function GET() {
  try {
    // Get current session
    const session = await getTrainingSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user } = session;
    const supabase = getSupabaseAdmin();

    // Get content unlocks
    const unlocks = await getContentUnlocks(user.id);

    // Get flow assessment status
    const { data: assessments } = await supabase
      .from('dna_flow_assessments')
      .select('id, completed_at, is_draft, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    let flowAssessment = null;
    if (assessments && assessments.length > 0) {
      const latest = assessments[0];
      const completed = !latest.is_draft && !!latest.completed_at;
      let canRetake = false;
      let daysUntilRetake = null;

      if (completed && latest.completed_at) {
        const completedDate = new Date(latest.completed_at);
        const threeMonthsLater = new Date(completedDate);
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

        const now = new Date();
        canRetake = now >= threeMonthsLater;

        if (!canRetake) {
          const diffTime = threeMonthsLater.getTime() - now.getTime();
          daysUntilRetake = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }

      flowAssessment = {
        exists: true,
        completed,
        completedAt: latest.completed_at,
        canRetake,
        daysUntilRetake
      };
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      journey: user.journey || {
        current_stage: 'onboarding',
        milestones: {
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
      flowAssessment
    });

  } catch (error) {
    console.error('[Training Dashboard] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}
