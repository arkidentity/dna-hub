import { NextRequest, NextResponse } from 'next/server';
import {
  getUnifiedSession,
  isTrainingParticipant,
  isAdmin,
} from '@/lib/unified-auth';
import { supabase } from '@/lib/supabase';
import { getPhase } from '@/lib/launch-guide-data';

/**
 * GET /api/training/launch-guide/phases/[phaseId]
 * Get user's progress for a specific phase
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
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

    const { phaseId } = await params;
    const phaseIdNum = parseInt(phaseId);
    const phase = getPhase(phaseIdNum);

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
    }

    // Check if launch guide is unlocked (or admin)
    const { data: launchGuideUnlock } = await supabase
      .from('user_content_unlocks')
      .select('*')
      .eq('user_id', session.userId)
      .eq('content_type', 'launch_guide')
      .single();

    if (!launchGuideUnlock && !isAdmin(session)) {
      return NextResponse.json(
        { error: 'Launch guide not unlocked' },
        { status: 403 }
      );
    }

    // Check if previous phase has sufficient progress (allows "look ahead")
    // Users can view the next phase once they've completed at least 50% of section checks in current phase
    if (phaseIdNum > 0 && !isAdmin(session)) {
      const prevPhaseKey = `launch_guide_phase_${phaseIdNum - 1}`;
      const { data: prevPhaseUnlock } = await supabase
        .from('user_content_unlocks')
        .select('*')
        .eq('user_id', session.userId)
        .eq('content_type', prevPhaseKey)
        .single();

      // Phase is accessible if:
      // 1. Previous phase is marked as completed, OR
      // 2. Previous phase has at least 50% of section checks completed
      const prevPhaseCompleted = prevPhaseUnlock?.metadata?.completed;
      const prevSectionChecks = prevPhaseUnlock?.metadata?.sectionChecks || [];
      const prevPhase = getPhase(phaseIdNum - 1);
      const prevTotalSectionChecks = prevPhase?.sections.filter(s => s.sectionCheck).length || 0;
      const hasEnoughProgress = prevTotalSectionChecks > 0
        ? prevSectionChecks.length >= Math.ceil(prevTotalSectionChecks * 0.5)
        : false;

      if (!prevPhaseCompleted && !hasEnoughProgress) {
        return NextResponse.json(
          { error: 'Previous phase not complete' },
          { status: 403 }
        );
      }
    }

    // Get phase progress
    const phaseKey = `launch_guide_phase_${phaseIdNum}`;
    const { data: phaseUnlock } = await supabase
      .from('user_content_unlocks')
      .select('*')
      .eq('user_id', session.userId)
      .eq('content_type', phaseKey)
      .single();

    return NextResponse.json({
      progress: {
        completed: phaseUnlock?.metadata?.completed || false,
        checklistCompleted: phaseUnlock?.metadata?.checklistCompleted || [],
        sectionChecks: phaseUnlock?.metadata?.sectionChecks || [],
        userData: phaseUnlock?.metadata?.userData || {},
      },
    });
  } catch (error) {
    console.error('Error loading phase:', error);
    return NextResponse.json(
      { error: 'Failed to load phase' },
      { status: 500 }
    );
  }
}
