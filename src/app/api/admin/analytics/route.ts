import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

export async function GET() {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // Get all churches with timestamps
    const { data: churches, error: churchesError } = await supabase
      .from('churches')
      .select('id, name, status, current_phase, created_at, updated_at');

    if (churchesError) {
      console.error('[ANALYTICS] Error:', churchesError);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // Get leaders for at-risk churches
    const churchIds = churches?.map(c => c.id) || [];
    const { data: leaders } = await supabase
      .from('church_leaders')
      .select('church_id, name, email')
      .in('church_id', churchIds)
      .eq('is_primary_contact', true);

    // Calculate funnel metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Status counts
    const statusCounts: Record<string, number> = {};
    churches?.forEach(church => {
      statusCounts[church.status] = (statusCounts[church.status] || 0) + 1;
    });

    // Pipeline stages in order
    const pipelineStages = [
      { key: 'pending_assessment', label: 'Assessment' },
      { key: 'awaiting_discovery', label: 'Discovery' },
      { key: 'proposal_sent', label: 'Proposal' },
      { key: 'awaiting_agreement', label: 'Agreement' },
      { key: 'awaiting_strategy', label: 'Strategy' },
      { key: 'active', label: 'Active' },
      { key: 'completed', label: 'Completed' },
    ];

    const pipeline = pipelineStages.map(stage => ({
      ...stage,
      count: statusCounts[stage.key] || 0,
    }));

    // Calculate conversion rates (cumulative)
    const total = churches?.length || 0;
    const conversions = pipelineStages.slice(0, -1).map((stage, index) => {
      // Count churches that made it past this stage
      const pastThisStage = pipelineStages
        .slice(index + 1)
        .reduce((sum, s) => sum + (statusCounts[s.key] || 0), 0);
      const atOrPastThisStage = (statusCounts[stage.key] || 0) + pastThisStage;

      // Conversion rate from previous stage
      const prevStageTotal = index === 0
        ? total
        : pipelineStages
            .slice(index)
            .reduce((sum, s) => sum + (statusCounts[s.key] || 0), 0) +
          (statusCounts[pipelineStages[index - 1].key] || 0);

      const rate = prevStageTotal > 0 ? Math.round((atOrPastThisStage / prevStageTotal) * 100) : 0;

      return {
        from: index === 0 ? 'New' : pipelineStages[index - 1].label,
        to: stage.label,
        rate,
        count: atOrPastThisStage,
      };
    });

    // Churches at risk (no activity in 14+ days, not completed/declined)
    const atRiskChurches = churches
      ?.filter(church => {
        if (['completed', 'declined', 'paused'].includes(church.status)) return false;
        const lastUpdate = new Date(church.updated_at);
        const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceUpdate >= 14;
      })
      .map(church => {
        const leader = leaders?.find(l => l.church_id === church.id);
        const lastUpdate = new Date(church.updated_at);
        const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: church.id,
          name: church.name,
          status: church.status,
          leader_name: leader?.name || 'Unknown',
          leader_email: leader?.email || '',
          days_inactive: daysSinceUpdate,
        };
      })
      .sort((a, b) => b.days_inactive - a.days_inactive) || [];

    // Recent activity (last 7 days)
    const recentlyActive = churches?.filter(church => {
      const lastUpdate = new Date(church.updated_at);
      return lastUpdate >= sevenDaysAgo;
    }).length || 0;

    // New this month
    const newThisMonth = churches?.filter(church => {
      const created = new Date(church.created_at);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length || 0;

    // Phase distribution (for active churches)
    const phaseDistribution: Record<number, number> = {};
    churches?.filter(c => c.status === 'active').forEach(church => {
      phaseDistribution[church.current_phase] = (phaseDistribution[church.current_phase] || 0) + 1;
    });

    // Time in status analysis (average days in each status)
    // This would require historical data we don't have, so we'll show current tenure
    const avgTenure: Record<string, number> = {};
    const tenureCounts: Record<string, number[]> = {};

    churches?.forEach(church => {
      const created = new Date(church.created_at);
      const daysInSystem = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

      if (!tenureCounts[church.status]) {
        tenureCounts[church.status] = [];
      }
      tenureCounts[church.status].push(daysInSystem);
    });

    Object.keys(tenureCounts).forEach(status => {
      const days = tenureCounts[status];
      avgTenure[status] = Math.round(days.reduce((a, b) => a + b, 0) / days.length);
    });

    return NextResponse.json({
      summary: {
        total: total,
        active: statusCounts['active'] || 0,
        completed: statusCounts['completed'] || 0,
        inPipeline: total - (statusCounts['active'] || 0) - (statusCounts['completed'] || 0) - (statusCounts['declined'] || 0) - (statusCounts['paused'] || 0),
        atRisk: atRiskChurches.length,
        recentlyActive,
        newThisMonth,
      },
      pipeline,
      conversions,
      atRiskChurches,
      phaseDistribution,
      avgTenure,
    });
  } catch (error) {
    console.error('[ANALYTICS] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
