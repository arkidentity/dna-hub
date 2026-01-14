import { NextRequest, NextResponse } from 'next/server';
import { getSession, isAdmin, getSupabaseAdmin } from '@/lib/auth';
import { logAdminAction, logMilestoneToggle } from '@/lib/audit';

// POST: Create a custom milestone for this church
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: churchId } = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.leader.email)) {
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

    // Get the highest display_order for milestones in this phase
    const { data: existingMilestones } = await supabase
      .from('milestones')
      .select('display_order')
      .eq('phase_id', phase_id)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (existingMilestones?.[0]?.display_order || 0) + 1;

    // Create the milestone (church-specific milestones have church_id set)
    const { data: milestone, error: milestoneError } = await supabase
      .from('milestones')
      .insert({
        phase_id,
        title,
        description: description || null,
        is_key_milestone: is_key_milestone || false,
        display_order: nextOrder,
        church_id: churchId, // Links this milestone to a specific church
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
      session.leader.email,
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

// DELETE: Remove a custom milestone
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: churchId } = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.leader.email)) {
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

    // Only allow deleting church-specific milestones (not template milestones)
    const { data: milestone, error: fetchError } = await supabase
      .from('milestones')
      .select('church_id')
      .eq('id', milestoneId)
      .single();

    if (fetchError || !milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    if (milestone.church_id !== churchId) {
      return NextResponse.json(
        { error: 'Cannot delete template milestones' },
        { status: 403 }
      );
    }

    // Delete progress entries first
    await supabase
      .from('church_progress')
      .delete()
      .eq('milestone_id', milestoneId)
      .eq('church_id', churchId);

    // Delete the milestone
    const { error: deleteError } = await supabase
      .from('milestones')
      .delete()
      .eq('id', milestoneId);

    if (deleteError) {
      console.error('[MILESTONE DELETE] Error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete milestone' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MILESTONE DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Toggle milestone completion or update details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: churchId } = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.leader.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { milestone_id, completed, target_date, notes } = body;

    if (!milestone_id) {
      return NextResponse.json(
        { error: 'Milestone ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

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
        session.leader.email,
        milestone_id,
        churchId,
        completed
      );
    } else if (target_date !== undefined || notes !== undefined) {
      await logAdminAction(
        session.leader.email,
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
