import { NextResponse } from 'next/server';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';
import { getSupabaseAdmin } from '@/lib/auth';

// GET /api/admin/disciples/network
// Returns all app users across all churches (admin only)
export async function GET() {
  const session = await getUnifiedSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('get_all_disciples');

    if (error) throw error;

    const disciples = data || [];

    // Overlay canonical stats from get_user_stats RPC
    const accountIds = disciples
      .map((d: { app_account_id: string }) => d.app_account_id)
      .filter(Boolean);

    if (accountIds.length > 0) {
      const { data: statsRows } = await supabase.rpc('get_user_stats', {
        p_account_ids: accountIds,
      });

      if (statsRows) {
        const statsMap: Record<string, Record<string, unknown>> = {};
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
          if (s) Object.assign(d, s);
        });
      }
    }

    return NextResponse.json({ disciples });
  } catch (error) {
    console.error('Error fetching network disciples:', error);
    return NextResponse.json({ error: 'Failed to fetch disciples' }, { status: 500 });
  }
}
