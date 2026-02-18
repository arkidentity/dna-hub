import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedSession } from '@/lib/unified-auth';
import { supabase } from '@/lib/supabase';
import { getPhase } from '@/lib/launch-guide-data';

/**
 * POST /api/training/launch-guide/phases/[phaseId]/section-check
 * Toggle a section check completion
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

    const body = await request.json();
    const { checkId, completed } = body;

    if (!checkId) {
      return NextResponse.json(
        { error: 'Check ID required' },
        { status: 400 }
      );
    }

    // Validate the checkId exists in the phase sections
    const validCheck = phase.sections.find(
      (section) => section.sectionCheck?.id === checkId
    );
    if (!validCheck) {
      return NextResponse.json(
        { error: 'Invalid section check' },
        { status: 400 }
      );
    }

    const phaseKey = `launch_guide_phase_${phaseIdNum}`;

    // Get current progress
    const { data: currentUnlock } = await supabase
      .from('user_content_unlocks')
      .select('*')
      .eq('user_id', session.userId)
      .eq('content_type', phaseKey)
      .single();

    const currentChecks: string[] =
      currentUnlock?.metadata?.sectionChecks || [];

    // Update section checks
    let newChecks: string[];
    if (completed) {
      if (!currentChecks.includes(checkId)) {
        newChecks = [...currentChecks, checkId];
      } else {
        newChecks = currentChecks;
      }
    } else {
      newChecks = currentChecks.filter((id) => id !== checkId);
    }

    // Upsert the progress
    const { error: upsertError } = await supabase
      .from('user_content_unlocks')
      .upsert(
        {
          user_id: session.userId,
          content_type: phaseKey,
          unlocked: true,
          unlocked_at: currentUnlock?.unlocked_at || new Date().toISOString(),
          unlock_trigger: 'phase_started',
          metadata: {
            ...currentUnlock?.metadata,
            sectionChecks: newChecks,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,content_type' }
      );

    if (upsertError) {
      console.error('Error updating section check:', upsertError);
      return NextResponse.json(
        { error: 'Failed to update section check' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      progress: {
        completed: currentUnlock?.metadata?.completed || false,
        checklistCompleted: currentUnlock?.metadata?.checklistCompleted || [],
        sectionChecks: newChecks,
        userData: currentUnlock?.metadata?.userData || {},
      },
    });
  } catch (error) {
    console.error('Error updating section check:', error);
    return NextResponse.json(
      { error: 'Failed to update section check' },
      { status: 500 }
    );
  }
}
