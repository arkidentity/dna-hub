import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

// ============================================
// GET — Fetch branding settings for a church
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const churchId = searchParams.get('church_id');

    if (!churchId) {
      return NextResponse.json({ error: 'church_id is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Fetch church branding fields + extended settings
    const { data: church, error: churchError } = await supabase
      .from('churches')
      .select('id, name, logo_url, icon_url, splash_logo_url, subdomain, primary_color, accent_color, contact_email')
      .eq('id', churchId)
      .single();

    if (churchError) {
      console.error('[ADMIN] Branding fetch error:', churchError);
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    const { data: settings } = await supabase
      .from('church_branding_settings')
      .select('app_title, app_description, theme_color, header_style, reading_plan_id, custom_tab_label, custom_tab_url, custom_tab_mode, custom_link_1_title, custom_link_1_url, custom_link_1_mode, custom_link_2_title, custom_link_2_url, custom_link_2_mode, custom_link_3_title, custom_link_3_url, custom_link_3_mode, custom_link_4_title, custom_link_4_url, custom_link_4_mode, custom_link_5_title, custom_link_5_url, custom_link_5_mode')
      .eq('church_id', churchId)
      .single();

    return NextResponse.json({
      branding: {
        ...church,
        app_title: settings?.app_title ?? 'DNA Daily',
        app_description: settings?.app_description ?? 'Daily discipleship tools',
        theme_color: settings?.theme_color ?? church.primary_color ?? '#143348',
        header_style: settings?.header_style ?? 'text',
        reading_plan_id: settings?.reading_plan_id ?? null,
        custom_tab_label: settings?.custom_tab_label ?? null,
        custom_tab_url: settings?.custom_tab_url ?? null,
        custom_tab_mode: settings?.custom_tab_mode ?? 'browser',
        custom_link_1_title: settings?.custom_link_1_title ?? null,
        custom_link_1_url: settings?.custom_link_1_url ?? null,
        custom_link_1_mode: settings?.custom_link_1_mode ?? 'browser',
        custom_link_2_title: settings?.custom_link_2_title ?? null,
        custom_link_2_url: settings?.custom_link_2_url ?? null,
        custom_link_2_mode: settings?.custom_link_2_mode ?? 'browser',
        custom_link_3_title: settings?.custom_link_3_title ?? null,
        custom_link_3_url: settings?.custom_link_3_url ?? null,
        custom_link_3_mode: settings?.custom_link_3_mode ?? 'browser',
        custom_link_4_title: settings?.custom_link_4_title ?? null,
        custom_link_4_url: settings?.custom_link_4_url ?? null,
        custom_link_4_mode: settings?.custom_link_4_mode ?? 'browser',
        custom_link_5_title: settings?.custom_link_5_title ?? null,
        custom_link_5_url: settings?.custom_link_5_url ?? null,
        custom_link_5_mode: settings?.custom_link_5_mode ?? 'browser',
      },
    });
  } catch (error) {
    console.error('[ADMIN] Branding GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST — Save branding settings for a church
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const {
      church_id,
      subdomain,
      primary_color,
      accent_color,
      logo_url,
      icon_url,
      splash_logo_url,
      app_title,
      app_description,
      theme_color,
      header_style,
      reading_plan_id,
      custom_tab_label,
      custom_tab_url,
      custom_tab_mode,
      custom_link_1_title,
      custom_link_1_url,
      custom_link_1_mode,
      custom_link_2_title,
      custom_link_2_url,
      custom_link_2_mode,
      custom_link_3_title,
      custom_link_3_url,
      custom_link_3_mode,
      custom_link_4_title,
      custom_link_4_url,
      custom_link_4_mode,
      custom_link_5_title,
      custom_link_5_url,
      custom_link_5_mode,
      contact_email,
    } = body;

    if (!church_id) {
      return NextResponse.json({ error: 'church_id is required' }, { status: 400 });
    }

    // Validate subdomain format (lowercase letters, numbers, hyphens only)
    if (subdomain && !/^[a-z0-9-]+$/.test(subdomain)) {
      return NextResponse.json(
        { error: 'Subdomain can only contain lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    // Validate hex colors
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (primary_color && !hexColorRegex.test(primary_color)) {
      return NextResponse.json({ error: 'Invalid primary_color format (use #rrggbb)' }, { status: 400 });
    }
    if (accent_color && !hexColorRegex.test(accent_color)) {
      return NextResponse.json({ error: 'Invalid accent_color format (use #rrggbb)' }, { status: 400 });
    }

    // Check subdomain uniqueness (if provided and changed)
    if (subdomain) {
      const { data: existing } = await supabase
        .from('churches')
        .select('id')
        .eq('subdomain', subdomain)
        .neq('id', church_id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'This subdomain is already taken by another church' },
          { status: 409 }
        );
      }
    }

    // Update churches table (core branding fields)
    const { error: churchError } = await supabase
      .from('churches')
      .update({
        subdomain: subdomain || null,
        primary_color: primary_color || '#143348',
        accent_color: accent_color || '#e8b562',
        logo_url: logo_url ?? undefined,
        icon_url: icon_url ?? undefined,
        splash_logo_url: splash_logo_url ?? undefined,
        contact_email: contact_email || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', church_id);

    if (churchError) {
      console.error('[ADMIN] Church update error:', churchError);
      return NextResponse.json({ error: 'Failed to update church branding' }, { status: 500 });
    }

    // Upsert church_branding_settings (extended config)
    if (app_title || app_description || theme_color || header_style || reading_plan_id !== undefined) {
      const { error: settingsError } = await supabase
        .from('church_branding_settings')
        .upsert(
          {
            church_id,
            app_title: app_title || 'DNA Daily',
            app_description: app_description || 'Daily discipleship tools',
            theme_color: theme_color || primary_color || '#143348',
            header_style: header_style || 'text',
            reading_plan_id: reading_plan_id || null,
            custom_tab_label: custom_tab_label || null,
            custom_tab_url: custom_tab_url || null,
            custom_tab_mode: custom_tab_mode || 'browser',
            custom_link_1_title: custom_link_1_title || null,
            custom_link_1_url: custom_link_1_url || null,
            custom_link_1_mode: custom_link_1_mode || 'browser',
            custom_link_2_title: custom_link_2_title || null,
            custom_link_2_url: custom_link_2_url || null,
            custom_link_2_mode: custom_link_2_mode || 'browser',
            custom_link_3_title: custom_link_3_title || null,
            custom_link_3_url: custom_link_3_url || null,
            custom_link_3_mode: custom_link_3_mode || 'browser',
            custom_link_4_title: custom_link_4_title || null,
            custom_link_4_url: custom_link_4_url || null,
            custom_link_4_mode: custom_link_4_mode || 'browser',
            custom_link_5_title: custom_link_5_title || null,
            custom_link_5_url: custom_link_5_url || null,
            custom_link_5_mode: custom_link_5_mode || 'browser',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'church_id' }
        );

      if (settingsError) {
        console.error('[ADMIN] Branding settings upsert error:', settingsError);
        // Non-fatal — core fields already saved
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] Branding POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
