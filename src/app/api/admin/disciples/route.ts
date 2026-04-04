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

    // Override stale aggregate counts with live queries
    const accountIds = disciples
      .map((d: { app_account_id: string }) => d.app_account_id)
      .filter(Boolean);

    if (accountIds.length > 0) {
      const [journalResult, prayerResult] = await Promise.all([
        supabase
          .from('disciple_journal_entries')
          .select('account_id')
          .in('account_id', accountIds)
          .is('deleted_at', null),
        supabase
          .from('disciple_prayer_cards')
          .select('account_id')
          .in('account_id', accountIds)
          .is('deleted_at', null),
      ]);

      if (journalResult.data) {
        const journalMap: Record<string, number> = {};
        journalResult.data.forEach((j: { account_id: string }) => {
          journalMap[j.account_id] = (journalMap[j.account_id] || 0) + 1;
        });
        disciples.forEach((d: { app_account_id: string; total_journal_entries: number }) => {
          if (d.app_account_id && journalMap[d.app_account_id] !== undefined) {
            d.total_journal_entries = journalMap[d.app_account_id];
          }
        });
      }

      if (prayerResult.data) {
        const prayerMap: Record<string, number> = {};
        prayerResult.data.forEach((p: { account_id: string }) => {
          prayerMap[p.account_id] = (prayerMap[p.account_id] || 0) + 1;
        });
        disciples.forEach((d: { app_account_id: string; total_prayer_cards: number }) => {
          if (d.app_account_id && prayerMap[d.app_account_id] !== undefined) {
            d.total_prayer_cards = prayerMap[d.app_account_id];
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
