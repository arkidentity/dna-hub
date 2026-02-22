import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole } from '@/lib/unified-auth';

// GET /api/groups/[id]/disciples/[discipleId]
// Get full disciple profile with journey data
// Query params:
//   ?days=7|30|90 — filter time-based metrics to last N days (default: all time)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; discipleId: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(hasRole(session, 'dna_leader') || hasRole(session, 'church_leader'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: groupId, discipleId } = await params;
    const supabase = getSupabaseAdmin();

    // Parse time filter
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const filterDays = daysParam ? parseInt(daysParam, 10) : null;
    const filterDate = filterDays
      ? new Date(Date.now() - filterDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Get DNA leader record (optional — church_leaders and admins may not have one)
    const { data: dnaLeader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', session.email)
      .single();

    const isChurchLeaderOrAdmin = hasRole(session, 'church_leader') || hasRole(session, 'admin');

    // dna_leaders are required unless user is a church_leader or admin
    if (!dnaLeader && !isChurchLeaderOrAdmin) {
      return NextResponse.json({ error: 'DNA leader not found' }, { status: 404 });
    }

    // Get group
    const { data: group } = await supabase
      .from('dna_groups')
      .select('id, group_name, current_phase, leader_id, co_leader_id')
      .eq('id', groupId)
      .single();

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    // Verify ownership — church_leaders and admins can access any group
    if (!isChurchLeaderOrAdmin && dnaLeader) {
      if (group.leader_id !== dnaLeader.id && group.co_leader_id !== dnaLeader.id) {
        return NextResponse.json({ error: 'Not authorized to access this group' }, { status: 403 });
      }
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
    let appAccountId = disciple.app_account_id;

    // Fallback: if app_account_id not set, look up by email and heal the link
    if (!appAccountId && disciple.email) {
      const { data: appAccount } = await supabase
        .from('disciple_app_accounts')
        .select('id')
        .ilike('email', disciple.email)
        .single();

      if (appAccount?.id) {
        appAccountId = appAccount.id;
        // Heal the link so future loads don't need the fallback
        await supabase
          .from('disciples')
          .update({ app_account_id: appAccount.id })
          .eq('id', discipleId);
        await supabase
          .from('disciple_app_accounts')
          .update({ disciple_id: discipleId })
          .eq('id', appAccount.id)
          .is('disciple_id', null);
      }
    }

    // Build time-filtered queries for app metrics
    const buildFilteredCountQuery = (table: string) => {
      let query = supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('account_id', appAccountId!);

      if (table === 'disciple_journal_entries' || table === 'disciple_prayer_cards') {
        query = query.is('deleted_at', null);
      }

      if (filterDate) {
        query = query.gte('created_at', filterDate);
      }

      return query;
    };

    const [
      assessmentsResult,
      logResult,
      checkpointsResult,
      progressResult,
      toolkitResult,
      completionsResult,
      // Time-filtered counts
      journalCountResult,
      prayerSessionCountResult,
      prayerCardCountResult,
      testimonyResult,
      creedResult,
      lifeAssessmentsResult,
    ] = await Promise.all([
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
      // Aggregate progress (all-time)
      appAccountId
        ? supabase
            .from('disciple_progress')
            .select('current_streak, longest_streak, last_activity_date, total_journal_entries, total_prayer_sessions, total_prayer_cards, total_time_minutes, badges')
            .eq('account_id', appAccountId)
            .single()
        : Promise.resolve({ data: null, error: null }),
      // Toolkit progress
      appAccountId
        ? supabase
            .from('disciple_toolkit_progress')
            .select('current_month, current_week, started_at, month_1_completed_at, month_2_completed_at, month_3_completed_at')
            .eq('account_id', appAccountId)
            .single()
        : Promise.resolve({ data: null, error: null }),
      // Checkpoint completions
      appAccountId
        ? supabase
            .from('disciple_checkpoint_completions')
            .select('checkpoint_id, completed_at, marked_by')
            .eq('account_id', appAccountId)
        : Promise.resolve({ data: null, error: null }),
      // Time-filtered journal count
      appAccountId
        ? buildFilteredCountQuery('disciple_journal_entries')
        : Promise.resolve({ count: null, error: null }),
      // Time-filtered prayer session count
      appAccountId
        ? buildFilteredCountQuery('disciple_prayer_sessions')
        : Promise.resolve({ count: null, error: null }),
      // Time-filtered prayer card count
      appAccountId
        ? buildFilteredCountQuery('disciple_prayer_cards')
        : Promise.resolve({ count: null, error: null }),
      // Testimonies (count + completion status)
      appAccountId
        ? supabase
            .from('disciple_testimonies')
            .select('id, title, status, testimony_type, created_at')
            .eq('account_id', appAccountId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: null, error: null }),
      // Creed card progress
      appAccountId
        ? supabase
            .from('disciple_creed_progress')
            .select('cards_mastered, total_study_sessions, last_studied_at')
            .eq('account_id', appAccountId)
            .single()
        : Promise.resolve({ data: null, error: null }),
      // Life assessment results (synced from Daily DNA app)
      appAccountId
        ? supabase
            .from('life_assessment_responses')
            .select('assessment_type, category_scores, overall_score, responses, follow_ups, submitted_at')
            .eq('account_id', appAccountId)
            .eq('status', 'submitted')
            .order('submitted_at', { ascending: true })
        : Promise.resolve({ data: null, error: null }),
    ]);

    let week1Status = 'not_sent';
    let week12Status = 'not_sent';
    if (assessmentsResult.data) {
      assessmentsResult.data.forEach((a: { assessment_week: number; sent_at: string | null; completed_at: string | null }) => {
        const status = a.completed_at ? 'completed' : a.sent_at ? 'sent' : 'not_sent';
        if (a.assessment_week === 1) week1Status = status;
        if (a.assessment_week === 12) week12Status = status;
      });
    }

    // Build app activity (stats + time-filtered metrics)
    let appActivity = null;
    if (appAccountId) {
      appActivity = {
        connected: true,
        // All-time aggregate progress
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
        // Time-filtered counts (respects ?days= param)
        filtered_metrics: {
          days: filterDays || 'all',
          journal_entries: journalCountResult.count ?? 0,
          prayer_sessions: prayerSessionCountResult.count ?? 0,
          prayer_cards: prayerCardCountResult.count ?? 0,
        },
        // Toolkit progress
        toolkit: toolkitResult.data ? {
          current_month: toolkitResult.data.current_month,
          current_week: toolkitResult.data.current_week,
          started_at: toolkitResult.data.started_at,
          month_1_completed_at: toolkitResult.data.month_1_completed_at,
          month_2_completed_at: toolkitResult.data.month_2_completed_at,
          month_3_completed_at: toolkitResult.data.month_3_completed_at,
        } : null,
        // Checkpoint completions
        checkpoint_completions: completionsResult.data || [],
        // Testimonies (metadata only, no content)
        testimonies: (testimonyResult.data || []).map((t: { id: string; title: string; status: string; testimony_type: string | null; created_at: string }) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          testimony_type: t.testimony_type,
          created_at: t.created_at,
        })),
        // Creed card progress
        creed_progress: creedResult.data ? {
          cards_mastered: creedResult.data.cards_mastered || [],
          total_cards_mastered: (creedResult.data.cards_mastered || []).length,
          total_study_sessions: creedResult.data.total_study_sessions,
          last_studied_at: creedResult.data.last_studied_at,
        } : null,
        // Life assessment results (synced from Daily DNA app)
        life_assessments: lifeAssessmentsResult.data ? {
          week1: (lifeAssessmentsResult.data as Array<{ assessment_type: string; category_scores: Record<string, number> | null; overall_score: number | null; responses: Record<string, unknown>; follow_ups: Record<string, string> | null; submitted_at: string | null }>).find(r => r.assessment_type === 'week_1') || null,
          week12: (lifeAssessmentsResult.data as Array<{ assessment_type: string; category_scores: Record<string, number> | null; overall_score: number | null; responses: Record<string, unknown>; follow_ups: Record<string, string> | null; submitted_at: string | null }>).find(r => r.assessment_type === 'week_12') || null,
        } : null,
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
        week12_assessment_status: week12Status,
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

// ============================================================
// PATCH /api/groups/[id]/disciples/[discipleId]
// Update disciple name/email/phone and/or membership status
// Body: { name?, email?, phone?, current_status? }
// ============================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; discipleId: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(hasRole(session, 'dna_leader') || hasRole(session, 'church_leader'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: groupId, discipleId } = await params;
    const supabase = getSupabaseAdmin();

    // Verify leadership / access
    const { data: dnaLeader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', session.email)
      .single();

    const isChurchLeaderOrAdmin = hasRole(session, 'church_leader') || hasRole(session, 'admin');

    if (!dnaLeader && !isChurchLeaderOrAdmin) {
      return NextResponse.json({ error: 'DNA leader not found' }, { status: 404 });
    }

    const { data: group } = await supabase
      .from('dna_groups')
      .select('leader_id, co_leader_id')
      .eq('id', groupId)
      .single();

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    if (!isChurchLeaderOrAdmin && dnaLeader) {
      if (group.leader_id !== dnaLeader.id && group.co_leader_id !== dnaLeader.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { name, email, phone, current_status } = body;

    // Update disciples table if any contact info changed
    const discipleUpdates: Record<string, string> = {};
    if (name !== undefined) {
      if (!name.trim()) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      discipleUpdates.name = name.trim();
    }
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      discipleUpdates.email = email.toLowerCase().trim();
    }
    if (phone !== undefined) {
      discipleUpdates.phone = phone?.trim() || null as unknown as string;
    }

    if (Object.keys(discipleUpdates).length > 0) {
      const { error: discipleError } = await supabase
        .from('disciples')
        .update(discipleUpdates)
        .eq('id', discipleId);

      if (discipleError) {
        if (discipleError.code === '23505') {
          return NextResponse.json({ error: 'That email is already used by another disciple' }, { status: 400 });
        }
        console.error('[Disciples] PATCH update error:', discipleError);
        return NextResponse.json({ error: 'Failed to update disciple' }, { status: 500 });
      }
    }

    // Update group membership status if provided
    if (current_status !== undefined) {
      const validStatuses = ['active', 'completed', 'dropped'];
      if (!validStatuses.includes(current_status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      const { error: membershipError } = await supabase
        .from('group_disciples')
        .update({ current_status })
        .eq('group_id', groupId)
        .eq('disciple_id', discipleId);

      if (membershipError) {
        console.error('[Disciples] PATCH membership error:', membershipError);
        return NextResponse.json({ error: 'Failed to update membership status' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Disciples] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================
// DELETE /api/groups/[id]/disciples/[discipleId]
// Removes disciple from the group (sets current_status = 'dropped')
// Does NOT delete the disciple record — they may be in other groups.
// ============================================================
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; discipleId: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(hasRole(session, 'dna_leader') || hasRole(session, 'church_leader'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: groupId, discipleId } = await params;
    const supabase = getSupabaseAdmin();

    // Verify leadership / access
    const { data: dnaLeader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', session.email)
      .single();

    const isChurchLeaderOrAdmin = hasRole(session, 'church_leader') || hasRole(session, 'admin');

    if (!dnaLeader && !isChurchLeaderOrAdmin) {
      return NextResponse.json({ error: 'DNA leader not found' }, { status: 404 });
    }

    const { data: group } = await supabase
      .from('dna_groups')
      .select('leader_id, co_leader_id')
      .eq('id', groupId)
      .single();

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    if (!isChurchLeaderOrAdmin && dnaLeader) {
      if (group.leader_id !== dnaLeader.id && group.co_leader_id !== dnaLeader.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
    }

    // Soft-remove: mark membership as dropped
    const { error: removeError } = await supabase
      .from('group_disciples')
      .update({ current_status: 'dropped' })
      .eq('group_id', groupId)
      .eq('disciple_id', discipleId);

    if (removeError) {
      console.error('[Disciples] DELETE error:', removeError);
      return NextResponse.json({ error: 'Failed to remove disciple from group' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Disciples] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
