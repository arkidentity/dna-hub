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

    // Check if previous phase is complete (if not phase 0)
    if (phaseIdNum > 0) {
      const prevPhaseKey = `launch_guide_phase_${phaseIdNum - 1}`;
      const { data: prevPhaseUnlock } = await supabase
        .from('user_content_unlocks')
        .select('*')
        .eq('user_id', session.userId)
        .eq('content_type', prevPhaseKey)
        .single();

      if (
        !prevPhaseUnlock?.metadata?.completed &&
        !isAdmin(session)
      ) {
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
