import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole } from '@/lib/unified-auth';

// GET /api/groups/[id]/disciples/[discipleId]
// Get full disciple profile with journey data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; discipleId: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(session, 'dna_leader')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: groupId, discipleId } = await params;
    const supabase = getSupabaseAdmin();

    // Get DNA leader record
    const { data: dnaLeader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', session.email)
      .single();

    if (!dnaLeader) return NextResponse.json({ error: 'DNA leader not found' }, { status: 404 });

    // Get group and verify ownership
    const { data: group } = await supabase
      .from('dna_groups')
      .select('id, group_name, current_phase, leader_id, co_leader_id')
      .eq('id', groupId)
      .single();

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    if (group.leader_id !== dnaLeader.id && group.co_leader_id !== dnaLeader.id) {
      return NextResponse.json({ error: 'Not authorized to access this group' }, { status: 403 });
    }

    // Get disciple basic info (include app_account_id)
    const { data: disciple } = await supabase
      .from('disciples')
      .select('id, name, email, phone, app_account_id')
      .eq('id', discipleId)
      .single();

    if (!disciple) return NextResponse.json({ error: 'Disciple not found' }, { status: 404 });

    // Get membership info
    const { data: membership } = await supabase
      .from('group_disciples')
      .select('joined_date, current_status')
      .eq('group_id', groupId)
      .eq('disciple_id', discipleId)
      .single();

    if (!membership) return NextResponse.json({ error: 'Disciple not in this group' }, { status: 404 });

    // Fetch assessments, log entries, checkpoints, and app activity in parallel
    const appAccountId = disciple.app_account_id;

    const [assessmentsResult, logResult, checkpointsResult, progressResult, toolkitResult, completionsResult] = await Promise.all([
      supabase
        .from('life_assessments')
        .select('assessment_week, sent_at, completed_at')
        .eq('group_id', groupId)
        .eq('disciple_id', discipleId),
      supabase
        .from('discipleship_log')
        .select('*')
        .eq('group_id', groupId)
        .eq('disciple_id', discipleId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('journey_checkpoints')
        .select('*')
        .eq('group_id', groupId)
        .eq('disciple_id', discipleId)
        .order('phase', { ascending: true }),
      // App engagement stats (only if connected)
      appAccountId
        ? supabase
            .from('disciple_progress')
            .select('current_streak, longest_streak, last_activity_date, total_journal_entries, total_prayer_sessions, total_prayer_cards, total_time_minutes, badges')
            .eq('account_id', appAccountId)
            .single()
        : Promise.resolve({ data: null, error: null }),
      appAccountId
        ? supabase
            .from('disciple_toolkit_progress')
            .select('current_month, current_week, started_at, month_1_completed_at, month_2_completed_at, month_3_completed_at')
            .eq('account_id', appAccountId)
            .single()
        : Promise.resolve({ data: null, error: null }),
      appAccountId
        ? supabase
            .from('disciple_checkpoint_completions')
            .select('checkpoint_id, completed_at, marked_by')
            .eq('account_id', appAccountId)
        : Promise.resolve({ data: null, error: null }),
    ]);

    let week1Status = 'not_sent';
    let week8Status = 'not_sent';
    if (assessmentsResult.data) {
      assessmentsResult.data.forEach(a => {
        const status = a.completed_at ? 'completed' : a.sent_at ? 'sent' : 'not_sent';
        if (a.assessment_week === 1) week1Status = status;
        if (a.assessment_week === 8) week8Status = status;
      });
    }

    // Build app activity (stats only - no journal content or prayer cards)
    let appActivity = null;
    if (appAccountId) {
      appActivity = {
        connected: true,
        progress: progressResult.data ? {
          current_streak: progressResult.data.current_streak,
          longest_streak: progressResult.data.longest_streak,
          last_activity_date: progressResult.data.last_activity_date,
          total_journal_entries: progressResult.data.total_journal_entries,
          total_prayer_sessions: progressResult.data.total_prayer_sessions,
          total_prayer_cards: progressResult.data.total_prayer_cards,
          total_time_minutes: progressResult.data.total_time_minutes,
          badges: progressResult.data.badges,
        } : null,
        toolkit: toolkitResult.data ? {
          current_month: toolkitResult.data.current_month,
          current_week: toolkitResult.data.current_week,
          started_at: toolkitResult.data.started_at,
          month_1_completed_at: toolkitResult.data.month_1_completed_at,
          month_2_completed_at: toolkitResult.data.month_2_completed_at,
          month_3_completed_at: toolkitResult.data.month_3_completed_at,
        } : null,
        checkpoint_completions: completionsResult.data || [],
      };
    }

    return NextResponse.json({
      disciple: {
        id: disciple.id,
        name: disciple.name,
        email: disciple.email,
        phone: disciple.phone,
        joined_date: membership.joined_date,
        current_status: membership.current_status,
        week1_assessment_status: week1Status,
        week8_assessment_status: week8Status,
        group: {
          id: group.id,
          group_name: group.group_name,
          current_phase: group.current_phase,
        },
        log_entries: logResult.data || [],
        checkpoints: checkpointsResult.data || [],
        app_activity: appActivity,
      },
    });

  } catch (error) {
    console.error('[Disciple Profile] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
