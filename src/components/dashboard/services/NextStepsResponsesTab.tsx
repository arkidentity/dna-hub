'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Send, Loader2, Check } from 'lucide-react';
import type { ServiceFollowUpResponse } from '@/lib/types';

interface Props {
  churchId: string;
}

interface ServiceOption {
  session_id: string;
  service_title: string;
  service_date: string | null;
  session_ended_at: string | null;
}

export default function NextStepsResponsesTab({ churchId }: Props) {
  const [responses, setResponses] = useState<ServiceFollowUpResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sessionFilter, setSessionFilter] = useState('all');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const fetchResponses = useCallback(async () => {
    setLoading(true);
    try {
      const url = sessionFilter === 'all'
        ? `/api/admin/next-steps?church_id=${churchId}`
        : `/api/admin/next-steps?church_id=${churchId}&session_id=${sessionFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setResponses(data.responses || []);
    } catch (err) {
      console.error('Failed to fetch responses:', err);
    } finally {
      setLoading(false);
    }
  }, [churchId, sessionFilter]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  // Derive unique services for the dropdown
  const serviceOptions = useMemo(() => {
    const map = new Map<string, ServiceOption>();
    for (const r of responses) {
      if (r.session_id && !map.has(r.session_id)) {
        map.set(r.session_id, {
          session_id: r.session_id,
          service_title: r.service_title,
          service_date: r.service_date,
          session_ended_at: r.session_ended_at,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const da = a.session_ended_at || a.service_date || '';
      const db = b.session_ended_at || b.service_date || '';
      return db.localeCompare(da);
    });
  }, [responses]);

  // Derive category labels (response_label) for filter pills
  const categoryLabels = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of responses) {
      counts[r.response_label] = (counts[r.response_label] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [responses]);

  // Build person-centric view for the table
  const personView = useMemo(() => {
    // Group responses by person
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

    const filtered = categoryFilter === 'all'
      ? responses
      : responses.filter((r) => r.response_label === categoryFilter);

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
      if (!person.labels.includes(r.response_label)) {
        person.labels.push(r.response_label);
      }
    }

    return Array.from(personMap.values());
  }, [responses, categoryFilter]);

  const exportCsv = () => {
    const headers = ['Name', 'Email', 'Phone', 'Responses', 'Service', 'Date', 'Type'];
    const rows = personView.map((p) => [
      p.display_name,
      p.email || '',
      p.phone || '',
      p.labels.join('; '),
      p.service_title,
      p.responded_at ? new Date(p.responded_at).toLocaleDateString() : '',
      p.is_guest ? 'Guest' : 'Member',
    ]);

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `follow-up-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendEmails = async () => {
    if (sessionFilter === 'all' || sending) return;
    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/admin/next-steps/send-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ church_id: churchId, session_id: sessionFilter }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSendResult(data.error || 'Failed to send');
      } else {
        const data = await res.json();
        setSendResult(`${data.sent} email${data.sent !== 1 ? 's' : ''} sent to coordinators`);
      }
    } catch {
      setSendResult('Network error');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      {/* Service filter + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-foreground-muted">Service:</label>
          <select
            value={sessionFilter}
            onChange={(e) => { setSessionFilter(e.target.value); setCategoryFilter('all'); setSendResult(null); }}
            className="border border-card-border rounded px-3 py-1.5 text-sm min-w-[200px]"
          >
            <option value="all">All Services</option>
            {serviceOptions.map((s) => (
              <option key={s.session_id} value={s.session_id}>
                {s.service_title}
                {s.service_date ? ` (${new Date(s.service_date + 'T00:00:00').toLocaleDateString()})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {sessionFilter !== 'all' && (
            <button
              onClick={handleSendEmails}
              disabled={sending || personView.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-navy text-white hover:bg-navy/90 disabled:opacity-50 transition-colors"
            >
              {sending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : sendResult?.includes('sent') ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Email Coordinators
            </button>
          )}

          <button
            onClick={exportCsv}
            disabled={personView.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-foreground-muted hover:bg-gray-200 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Send result message */}
      {sendResult && (
        <div className={`text-sm mb-3 px-3 py-2 rounded ${
          sendResult.includes('sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {sendResult}
        </div>
      )}

      {/* Category filter pills */}
      {categoryLabels.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              categoryFilter === 'all'
                ? 'bg-navy text-white'
                : 'bg-gray-100 text-foreground-muted hover:bg-gray-200'
            }`}
          >
            All ({responses.length})
          </button>
          {categoryLabels.map(([label, count]) => (
            <button
              key={label}
              onClick={() => setCategoryFilter(label)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                categoryFilter === label
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 text-foreground-muted hover:bg-gray-200'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      )}

      {/* Person-centric table */}
      {loading ? (
        <div className="text-center py-8 text-foreground-muted">Loading responses...</div>
      ) : personView.length === 0 ? (
        <div className="text-center py-8 text-foreground-muted">
          <p className="text-lg font-medium mb-1">No follow-up responses yet</p>
          <p className="text-sm">Responses will appear here after a live service with Next Steps, Announcements, or Connect Card blocks.</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left px-4 py-2 font-medium text-foreground-muted">Name</th>
                <th className="text-left px-4 py-2 font-medium text-foreground-muted">Email</th>
                <th className="text-left px-4 py-2 font-medium text-foreground-muted">Phone</th>
                <th className="text-left px-4 py-2 font-medium text-foreground-muted">Responses</th>
                {sessionFilter === 'all' && (
                  <th className="text-left px-4 py-2 font-medium text-foreground-muted">Service</th>
                )}
                <th className="text-center px-4 py-2 font-medium text-foreground-muted">Type</th>
              </tr>
            </thead>
            <tbody>
              {personView.map((p) => (
                <tr key={p.person_key} className="border-b border-border last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.display_name}</td>
                  <td className="px-4 py-3 text-foreground-muted">{p.email || '—'}</td>
                  <td className="px-4 py-3 text-foreground-muted">{p.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.labels.map((label) => (
                        <span
                          key={label}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </td>
                  {sessionFilter === 'all' && (
                    <td className="px-4 py-3 text-foreground-muted">{p.service_title}</td>
                  )}
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
      )}

      <p className="text-xs text-foreground-muted mt-4">
        {personView.length > 0 && `Showing ${personView.length} ${personView.length === 1 ? 'person' : 'people'}`}
        {personView.length > 0 && sessionFilter !== 'all' && '. Select a service and click "Email Coordinators" to send follow-up lists.'}
      </p>
    </div>
  );
}
