import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';

/**
 * GET /api/demo/church/[slug]
 * Public endpoint — returns church branding + demo config for the demo landing page.
 * Only returns data if demo_enabled = true.
 * No auth required (public funnel page).
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

    // Fetch church by subdomain
    const { data: church, error: churchError } = await supabase
      .from('churches')
      .select('id, name, subdomain, primary_color, accent_color, logo_url, icon_url, splash_logo_url, contact_email')
      .eq('subdomain', slug)
      .single();

    if (churchError || !church) {
      return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
    }

    // Fetch demo settings — only return if enabled
    const { data: demo } = await supabase
      .from('church_demo_settings')
      .select('video_url, demo_enabled, default_temp, demo_seeded_at, coach_name')
      .eq('church_id', church.id)
      .single();

    if (!demo || !demo.demo_enabled) {
      return NextResponse.json({ error: 'Demo not available' }, { status: 404 });
    }

    // Fetch branding settings
    const { data: branding } = await supabase
      .from('church_branding_settings')
      .select('app_title, header_style')
      .eq('church_id', church.id)
      .single();

    return NextResponse.json({
      church: {
        id: church.id,
        name: church.name,
        subdomain: church.subdomain,
        primary_color: church.primary_color ?? '#143348',
        accent_color: church.accent_color ?? '#e8b562',
        logo_url: church.logo_url ?? null,
        icon_url: church.icon_url ?? null,
        app_title: branding?.app_title ?? 'DNA Daily',
        header_style: branding?.header_style ?? 'text',
      },
      demo: {
        video_url: demo.video_url ?? null,
        default_temp: demo.default_temp ?? 'warm',
        demo_seeded_at: demo.demo_seeded_at ?? null,
        coach_name: (demo.coach_name as string | null) ?? 'Travis',
      },
    });
  } catch (error) {
    console.error('[DEMO] Church fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
