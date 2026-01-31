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

    // Get leader IDs to fetch their groups
    const leaderIds = (leaders || []).map(l => l.id);

    // Fetch groups for these leaders
    let groups: Array<{
      id: string;
      leader_id: string;
      group_name: string;
      current_phase: string;
      created_at: string;
      disciple_count?: number;
    }> = [];

    if (leaderIds.length > 0) {
      const { data: groupsData, error: groupsError } = await supabase
        .from('dna_groups')
        .select('*')
        .in('leader_id', leaderIds)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;
      groups = groupsData || [];

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
    }

    // Fetch health check-in summaries (only status and flags visible to church leaders)
    let healthSummaries: Array<{
      leader_id: string;
      status: string;
      flag_areas: unknown[];
      due_date: string;
      completed_at?: string;
    }> = [];

    if (leaderIds.length > 0) {
      const { data: healthData, error: healthError } = await supabase
        .from('leader_health_checkins')
        .select('leader_id, status, flag_areas, due_date, completed_at')
        .in('leader_id', leaderIds)
        .order('due_date', { ascending: false });

      if (!healthError && healthData) {
        // Get only the most recent checkin per leader
        const latestByLeader: Record<string, typeof healthData[0]> = {};
        healthData.forEach(h => {
          if (!latestByLeader[h.leader_id]) {
            latestByLeader[h.leader_id] = h;
          }
        });
        healthSummaries = Object.values(latestByLeader);
      }
    }

    // Calculate stats
    const stats = {
      totalLeaders: leaders?.length || 0,
      activeLeaders: leaders?.filter(l => l.is_active && l.activated_at).length || 0,
      pendingInvites: leaders?.filter(l => !l.activated_at).length || 0,
      totalGroups: groups.length,
      totalDisciples: groups.reduce((sum, g) => sum + (g.disciple_count || 0), 0),
      healthyLeaders: healthSummaries.filter(h => h.status === 'healthy').length,
      needsAttentionLeaders: healthSummaries.filter(h => h.status === 'needs_attention').length,
    };

    return NextResponse.json({
      leaders: leaders || [],
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
