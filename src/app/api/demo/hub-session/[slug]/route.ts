import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/demo/hub-session/[slug]
 * Public endpoint (no auth required).
 *
 * Returns short-lived Supabase access + refresh tokens for the Hub demo
 * church leader account so HubDemoClient can call setSession() and redirect
 * to /groups — giving prospects a signed-in experience without a login screen.
 *
 * Flow:
 *   1. Verify church + demo_enabled
 *   2. Confirm hub_demo_leader_id is set (i.e. hub-seed has been run)
 *   3. Sign in as the demo Hub leader using signInWithPassword (anon client)
 *   4. Return { demo_auth: true, access_token, refresh_token, expires_in }
 *
 * Returns { demo_auth: false } if the church hasn't been Hub-seeded yet.
 * HubDemoClient treats this as "not seeded" and falls back to the static mini-dashboard.
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
      .select('demo_enabled, hub_demo_leader_id')
      .eq('church_id', church.id)
      .single();

    if (!demoSettings?.demo_enabled) {
      return NextResponse.json({ error: 'Demo not enabled' }, { status: 403 });
    }

    // ── 2. Check for seeded Hub demo leader ────────────────────────────────
    if (!demoSettings.hub_demo_leader_id) {
      return NextResponse.json({ demo_auth: false });
    }

    // ── 3. Sign in as the Hub demo leader ──────────────────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[DEMO] Missing Supabase env vars');
      return NextResponse.json({ demo_auth: false });
    }

    const demoEmail = `demo-hub-${slug}@dna.demo`;
    const demoPassword = `dna-hub-demo-${slug}-session`;

    // Use anon client — signInWithPassword is a user-facing operation
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: sessionData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });

    if (signInError || !sessionData?.session) {
      console.error('[DEMO] Hub signInWithPassword error:', signInError?.message ?? 'no session returned');
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
    console.error('[DEMO] hub-session GET error:', error);
    return NextResponse.json({ demo_auth: false });
  }
}
