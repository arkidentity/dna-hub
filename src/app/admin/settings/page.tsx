'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Loader2,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Clock,
  Unlink,
  FileText,
  Mic,
} from 'lucide-react';

interface CalendarStatus {
  connected: boolean;
  calendarId?: string;
  lastSync?: {
    timestamp: string;
    eventsProcessed: number;
    eventsSynced: number;
    success: boolean;
  } | null;
}

interface UnmatchedEvent {
  id: string;
  google_event_id: string;
  event_title: string;
  event_start: string;
  attendee_emails: string[];
  meet_link?: string;
}

interface FirefliesStatus {
  connected: boolean;
  settings?: {
    admin_email: string;
    auto_process_enabled: boolean;
    auto_match_enabled: boolean;
    auto_share_with_churches: boolean;
    connected_at: string;
    last_webhook_received_at?: string;
  } | null;
}

interface UnmatchedMeeting {
  id: string;
  fireflies_meeting_id: string;
  title: string;
  meeting_date?: string;
  participants?: string[];
  ai_summary?: string;
  transcript_url?: string;
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null);
  const [unmatchedEvents, setUnmatchedEvents] = useState<UnmatchedEvent[]>([]);
  const [firefliesStatus, setFirefliesStatus] = useState<FirefliesStatus | null>(null);
  const [unmatchedMeetings, setUnmatchedMeetings] = useState<UnmatchedMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [firefliesConnecting, setFirefliesConnecting] = useState(false);
  const [firefliesDisconnecting, setFirefliesDisconnecting] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check for success/error messages from OAuth callback
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'google_connected') {
      setMessage({ type: 'success', text: 'Google Calendar connected successfully!' });
    } else if (error === 'google_auth_denied') {
      setMessage({ type: 'error', text: 'Google Calendar authorization was denied.' });
    } else if (error === 'google_auth_failed') {
      setMessage({ type: 'error', text: 'Failed to connect Google Calendar. Please try again.' });
    }

    fetchCalendarStatus();
    fetchFirefliesStatus();
  }, [searchParams]);

  const fetchCalendarStatus = async () => {
    try {
      const response = await fetch('/api/admin/calendar/status');
      if (response.ok) {
        const data = await response.json();
        setCalendarStatus(data.status);
        setUnmatchedEvents(data.unmatchedEvents || []);
      }
    } catch (error) {
      console.error('Failed to fetch calendar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/auth/google');
      if (response.ok) {
        const data = await response.json();
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        setMessage({ type: 'error', text: 'Failed to start Google authentication.' });
        setConnecting(false);
      }
    } catch (error) {
      console.error('Connect error:', error);
      setMessage({ type: 'error', text: 'Failed to connect to Google.' });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar? Existing synced calls will remain.')) {
      return;
    }

    setDisconnecting(true);
    try {
      const response = await fetch('/api/admin/calendar/disconnect', { method: 'POST' });
      if (response.ok) {
        setCalendarStatus({ connected: false });
        setMessage({ type: 'success', text: 'Google Calendar disconnected.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to disconnect Google Calendar.' });
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      setMessage({ type: 'error', text: 'Failed to disconnect.' });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/calendar/sync', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setMessage({
          type: 'success',
          text: `Sync complete: ${data.eventsSynced} events synced, ${data.eventsUnmatched} unmatched.`,
        });
        await fetchCalendarStatus();
      } else {
        setMessage({ type: 'error', text: 'Calendar sync failed. Please try again.' });
      }
    } catch (error) {
      console.error('Sync error:', error);
      setMessage({ type: 'error', text: 'Sync failed. Please try again.' });
    } finally {
      setSyncing(false);
    }
  };

  // Fireflies handlers
  const fetchFirefliesStatus = async () => {
    try {
      const response = await fetch('/api/admin/fireflies/settings');
      if (response.ok) {
        const data = await response.json();
        setFirefliesStatus(data);
      }
      // Fetch unmatched meetings
      const unmatchedResponse = await fetch('/api/admin/transcripts?unmatched=true');
      if (unmatchedResponse.ok) {
        const unmatchedData = await unmatchedResponse.json();
        setUnmatchedMeetings(unmatchedData.unmatched_meetings || []);
      }
    } catch (error) {
      console.error('Failed to fetch Fireflies status:', error);
    }
  };

  const handleFirefliesConnect = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter your Fireflies API key' });
      return;
    }

    setFirefliesConnecting(true);
    try {
      const response = await fetch('/api/admin/fireflies/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey.trim() }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Fireflies connected successfully!' });
        setShowApiKeyInput(false);
        setApiKey('');
        await fetchFirefliesStatus();
      } else {
        setMessage({ type: 'error', text: 'Failed to connect Fireflies. Please check your API key.' });
      }
    } catch (error) {
      console.error('Fireflies connect error:', error);
      setMessage({ type: 'error', text: 'Failed to connect Fireflies.' });
    } finally {
      setFirefliesConnecting(false);
    }
  };

  const handleFirefliesDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Fireflies? Existing transcripts will remain.')) {
      return;
    }

    setFirefliesDisconnecting(true);
    try {
      const response = await fetch('/api/admin/fireflies/settings', { method: 'DELETE' });
      if (response.ok) {
        setFirefliesStatus({ connected: false });
        setMessage({ type: 'success', text: 'Fireflies disconnected.' });
        setUnmatchedMeetings([]);
      } else {
        setMessage({ type: 'error', text: 'Failed to disconnect Fireflies.' });
      }
    } catch (error) {
      console.error('Fireflies disconnect error:', error);
      setMessage({ type: 'error', text: 'Failed to disconnect.' });
    } finally {
      setFirefliesDisconnecting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="text-gold font-medium text-sm tracking-wide">DNA ADMIN</p>
              <p className="font-semibold">Settings</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Message Banner */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto p-1 hover:bg-black/10 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Google Calendar Integration */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-navy">Google Calendar Integration</h2>
              <p className="text-sm text-foreground-muted">
                Sync DNA calls from your Google Calendar
              </p>
            </div>
          </div>

          {calendarStatus?.connected ? (
            <>
              {/* Connected State */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-800">Connected</p>
                      <p className="text-sm text-green-600">
                        Calendar: {calendarStatus.calendarId || 'primary'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="flex items-center gap-2 px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm"
                  >
                    {disconnecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Unlink className="w-4 h-4" />
                    )}
                    Disconnect
                  </button>
                </div>
              </div>

              {/* Last Sync Info */}
              {calendarStatus.lastSync && (
                <div className="bg-background-secondary rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-foreground-muted" />
                      <div>
                        <p className="text-sm font-medium text-navy">
                          Last sync: {formatRelativeTime(calendarStatus.lastSync.timestamp)}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          {calendarStatus.lastSync.eventsProcessed} events processed,{' '}
                          {calendarStatus.lastSync.eventsSynced} synced
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        calendarStatus.lastSync.success
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {calendarStatus.lastSync.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                </div>
              )}

              {/* Sync Button */}
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors disabled:opacity-50"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Sync Now
                  </>
                )}
              </button>

              <p className="text-xs text-foreground-muted text-center mt-3">
                Calendar syncs automatically every 15 minutes
              </p>
            </>
          ) : (
            <>
              {/* Disconnected State */}
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-navy mb-2">Not Connected</h3>
                <p className="text-sm text-foreground-muted mb-6 max-w-md mx-auto">
                  Connect your Google Calendar to automatically sync DNA calls (discovery,
                  proposal, strategy) to the scheduled calls system.
                </p>
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-5 h-5" />
                      Connect Google Calendar
                    </>
                  )}
                </button>
              </div>

              {/* Features List */}
              <div className="border-t border-border mt-8 pt-6">
                <h4 className="font-medium text-navy mb-4">What gets synced?</h4>
                <ul className="space-y-3 text-sm text-foreground-muted">
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Events with "DNA", "Discovery", "Proposal", "Strategy", "Kick-Off", or "Assessment" in the title</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Automatic matching to churches by attendee email or church name</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Google Meet links are captured for easy access</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Past events automatically marked as completed</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Unmatched Events */}
        {calendarStatus?.connected && unmatchedEvents.length > 0 && (
          <div className="card mt-6">
            <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Unmatched Events ({unmatchedEvents.length})
            </h3>
            <p className="text-sm text-foreground-muted mb-4">
              These DNA-related events couldn&apos;t be matched to a church automatically. They may need
              manual review.
            </p>
            <div className="space-y-3">
              {unmatchedEvents.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-navy">{event.event_title}</p>
                    <p className="text-xs text-foreground-muted">
                      {formatDate(event.event_start)}
                      {event.attendee_emails.length > 0 &&
                        ` • ${event.attendee_emails.join(', ')}`}
                    </p>
                  </div>
                  {event.meet_link && (
                    <a
                      href={event.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal hover:text-teal-light flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Meet
                    </a>
                  )}
                </div>
              ))}
              {unmatchedEvents.length > 5 && (
                <p className="text-sm text-foreground-muted text-center">
                  +{unmatchedEvents.length - 5} more unmatched events
                </p>
              )}
            </div>
          </div>
        )}

        {/* Sync Settings Info */}
        {calendarStatus?.connected && (
          <div className="card mt-6">
            <h3 className="font-semibold text-navy mb-4">Sync Settings</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-foreground-muted">Auto-sync interval</span>
                <span className="font-medium text-navy">Every 15 minutes</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-foreground-muted">Sync range</span>
                <span className="font-medium text-navy">30 days past to 30 days future</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-foreground-muted">Keywords matched</span>
                <span className="font-medium text-navy text-right">DNA, Discovery, Proposal, Strategy, Kick-Off, Assessment</span>
              </div>
            </div>
          </div>
        )}

        {/* Fireflies.ai Integration */}
        <div className="card mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Mic className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-navy">Fireflies.ai Meeting Notes</h2>
              <p className="text-sm text-foreground-muted">
                Automatic transcription and AI summaries for your calls
              </p>
            </div>
          </div>

          {firefliesStatus?.connected ? (
            <>
              {/* Connected State */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-purple-800">Connected</p>
                      <p className="text-sm text-purple-600">
                        {firefliesStatus.settings?.admin_email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleFirefliesDisconnect}
                    disabled={firefliesDisconnecting}
                    className="flex items-center gap-2 px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm"
                  >
                    {firefliesDisconnecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Unlink className="w-4 h-4" />
                    )}
                    Disconnect
                  </button>
                </div>
              </div>

              {/* Last Webhook Info */}
              {firefliesStatus.settings?.last_webhook_received_at && (
                <div className="bg-background-secondary rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-foreground-muted" />
                    <div>
                      <p className="text-sm font-medium text-navy">
                        Last transcript received: {formatRelativeTime(firefliesStatus.settings.last_webhook_received_at)}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        Auto-processing is {firefliesStatus.settings.auto_process_enabled ? 'enabled' : 'disabled'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Features List */}
              <div className="border-t border-border pt-6">
                <h4 className="font-medium text-navy mb-4">Active Features</h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-navy">Auto-process transcripts</span>
                      <p className="text-xs text-foreground-muted">Automatically fetch and save transcripts from Fireflies</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-navy">Auto-match to churches</span>
                      <p className="text-xs text-foreground-muted">Match meetings to churches by participant email</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    {firefliesStatus.settings?.auto_share_with_churches ? (
                      <Check className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <span className="text-navy">Auto-share with churches</span>
                      <p className="text-xs text-foreground-muted">
                        {firefliesStatus.settings?.auto_share_with_churches
                          ? 'Transcripts are automatically visible to churches'
                          : 'Transcripts require manual approval before churches can see them'}
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Disconnected State */}
              {!showApiKeyInput ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-navy mb-2">Not Connected</h3>
                  <p className="text-sm text-foreground-muted mb-6 max-w-md mx-auto">
                    Connect Fireflies.ai to automatically capture meeting transcripts, AI summaries, and action items from your calls.
                  </p>
                  <button
                    onClick={() => setShowApiKeyInput(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Mic className="w-5 h-5" />
                    Connect Fireflies.ai
                  </button>
                </div>
              ) : (
                <div className="py-6">
                  <div className="max-w-md mx-auto">
                    <label className="block text-sm font-medium text-navy mb-2">
                      Fireflies API Key
                    </label>
                    <p className="text-xs text-foreground-muted mb-3">
                      Get your API key from{' '}
                      <a
                        href="https://app.fireflies.ai/integrations/custom/fireflies"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:underline"
                      >
                        Fireflies Settings
                      </a>
                    </p>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your Fireflies API key"
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleFirefliesConnect();
                        }
                      }}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleFirefliesConnect}
                        disabled={firefliesConnecting}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        {firefliesConnecting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          'Connect'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowApiKeyInput(false);
                          setApiKey('');
                        }}
                        className="px-4 py-3 border border-border rounded-lg hover:bg-background-secondary transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Features List */}
              <div className="border-t border-border mt-8 pt-6">
                <h4 className="font-medium text-navy mb-4">What you'll get</h4>
                <ul className="space-y-3 text-sm text-foreground-muted">
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Full meeting transcripts with speaker identification and timestamps</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>AI-generated summaries highlighting key points and decisions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Automatic action items extraction from conversations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Keywords and key moments identified by AI</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Automatic matching to churches and scheduled calls</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Unmatched Fireflies Meetings */}
        {firefliesStatus?.connected && unmatchedMeetings.length > 0 && (
          <div className="card mt-6">
            <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Unmatched Transcripts ({unmatchedMeetings.length})
            </h3>
            <p className="text-sm text-foreground-muted mb-4">
              These meetings couldn&apos;t be matched to a church automatically. Review and match them manually.
            </p>
            <div className="space-y-3">
              {unmatchedMeetings.slice(0, 5).map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-navy">{meeting.title}</p>
                    <p className="text-xs text-foreground-muted">
                      {meeting.meeting_date && formatDate(meeting.meeting_date)}
                      {meeting.participants && meeting.participants.length > 0 &&
                        ` • ${meeting.participants.slice(0, 2).join(', ')}`}
                    </p>
                    {meeting.ai_summary && (
                      <p className="text-xs text-foreground-muted mt-1 line-clamp-2">
                        {meeting.ai_summary}
                      </p>
                    )}
                  </div>
                  {meeting.transcript_url && (
                    <a
                      href={meeting.transcript_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 ml-4"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View
                    </a>
                  )}
                </div>
              ))}
              {unmatchedMeetings.length > 5 && (
                <p className="text-sm text-foreground-muted text-center">
                  +{unmatchedMeetings.length - 5} more unmatched meetings
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SettingsLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-gold animate-spin" />
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent />
    </Suspense>
  );
}
