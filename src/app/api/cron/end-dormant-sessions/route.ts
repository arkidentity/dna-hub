import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.rpc('auto_end_stale_sessions');

    if (error) {
      console.error('[Cron] auto_end_stale_sessions error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const ended = (data as any[]) || [];
    console.log(`[Cron] Auto-ended ${ended.length} dormant session(s)`);

    return NextResponse.json({
      ok: true,
      ended_count: ended.length,
      sessions: ended.map((s: any) => ({
        session_id: s.ended_session_id,
        service: s.service_title,
        started_at: s.started_at,
        last_block_at: s.last_block_at,
      })),
    });
  } catch (err) {
    console.error('[Cron] end-dormant-sessions failed:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
