import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

/**
 * POST /api/admin/demo/[churchId]/seed
 * Seeds demo calendar events for a church's demo page.
 * Idempotent: deletes prior seeded events and re-creates them.
 * Church event type used (no group_id or created_by required).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ churchId: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { churchId } = await params;
    const supabase = getSupabaseAdmin();

    // Verify church + demo settings exist
    const { data: church } = await supabase
      .from('churches')
      .select('id, name')
      .eq('id', churchId)
      .single();

    if (!church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    // Delete any prior seeded events (identified by title prefix)
    await supabase
      .from('dna_calendar_events')
      .delete()
      .eq('church_id', churchId)
      .ilike('title', '[DEMO]%');

    // Build upcoming event dates (next Thursday + Thursday after)
    const getNextThursday = (offset: number): Date => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun, 4=Thu
      const daysUntilThursday = ((4 - dayOfWeek + 7) % 7) || 7;
      const next = new Date(now);
      next.setDate(now.getDate() + daysUntilThursday + offset * 7);
      next.setHours(19, 0, 0, 0); // 7:00 PM
      return next;
    };

    const event1Start = getNextThursday(0);
    const event1End = new Date(event1Start.getTime() + 90 * 60 * 1000); // +90 min
    const event2Start = getNextThursday(1);
    const event2End = new Date(event2Start.getTime() + 90 * 60 * 1000);

    const eventsToInsert = [
      {
        title: `[DEMO] Life Group Meeting`,
        description: 'Weekly DNA Life Group — Phase 1, Week 3. Bring your journal!',
        location: 'Church Fellowship Hall',
        start_time: event1Start.toISOString(),
        end_time: event1End.toISOString(),
        event_type: 'church_event' as const,
        church_id: churchId,
        group_id: null,
        cohort_id: null,
        is_recurring: false,
        created_by: null,
      },
      {
        title: `[DEMO] Leader Check-in`,
        description: 'Monthly DNA leader alignment and prayer. All group leaders welcome.',
        location: 'Pastor\'s Office',
        start_time: event2Start.toISOString(),
        end_time: event2End.toISOString(),
        event_type: 'church_event' as const,
        church_id: churchId,
        group_id: null,
        cohort_id: null,
        is_recurring: false,
        created_by: null,
      },
    ];

    const { error: insertError } = await supabase
      .from('dna_calendar_events')
      .insert(eventsToInsert);

    if (insertError) {
      console.error('[DEMO] Event seed error:', insertError);
      return NextResponse.json({ error: 'Failed to seed calendar events' }, { status: 500 });
    }

    // Update seed timestamp
    const { error: updateError } = await supabase
      .from('church_demo_settings')
      .upsert(
        {
          church_id: churchId,
          demo_seeded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'church_id' }
      );

    if (updateError) {
      console.error('[DEMO] Seed timestamp update error:', updateError);
      // Non-fatal — events were created successfully
    }

    return NextResponse.json({
      success: true,
      seeded: {
        calendar_events: eventsToInsert.length,
      },
    });
  } catch (error) {
    console.error('[DEMO] Seed POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
