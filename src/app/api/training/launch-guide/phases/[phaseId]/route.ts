import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedSession } from '@/lib/unified-auth';
import { getSupabaseAdmin } from '@/lib/auth';
import { getPhase } from '@/lib/launch-guide-data';

const supabase = getSupabaseAdmin();

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

    const { phaseId } = await params;
    const phaseIdNum = parseInt(phaseId);
    const phase = getPhase(phaseIdNum);

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
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
