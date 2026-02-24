import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';

/**
 * GET /api/demo/app-session/[slug]
 * Public endpoint (no auth required).
 *
 * Returns short-lived Supabase access + refresh tokens for the demo disciple
 * account, so the DemoPageClient can inject them into the Daily DNA iframe URL
 * as hash params — giving prospects a signed-in experience without a login screen.
 *
 * Flow:
 *   1. Verify church + demo_enabled
 *   2. Fetch demo_user_id from church_demo_settings
 *   3. Generate a magic link token via supabase.auth.admin.generateLink
 *   4. Exchange the hashed_token for session tokens via /auth/v1/verify
 *   5. Return { access_token, refresh_token, expires_in }
 *
 * Returns { demo_auth: false } if the church hasn't been seeded yet.
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
      .select('demo_enabled, demo_user_id')
      .eq('church_id', church.id)
      .single();

    if (!demoSettings?.demo_enabled) {
      return NextResponse.json({ error: 'Demo not enabled' }, { status: 403 });
    }

    // ── 2. Check for seeded demo user ──────────────────────────────────────
    if (!demoSettings.demo_user_id) {
      return NextResponse.json({ demo_auth: false });
    }

    const demoEmail = `demo-${slug}@dna.demo`;

    // ── 3. Generate magic link token ───────────────────────────────────────
    const appUrl = `https://${slug}.dailydna.app`;
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: demoEmail,
      options: {
        redirectTo: appUrl,
      },
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('[DEMO] generateLink error:', linkError);
      return NextResponse.json({ demo_auth: false });
    }

    const hashedToken = linkData.properties.hashed_token;

    // ── 4. Exchange hashed_token for session tokens ────────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[DEMO] Missing Supabase env vars');
      return NextResponse.json({ demo_auth: false });
    }

    const verifyRes = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        token: hashedToken,
        type: 'magiclink',
        redirect_to: appUrl,
      }),
    });

    if (!verifyRes.ok) {
      const verifyText = await verifyRes.text();
      console.error('[DEMO] /auth/v1/verify error:', verifyRes.status, verifyText);
      return NextResponse.json({ demo_auth: false });
    }

    const verifyData = await verifyRes.json();

    const accessToken = verifyData.access_token as string | undefined;
    const refreshToken = verifyData.refresh_token as string | undefined;
    const expiresIn = (verifyData.expires_in as number | undefined) ?? 3600;

    if (!accessToken || !refreshToken) {
      console.error('[DEMO] /auth/v1/verify response missing tokens:', Object.keys(verifyData));
      return NextResponse.json({ demo_auth: false });
    }

    // ── 5. Return tokens ───────────────────────────────────────────────────
    return NextResponse.json({
      demo_auth: true,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
    });
  } catch (error) {
    console.error('[DEMO] app-session GET error:', error);
    return NextResponse.json({ demo_auth: false });
  }
}
