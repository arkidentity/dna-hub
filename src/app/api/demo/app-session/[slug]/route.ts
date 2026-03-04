import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/demo/app-session/[slug]
 * Public endpoint (no auth required).
 *
 * Returns short-lived Supabase access + refresh tokens for the global demo
 * account so DemoPageClient can pass them to the Daily DNA iframe via
 * /demo-entry?at=...&rt=...&church={slug} — giving prospects a signed-in
 * experience without a login screen.
 *
 * Flow:
 *   1. Verify church + demo_enabled
 *   2. Sign in as the global demo account (demo-global@dna.demo)
 *   3. Return { access_token, refresh_token, expires_in }
 *
 * Global vs per-church:
 *   Previously each church had its own demo user (demo-{slug}@dna.demo).
 *   Now all churches share one global demo account. Church-specific branding
 *   is handled by the Daily DNA iframe URL subdomain, not by the auth user.
 *   This eliminates per-church group/disciple pollution in the database.
 *
 *   The global account must be seeded once via:
 *     POST /api/admin/demo/global-seed
 *
 * Returns { demo_auth: false } if demo is not enabled for this church,
 * or if the global seed hasn't been run yet.
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

    // ── 1. Verify church + demo_enabled ────────────────────────────────────
    const { data: church } = await supabase
      .from('churches')
      .select('id, subdomain')
      .eq('subdomain', slug)
      .single();

    if (!church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    const { data: demoSettings } = await supabase
      .from('church_demo_settings')
      .select('demo_enabled')
      .eq('church_id', church.id)
      .single();

    if (!demoSettings?.demo_enabled) {
      return NextResponse.json({ error: 'Demo not enabled' }, { status: 403 });
    }

    // ── 2. Sign in as the global demo account ─────────────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[DEMO] Missing Supabase env vars');
      return NextResponse.json({ demo_auth: false });
    }

    // One shared account for all churches — branding comes from the iframe URL subdomain
    const demoEmail = process.env.DEMO_GLOBAL_EMAIL ?? 'demo-global@dna.demo';
    const demoPassword = process.env.DEMO_GLOBAL_PASSWORD ?? 'dna-demo-global-session';

    // Use anon client — signInWithPassword is a user-facing operation
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: sessionData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });

    if (signInError || !sessionData?.session) {
      console.error('[DEMO] signInWithPassword error:', signInError?.message ?? 'no session returned');
      // Global seed hasn't been run yet — run POST /api/admin/demo/global-seed
      return NextResponse.json({ demo_auth: false });
    }

    // ── 3. Return tokens ───────────────────────────────────────────────────
    return NextResponse.json({
      demo_auth: true,
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      expires_in: sessionData.session.expires_in,
    });
  } catch (error) {
    console.error('[DEMO] app-session GET error:', error);
    return NextResponse.json({ demo_auth: false });
  }
}
