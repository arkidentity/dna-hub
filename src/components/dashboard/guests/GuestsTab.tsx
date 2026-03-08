'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';

interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  visit_count: number;
  first_visit_at: string;
  last_visit_at: string;
  merged_to_user_id: string | null;
  created_at: string;
}

interface GuestsTabProps {
  churchId: string;
}

export default function GuestsTab({ churchId }: GuestsTabProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active');

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/guests?church_id=${churchId}&status=${statusFilter}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setGuests(data.guests || []);
    } catch (err) {
      console.error('Failed to fetch guests:', err);
    } finally {
      setLoading(false);
    }
  }, [churchId, statusFilter]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const exportCsv = () => {
    const headers = ['Name', 'Email', 'Phone', 'Visits', 'First Visit', 'Last Visit', 'Status'];
    const rows = guests.map(g => [
      g.name,
      g.email || '',
      g.phone || '',
      String(g.visit_count),
      new Date(g.first_visit_at).toLocaleDateString(),
      new Date(g.last_visit_at).toLocaleDateString(),
      g.merged_to_user_id ? 'Merged' : 'Active',
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const activeCount = guests.filter(g => !g.merged_to_user_id).length;
  const mergedCount = guests.filter(g => g.merged_to_user_id).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {['active', 'merged', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                statusFilter === f
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 text-foreground-muted hover:bg-gray-200'
              }`}
            >
              {f} {f === 'active' ? `(${activeCount})` : f === 'merged' ? `(${mergedCount})` : ''}
            </button>
          ))}
        </div>

        <button
          onClick={exportCsv}
          disabled={guests.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-foreground-muted hover:bg-gray-200 disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-foreground-muted">Loading guests...</div>
      ) : guests.length === 0 ? (
        <div className="text-center py-8 text-foreground-muted">
          <p className="text-lg font-medium mb-1">No guests yet</p>
          <p className="text-sm">Guests will appear here when they join via QR code or the /join page.</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left px-4 py-2 font-medium text-foreground-muted">Name</th>
                <th className="text-left px-4 py-2 font-medium text-foreground-muted">Email</th>
                <th className="text-left px-4 py-2 font-medium text-foreground-muted">Phone</th>
                <th className="text-center px-4 py-2 font-medium text-foreground-muted">Visits</th>
                <th className="text-left px-4 py-2 font-medium text-foreground-muted">First Visit</th>
                <th className="text-left px-4 py-2 font-medium text-foreground-muted">Last Visit</th>
                <th className="text-center px-4 py-2 font-medium text-foreground-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => (
                <tr key={guest.id} className="border-b border-border last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{guest.name}</td>
                  <td className="px-4 py-3 text-foreground-muted">{guest.email || '—'}</td>
                  <td className="px-4 py-3 text-foreground-muted">{guest.phone || '—'}</td>
                  <td className="px-4 py-3 text-center">{guest.visit_count}</td>
                  <td className="px-4 py-3 text-foreground-muted">{formatDate(guest.first_visit_at)}</td>
                  <td className="px-4 py-3 text-foreground-muted">{formatDate(guest.last_visit_at)}</td>
                  <td className="px-4 py-3 text-center">
                    {guest.merged_to_user_id ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Merged
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
