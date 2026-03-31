'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Send, Loader2, Check, ClipboardList, Users, ChevronDown, ChevronUp } from 'lucide-react';
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
  if (session.session_ended_at) {
    return new Date(session.session_ended_at).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  return session.service_title;
}

/** Truncate label to first phrase (before first dash or 50 chars) */
function truncateLabel(label: string): string {
  const dashIdx = label.indexOf(' - ');
  if (dashIdx > 0 && dashIdx <= 50) return label.substring(0, dashIdx);
  if (label.length > 50) return label.substring(0, 47) + '...';
  return label;
}

export default function NextStepsResponsesTab({ churchId }: Props) {
  const [viewTab, setViewTab] = useState<ViewTab>('responses');
  const [allResponses, setAllResponses] = useState<ServiceFollowUpResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string>('all-date');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [summaryOpen, setSummaryOpen] = useState(true);

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
        sessions: sessions.sort((a, b) =>
          (a.session_ended_at || '').localeCompare(b.session_ended_at || '')
        ),
        responseCount: count,
      }));
  }, [serviceOptions, allResponses]);

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

  const responses = useMemo(() => {
    if (selectedDate === null) return allResponses;
    const byDate = allResponses.filter(r => {
      const rDate = r.service_date || r.session_ended_at?.split('T')[0] || 'unknown';
      return rDate === selectedDate;
    });
    if (selectedSession === 'all-date') return byDate;
    return byDate.filter(r => r.session_id === selectedSession);
  }, [allResponses, selectedDate, selectedSession]);

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

  const totalPeople = useMemo(() => {
    const keys = new Set(responses.map(r => r.person_key));
    return keys.size;
  }, [responses]);

  const totalResponses = responses.length;

  // Max count for bar chart scaling
  const maxCount = useMemo(() => {
    let max = 0;
    for (const [, c] of categoryGroups.nextSteps) max = Math.max(max, c);
    for (const [, c] of categoryGroups.announcements) max = Math.max(max, c);
    max = Math.max(max, categoryGroups.connectCards);
    return max || 1;
  }, [categoryGroups]);

  const labelTypeMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of responses) {
      if (!m.has(r.response_label)) m.set(r.response_label, r.response_type);
    }
    return m;
  }, [responses]);

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

  const getLabelDotColor = (responseType: string) => {
    if (responseType === 'next_step_tap') return 'bg-blue-500';
    if (responseType === 'announcement_signup') return 'bg-purple-500';
    return 'bg-green-500';
  };

  const getBarColor = (responseType: string) => {
    if (responseType === 'next_step_tap') return 'bg-blue-500';
    if (responseType === 'announcement_signup') return 'bg-purple-500';
    return 'bg-green-500';
  };

  const getBarBgColor = (responseType: string) => {
    if (responseType === 'next_step_tap') return 'bg-blue-100';
    if (responseType === 'announcement_signup') return 'bg-purple-100';
    return 'bg-green-100';
  };

  const canEmailCoordinators = selectedSession !== 'all-date' && personView.length > 0;

  // Build flat list of all categories for the summary chart
  const allCategories = useMemo(() => {
    const items: { label: string; shortLabel: string; count: number; type: string }[] = [];
    for (const [label, count] of categoryGroups.nextSteps) {
      items.push({ label, shortLabel: truncateLabel(label), count, type: 'next_step_tap' });
    }
    for (const [label, count] of categoryGroups.announcements) {
      items.push({ label, shortLabel: truncateLabel(label), count, type: 'announcement_signup' });
    }
    if (categoryGroups.connectCards > 0) {
      items.push({ label: 'Connect Card', shortLabel: 'Connect Card', count: categoryGroups.connectCards, type: 'connect_card' });
    }
    return items;
  }, [categoryGroups]);

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

      {viewTab === 'visitors' && <GuestsTab churchId={churchId} />}

      {viewTab === 'responses' && <div>

      {/* ── Filter bar: date + service + actions ── */}
      <div className="bg-white rounded-lg border border-card-border p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Date selector */}
          <select
            value={selectedDate || ''}
            onChange={e => handleDateChange(e.target.value)}
            className="border border-card-border rounded-lg px-3 py-2 text-sm font-medium w-full sm:w-auto sm:min-w-[260px]"
          >
            {dateGroups.length === 0 && <option value="">No services yet</option>}
            {dateGroups.map(g => (
              <option key={g.date} value={g.date}>
                {g.label} ({g.responseCount} response{g.responseCount !== 1 ? 's' : ''})
              </option>
            ))}
          </select>

          {/* Service selector (only when multiple sessions) */}
          {currentDateGroup && currentDateGroup.sessions.length > 1 && (
            <select
              value={selectedSession}
              onChange={e => handleSessionChange(e.target.value)}
              className="border border-card-border rounded-lg px-3 py-2 text-sm w-full sm:w-auto sm:min-w-[200px]"
            >
              <option value="all-date">All Services</option>
              {currentDateGroup.sessions.map(s => (
                <option key={s.session_id} value={s.session_id}>
                  {s.service_title}{s.session_ended_at ? ` · ${formatSessionTime(s)}` : ''}
                </option>
              ))}
            </select>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <button
              onClick={handleSendEmails}
              disabled={!canEmailCoordinators || sending}
              title={
                selectedSession === 'all-date'
                  ? 'Select a specific service to resend coordinator emails'
                  : 'Resend coordinator emails'
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-navy text-white hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : sendResult?.includes('sent') ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Resend Emails</span>
            </button>

            <button
              onClick={exportCsv}
              disabled={personView.length === 0}
              title="Export CSV"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-gray-100 text-foreground-muted hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Send result message */}
        {sendResult && (
          <div
            className={`text-sm mt-3 px-3 py-2 rounded-lg ${
              sendResult.includes('sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {sendResult}
          </div>
        )}
      </div>

      {/* ── Summary panel with bar chart ── */}
      {responses.length > 0 && (
        <div className="bg-white rounded-lg border border-card-border mb-4">
          {/* Summary header */}
          <button
            onClick={() => setSummaryOpen(!summaryOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-4">
              <div>
                <span className="text-2xl font-bold text-navy">{totalPeople}</span>
                <span className="text-sm text-foreground-muted ml-1.5">
                  {totalPeople === 1 ? 'person' : 'people'}
                </span>
              </div>
              <div className="hidden sm:block text-sm text-foreground-muted">
                {totalResponses} response{totalResponses !== 1 ? 's' : ''} across {allCategories.length} categor{allCategories.length === 1 ? 'y' : 'ies'}
              </div>
            </div>
            {summaryOpen ? (
              <ChevronUp className="w-4 h-4 text-foreground-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-foreground-muted" />
            )}
          </button>

          {/* Collapsible bar chart */}
          {summaryOpen && (
            <div className="px-4 pb-4 space-y-1">
              {/* "All" reset button */}
              {categoryFilter !== 'all' && (
                <button
                  onClick={() => setCategoryFilter('all')}
                  className="text-xs text-navy hover:underline mb-2"
                >
                  Clear filter
                </button>
              )}

              {allCategories.map(({ label, shortLabel, count, type }) => (
                <button
                  key={label}
                  onClick={() => setCategoryFilter(categoryFilter === label ? 'all' : label)}
                  className={`w-full group text-left rounded-lg px-3 py-2 transition-colors ${
                    categoryFilter === label
                      ? 'bg-gray-100 ring-1 ring-navy/20'
                      : 'hover:bg-gray-50'
                  }`}
                  title={label}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getLabelDotColor(type)}`} />
                      <span className="text-sm text-navy truncate">{shortLabel}</span>
                    </div>
                    <span className="text-sm font-semibold text-navy ml-2 flex-shrink-0">{count}</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${getBarBgColor(type)}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getBarColor(type)}`}
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── People list ── */}
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
        <>
          {/* Desktop table (hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-card-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-card-border">
                  <th className="text-left px-4 py-2.5 font-medium text-foreground-muted">Name</th>
                  <th className="text-left px-4 py-2.5 font-medium text-foreground-muted">Contact</th>
                  <th className="text-left px-4 py-2.5 font-medium text-foreground-muted">Responses</th>
                  <th className="text-center px-4 py-2.5 font-medium text-foreground-muted w-20">Type</th>
                </tr>
              </thead>
              <tbody>
                {personView.map(p => (
                  <tr
                    key={p.person_key}
                    className="border-b border-card-border last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{p.display_name}</td>
                    <td className="px-4 py-3 text-foreground-muted">
                      <div>{p.email || '—'}</div>
                      {p.phone && <div className="text-xs mt-0.5">{p.phone}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {p.labels.map(label => (
                          <span
                            key={label}
                            title={label}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getLabelColor(
                              labelTypeMap.get(label) || 'next_step_tap'
                            )}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${getLabelDotColor(labelTypeMap.get(label) || 'next_step_tap')}`} />
                            {truncateLabel(label)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
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

          {/* Mobile card layout (shown only on mobile) */}
          <div className="md:hidden space-y-3">
            {personView.map(p => (
              <div
                key={p.person_key}
                className="bg-white rounded-lg border border-card-border p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-navy">{p.display_name}</div>
                    {p.email && <div className="text-xs text-foreground-muted mt-0.5">{p.email}</div>}
                    {p.phone && <div className="text-xs text-foreground-muted">{p.phone}</div>}
                  </div>
                  {p.is_guest ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 flex-shrink-0">
                      Guest
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex-shrink-0">
                      Member
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-card-border">
                  {p.labels.map(label => (
                    <span
                      key={label}
                      title={label}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getLabelColor(
                        labelTypeMap.get(label) || 'next_step_tap'
                      )}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${getLabelDotColor(labelTypeMap.get(label) || 'next_step_tap')}`} />
                      {truncateLabel(label)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
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
