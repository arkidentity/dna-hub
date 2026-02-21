import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUnifiedSession, isAdmin, isChurchLeader } from '@/lib/unified-auth';

// GET: Fetch DNA leaders and groups for a church
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ churchId: string }> }
) {
  const session = await getUnifiedSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { churchId } = await params;
  const admin = isAdmin(session);

  // Non-admins can only view their own church
  if (!admin && !isChurchLeader(session, churchId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Fetch DNA leaders for this church
    const { data: leaders, error: leadersError } = await supabase
      .from('dna_leaders')
      .select('*')
      .eq('church_id', churchId)
      .order('created_at', { ascending: false });

    if (leadersError) throw leadersError;

    // Join last_login_at from users table (keyed by email)
    const leaderEmails = (leaders || []).map(l => l.email);
    let lastLoginMap: Record<string, string | null> = {};
    if (leaderEmails.length > 0) {
      const { data: userRows } = await supabase
        .from('users')
        .select('email, last_login_at')
        .in('email', leaderEmails);
      (userRows || []).forEach(u => {
        lastLoginMap[u.email] = u.last_login_at ?? null;
      });
    }
    const leadersWithLogin = (leaders || []).map(l => ({
      ...l,
      last_login_at: lastLoginMap[l.email] ?? null,
    }));

    // Get leader IDs to fetch their groups
    const leaderIds = leadersWithLogin.map(l => l.id);

    // Fetch groups and health check-ins in parallel (both depend on leaderIds)
    let groups: Array<{
      id: string;
      leader_id: string;
      group_name: string;
      current_phase: string;
      created_at: string;
      disciple_count?: number;
    }> = [];

    let healthSummaries: Array<{
      leader_id: string;
      status: string;
      flag_areas: unknown[];
      due_date: string;
      completed_at?: string;
    }> = [];

    if (leaderIds.length > 0) {
      const [groupsResult, healthResult] = await Promise.all([
        supabase
          .from('dna_groups')
          .select('*')
          .in('leader_id', leaderIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('leader_health_checkins')
          .select('leader_id, status, flag_areas, due_date, completed_at')
          .in('leader_id', leaderIds)
          .order('due_date', { ascending: false }),
      ]);

      if (groupsResult.error) throw groupsResult.error;
      groups = groupsResult.data || [];

      // Get disciple counts for each group
      if (groups.length > 0) {
        const groupIds = groups.map(g => g.id);
        const { data: discipleCounts, error: countError } = await supabase
          .from('group_disciples')
          .select('group_id')
          .in('group_id', groupIds)
          .eq('is_active', true);

        if (!countError && discipleCounts) {
          const countMap: Record<string, number> = {};
          discipleCounts.forEach(d => {
            countMap[d.group_id] = (countMap[d.group_id] || 0) + 1;
          });
          groups = groups.map(g => ({
            ...g,
            disciple_count: countMap[g.id] || 0,
          }));
        }
      }

      // Process health check-in summaries
      if (!healthResult.error && healthResult.data) {
        const latestByLeader: Record<string, (typeof healthResult.data)[0]> = {};
        healthResult.data.forEach(h => {
          if (!latestByLeader[h.leader_id]) {
            latestByLeader[h.leader_id] = h;
          }
        });
        healthSummaries = Object.values(latestByLeader);
      }
    }

    // Calculate stats
    const stats = {
      totalLeaders: leadersWithLogin.length,
      activeLeaders: leadersWithLogin.filter(l => l.is_active && l.activated_at).length,
      pendingInvites: leadersWithLogin.filter(l => !l.activated_at).length,
      totalGroups: groups.length,
      totalDisciples: groups.reduce((sum, g) => sum + (g.disciple_count || 0), 0),
      healthyLeaders: healthSummaries.filter(h => h.status === 'healthy').length,
      needsAttentionLeaders: healthSummaries.filter(h => h.status === 'needs_attention').length,
    };

    return NextResponse.json({
      leaders: leadersWithLogin,
      groups,
      healthSummaries,
      stats,
    });
  } catch (error) {
    console.error('Error fetching DNA groups data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DNA groups data' },
      { status: 500 }
    );
  }
}
