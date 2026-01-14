import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { syncCalendarEvents } from '@/lib/google-calendar';

// Vercel Cron jobs send a specific header to authenticate
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron authentication
  const authHeader = request.headers.get('authorization');

  // In production, verify the cron secret
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.log('[CRON CALENDAR] Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CRON CALENDAR] Starting calendar sync...');

  const supabase = getSupabaseAdmin();

  try {
    // Get all admin emails with connected Google Calendar
    const { data: tokens, error: tokenError } = await supabase
      .from('google_oauth_tokens')
      .select('admin_email');

    if (tokenError) {
      console.error('[CRON CALENDAR] Error fetching tokens:', tokenError);
      return NextResponse.json(
        { error: 'Failed to fetch connected accounts' },
        { status: 500 }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log('[CRON CALENDAR] No connected Google Calendar accounts');
      return NextResponse.json({
        message: 'No connected Google Calendar accounts',
        synced: 0,
      });
    }

    interface SyncResult {
      email: string;
      success: boolean;
      eventsProcessed?: number;
      eventsSynced?: number;
      eventsUnmatched?: number;
      errors?: string[];
      error?: string;
    }

    const results: SyncResult[] = [];

    // Sync for each connected admin
    for (const token of tokens) {
      console.log('[CRON CALENDAR] Syncing for:', token.admin_email);

      try {
        const syncResult = await syncCalendarEvents(token.admin_email);
        results.push({
          email: token.admin_email,
          ...syncResult,
        });
      } catch (syncError) {
        console.error(
          '[CRON CALENDAR] Sync error for',
          token.admin_email,
          ':',
          syncError
        );
        results.push({
          email: token.admin_email,
          success: false,
          error: String(syncError),
        });
      }
    }

    const summary = {
      timestamp: new Date().toISOString(),
      accountsSynced: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      totalEventsProcessed: results.reduce(
        (sum, r) => sum + (r.eventsProcessed || 0),
        0
      ),
      totalEventsSynced: results.reduce(
        (sum, r) => sum + (r.eventsSynced || 0),
        0
      ),
      totalUnmatched: results.reduce(
        (sum, r) => sum + (r.eventsUnmatched || 0),
        0
      ),
      results,
    };

    console.log('[CRON CALENDAR] Sync complete:', summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[CRON CALENDAR] Error:', error);
    return NextResponse.json(
      { error: 'Calendar sync failed', details: String(error) },
      { status: 500 }
    );
  }
}
