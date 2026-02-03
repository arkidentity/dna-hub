import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';
import { logAdminAction, logMilestoneToggle } from '@/lib/audit';

// POST: Create a custom milestone for this church
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: churchId } = await params;
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { phase_id, title, description, is_key_milestone, target_date } = body;

    if (!phase_id || !title) {
      return NextResponse.json(
        { error: 'Phase ID and title are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify church exists
    const { data: church, error: churchError } = await supabase
      .from('churches')
      .select('id')
      .eq('id', churchId)
      .single();

    if (churchError || !church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    // Get the highest display_order for milestones in this phase for this church
    const { data: existingMilestones } = await supabase
      .from('church_milestones')
      .select('display_order')
      .eq('church_id', churchId)
      .eq('phase_id', phase_id)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (existingMilestones?.[0]?.display_order || 0) + 1;

    // Create the milestone in church_milestones (custom milestone)
    const { data: milestone, error: milestoneError } = await supabase
      .from('church_milestones')
      .insert({
        church_id: churchId,
        phase_id,
        title,
        description: description || null,
        is_key_milestone: is_key_milestone || false,
        display_order: nextOrder,
        is_custom: true, // Custom milestones are marked as such
      })
      .select()
      .single();

    if (milestoneError) {
      console.error('[MILESTONE CREATE] Error:', milestoneError);
      return NextResponse.json(
        { error: 'Failed to create milestone' },
        { status: 500 }
      );
    }

    // If target_date provided, create a progress entry
    if (target_date) {
      await supabase.from('church_progress').insert({
        church_id: churchId,
        milestone_id: milestone.id,
        completed: false,
        target_date,
      });
    }

    // Log the milestone creation
    await logAdminAction(
      session.email,
      'milestone_update',
      'milestone',
      milestone.id,
      null,
      { title, church_id: churchId, phase_id },
      `Created custom milestone: ${title}`
    );

    return NextResponse.json({ milestone });
  } catch (error) {
    console.error('[MILESTONE CREATE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove a milestone from this church
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: churchId } = await params;
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const milestoneId = searchParams.get('milestone_id');

    if (!milestoneId) {
      return NextResponse.json(
        { error: 'Milestone ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get milestone to verify it belongs to this church
    const { data: milestone, error: fetchError } = await supabase
      .from('church_milestones')
      .select('id, church_id, title')
      .eq('id', milestoneId)
      .single();

    if (fetchError || !milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Verify milestone belongs to this church
    if (milestone.church_id !== churchId) {
      return NextResponse.json(
        { error: 'Cannot delete milestones from other churches' },
        { status: 403 }
      );
    }

    // Delete progress entries first
    await supabase
      .from('church_progress')
      .delete()
      .eq('milestone_id', milestoneId)
      .eq('church_id', churchId);

    // Delete attachments
    await supabase
      .from('milestone_attachments')
      .delete()
      .eq('milestone_id', milestoneId)
      .eq('church_id', churchId);

    // Unlink any scheduled calls
    await supabase
      .from('scheduled_calls')
      .update({ milestone_id: null })
      .eq('milestone_id', milestoneId)
      .eq('church_id', churchId);

    // Delete the milestone
    const { error: deleteError } = await supabase
      .from('church_milestones')
      .delete()
      .eq('id', milestoneId);

    if (deleteError) {
      console.error('[MILESTONE DELETE] Error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete milestone' },
        { status: 500 }
      );
    }

    // Log the deletion
    await logAdminAction(
      session.email,
      'milestone_update',
      'milestone',
      milestoneId,
      { title: milestone.title, church_id: churchId },
      null,
      `Deleted milestone: ${milestone.title}`
    );

    return NextResponse.json({ success: true, action: 'deleted' });
  } catch (error) {
    console.error('[MILESTONE DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Toggle milestone completion, update details, edit title/description, or reorder
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: churchId } = await params;
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { milestone_id, completed, target_date, notes, action, title, description, is_key_milestone } = body;

    // Handle reordering actions
    if (action === 'move_up' || action === 'move_down') {
      return handleReorderMilestone(churchId, milestone_id, action, session.email);
    }

    if (!milestone_id) {
      return NextResponse.json(
        { error: 'Milestone ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Handle milestone title/description/is_key_milestone editing
    if (title !== undefined || description !== undefined || is_key_milestone !== undefined) {
      // Get the current milestone to log the change
      const { data: currentMilestone, error: fetchError } = await supabase
        .from('church_milestones')
        .select('id, title, description, is_key_milestone, church_id')
        .eq('id', milestone_id)
        .single();

      if (fetchError || !currentMilestone) {
        return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
      }

      // Verify milestone belongs to this church
      if (currentMilestone.church_id !== churchId) {
        return NextResponse.json(
          { error: 'Cannot edit milestones from other churches' },
          { status: 403 }
        );
      }

      // Build update object
      const milestoneUpdates: Record<string, unknown> = {};
      if (title !== undefined) milestoneUpdates.title = title;
      if (description !== undefined) milestoneUpdates.description = description;
      if (is_key_milestone !== undefined) milestoneUpdates.is_key_milestone = is_key_milestone;

      // Update the milestone
      const { error: updateError } = await supabase
        .from('church_milestones')
        .update(milestoneUpdates)
        .eq('id', milestone_id);

      if (updateError) {
        console.error('[MILESTONE EDIT] Error:', updateError);
        return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
      }

      // Log the change
      await logAdminAction(
        session.email,
        'milestone_update',
        'milestone',
        milestone_id,
        { title: currentMilestone.title, description: currentMilestone.description, is_key_milestone: currentMilestone.is_key_milestone },
        milestoneUpdates,
        `Updated milestone: ${title || currentMilestone.title}`
      );

      return NextResponse.json({ success: true });
    }

    // Check if progress entry exists
    const { data: existingProgress } = await supabase
      .from('church_progress')
      .select('*')
      .eq('church_id', churchId)
      .eq('milestone_id', milestone_id)
      .single();

    if (existingProgress) {
      // Update existing progress
      const updateData: Record<string, unknown> = {};

      if (typeof completed === 'boolean') {
        updateData.completed = completed;
        updateData.completed_at = completed ? new Date().toISOString() : null;
      }
      if (target_date !== undefined) {
        updateData.target_date = target_date;
      }
      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { error: updateError } = await supabase
        .from('church_progress')
        .update(updateData)
        .eq('id', existingProgress.id);

      if (updateError) {
        console.error('[PROGRESS UPDATE] Error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update progress' },
          { status: 500 }
        );
      }
    } else {
      // Create new progress entry
      const { error: insertError } = await supabase
        .from('church_progress')
        .insert({
          church_id: churchId,
          milestone_id,
          completed: completed || false,
          completed_at: completed ? new Date().toISOString() : null,
          target_date: target_date || null,
          notes: notes || null,
        });

      if (insertError) {
        console.error('[PROGRESS INSERT] Error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create progress entry' },
          { status: 500 }
        );
      }
    }

    // Log the milestone update to audit trail
    if (typeof completed === 'boolean') {
      await logMilestoneToggle(
        session.email,
        milestone_id,
        churchId,
        completed
      );
    } else if (target_date !== undefined || notes !== undefined) {
      await logAdminAction(
        session.email,
        target_date !== undefined ? 'date_update' : 'notes_update',
        'milestone',
        milestone_id,
        existingProgress ? { target_date: existingProgress.target_date, notes: existingProgress.notes } : null,
        { target_date, notes, church_id: churchId }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MILESTONE PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to handle milestone reordering
async function handleReorderMilestone(
  churchId: string,
  milestoneId: string,
  action: 'move_up' | 'move_down',
  adminEmail: string
) {
  if (!milestoneId) {
    return NextResponse.json(
      { error: 'Milestone ID is required' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Get the current milestone with its phase and display_order
  const { data: currentMilestone, error: fetchError } = await supabase
    .from('church_milestones')
    .select('id, phase_id, display_order, title, church_id')
    .eq('id', milestoneId)
    .single();

  if (fetchError || !currentMilestone) {
    return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
  }

  // Verify milestone belongs to this church
  if (currentMilestone.church_id !== churchId) {
    return NextResponse.json(
      { error: 'Cannot reorder milestones from other churches' },
      { status: 403 }
    );
  }

  // Get all milestones in the same phase for this church
  const { data: phaseMilestones, error: phaseError } = await supabase
    .from('church_milestones')
    .select('id, display_order, title')
    .eq('church_id', churchId)
    .eq('phase_id', currentMilestone.phase_id)
    .order('display_order', { ascending: true });

  if (phaseError || !phaseMilestones || phaseMilestones.length < 2) {
    return NextResponse.json({ error: 'Cannot reorder - not enough milestones' }, { status: 400 });
  }

  // Find current milestone index
  const currentIndex = phaseMilestones.findIndex(m => m.id === milestoneId);
  if (currentIndex === -1) {
    return NextResponse.json({ error: 'Milestone not found in phase' }, { status: 404 });
  }

  // Determine target index based on action
  const targetIndex = action === 'move_up' ? currentIndex - 1 : currentIndex + 1;

  // Check boundaries
  if (targetIndex < 0 || targetIndex >= phaseMilestones.length) {
    return NextResponse.json(
      { error: `Cannot move ${action === 'move_up' ? 'up' : 'down'} - already at ${action === 'move_up' ? 'top' : 'bottom'}` },
      { status: 400 }
    );
  }

  const targetMilestone = phaseMilestones[targetIndex];

  // Swap display_order values
  const currentOrder = currentMilestone.display_order;
  const targetOrder = targetMilestone.display_order;

  // Update both milestones
  const { error: updateCurrentError } = await supabase
    .from('church_milestones')
    .update({ display_order: targetOrder })
    .eq('id', currentMilestone.id);

  if (updateCurrentError) {
    console.error('[MILESTONE REORDER] Error updating current:', updateCurrentError);
    return NextResponse.json({ error: 'Failed to reorder milestone' }, { status: 500 });
  }

  const { error: updateTargetError } = await supabase
    .from('church_milestones')
    .update({ display_order: currentOrder })
    .eq('id', targetMilestone.id);

  if (updateTargetError) {
    console.error('[MILESTONE REORDER] Error updating target:', updateTargetError);
    // Attempt to rollback the first update
    await supabase
      .from('church_milestones')
      .update({ display_order: currentOrder })
      .eq('id', currentMilestone.id);
    return NextResponse.json({ error: 'Failed to reorder milestone' }, { status: 500 });
  }

  // Log the reorder action
  await logAdminAction(
    adminEmail,
    'milestone_update',
    'milestone',
    milestoneId,
    { display_order: currentOrder },
    { display_order: targetOrder, action, swapped_with: targetMilestone.id },
    `Moved milestone "${currentMilestone.title}" ${action === 'move_up' ? 'up' : 'down'}`
  );

  return NextResponse.json({ success: true });
}
