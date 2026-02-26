import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/demo/app-session-free/[slug]
 * Public endpoint (no auth required).
 *
 * Returns short-lived Supabase tokens for the *free-tier* demo disciple —
 * a user with NO group membership and role='disciple', so the Daily DNA
 * app correctly shows the NoGroupView / "no group found" state.
 *
 * This powers the first iframe on the demo landing page (the "free" preview).
 * The full-experience iframe continues to use /api/demo/app-session/[slug].
 *
 * Returns { demo_auth: false } if the free user hasn't been seeded yet.
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
      .select('demo_enabled, demo_free_user_id')
      .eq('church_id', church.id)
      .single();

    if (!demoSettings?.demo_enabled) {
      return NextResponse.json({ error: 'Demo not enabled' }, { status: 403 });
    }

    // ── 2. Check for seeded free-tier user ─────────────────────────────────
    if (!demoSettings.demo_free_user_id) {
      return NextResponse.json({ demo_auth: false });
    }

    // ── 3. Sign in as the free-tier demo account ───────────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[DEMO-FREE] Missing Supabase env vars');
      return NextResponse.json({ demo_auth: false });
    }

    const demoFreeEmail = `demo-free-${slug}@dna.demo`;
    const demoFreePassword = `dna-demo-free-${slug}-session`;

    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: sessionData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: demoFreeEmail,
      password: demoFreePassword,
    });

    if (signInError || !sessionData?.session) {
      console.error('[DEMO-FREE] signInWithPassword error:', signInError?.message ?? 'no session returned');
      return NextResponse.json({ demo_auth: false });
    }

    // ── 4. Return tokens ───────────────────────────────────────────────────
    return NextResponse.json({
      demo_auth: true,
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      expires_in: sessionData.session.expires_in,
    });
  } catch (error) {
    console.error('[DEMO-FREE] app-session-free GET error:', error);
    return NextResponse.json({ demo_auth: false });
  }
}
