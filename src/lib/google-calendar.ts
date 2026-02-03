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

  // Only match "DNA Discovery" specifically - this prevents generic DNA meetings
  // (like "DNA Training with John" or "DNA meeting with individual") from being
  // incorrectly classified as discovery calls
  if (lower.includes('dna discovery')) {
    return 'discovery';
  }

  return null;
}

// Admin emails that should NOT trigger auto-matching
// (admins are on all calls, so their presence doesn't indicate which church)
const ADMIN_EMAILS = ['thearkidentity@gmail.com', 'travis@arkidentity.com'];

// Match event to a church by church leader attendee email ONLY
// This is the most reliable matching method - title/alias matching is too error-prone
// Events that can't be matched go to the unmatched queue for manual assignment
export async function matchEventToChurch(
  event: calendar_v3.Schema$Event
): Promise<{ churchId: string; churchName: string } | null> {
  const supabase = getSupabaseAdmin();

  // Get all churches for name lookup
  const { data: churches } = await supabase.from('churches').select('id, name');

  if (!churches) {
    console.log('[GOOGLE] No churches found in database');
    return null;
  }

  // ONLY match by church leader attendee email (most reliable)
  // Skip admin emails - they're on all calls so don't indicate which church
  const attendees = event.attendees || [];
  for (const attendee of attendees) {
    if (!attendee.email) continue;

    // Skip admin emails
    const normalizedEmail = attendee.email.toLowerCase().trim();
    if (ADMIN_EMAILS.includes(normalizedEmail)) {
      console.log(`[GOOGLE] Skipping admin email: ${attendee.email}`);
      continue;
    }

    // Check if this email belongs to a church leader
    const { data: leader } = await supabase
      .from('church_leaders')
      .select('church_id')
      .eq('email', normalizedEmail)
      .single();

    if (leader) {
      const church = churches.find((c) => c.id === leader.church_id);
      if (church) {
        console.log(`[GOOGLE] Matched by church leader email: ${attendee.email} → ${church.name}`);
        return { churchId: church.id, churchName: church.name };
      }
    }
  }

  // No church leader found in attendees - event goes to unmatched queue
  // This is intentionally conservative to avoid wrong assignments
  console.log(`[GOOGLE] No church leader found in attendees for: "${event.summary}" - sending to unmatched queue`);
  return null;
}

// Check if a call type should be blocked due to existing completed call
async function shouldBlockDuplicateCall(
  churchId: string,
  callType: string,
  googleEventId?: string
): Promise<boolean> {
  // Only block duplicates for discovery, proposal, and kickoff
  if (!['discovery', 'proposal', 'kickoff'].includes(callType)) {
    return false;
  }

  const supabase = getSupabaseAdmin();

  // Check for existing completed calls of this type
  let query = supabase
    .from('scheduled_calls')
    .select('id')
    .eq('church_id', churchId)
    .eq('call_type', callType)
    .eq('completed', true);

  // Exclude the current event if it's an update
  if (googleEventId) {
    query = query.neq('google_event_id', googleEventId);
  }

  const { data: existingCalls } = await query;

  if (existingCalls && existingCalls.length > 0) {
    console.log(
      `[GOOGLE] Blocking duplicate ${callType} call for church ${churchId} - completed call already exists`
    );
    return true;
  }

  return false;
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
            detected_call_type: callType,
          },
          { onConflict: 'google_event_id' }
        );

        eventsUnmatched++;
        continue;
      }

      // Check for duplicate completed calls (only for discovery, proposal, kickoff)
      const shouldBlock = await shouldBlockDuplicateCall(match.churchId, callType, event.id!);
      if (shouldBlock) {
        errors.push(
          `Skipped duplicate ${callType} call for ${match.churchName} - a completed ${callType} call already exists`
        );
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
