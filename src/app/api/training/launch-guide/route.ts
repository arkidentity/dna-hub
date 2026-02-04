import { NextResponse } from 'next/server';
import {
  getUnifiedSession,
  isTrainingParticipant,
  isAdmin,
} from '@/lib/unified-auth';
import { supabase } from '@/lib/supabase';
import { getPhaseCount, launchGuideData } from '@/lib/launch-guide-data';

/**
 * GET /api/training/launch-guide
 * Get user's launch guide progress and phase unlocks
 */
export async function GET() {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isTrainingParticipant(session) && !isAdmin(session)) {
      return NextResponse.json(
        { error: 'Not a training participant' },
        { status: 403 }
      );
    }

    // Check if manual is complete (required to access launch guide) - OR admin override
    const { data: contentUnlocks } = await supabase
      .from('user_content_unlocks')
      .select('*')
      .eq('user_id', session.userId);

    const launchGuideUnlock = contentUnlocks?.find(
      (u) => u.content_type === 'launch_guide'
    );

    // Admin can bypass the unlock check
    if (!launchGuideUnlock && !isAdmin(session)) {
      return NextResponse.json(
        { error: 'DNA Manual must be completed first' },
        { status: 403 }
      );
    }

    // Get user's training progress
    const { data: trainingProgress } = await supabase
      .from('user_training_progress')
      .select('*')
      .eq('user_id', session.userId)
      .single();

    // Build phase progress from metadata in content unlocks
    const totalPhases = getPhaseCount();
    const phases = [];
    let totalChecklistCompleted = 0;
    let currentPhase = 0;

    for (const phase of launchGuideData.phases) {
      const phaseKey = `launch_guide_phase_${phase.id}`;
      const unlock = contentUnlocks?.find((u) => u.content_type === phaseKey);

      const isCompleted = unlock?.metadata?.completed === true;
      const checklistCompleted: string[] =
        unlock?.metadata?.checklistCompleted || [];
      const sectionChecks: string[] =
        unlock?.metadata?.sectionChecks || [];

      phases.push({
        phaseId: phase.id,
        completed: isCompleted,
        completedAt: isCompleted ? unlock?.updated_at : null,
        checklistCompleted,
        sectionChecks,
      });

      totalChecklistCompleted += checklistCompleted.length;
      // Also count section checks towards progress
      totalChecklistCompleted += sectionChecks.length;

      if (isCompleted && phase.id >= currentPhase) {
        currentPhase = phase.id + 1;
      }
    }

    // Ensure current phase doesn't exceed max
    currentPhase = Math.min(currentPhase, totalPhases - 1);

    // Check if all phases are complete
    const isGuideComplete = phases.every((p) => p.completed);

    // If guide is complete, update the training progress milestone
    if (
      isGuideComplete &&
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

    return NextResponse.json({
      name: session.name,
      progress: {
        phases,
        currentPhase,
        totalChecklistCompleted,
        isGuideComplete,
      },
    });
  } catch (error) {
    console.error('Error loading launch guide:', error);
    return NextResponse.json(
      { error: 'Failed to load launch guide' },
      { status: 500 }
    );
  }
}
