import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole } from '@/lib/unified-auth';

// PATCH /api/groups/[id]/disciples/[discipleId]/log/[entryId]
// Update a log entry (edit content, mark prayer answered)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; discipleId: string; entryId: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(hasRole(session, 'dna_leader') || hasRole(session, 'church_leader'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: groupId, discipleId, entryId } = await params;
    const supabase = getSupabaseAdmin();

    // Get DNA leader record
    const { data: dnaLeader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', session.email)
      .single();

    if (!dnaLeader) return NextResponse.json({ error: 'DNA leader not found' }, { status: 404 });

    // Verify group ownership
    const { data: group } = await supabase
      .from('dna_groups')
      .select('id, leader_id, co_leader_id')
      .eq('id', groupId)
      .single();

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    if (group.leader_id !== dnaLeader.id && group.co_leader_id !== dnaLeader.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Verify the entry belongs to this group and disciple
    const { data: existingEntry } = await supabase
      .from('discipleship_log')
      .select('id, group_id, disciple_id, entry_type')
      .eq('id', entryId)
      .single();

    if (!existingEntry) return NextResponse.json({ error: 'Log entry not found' }, { status: 404 });
    if (existingEntry.group_id !== groupId || existingEntry.disciple_id !== discipleId) {
      return NextResponse.json({ error: 'Entry does not belong to this group/disciple' }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    // Allow updating content
    if (body.content !== undefined) {
      if (!body.content || !body.content.trim()) {
        return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
      }
      updates.content = body.content.trim();
    }

    // Allow marking prayer as answered
    if (body.is_answered !== undefined && existingEntry.entry_type === 'prayer') {
      updates.is_answered = body.is_answered;
      if (body.is_answered) {
        updates.answered_at = new Date().toISOString();
      } else {
        updates.answered_at = null;
        updates.answer_notes = null;
      }
    }

    // Allow adding answer notes
    if (body.answer_notes !== undefined && existingEntry.entry_type === 'prayer') {
      updates.answer_notes = body.answer_notes?.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: updatedEntry, error } = await supabase
      .from('discipleship_log')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();

    if (error) {
      console.error('[Discipleship Log] Update error:', error);
      return NextResponse.json({ error: 'Failed to update log entry' }, { status: 500 });
    }

    return NextResponse.json({ entry: updatedEntry });

  } catch (error) {
    console.error('[Discipleship Log] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/groups/[id]/disciples/[discipleId]/log/[entryId]
// Delete a log entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; discipleId: string; entryId: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(hasRole(session, 'dna_leader') || hasRole(session, 'church_leader'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: groupId, discipleId, entryId } = await params;
    const supabase = getSupabaseAdmin();

    // Get DNA leader record
    const { data: dnaLeader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', session.email)
      .single();

    if (!dnaLeader) return NextResponse.json({ error: 'DNA leader not found' }, { status: 404 });

    // Verify group ownership
    const { data: group } = await supabase
      .from('dna_groups')
      .select('id, leader_id, co_leader_id')
      .eq('id', groupId)
      .single();

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    if (group.leader_id !== dnaLeader.id && group.co_leader_id !== dnaLeader.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Verify the entry belongs to this group and disciple
    const { data: existingEntry } = await supabase
      .from('discipleship_log')
      .select('id, group_id, disciple_id')
      .eq('id', entryId)
      .single();

    if (!existingEntry) return NextResponse.json({ error: 'Log entry not found' }, { status: 404 });
    if (existingEntry.group_id !== groupId || existingEntry.disciple_id !== discipleId) {
      return NextResponse.json({ error: 'Entry does not belong to this group/disciple' }, { status: 403 });
    }

    const { error } = await supabase
      .from('discipleship_log')
      .delete()
      .eq('id', entryId);

    if (error) {
      console.error('[Discipleship Log] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete log entry' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Discipleship Log] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
