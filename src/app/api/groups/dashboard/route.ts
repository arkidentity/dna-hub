import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole } from '@/lib/unified-auth';

// GET /api/groups/dashboard
// Get dashboard data for the logged-in DNA leader
export async function GET() {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a DNA leader or church leader
    if (!(hasRole(session, 'dna_leader') || hasRole(session, 'church_leader'))) {
      return NextResponse.json(
        { error: 'Forbidden - DNA leader access required' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get DNA leader record
    const { data: dnaLeader, error: leaderError } = await supabase
      .from('dna_leaders')
      .select(`
        *,
        church:churches(id, name, logo_url)
      `)
      .eq('email', session.email)
      .single();

    // If no dna_leaders record (e.g. pure church_leader), return empty dashboard
    if (!dnaLeader) {
      return NextResponse.json({
        leader: { id: null, name: session.name, email: session.email, church: null },
        groups: [],
        stats: { total_groups: 0, active_groups: 0, total_disciples: 0 },
      });
    }

    const leaderId = dnaLeader.id;

    // Get all groups where this person is leader or co-leader
    const { data: groups, error: groupsError } = await supabase
      .from('dna_groups')
      .select(`
        id,
        group_name,
        current_phase,
        start_date,
        multiplication_target_date,
        is_active,
        leader_id,
        co_leader_id
      `)
      .or(`leader_id.eq.${leaderId},co_leader_id.eq.${leaderId}`)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (groupsError) {
      console.error('[Groups Dashboard] Error fetching groups:', groupsError);
      return NextResponse.json(
        { error: 'Failed to fetch groups' },
        { status: 500 }
      );
    }

    // Get disciple counts for each group
    const groupIds = groups?.map(g => g.id) || [];
    let discipleCounts: Record<string, number> = {};

    if (groupIds.length > 0) {
      const { data: discipleData, error: discipleError } = await supabase
        .from('group_disciples')
        .select('group_id')
        .in('group_id', groupIds)
        .eq('current_status', 'active');

      if (!discipleError && discipleData) {
        // Count disciples per group
        discipleData.forEach(d => {
          discipleCounts[d.group_id] = (discipleCounts[d.group_id] || 0) + 1;
        });
      }
    }

    // Format groups with disciple counts
    const formattedGroups = (groups || []).map(group => ({
      id: group.id,
      group_name: group.group_name,
      current_phase: group.current_phase,
      start_date: group.start_date,
      multiplication_target_date: group.multiplication_target_date,
      disciple_count: discipleCounts[group.id] || 0,
    }));

    // Calculate stats
    const activeGroups = formattedGroups.filter(g =>
      g.current_phase !== 'multiplication' // Groups that haven't completed
    ).length;

    const totalDisciples = Object.values(discipleCounts).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      leader: {
        id: dnaLeader.id,
        name: dnaLeader.name,
        email: dnaLeader.email,
        church: dnaLeader.church,
      },
      groups: formattedGroups,
      stats: {
        total_groups: formattedGroups.length,
        active_groups: activeGroups,
        total_disciples: totalDisciples,
      },
    });

  } catch (error) {
    console.error('[Groups Dashboard] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
