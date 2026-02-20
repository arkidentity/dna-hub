import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedSession } from '@/lib/unified-auth';
import { getSupabaseAdmin } from '@/lib/auth';
import { getPhase, launchGuideData } from '@/lib/launch-guide-data';

const supabase = getSupabaseAdmin();

/**
 * POST /api/training/launch-guide/phases/[phaseId]/complete
 * Mark a phase as complete
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phaseId } = await params;
    const phaseIdNum = parseInt(phaseId);
    const phase = getPhase(phaseIdNum);

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
    }

    const phaseKey = `launch_guide_phase_${phaseIdNum}`;

    // Get current progress
    const { data: currentUnlock } = await supabase
      .from('user_content_unlocks')
      .select('*')
      .eq('user_id', session.userId)
      .eq('content_type', phaseKey)
      .single();

    // Mark phase as complete
    const { error: upsertError } = await supabase
      .from('user_content_unlocks')
      .upsert(
        {
          user_id: session.userId,
          content_type: phaseKey,
          unlocked: true,
          unlocked_at: currentUnlock?.unlocked_at || new Date().toISOString(),
          unlock_trigger: 'phase_completed',
          metadata: {
            ...currentUnlock?.metadata,
            completed: true,
            completedAt: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,content_type' }
      );

    if (upsertError) {
      console.error('Error completing phase:', upsertError);
      return NextResponse.json(
        { error: 'Failed to complete phase' },
        { status: 500 }
      );
    }

    // Check if all phases are now complete
    const { data: allUnlocks } = await supabase
      .from('user_content_unlocks')
      .select('*')
      .eq('user_id', session.userId)
      .like('content_type', 'launch_guide_phase_%');

    const allPhasesComplete = launchGuideData.phases.every((p) => {
      const unlock = allUnlocks?.find(
        (u) => u.content_type === `launch_guide_phase_${p.id}`
      );
      return unlock?.metadata?.completed === true;
    });

    // If all phases complete, update training progress
    if (allPhasesComplete) {
      const { data: trainingProgress } = await supabase
        .from('user_training_progress')
        .select('*')
        .eq('user_id', session.userId)
        .single();

      if (
        trainingProgress &&
        !trainingProgress.milestones?.launch_guide_reviewed?.completed
      ) {
        await supabase
          .from('user_training_progress')
          .update({
            milestones: {
              ...trainingProgress.milestones,
              launch_guide_reviewed: {
                completed: true,
                completed_at: new Date().toISOString(),
              },
            },
            current_stage: 'growing',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', session.userId);
      }
    }

    return NextResponse.json({
      success: true,
      allPhasesComplete,
    });
  } catch (error) {
    console.error('Error completing phase:', error);
    return NextResponse.json(
      { error: 'Failed to complete phase' },
      { status: 500 }
    );
  }
}
