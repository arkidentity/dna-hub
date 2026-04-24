import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedSession, hasRole, isAdmin, getPrimaryChurch } from '@/lib/unified-auth';
import { getSupabaseAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getUnifiedSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isAdminUser = isAdmin(session);
  const isChurchLeader = hasRole(session, 'church_leader');
  if (!isAdminUser && !isChurchLeader) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const churchId = request.nextUrl.searchParams.get('church_id');
  if (!churchId) {
    return NextResponse.json({ error: 'church_id required' }, { status: 400 });
  }

  // Church leaders can only view their own church
  if (!isAdminUser) {
    const myChurchId = getPrimaryChurch(session);
    if (myChurchId !== churchId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('get_church_disciples', {
      p_church_id: churchId,
    });

    if (error) throw error;

    const disciples = data || [];

    // Overlay canonical stats from get_user_stats RPC (replaces per-stat live queries)
    const accountIds = disciples
      .map((d: { app_account_id: string }) => d.app_account_id)
      .filter(Boolean);

    if (accountIds.length > 0) {
      const { data: statsRows } = await supabase.rpc('get_user_stats', {
        p_account_ids: accountIds,
      });

      if (statsRows) {
        const statsMap: Record<string, {
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
          total_journal_entries: number;
          total_prayer_cards: number;
          total_prayer_sessions: number;
          cards_mastered_count: number;
        }> = {};
        (statsRows as Array<{
          account_id: string;
          current_streak: number | null;
          longest_streak: number | null;
          last_activity_date: string | null;
          journal_count: number | string;
          prayer_count: number | string;
          prayer_sessions_count: number | null;
          cards_mastered_count: number | null;
        }>).forEach(r => {
          statsMap[r.account_id] = {
            current_streak: r.current_streak ?? 0,
            longest_streak: r.longest_streak ?? 0,
            last_activity_date: r.last_activity_date,
            total_journal_entries: Number(r.journal_count) || 0,
            total_prayer_cards: Number(r.prayer_count) || 0,
            total_prayer_sessions: r.prayer_sessions_count ?? 0,
            cards_mastered_count: r.cards_mastered_count ?? 0,
          };
        });

        disciples.forEach((d: Record<string, unknown> & { app_account_id: string }) => {
          const s = statsMap[d.app_account_id];
          if (!s) return;
          d.current_streak = s.current_streak;
          d.longest_streak = s.longest_streak;
          d.last_activity_date = s.last_activity_date;
          d.total_journal_entries = s.total_journal_entries;
          d.total_prayer_cards = s.total_prayer_cards;
          d.total_prayer_sessions = s.total_prayer_sessions;
          if (Array.isArray(d.cards_mastered)) {
            // keep array if consumers need it; also expose count
            (d as Record<string, unknown>).cards_mastered_count = s.cards_mastered_count;
          }
        });
      }
    }

    return NextResponse.json({ disciples });
  } catch (error) {
    console.error('Error fetching church disciples:', error);
    return NextResponse.json({ error: 'Failed to fetch disciples' }, { status: 500 });
  }
}
