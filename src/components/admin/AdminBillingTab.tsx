'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Loader2,
  RefreshCw,
  AlertTriangle,
  XCircle,
  CheckCircle,
  ExternalLink,
  TrendingUp,
  Building2,
  Download,
  Pencil,
  Check,
  X,
} from 'lucide-react';

interface ChurchBillingRow {
  church_id: string;
  church_name: string;
  subdomain: string | null;
  church_created_at: string;
  status: 'free' | 'active' | 'past_due' | 'suspended' | 'canceled';
  plan_tier: string | null;
  monthly_amount_cents: number | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  suspended_at: string | null;
  billing_updated_at: string | null;
  billing_email: string | null;
  admin_notes: string | null;
}

interface BillingSummary {
  mrr_cents: number;
  arr_cents: number;
  total_churches: number;
  active_count: number;
  past_due_count: number;
  suspended_count: number;
  free_count: number;
  canceled_count: number;
}

type Filter = 'all' | 'active' | 'past_due' | 'suspended' | 'free' | 'canceled';

const TIER_LABELS: Record<string, string> = {
  seed: 'Seed',
  growth: 'Growth',
  thrive: 'Thrive',
  multiply: 'Multiply',
  movement: 'Movement',
  custom: 'Custom',
};

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  active: { label: 'Active', className: 'bg-green-100 text-green-700', icon: CheckCircle },
  past_due: { label: 'Past Due', className: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  suspended: { label: 'Suspended', className: 'bg-red-100 text-red-700', icon: XCircle },
  free: { label: 'Free', className: 'bg-gray-100 text-gray-500', icon: Building2 },
  canceled: { label: 'Canceled', className: 'bg-gray-100 text-gray-400', icon: XCircle },
};

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminBillingTab() {
  const [rows, setRows] = useState<ChurchBillingRow[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  // Admin notes inline editing: keyed by church_id
  const [editingNotes, setEditingNotes] = useState<string | null>(null); // church_id being edited
  const [notesValue, setNotesValue] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  const fetchData = async () => {
    try {
      setError('');
      const res = await fetch('/api/admin/billing');
      if (!res.ok) throw new Error('Failed to load billing data');
      const data = await res.json();
      setRows(data.rows);
      setSummary(data.summary);
    } catch {
      setError('Could not load billing data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filtered = useMemo(() => {
    let result = rows;
    if (filter !== 'all') result = result.filter(r => r.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.church_name.toLowerCase().includes(q) ||
        (r.subdomain ?? '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [rows, filter, search]);

  const exportCSV = () => {
    const headers = ['Church', 'Subdomain', 'Status', 'Tier', 'MRR', 'Next Billing', 'Billing Email', 'Stripe Customer', 'Church Created'];
    const escapeCSV = (val: string | null | undefined) => {
      if (val == null) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };
    const csvRows = [
      headers.join(','),
      ...rows.map(r => [
        escapeCSV(r.church_name),
        escapeCSV(r.subdomain),
        escapeCSV(r.status),
        escapeCSV(r.plan_tier ? TIER_LABELS[r.plan_tier] ?? r.plan_tier : null),
        r.monthly_amount_cents ? (r.monthly_amount_cents / 100).toFixed(2) : '',
        r.current_period_end ? formatDate(r.current_period_end) : '',
        escapeCSV(r.billing_email),
        escapeCSV(r.stripe_customer_id),
        r.church_created_at ? formatDate(r.church_created_at) : '',
      ].join(',')),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dna-billing-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startEditNotes = (row: ChurchBillingRow) => {
    setEditingNotes(row.church_id);
    setNotesValue(row.admin_notes ?? '');
  };

  const saveNotes = async (churchId: string) => {
    setNotesSaving(true);
    try {
      const res = await fetch(`/api/admin/billing/${churchId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: notesValue }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setRows(prev => prev.map(r => r.church_id === churchId ? { ...r, admin_notes: notesValue } : r));
      setEditingNotes(null);
    } catch {
      // Leave editing open on failure — user can retry
    } finally {
      setNotesSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 max-w-lg">
        <XCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm">{error}</span>
        <button onClick={handleRefresh} className="ml-auto text-sm underline">Retry</button>
      </div>
    );
  }

  const FILTERS: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: summary?.total_churches ?? 0 },
    { id: 'active', label: 'Active', count: summary?.active_count ?? 0 },
    { id: 'past_due', label: 'Past Due', count: summary?.past_due_count ?? 0 },
    { id: 'suspended', label: 'Suspended', count: summary?.suspended_count ?? 0 },
    { id: 'free', label: 'Free', count: summary?.free_count ?? 0 },
    { id: 'canceled', label: 'Canceled', count: summary?.canceled_count ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy">Billing Overview</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={rows.length === 0}
            className="btn-secondary flex items-center gap-1.5 text-sm py-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button onClick={handleRefresh} disabled={refreshing} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* MRR / ARR stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-gold" />
              <span className="text-xs text-foreground-muted uppercase tracking-wide">MRR</span>
            </div>
            <p className="text-2xl font-bold text-navy">{formatMoney(summary.mrr_cents)}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-teal" />
              <span className="text-xs text-foreground-muted uppercase tracking-wide">ARR</span>
            </div>
            <p className="text-2xl font-bold text-navy">{formatMoney(summary.arr_cents)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-foreground-muted uppercase tracking-wide mb-1">Active</p>
            <p className="text-2xl font-bold text-green-700">{summary.active_count}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-foreground-muted uppercase tracking-wide mb-1">Needs Attention</p>
            <p className={`text-2xl font-bold ${(summary.past_due_count + summary.suspended_count) > 0 ? 'text-yellow-600' : 'text-navy'}`}>
              {summary.past_due_count + summary.suspended_count}
            </p>
          </div>
        </div>
      )}

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f.id
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label} {f.count > 0 && <span className="ml-1 opacity-70">{f.count}</span>}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search church or subdomain…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="sm:ml-auto border border-card-border rounded-lg px-3 py-1.5 text-sm w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Church</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Tier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">MRR</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Next Billing</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Stripe</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-foreground-muted">
                    No churches match this filter.
                  </td>
                </tr>
              )}
              {filtered.map(row => {
                const statusCfg = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.free;
                const StatusIcon = statusCfg.icon;
                return (
                  <tr key={row.church_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy">{row.church_name}</p>
                      {row.subdomain && (
                        <p className="text-xs text-foreground-muted">{row.subdomain}.dailydna.app</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                      {row.cancel_at_period_end && (
                        <p className="text-xs text-red-500 mt-0.5">Cancels at period end</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">
                      {row.plan_tier ? TIER_LABELS[row.plan_tier] ?? row.plan_tier : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-navy">
                      {row.monthly_amount_cents ? formatMoney(row.monthly_amount_cents) : '—'}
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">
                      {row.current_period_end ? formatDate(row.current_period_end) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {row.stripe_customer_id ? (
                        <a
                          href={`https://dashboard.stripe.com/customers/${row.stripe_customer_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-teal hover:text-teal-dark text-xs"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-foreground-muted">—</span>
                      )}
                    </td>
                    {/* Admin notes — inline edit */}
                    <td className="px-4 py-3 max-w-xs">
                      {editingNotes === row.church_id ? (
                        <div className="flex items-start gap-1">
                          <textarea
                            value={notesValue}
                            onChange={e => setNotesValue(e.target.value)}
                            rows={2}
                            className="text-xs border border-card-border rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-gold resize-none"
                            autoFocus
                          />
                          <button
                            onClick={() => saveNotes(row.church_id)}
                            disabled={notesSaving}
                            className="text-green-600 hover:text-green-700 flex-shrink-0 p-0.5"
                          >
                            {notesSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => setEditingNotes(null)}
                            className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1 group">
                          <span className="text-xs text-foreground-muted line-clamp-2">
                            {row.admin_notes || <span className="italic text-gray-300">—</span>}
                          </span>
                          <button
                            onClick={() => startEditNotes(row)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1 text-gray-400 hover:text-navy"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-card-border text-xs text-foreground-muted">
            Showing {filtered.length} of {rows.length} churches
          </div>
        )}
      </div>
    </div>
  );
}
