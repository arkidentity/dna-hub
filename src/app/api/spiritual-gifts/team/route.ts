import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin, hasRole, getPrimaryChurch } from '@/lib/unified-auth';

/**
 * GET /api/spiritual-gifts/team?church_id=<id>
 *
 * Returns completed spiritual gifts assessments for all team members
 * who took the test via the church-scoped link for this church.
 *
 * Auth: church_leader for that church, or admin.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const churchId = searchParams.get('church_id');

    if (!churchId) {
      return NextResponse.json({ error: 'church_id is required' }, { status: 400 });
    }

    // Must be admin or church_leader for this church
    const isSuperAdmin = isAdmin(session);
    const isLeaderForChurch =
      hasRole(session, 'church_leader') && getPrimaryChurch(session) === churchId;

    if (!isSuperAdmin && !isLeaderForChurch) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // Fetch completed assessments for this church, joined with user info
    const { data, error } = await supabase
      .from('spiritual_gifts_assessments')
      .select(`
        id,
        disciple_id,
        full_name,
        email,
        tier1_primary,
        tier1_primary_score,
        tier1_secondary,
        tier1_secondary_score,
        tier2_primary,
        tier2_primary_score,
        tier2_secondary,
        tier2_secondary_score,
        tier3_primary,
        tier3_primary_score,
        tier3_secondary,
        tier3_secondary_score,
        completed_at
      `)
      .eq('church_id', churchId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('[Team Gifts] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch team results' }, { status: 500 });
    }

    // For assessments where full_name/email is null, resolve from users table via disciple_id
    const discipleIds = (data || [])
      .filter((r) => (!r.full_name || !r.email) && r.disciple_id)
      .map((r) => r.disciple_id);

    let userMap: Record<string, { name: string; email: string }> = {};
    if (discipleIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', discipleIds);

      for (const u of users || []) {
        userMap[u.id] = { name: u.name, email: u.email };
      }
    }

    const members = (data || []).map((r) => ({
      id: r.id,
      name: r.full_name || userMap[r.disciple_id]?.name || 'Unknown',
      email: r.email || userMap[r.disciple_id]?.email || '',
      tier1_primary: r.tier1_primary,
      tier1_primary_score: r.tier1_primary_score,
      tier1_secondary: r.tier1_secondary,
      tier1_secondary_score: r.tier1_secondary_score,
      tier2_primary: r.tier2_primary,
      tier2_primary_score: r.tier2_primary_score,
      tier2_secondary: r.tier2_secondary,
      tier2_secondary_score: r.tier2_secondary_score,
      tier3_primary: r.tier3_primary,
      tier3_primary_score: r.tier3_primary_score,
      tier3_secondary: r.tier3_secondary,
      tier3_secondary_score: r.tier3_secondary_score,
      completed_at: r.completed_at,
    }));

    return NextResponse.json({ members });
  } catch (error) {
    console.error('[Team Gifts] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
