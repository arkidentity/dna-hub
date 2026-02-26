import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';

/**
 * GET /api/demo/hub-data/[slug]
 * Public endpoint — returns Hub seed data for the no-auth Hub demo preview.
 * Only returns data if demo_enabled = true.
 * Uses admin client to read seeded calendar events.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Verify church + demo enabled
    const { data: church } = await supabase
      .from('churches')
      .select('id, name, subdomain, primary_color, accent_color, logo_url')
      .eq('subdomain', slug)
      .single();

    if (!church) {
      return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
    }

    const { data: demo } = await supabase
      .from('church_demo_settings')
      .select('demo_enabled, booking_url')
      .eq('church_id', church.id)
      .single();

    if (!demo?.demo_enabled) {
      return NextResponse.json({ error: 'Demo not available' }, { status: 404 });
    }

    // Fetch seeded calendar events for this church
    const now = new Date().toISOString();
    const { data: events } = await supabase
      .from('dna_calendar_events')
      .select('id, title, description, location, start_time, end_time, event_type')
      .eq('church_id', church.id)
      .gte('start_time', now)
      .order('start_time', { ascending: true })
      .limit(5);

    return NextResponse.json({
      church: {
        name: church.name,
        subdomain: church.subdomain,
        primary_color: church.primary_color ?? '#143348',
        accent_color: church.accent_color ?? '#e8b562',
        logo_url: church.logo_url ?? null,
      },
      events: events ?? [],
      booking_url: (demo.booking_url as string | null) ?? null,
    });
  } catch (error) {
    console.error('[DEMO] Hub data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
