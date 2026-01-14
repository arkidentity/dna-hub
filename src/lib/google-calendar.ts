import { google, calendar_v3 } from 'googleapis';
import { getSupabaseAdmin } from './auth';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

// Create OAuth2 client
function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// Generate authorization URL for OAuth flow
export function getAuthUrl(adminEmail: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent to get refresh token
    state: adminEmail, // Pass admin email to callback
  });
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string, adminEmail: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to get tokens from Google');
  }

  // Store tokens in database
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('google_oauth_tokens').upsert(
    {
      admin_email: adminEmail,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: new Date(tokens.expiry_date || Date.now() + 3600000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'admin_email',
    }
  );

  if (error) {
    console.error('[GOOGLE] Token storage error:', error);
    throw new Error('Failed to store Google tokens');
  }

  return tokens;
}

// Get authenticated calendar client
export async function getCalendarClient(
  adminEmail: string
): Promise<calendar_v3.Calendar | null> {
  const supabase = getSupabaseAdmin();

  // Get stored tokens
  const { data: tokenData, error } = await supabase
    .from('google_oauth_tokens')
    .select('*')
    .eq('admin_email', adminEmail)
    .single();

  if (error || !tokenData) {
    console.log('[GOOGLE] No tokens found for:', adminEmail);
    return null;
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expiry_date: new Date(tokenData.token_expiry).getTime(),
  });

  // Check if token needs refresh
  if (new Date(tokenData.token_expiry) < new Date()) {
    console.log('[GOOGLE] Token expired, refreshing...');
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update stored tokens
      await supabase
        .from('google_oauth_tokens')
        .update({
          access_token: credentials.access_token,
          token_expiry: new Date(credentials.expiry_date || Date.now() + 3600000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('admin_email', adminEmail);

      oauth2Client.setCredentials(credentials);
    } catch (refreshError) {
      console.error('[GOOGLE] Token refresh failed:', refreshError);
      // Mark tokens as invalid - user needs to re-authenticate
      await supabase.from('google_oauth_tokens').delete().eq('admin_email', adminEmail);
      return null;
    }
  }

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// Check if admin has connected Google Calendar
export async function isGoogleCalendarConnected(adminEmail: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('google_oauth_tokens')
    .select('id')
    .eq('admin_email', adminEmail)
    .single();

  return !!data;
}

// Get connection status with details
export async function getGoogleCalendarStatus(adminEmail: string) {
  const supabase = getSupabaseAdmin();

  const { data: tokenData } = await supabase
    .from('google_oauth_tokens')
    .select('*')
    .eq('admin_email', adminEmail)
    .single();

  if (!tokenData) {
    return { connected: false };
  }

  // Get last sync info
  const { data: lastSync } = await supabase
    .from('calendar_sync_log')
    .select('*')
    .order('sync_started_at', { ascending: false })
    .limit(1)
    .single();

  return {
    connected: true,
    calendarId: tokenData.calendar_id,
    lastSync: lastSync
      ? {
          timestamp: lastSync.sync_completed_at || lastSync.sync_started_at,
          eventsProcessed: lastSync.events_processed,
          eventsSynced: lastSync.events_synced,
          success: lastSync.success,
        }
      : null,
  };
}

// Disconnect Google Calendar
export async function disconnectGoogleCalendar(adminEmail: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('google_oauth_tokens').delete().eq('admin_email', adminEmail);

  if (error) {
    console.error('[GOOGLE] Disconnect error:', error);
    throw new Error('Failed to disconnect Google Calendar');
  }
}

// Detect call type from event title
export function detectCallType(
  title: string
): 'discovery' | 'proposal' | 'strategy' | 'kickoff' | 'assessment' | 'onboarding' | 'checkin' | null {
  const lower = title.toLowerCase();
  if (lower.includes('discovery')) return 'discovery';
  if (lower.includes('proposal')) return 'proposal';
  if (lower.includes('strategy')) return 'strategy';
  if (lower.includes('kick-off') || lower.includes('kickoff') || lower.includes('kick off')) return 'kickoff';
  if (lower.includes('assessment')) return 'assessment';
  if (lower.includes('onboarding')) return 'onboarding';
  if (lower.includes('check-in') || lower.includes('checkin') || lower.includes('check in')) return 'checkin';
  if (lower.includes('dna')) return 'discovery'; // Default for DNA calls
  return null;
}

// Match event to a church by attendee email or title
export async function matchEventToChurch(
  event: calendar_v3.Schema$Event
): Promise<{ churchId: string; churchName: string } | null> {
  const supabase = getSupabaseAdmin();

  // Try matching by attendee email
  const attendees = event.attendees || [];
  for (const attendee of attendees) {
    if (!attendee.email) continue;

    // Check if this email belongs to a church leader
    const { data: leader } = await supabase
      .from('church_leaders')
      .select('church_id')
      .eq('email', attendee.email)
      .single();

    if (leader) {
      const { data: church } = await supabase
        .from('churches')
        .select('id, name')
        .eq('id', leader.church_id)
        .single();

      if (church) {
        return { churchId: church.id, churchName: church.name };
      }
    }
  }

  // Try matching by title
  const title = event.summary || '';
  const { data: churches } = await supabase.from('churches').select('id, name');

  if (churches) {
    for (const church of churches) {
      if (title.toLowerCase().includes(church.name.toLowerCase())) {
        return { churchId: church.id, churchName: church.name };
      }
    }
  }

  return null;
}

// Sync calendar events to scheduled_calls
export async function syncCalendarEvents(adminEmail: string) {
  const supabase = getSupabaseAdmin();
  const calendar = await getCalendarClient(adminEmail);

  if (!calendar) {
    throw new Error('Google Calendar not connected');
  }

  // Create sync log entry
  const { data: syncLog, error: logError } = await supabase
    .from('calendar_sync_log')
    .insert({})
    .select('id')
    .single();

  if (logError || !syncLog) {
    console.error('[GOOGLE] Failed to create sync log:', logError);
  }

  const syncLogId = syncLog?.id;

  // Get events from last 30 days and next 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  let eventsProcessed = 0;
  let eventsSynced = 0;
  let eventsUnmatched = 0;
  const errors: string[] = [];

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: thirtyDaysAgo.toISOString(),
      timeMax: thirtyDaysFromNow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    });

    const events = response.data.items || [];

    for (const event of events) {
      eventsProcessed++;

      // Check if this is a DNA-related event
      const callType = detectCallType(event.summary || '');
      if (!callType) continue;

      // Try to match to a church
      const match = await matchEventToChurch(event);

      if (!match) {
        // Store as unmatched event for manual linking
        const attendeeEmails = (event.attendees || [])
          .map((a) => a.email)
          .filter((e): e is string => !!e);

        await supabase.from('unmatched_calendar_events').upsert(
          {
            google_event_id: event.id!,
            event_title: event.summary || 'Untitled',
            event_start: event.start?.dateTime || event.start?.date || now.toISOString(),
            event_end: event.end?.dateTime || event.end?.date,
            attendee_emails: attendeeEmails,
            meet_link: event.hangoutLink,
          },
          { onConflict: 'google_event_id' }
        );

        eventsUnmatched++;
        continue;
      }

      // Upsert to scheduled_calls
      const scheduledAt = event.start?.dateTime || event.start?.date;
      const eventEnd = event.end?.dateTime || event.end?.date;
      const isCompleted = eventEnd ? new Date(eventEnd) < now : false;

      const { error: upsertError } = await supabase.from('scheduled_calls').upsert(
        {
          google_event_id: event.id!,
          church_id: match.churchId,
          call_type: callType,
          scheduled_at: scheduledAt,
          meet_link: event.hangoutLink,
          completed: isCompleted,
        },
        { onConflict: 'google_event_id' }
      );

      if (upsertError) {
        errors.push(`Failed to sync event ${event.id}: ${upsertError.message}`);
      } else {
        eventsSynced++;

        // Remove from unmatched events if it was there
        await supabase
          .from('unmatched_calendar_events')
          .delete()
          .eq('google_event_id', event.id!);
      }
    }
  } catch (error) {
    errors.push(`Calendar API error: ${String(error)}`);
  }

  // Update sync log
  if (syncLogId) {
    await supabase
      .from('calendar_sync_log')
      .update({
        sync_completed_at: new Date().toISOString(),
        events_processed: eventsProcessed,
        events_synced: eventsSynced,
        events_unmatched: eventsUnmatched,
        errors: errors.length > 0 ? errors : null,
        success: errors.length === 0,
      })
      .eq('id', syncLogId);
  }

  return {
    eventsProcessed,
    eventsSynced,
    eventsUnmatched,
    errors,
    success: errors.length === 0,
  };
}

// Create a calendar event (for Phase 3 - two-way sync)
export async function createCalendarEvent(
  adminEmail: string,
  options: {
    summary: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendeeEmail?: string;
    addMeetLink?: boolean;
  }
) {
  const calendar = await getCalendarClient(adminEmail);

  if (!calendar) {
    throw new Error('Google Calendar not connected');
  }

  const event: calendar_v3.Schema$Event = {
    summary: options.summary,
    description: options.description,
    start: {
      dateTime: options.startTime.toISOString(),
      timeZone: 'America/New_York', // TODO: Make configurable
    },
    end: {
      dateTime: options.endTime.toISOString(),
      timeZone: 'America/New_York',
    },
  };

  if (options.attendeeEmail) {
    event.attendees = [{ email: options.attendeeEmail }];
  }

  if (options.addMeetLink) {
    event.conferenceData = {
      createRequest: {
        requestId: `dna-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
    conferenceDataVersion: options.addMeetLink ? 1 : 0,
  });

  return response.data;
}
