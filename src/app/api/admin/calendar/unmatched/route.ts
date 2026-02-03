import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

// GET: Fetch unmatched calendar events with optional filters
export async function GET(request: Request) {
  try {
    const session = await getUnifiedSession();
    if (!session || !isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeMatched = searchParams.get('includeMatched') === 'true';

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('unmatched_calendar_events')
      .select(`
        *,
        church:matched_church_id (id, name)
      `)
      .order('event_start', { ascending: false })
      .limit(limit);

    if (!includeMatched) {
      query = query.is('matched_church_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[UNMATCHED EVENTS] Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch unmatched events' }, { status: 500 });
    }

    return NextResponse.json({ events: data || [] });
  } catch (error) {
    console.error('[UNMATCHED EVENTS] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: Assign an unmatched event to a church (and optionally a milestone)
// This creates a new scheduled_call record from the unmatched event
export async function POST(request: Request) {
  try {
    const session = await getUnifiedSession();
    if (!session || !isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, churchId, callType, milestoneId } = body;

    if (!eventId || !churchId || !callType) {
      return NextResponse.json(
        { error: 'eventId, churchId, and callType are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get the unmatched event
    const { data: unmatchedEvent, error: fetchError } = await supabase
      .from('unmatched_calendar_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (fetchError || !unmatchedEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if this google_event_id already exists in scheduled_calls
    const { data: existingCall } = await supabase
      .from('scheduled_calls')
      .select('id')
      .eq('google_event_id', unmatchedEvent.google_event_id)
      .single();

    if (existingCall) {
      return NextResponse.json(
        { error: 'This event has already been synced as a scheduled call' },
        { status: 409 }
      );
    }

    // Check event end time to determine if completed
    const isCompleted = unmatchedEvent.event_end
      ? new Date(unmatchedEvent.event_end) < new Date()
      : false;

    // Create the scheduled call
    const { data: newCall, error: insertError } = await supabase
      .from('scheduled_calls')
      .insert({
        google_event_id: unmatchedEvent.google_event_id,
        church_id: churchId,
        call_type: callType,
        scheduled_at: unmatchedEvent.event_start,
        meet_link: unmatchedEvent.meet_link,
        completed: isCompleted,
        milestone_id: milestoneId || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[UNMATCHED EVENTS] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create scheduled call' }, { status: 500 });
    }

    // Update the unmatched event to mark it as matched
    await supabase
      .from('unmatched_calendar_events')
      .update({
        matched_church_id: churchId,
        matched_at: new Date().toISOString(),
        matched_by: session.email,
      })
      .eq('id', eventId);

    return NextResponse.json({
      success: true,
      call: newCall,
      message: 'Event successfully assigned to church',
    });
  } catch (error) {
    console.error('[UNMATCHED EVENTS] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE: Remove an unmatched event (if it shouldn't be synced at all)
export async function DELETE(request: Request) {
  try {
    const session = await getUnifiedSession();
    if (!session || !isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('unmatched_calendar_events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('[UNMATCHED EVENTS] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[UNMATCHED EVENTS] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
