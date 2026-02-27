import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin, isAdminOrCoach } from '@/lib/unified-auth';
import { ensureCoachAccount } from '@/lib/coachAuth';

/**
 * GET /api/admin/coaches
 * Returns all DNA coaches ordered by name, with stats (church_count, demo_count).
 * Accessible by admins and DNA coaches (coaches need the list for their own profile).
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdminOrCoach(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const supabase = getSupabaseAdmin();

    // Fetch coaches + churches + demo settings in parallel for stats
    const [coachesResult, churchesResult, demoResult] = await Promise.all([
      supabase
        .from('dna_coaches')
        .select('id, name, email, login_email, phone, booking_embed, user_id, created_at')
        .order('name', { ascending: true }),
      supabase
        .from('churches')
        .select('id, coach_id')
        .not('coach_id', 'is', null),
      supabase
        .from('church_demo_settings')
        .select('church_id')
        .eq('demo_enabled', true),
    ]);

    if (coachesResult.error) {
      console.error('[ADMIN] Coaches fetch error:', coachesResult.error);
      return NextResponse.json({ error: 'Failed to fetch coaches' }, { status: 500 });
    }

    const coaches = coachesResult.data ?? [];
    const assignedChurches = churchesResult.data ?? [];
    const demoChurchIds = new Set((demoResult.data ?? []).map(d => d.church_id));

    // Build a map of coach_id → church IDs for fast lookup
    const coachChurchMap = new Map<string, string[]>();
    for (const c of assignedChurches) {
      if (!c.coach_id) continue;
      const existing = coachChurchMap.get(c.coach_id) ?? [];
      existing.push(c.id);
      coachChurchMap.set(c.coach_id, existing);
    }

    // Attach stats to each coach
    const enriched = coaches.map(coach => {
      const churchIds = coachChurchMap.get(coach.id) ?? [];
      const demoCount = churchIds.filter(id => demoChurchIds.has(id)).length;
      return {
        ...coach,
        church_count: churchIds.length,
        demo_count: demoCount,
      };
    });

    return NextResponse.json({ coaches: enriched });
  } catch (error) {
    console.error('[ADMIN] Coaches GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/coaches
 * Creates a new DNA coach. Admin-only.
 * Body: { name, email?, phone?, booking_embed? }
 * If email is provided, auto-provisions a login account (fire-and-forget).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { name, email, login_email, phone, booking_embed } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Coach name is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('dna_coaches')
      .insert({
        name: name.trim(),
        email: email?.trim() || null,
        login_email: login_email?.trim() || null,
        phone: phone?.trim() || null,
        booking_embed: booking_embed?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .select('id, name, email, login_email, phone, booking_embed, user_id, created_at')
      .single();

    if (error) {
      console.error('[ADMIN] Coach create error:', error);
      return NextResponse.json({ error: 'Failed to create coach' }, { status: 500 });
    }

    // Auto-provision login account. Use login_email if provided (the email they log in with),
    // otherwise fall back to the display email.
    const authEmail = login_email?.trim() || email?.trim();
    if (data && authEmail) {
      void (async () => {
        await ensureCoachAccount(data.id, authEmail, name.trim());
      })();
    }

    return NextResponse.json({ coach: { ...data, church_count: 0, demo_count: 0 } }, { status: 201 });
  } catch (error) {
    console.error('[ADMIN] Coaches POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
