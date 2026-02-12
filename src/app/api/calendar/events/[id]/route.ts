import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession } from '@/lib/unified-auth';

// Resolve leader ID from session — shared by both handlers
async function getLeaderId(session: { email: string }) {
  const supabase = getSupabaseAdmin();
  const { data: leader } = await supabase
    .from('dna_leaders')
    .select('id')
    .eq('email', session.email)
    .single();
  return leader?.id ?? null;
}

// PATCH /api/calendar/events/[id]
// Edit an event. Body: { title, description, location, start_time, end_time, scope }
// scope: 'this' | 'this_and_future' | 'all'
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const leaderId = await getLeaderId(session);
    if (!leaderId) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { scope = 'this', title, description, location, start_time, end_time } = body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (location !== undefined) updates.location = location;
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Fetch the target event to determine parent and start_time
    const { data: event, error: fetchError } = await supabase
      .from('dna_calendar_events')
      .select('id, parent_event_id, start_time, created_by')
      .eq('id', id)
      .single();

    if (fetchError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.created_by !== leaderId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const parentId = event.parent_event_id;

    if (scope === 'this' || !parentId) {
      // Edit only this instance
      const { error } = await supabase
        .from('dna_calendar_events')
        .update(updates)
        .eq('id', id);
      if (error) throw error;

    } else if (scope === 'this_and_future') {
      // Edit this instance and all future instances in the same series
      const { error } = await supabase
        .from('dna_calendar_events')
        .update(updates)
        .eq('parent_event_id', parentId)
        .gte('start_time', event.start_time);
      if (error) throw error;

    } else if (scope === 'all') {
      // Edit every instance in the series
      const { error } = await supabase
        .from('dna_calendar_events')
        .update(updates)
        .eq('parent_event_id', parentId);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CALENDAR] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/calendar/events/[id]
// Delete an event. Query param: scope = 'this' | 'this_and_future' | 'all'
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const leaderId = await getLeaderId(session);
    if (!leaderId) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const { id } = await params;
    const scope = request.nextUrl.searchParams.get('scope') ?? 'this';

    // Fetch the target event
    const { data: event, error: fetchError } = await supabase
      .from('dna_calendar_events')
      .select('id, parent_event_id, start_time, created_by')
      .eq('id', id)
      .single();

    if (fetchError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.created_by !== leaderId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const parentId = event.parent_event_id;

    if (scope === 'this' || !parentId) {
      // Delete only this instance
      const { error } = await supabase
        .from('dna_calendar_events')
        .delete()
        .eq('id', id);
      if (error) throw error;

    } else if (scope === 'this_and_future') {
      // Delete this instance and all future instances in the same series
      const { error } = await supabase
        .from('dna_calendar_events')
        .delete()
        .eq('parent_event_id', parentId)
        .gte('start_time', event.start_time);
      if (error) throw error;

    } else if (scope === 'all') {
      // Delete all instances + the parent event itself
      const { error: instancesError } = await supabase
        .from('dna_calendar_events')
        .delete()
        .eq('parent_event_id', parentId);
      if (instancesError) throw instancesError;

      const { error: parentError } = await supabase
        .from('dna_calendar_events')
        .delete()
        .eq('id', parentId)
        .eq('created_by', leaderId);
      if (parentError) throw parentError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CALENDAR] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
