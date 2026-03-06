'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Submission {
  id: string;
  testimony_id: string;
  user_id: string;
  display_name: string;
  title: string;
  testimony_type: string | null;
  struggle: string | null;
  turning_point: string | null;
  outcome: string | null;
  reflection: string | null;
  your_invitation: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const TESTIMONY_TYPE_LABELS: Record<string, string> = {
  salvation: 'Salvation',
  healing: 'Healing',
  provision: 'Provision',
  breakthrough: 'Breakthrough',
  everyday_faithfulness: 'Everyday Faithfulness',
  transformation: 'Transformation',
  relationship_restoration: 'Relationship Restoration',
  direction_guidance: 'Direction & Guidance',
};

const STORY_LABELS = [
  { key: 'struggle', letter: 'S', title: 'Struggle' },
  { key: 'turning_point', letter: 'T', title: 'Turning Point' },
  { key: 'outcome', letter: 'O', title: 'Outcome' },
  { key: 'reflection', letter: 'R', title: 'Reflection' },
  { key: 'your_invitation', letter: 'Y', title: 'Your Invitation' },
];

interface TestimonySubmissionsTabProps {
  churchId: string;
}

export default function TestimonySubmissionsTab({ churchId }: TestimonySubmissionsTabProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/testimony-submissions?church_id=${churchId}&status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
        setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch testimony submissions:', err);
    }
    setLoading(false);
  }, [churchId, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (submissionId: string, action: 'approve' | 'reject') => {
    setActioningId(submissionId);
    try {
      const res = await fetch('/api/admin/testimony-submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, action, churchId }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to action submission:', err);
    }
    setActioningId(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-navy' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
          { label: 'Approved', value: stats.approved, color: 'text-green-600' },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-card-border p-4 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-foreground-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Submission List */}
      <div className="bg-white rounded-lg border border-card-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-navy">Submissions</h3>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-card-border rounded px-3 py-1.5 text-sm"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <p className="text-foreground-muted text-center py-8">Loading...</p>
        ) : submissions.length === 0 ? (
          <p className="text-foreground-muted text-center py-8">
            No testimony submissions yet. Disciples can share their testimonies from the Daily DNA app.
          </p>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => {
              const isExpanded = expandedId === sub.id;
              return (
                <div
                  key={sub.id}
                  className={`border rounded-lg p-4 ${
                    sub.status === 'pending'
                      ? 'border-yellow-300 bg-yellow-50'
                      : sub.status === 'rejected'
                      ? 'border-red-200 bg-red-50 opacity-75'
                      : sub.status === 'approved'
                      ? 'border-green-200 bg-green-50/30'
                      : 'border-card-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-navy">{sub.display_name}</span>
                        {sub.testimony_type && (
                          <span className="text-xs bg-navy/10 text-navy px-2 py-0.5 rounded-full">
                            {TESTIMONY_TYPE_LABELS[sub.testimony_type] || sub.testimony_type}
                          </span>
                        )}
                        {sub.status === 'pending' && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        )}
                        {sub.status === 'approved' && (
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                            Approved
                          </span>
                        )}
                        {sub.status === 'rejected' && (
                          <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                            Rejected
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-navy text-sm">{sub.title}</p>
                      <span className="text-xs text-foreground-muted">{formatDate(sub.created_at)}</span>

                      {/* Expand/Collapse STORY */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                        className="flex items-center gap-1 mt-2 text-xs text-navy/70 hover:text-navy transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {isExpanded ? 'Hide testimony' : 'Read testimony'}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-3">
                          {STORY_LABELS.map(({ key, letter, title }) => {
                            const value = sub[key as keyof Submission] as string | null;
                            if (!value) return null;
                            return (
                              <div key={key}>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="w-5 h-5 rounded-full bg-navy text-white text-xs flex items-center justify-center font-bold">
                                    {letter}
                                  </span>
                                  <span className="text-sm font-medium text-navy">{title}</span>
                                </div>
                                <p className="text-sm text-foreground-secondary pl-7 whitespace-pre-line">{value}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {sub.status === 'pending' && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleAction(sub.id, 'approve')}
                          disabled={actioningId === sub.id}
                          className="p-1.5 rounded border border-green-300 text-green-700 hover:bg-green-50 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAction(sub.id, 'reject')}
                          disabled={actioningId === sub.id}
                          className="p-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
