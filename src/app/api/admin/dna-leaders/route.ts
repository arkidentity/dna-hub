import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

// GET: List all DNA leaders (admin only)
export async function GET(request: NextRequest) {
  const session = await getUnifiedSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Fetch all DNA leaders with church info
    const { data: leaders, error: leadersError } = await supabase
      .from('dna_leaders')
      .select(`
        *,
        churches:church_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (leadersError) throw leadersError;

    // Get group counts for each leader
    const leaderIds = (leaders || []).map(l => l.id);
    let groupCounts: Record<string, number> = {};
    let discipleCounts: Record<string, number> = {};

    if (leaderIds.length > 0) {
      // Get groups per leader
      const { data: groups, error: groupsError } = await supabase
        .from('dna_groups')
        .select('id, leader_id')
        .in('leader_id', leaderIds);

      if (!groupsError && groups) {
        groups.forEach(g => {
          groupCounts[g.leader_id] = (groupCounts[g.leader_id] || 0) + 1;
        });

        // Get disciple counts per group
        const groupIds = groups.map(g => g.id);
        if (groupIds.length > 0) {
          const { data: disciples, error: disciplesError } = await supabase
            .from('group_disciples')
            .select('group_id')
            .in('group_id', groupIds)
            .eq('is_active', true);

          if (!disciplesError && disciples) {
            // Map group_id back to leader_id for disciple counts
            const groupToLeader: Record<string, string> = {};
            groups.forEach(g => {
              groupToLeader[g.id] = g.leader_id;
            });

            disciples.forEach(d => {
              const leaderId = groupToLeader[d.group_id];
              if (leaderId) {
                discipleCounts[leaderId] = (discipleCounts[leaderId] || 0) + 1;
              }
            });
          }
        }
      }
    }

    // Format response
    const formattedLeaders = (leaders || []).map(leader => ({
      ...leader,
      church_name: leader.churches?.name || null,
      group_count: groupCounts[leader.id] || 0,
      disciple_count: discipleCounts[leader.id] || 0,
    }));

    // Calculate stats
    const stats = {
      total: formattedLeaders.length,
      active: formattedLeaders.filter(l => l.is_active && l.activated_at).length,
      pending: formattedLeaders.filter(l => !l.activated_at).length,
      independent: formattedLeaders.filter(l => !l.church_id).length,
      churchAffiliated: formattedLeaders.filter(l => l.church_id).length,
      totalGroups: Object.values(groupCounts).reduce((sum, c) => sum + c, 0),
      totalDisciples: Object.values(discipleCounts).reduce((sum, c) => sum + c, 0),
    };

    return NextResponse.json({
      leaders: formattedLeaders,
      stats,
    });
  } catch (error) {
    console.error('Error fetching DNA leaders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DNA leaders' },
      { status: 500 }
    );
  }
}
