import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession } from '@/lib/unified-auth';

// GET: Fetch calendar events for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const searchParams = request.nextUrl.searchParams;

    const startDate = searchParams.get('start') || new Date().toISOString();
    const endDate = searchParams.get('end') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Use the helper function from the migration
    const { data: events, error } = await supabase
      .rpc('get_my_calendar_events', {
        start_date: startDate,
        end_date: endDate,
      });

    if (error) {
      console.error('[CALENDAR] Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error('[CALENDAR] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new calendar event
export async function POST(request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const {
      title,
      description,
      location,
      start_time,
      end_time,
      event_type,
      group_id,
      cohort_id,
      church_id,
      is_recurring,
      recurrence_pattern,
    } = body;

    // Validation
    if (!title || !start_time || !event_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get leader ID
    const { data: leader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', session.email)
      .single();

    if (!leader) {
      return NextResponse.json({ error: 'DNA leader not found' }, { status: 404 });
    }

    // If recurring, create multiple instances
    if (is_recurring && recurrence_pattern) {
      const instances = generateRecurringInstances(start_time, end_time, recurrence_pattern);

      // Create parent event first
      const { data: parentEvent, error: parentError } = await supabase
        .from('dna_calendar_events')
        .insert({
          title,
          description,
          location,
          start_time,
          end_time,
          event_type,
          group_id,
          cohort_id,
          church_id,
          is_recurring: true,
          recurrence_pattern,
          created_by: leader.id,
        })
        .select()
        .single();

      if (parentError) {
        console.error('[CALENDAR] Parent event error:', parentError);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
      }

      // Create instance events
      const instanceRecords = instances.map(instance => ({
        title,
        description,
        location,
        start_time: instance.start,
        end_time: instance.end,
        event_type,
        group_id,
        cohort_id,
        church_id,
        is_recurring: false,
        parent_event_id: parentEvent.id,
        created_by: leader.id,
      }));

      const { error: instancesError } = await supabase
        .from('dna_calendar_events')
        .insert(instanceRecords);

      if (instancesError) {
        console.error('[CALENDAR] Instances error:', instancesError);
        return NextResponse.json({ error: 'Failed to create recurring events' }, { status: 500 });
      }

      return NextResponse.json({ event: parentEvent, instanceCount: instances.length });
    }

    // Single event
    const { data: event, error } = await supabase
      .from('dna_calendar_events')
      .insert({
        title,
        description,
        location,
        start_time,
        end_time,
        event_type,
        group_id,
        cohort_id,
        church_id,
        is_recurring: false,
        created_by: leader.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[CALENDAR] Create error:', error);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('[CALENDAR] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper: Generate recurring event instances
function generateRecurringInstances(
  startTime: string,
  endTime: string | null,
  pattern: { frequency: string; interval: number; day_of_week?: number; end_date: string }
): Array<{ start: string; end: string | null }> {
  const instances: Array<{ start: string; end: string | null }> = [];
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : null;
  // end_date from the form is "YYYY-MM-DD" (no time) — treat as end of that day
  // to avoid timezone issues where midnight UTC < start_time UTC
  const endDateStr = pattern.end_date.includes('T')
    ? pattern.end_date
    : pattern.end_date + 'T23:59:59';
  const endDate = new Date(endDateStr);
  const duration = end ? end.getTime() - start.getTime() : 0;

  let current = new Date(start);
  let count = 0;
  const maxInstances = 100; // Safety limit

  while (current <= endDate && count < maxInstances) {
    instances.push({
      start: current.toISOString(),
      end: end ? new Date(current.getTime() + duration).toISOString() : null,
    });

    // Increment based on frequency
    if (pattern.frequency === 'weekly') {
      current.setDate(current.getDate() + (7 * pattern.interval));
    } else if (pattern.frequency === 'biweekly') {
      current.setDate(current.getDate() + 14);
    } else if (pattern.frequency === 'monthly') {
      current.setMonth(current.getMonth() + pattern.interval);
    }

    count++;
  }

  return instances;
}
