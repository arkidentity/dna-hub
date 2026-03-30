'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Send, Loader2, Check, ClipboardList, Users } from 'lucide-react';
import type { ServiceFollowUpResponse } from '@/lib/types';
import GuestsTab from '@/components/dashboard/guests/GuestsTab';

type ViewTab = 'responses' | 'visitors';

interface Props {
  churchId: string;
}

interface ServiceOption {
  session_id: string;
  service_title: string;
  service_date: string | null;
  session_ended_at: string | null;
}

interface DateGroup {
  date: string;
  label: string;
  sessions: ServiceOption[];
  responseCount: number;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatSessionTime(session: ServiceOption): string {
  // Prefer session_ended_at for time, fall back to title
  if (session.session_ended_at) {
    return new Date(session.session_ended_at).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  return session.service_title;
}

export default function NextStepsResponsesTab({ churchId }: Props) {
  const [viewTab, setViewTab] = useState<ViewTab>('responses');
  const [allResponses, setAllResponses] = useState<ServiceFollowUpResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);

  // Two-level selection: date → then optionally a specific session
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string>('all-date');

  // Category filter
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Email
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const fetchResponses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/next-steps?church_id=${churchId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const fetched: ServiceFollowUpResponse[] = data.responses || [];
      setAllResponses(fetched);

      // Build service option list from response data
      const map = new Map<string, ServiceOption>();
      for (const r of fetched) {
        if (r.session_id && !map.has(r.session_id)) {
          map.set(r.session_id, {
            session_id: r.session_id,
            service_title: r.service_title,
            service_date: r.service_date,
            session_ended_at: r.session_ended_at,
          });
        }
      }
      setServiceOptions(
        Array.from(map.values()).sort((a, b) => {
          const da = a.session_ended_at || a.service_date || '';
          const db = b.session_ended_at || b.service_date || '';
          return db.localeCompare(da);
        })
      );
    } catch (err) {
      console.error('Failed to fetch responses:', err);
    } finally {
      setLoading(false);
    }
  }, [churchId]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  // Group service options by date
  const dateGroups = useMemo((): DateGroup[] => {
    const sessionCounts = new Map<string, number>();
    for (const r of allResponses) {
      if (r.session_id) {
        sessionCounts.set(r.session_id, (sessionCounts.get(r.session_id) || 0) + 1);
      }
    }

    const dateMap = new Map<string, { sessions: ServiceOption[]; count: number }>();
    for (const opt of serviceOptions) {
      const key = opt.service_date || opt.session_ended_at?.split('T')[0] || 'unknown';
      if (!dateMap.has(key)) dateMap.set(key, { sessions: [], count: 0 });
      const entry = dateMap.get(key)!;
      entry.sessions.push(opt);
      entry.count += sessionCounts.get(opt.session_id) || 0;
    }

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, { sessions, count }]) => ({
        date,
        label: date !== 'unknown' ? formatDateLabel(date) : 'Unknown Date',
        // Sort sessions within a day by end time ascending (earliest first)
        sessions: sessions.sort((a, b) =>
          (a.session_ended_at || '').localeCompare(b.session_ended_at || '')
        ),
        responseCount: count,
      }));
  }, [serviceOptions, allResponses]);

  // Auto-select the most recent date on first load
  useEffect(() => {
    if (dateGroups.length > 0 && selectedDate === null) {
      setSelectedDate(dateGroups[0].date);
      setSelectedSession('all-date');
    }
  }, [dateGroups, selectedDate]);

  const currentDateGroup = useMemo(
    () => dateGroups.find(g => g.date === selectedDate) ?? null,
    [dateGroups, selectedDate]
  );

  // Responses for the current date + session selection (no category filter yet)
  const responses = useMemo(() => {
    if (selectedDate === null) return allResponses;
    const byDate = allResponses.filter(r => {
      const rDate = r.service_date || r.session_ended_at?.split('T')[0] || 'unknown';
      return rDate === selectedDate;
    });
    if (selectedSession === 'all-date') return byDate;
    return byDate.filter(r => r.session_id === selectedSession);
  }, [allResponses, selectedDate, selectedSession]);

  // Category groups (Next Steps / Announcements / Connect Cards)
  const categoryGroups = useMemo(() => {
    const nextStepCounts = new Map<string, number>();
    const announcementCounts = new Map<string, number>();
    let connectCards = 0;

    for (const r of responses) {
      if (r.response_type === 'next_step_tap') {
        nextStepCounts.set(r.response_label, (nextStepCounts.get(r.response_label) || 0) + 1);
      } else if (r.response_type === 'announcement_signup') {
        announcementCounts.set(r.response_label, (announcementCounts.get(r.response_label) || 0) + 1);
      } else if (r.response_type === 'connect_card') {
        connectCards++;
      }
    }

    return {
      nextSteps: Array.from(nextStepCounts.entries()).sort((a, b) => b[1] - a[1]),
      announcements: Array.from(announcementCounts.entries()).sort((a, b) => b[1] - a[1]),
      connectCards,
    };
  }, [responses]);

  // Total unique people count (unfiltered by category)
  const totalPeople = useMemo(() => {
    const keys = new Set(responses.map(r => r.person_key));
    return keys.size;
  }, [responses]);

  // Label → response_type map for badge coloring
  const labelTypeMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of responses) {
      if (!m.has(r.response_label)) m.set(r.response_label, r.response_type);
    }
    return m;
  }, [responses]);

  // Person-centric table rows (category filter applied here)
  const personView = useMemo(() => {
    const filtered =
      categoryFilter === 'all'
        ? responses
        : responses.filter(r => r.response_label === categoryFilter);

    const personMap = new Map<string, {
      person_key: string;
      display_name: string;
      email: string | null;
      phone: string | null;
      is_guest: boolean;
      labels: string[];
      service_title: string;
      responded_at: string;
    }>();

    for (const r of filtered) {
      let person = personMap.get(r.person_key);
      if (!person) {
        person = {
          person_key: r.person_key,
          display_name: r.display_name,
          email: r.email,
          phone: r.phone,
          is_guest: r.is_guest,
          labels: [],
          service_title: r.service_title,
          responded_at: r.responded_at,
        };
        personMap.set(r.person_key, person);
      }
      if (r.email && !person.email) person.email = r.email;
      if (r.phone && !person.phone) person.phone = r.phone;
      if (!person.labels.includes(r.response_label)) person.labels.push(r.response_label);
    }

    return Array.from(personMap.values());
  }, [responses, categoryFilter]);

  const exportCsv = () => {
    const headers = ['Name', 'Email', 'Phone', 'Responses', 'Service', 'Date', 'Type'];
    const rows = personView.map(p => [
      p.display_name,
      p.email || '',
      p.phone || '',
      p.labels.join('; '),
      p.service_title,
      p.responded_at ? new Date(p.responded_at).toLocaleDateString() : '',
      p.is_guest ? 'Guest' : 'Member',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `follow-up-${selectedDate || new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendEmails = async () => {
    if (selectedSession === 'all-date' || sending) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/admin/next-steps/send-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ church_id: churchId, session_id: selectedSession }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSendResult(d.error || 'Failed to send');
      } else {
        const d = await res.json();
        setSendResult(`${d.sent} email${d.sent !== 1 ? 's' : ''} sent to coordinators`);
      }
    } catch {
      setSendResult('Network error');
    } finally {
      setSending(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSession('all-date');
    setCategoryFilter('all');
    setSendResult(null);
  };

  const handleSessionChange = (sessionId: string) => {
    setSelectedSession(sessionId);
    setCategoryFilter('all');
    setSendResult(null);
  };

  const getLabelColor = (responseType: string) => {
    if (responseType === 'next_step_tap') return 'bg-blue-50 text-blue-700';
    if (responseType === 'announcement_signup') return 'bg-purple-50 text-purple-700';
    return 'bg-green-50 text-green-700';
  };

  const canEmailCoordinators = selectedSession !== 'all-date' && personView.length > 0;

  return (
    <div>
      {/* ── Sub-tab nav ── */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setViewTab('responses')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            viewTab === 'responses'
              ? 'bg-navy text-white'
              : 'bg-gray-100 text-foreground-muted hover:bg-gray-200'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Service Responses
        </button>
        <button
          onClick={() => setViewTab('visitors')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            viewTab === 'visitors'
              ? 'bg-navy text-white'
              : 'bg-gray-100 text-foreground-muted hover:bg-gray-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          All Visitors
        </button>
      </div>

      {/* ── All Visitors view ── */}
      {viewTab === 'visitors' && (
        <GuestsTab churchId={churchId} />
      )}

      {/* ── Service Responses view ── */}
      {viewTab === 'responses' && <div>

      {/* ── Row 1: Date selector + action buttons ── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-foreground-muted whitespace-nowrap">Date:</label>
          <select
            value={selectedDate || ''}
            onChange={e => handleDateChange(e.target.value)}
            className="border border-card-border rounded px-3 py-1.5 text-sm min-w-[230px]"
          >
            {dateGroups.length === 0 && <option value="">No services yet</option>}
            {dateGroups.map(g => (
              <option key={g.date} value={g.date}>
                {g.label}
                {g.sessions.length > 1 ? ` · ${g.sessions.length} services` : ''}
                {g.responseCount > 0 ? ` · ${g.responseCount} responses` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleSendEmails}
            disabled={!canEmailCoordinators || sending}
            title={
              selectedSession === 'all-date'
                ? 'Select a specific service below to resend coordinator emails'
                : undefined
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-navy text-white hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : sendResult?.includes('sent') ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Resend Emails
          </button>

          <button
            onClick={exportCsv}
            disabled={personView.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-foreground-muted hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Row 2: Per-service session pills (only when multiple sessions on the selected date) ── */}
      {currentDateGroup && currentDateGroup.sessions.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleSessionChange('all-date')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedSession === 'all-date'
                ? 'bg-navy text-white'
                : 'bg-gray-100 text-foreground-muted hover:bg-gray-200'
            }`}
          >
            All Services
          </button>
          {currentDateGroup.sessions.map(s => (
            <button
              key={s.session_id}
              onClick={() => handleSessionChange(s.session_id)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedSession === s.session_id
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 text-foreground-muted hover:bg-gray-200'
              }`}
            >
              {s.service_title}
              {s.session_ended_at && ` · ${formatSessionTime(s)}`}
            </button>
          ))}
        </div>
      )}

      {/* ── Send result message ── */}
      {sendResult && (
        <div
          className={`text-sm mb-3 px-3 py-2 rounded ${
            sendResult.includes('sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {sendResult}
        </div>
      )}

      {/* ── Category filter pills (grouped by type) ── */}
      {responses.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 text-foreground-muted hover:bg-gray-200'
              }`}
            >
              All ({totalPeople} {totalPeople === 1 ? 'person' : 'people'})
            </button>
          </div>

          {categoryGroups.nextSteps.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-foreground-muted font-medium uppercase tracking-wide mr-1">
                Next Steps:
              </span>
              {categoryGroups.nextSteps.map(([label, count]) => (
                <button
                  key={label}
                  onClick={() => setCategoryFilter(label)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    categoryFilter === label
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          )}

          {categoryGroups.announcements.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-foreground-muted font-medium uppercase tracking-wide mr-1">
                Announcements:
              </span>
              {categoryGroups.announcements.map(([label, count]) => (
                <button
                  key={label}
                  onClick={() => setCategoryFilter(label)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    categoryFilter === label
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          )}

          {categoryGroups.connectCards > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-foreground-muted font-medium uppercase tracking-wide mr-1">
                Connect Cards:
              </span>
              <button
                onClick={() => setCategoryFilter('Connect Card')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  categoryFilter === 'Connect Card'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                Connect Card ({categoryGroups.connectCards})
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Person-centric table ── */}
      {loading ? (
        <div className="text-center py-8 text-foreground-muted">Loading responses...</div>
      ) : personView.length === 0 ? (
        <div className="text-center py-8 text-foreground-muted">
          <p className="text-lg font-medium mb-1">No follow-up responses yet</p>
          <p className="text-sm">
            Responses will appear here after a live service with Next Steps, Announcements, or Connect Card blocks.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm min-w-[540px]">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left px-4 py-2 font-medium text-foreground-muted">Name</th>
                <th className="text-left px-4 py-2 font-medium text-foreground-muted">Email</th>
                <th className="text-left px-4 py-2 font-medium text-foreground-muted hidden sm:table-cell">
                  Phone
                </th>
                <th className="text-left px-4 py-2 font-medium text-foreground-muted">Responses</th>
                <th className="text-center px-4 py-2 font-medium text-foreground-muted hidden md:table-cell">
                  Type
                </th>
              </tr>
            </thead>
            <tbody>
              {personView.map(p => (
                <tr
                  key={p.person_key}
                  className="border-b border-border last:border-b-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{p.display_name}</td>
                  <td className="px-4 py-3 text-foreground-muted">{p.email || '—'}</td>
                  <td className="px-4 py-3 text-foreground-muted hidden sm:table-cell whitespace-nowrap">
                    {p.phone || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.labels.map(label => (
                        <span
                          key={label}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getLabelColor(
                            labelTypeMap.get(label) || 'next_step_tap'
                          )}`}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    {p.is_guest ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        Guest
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Member
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-foreground-muted mt-3">
        Coordinator emails are sent automatically after each service ends.
        {canEmailCoordinators && ' Use "Resend Emails" to re-trigger for this service.'}
        {selectedSession === 'all-date' &&
          currentDateGroup &&
          currentDateGroup.sessions.length > 1 &&
          ' Select a specific service above to resend coordinator emails.'}
      </p>
      </div>}
    </div>
  );
}
