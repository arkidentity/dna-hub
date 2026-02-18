import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedSession } from '@/lib/unified-auth';
import { supabase } from '@/lib/supabase';
import { getPhase } from '@/lib/launch-guide-data';

/**
 * POST /api/training/launch-guide/phases/[phaseId]/checklist
 * Toggle a checklist item completion
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
    const { itemId, completed } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID required' },
        { status: 400 }
      );
    }

    // Validate the itemId exists in the phase checklist
    const validItem = phase.checklist.find((item) => item.id === itemId);
    if (!validItem) {
      return NextResponse.json(
        { error: 'Invalid checklist item' },
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

    const currentChecklist: string[] =
      currentUnlock?.metadata?.checklistCompleted || [];

    // Update checklist
    let newChecklist: string[];
    if (completed) {
      if (!currentChecklist.includes(itemId)) {
        newChecklist = [...currentChecklist, itemId];
      } else {
        newChecklist = currentChecklist;
      }
    } else {
      newChecklist = currentChecklist.filter((id) => id !== itemId);
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
            checklistCompleted: newChecklist,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,content_type' }
      );

    if (upsertError) {
      console.error('Error updating checklist:', upsertError);
      return NextResponse.json(
        { error: 'Failed to update checklist' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      progress: {
        completed: currentUnlock?.metadata?.completed || false,
        checklistCompleted: newChecklist,
      },
    });
  } catch (error) {
    console.error('Error updating checklist:', error);
    return NextResponse.json(
      { error: 'Failed to update checklist' },
      { status: 500 }
    );
  }
}
