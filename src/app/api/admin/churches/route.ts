import { NextRequest, NextResponse } from 'next/server';
import { getSession, isAdmin, getSupabaseAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.leader.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // Get all churches with leader info
    const { data: churches, error: churchesError } = await supabase
      .from('churches')
      .select(`
        id,
        name,
        status,
        current_phase,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (churchesError) {
      console.error('[ADMIN] Churches error:', churchesError);
      return NextResponse.json({ error: 'Failed to fetch churches' }, { status: 500 });
    }

    // Get leaders for each church
    const churchIds = churches?.map(c => c.id) || [];
    const { data: leaders } = await supabase
      .from('church_leaders')
      .select('id, church_id, name, email')
      .in('church_id', churchIds)
      .eq('is_primary_contact', true);

    // Get progress for active churches
    const activeChurchIds = churches?.filter(c => c.status === 'active').map(c => c.id) || [];
    const { data: progress } = await supabase
      .from('church_progress')
      .select('church_id, completed, target_date')
      .in('church_id', activeChurchIds);

    // Get milestones count (excluding phase 0)
    const { data: phases } = await supabase
      .from('phases')
      .select('id')
      .gt('phase_number', 0);

    const phaseIds = phases?.map(p => p.id) || [];
    const { data: milestones } = await supabase
      .from('milestones')
      .select('id')
      .in('phase_id', phaseIds);

    const totalMilestones = milestones?.length || 0;

    // Get next scheduled calls
    const { data: scheduledCalls } = await supabase
      .from('scheduled_calls')
      .select('church_id, call_type, scheduled_at')
      .in('church_id', churchIds)
      .eq('completed', false)
      .gt('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true });

    // Build church summaries
    const churchSummaries = churches?.map(church => {
      const churchLeader = leaders?.find(l => l.church_id === church.id);
      const churchProgress = progress?.filter(p => p.church_id === church.id) || [];
      const completedMilestones = churchProgress.filter(p => p.completed).length;

      // Check for overdue items
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const hasOverdue = churchProgress.some(p => {
        if (p.completed || !p.target_date) return false;
        const targetDate = new Date(p.target_date);
        return targetDate < today;
      });

      // Get next call
      const nextCall = scheduledCalls?.find(c => c.church_id === church.id);

      return {
        id: church.id,
        name: church.name,
        status: church.status,
        current_phase: church.current_phase,
        created_at: church.created_at,
        updated_at: church.updated_at,
        leader_name: churchLeader?.name || 'Unknown',
        leader_email: churchLeader?.email || '',
        leader_id: churchLeader?.id || '',
        completed_milestones: completedMilestones,
        total_milestones: totalMilestones,
        has_overdue: hasOverdue,
        next_call: nextCall ? {
          call_type: nextCall.call_type,
          scheduled_at: nextCall.scheduled_at,
        } : undefined,
        last_activity: church.updated_at,
      };
    }) || [];

    // Calculate stats
    const stats = {
      total: churches?.length || 0,
      byStatus: {} as Record<string, number>,
      activeThisWeek: 0,
    };

    churches?.forEach(church => {
      stats.byStatus[church.status] = (stats.byStatus[church.status] || 0) + 1;

      // Check if updated in last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (new Date(church.updated_at) > weekAgo) {
        stats.activeThisWeek++;
      }
    });

    return NextResponse.json({
      churches: churchSummaries,
      stats,
    });
  } catch (error) {
    console.error('[ADMIN] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.leader.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    const { churchId, status, current_phase } = await request.json();

    if (!churchId) {
      return NextResponse.json({ error: 'Church ID required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updates.status = status;
    }

    if (typeof current_phase === 'number') {
      updates.current_phase = current_phase;
    }

    const { error: updateError } = await supabase
      .from('churches')
      .update(updates)
      .eq('id', churchId);

    if (updateError) {
      console.error('[ADMIN] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update church' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
