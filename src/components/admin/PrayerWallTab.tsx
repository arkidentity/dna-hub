'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, CheckCircle, Copy, ExternalLink } from 'lucide-react';

interface PrayerWallPost {
  id: string;
  user_id: string;
  is_anonymous: boolean;
  display_name: string;
  prayer_text: string;
  dimension: string | null;
  status: string;
  is_visible: boolean;
  testimony_text: string | null;
  answered_at: string | null;
  pray_count: number;
  created_at: string;
}

interface Stats {
  total: number;
  active: number;
  answered: number;
  pending: number;
  hidden: number;
}

interface PrayerWallTabProps {
  churchId: string;
  subdomain?: string;
}

export default function PrayerWallTab({ churchId, subdomain }: PrayerWallTabProps) {
  const [posts, setPosts] = useState<PrayerWallPost[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, answered: 0, pending: 0, hidden: 0 });
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [savingSettings, setSavingSettings] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const displayUrl = subdomain
    ? `https://${subdomain}.dailydna.app/prayer-wall/display/${churchId}`
    : `/prayer-wall/display/${churchId}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/prayer-wall?church_id=${churchId}&status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setStats(data.stats || { total: 0, active: 0, answered: 0, pending: 0, hidden: 0 });
        setRequiresApproval(data.settings?.requires_approval ?? false);
      }
    } catch (err) {
      console.error('Failed to fetch prayer wall data:', err);
    }
    setLoading(false);
  }, [churchId, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleApproval = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/prayer-wall', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId, requires_approval: !requiresApproval }),
      });
      if (res.ok) {
        setRequiresApproval(!requiresApproval);
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
    setSavingSettings(false);
  };

  const handleAction = async (postId: string, action: 'approve' | 'hide' | 'unhide') => {
    setActioningId(postId);
    try {
      const res = await fetch('/api/admin/prayer-wall', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action, churchId }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to action post:', err);
    }
    setActioningId(null);
  };

  const copyDisplayUrl = () => {
    navigator.clipboard.writeText(displayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-navy' },
          { label: 'Active', value: stats.active, color: 'text-green-600' },
          { label: 'Answered', value: stats.answered, color: 'text-gold' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
          { label: 'Hidden', value: stats.hidden, color: 'text-red-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-card-border p-4 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-foreground-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg border border-card-border p-6">
        <h3 className="text-lg font-semibold text-navy mb-4">Settings</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-navy">Require Approval</p>
            <p className="text-sm text-foreground-muted">
              When enabled, new prayer posts must be approved before appearing on the wall.
            </p>
          </div>
          <button
            onClick={handleToggleApproval}
            disabled={savingSettings}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              requiresApproval ? 'bg-gold' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              requiresApproval ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Display Mode URL */}
      <div className="bg-white rounded-lg border border-card-border p-6">
        <h3 className="text-lg font-semibold text-navy mb-2">Display Mode</h3>
        <p className="text-sm text-foreground-muted mb-3">
          Use this URL to project the prayer wall on a screen during services.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-50 px-3 py-2 rounded border text-sm text-navy truncate">
            {displayUrl}
          </code>
          <button
            onClick={copyDisplayUrl}
            className="px-3 py-2 rounded border border-card-border hover:bg-gray-50 transition-colors"
            title="Copy URL"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <a
            href={displayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded border border-card-border hover:bg-gray-50 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Post List */}
      <div className="bg-white rounded-lg border border-card-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-navy">Posts</h3>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-card-border rounded px-3 py-1.5 text-sm"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="answered">Answered</option>
          </select>
        </div>

        {loading ? (
          <p className="text-foreground-muted text-center py-8">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="text-foreground-muted text-center py-8">No prayer wall posts yet.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className={`border rounded-lg p-4 ${
                  post.status === 'pending'
                    ? 'border-yellow-300 bg-yellow-50'
                    : !post.is_visible
                    ? 'border-red-200 bg-red-50 opacity-60'
                    : post.status === 'answered'
                    ? 'border-gold/30 bg-gold/5'
                    : 'border-card-border'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-navy">
                        {post.display_name}
                        {post.is_anonymous && (
                          <span className="text-xs text-foreground-muted ml-1">(anonymous)</span>
                        )}
                      </span>
                      {post.status === 'pending' && (
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                      {post.status === 'answered' && (
                        <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">
                          Answered
                        </span>
                      )}
                      {!post.is_visible && (
                        <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground-secondary whitespace-pre-line">
                      {post.prayer_text}
                    </p>
                    {post.testimony_text && (
                      <p className="text-sm text-gold mt-1 italic">
                        &ldquo;{post.testimony_text}&rdquo;
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-foreground-muted">
                      <span>{formatDate(post.created_at)}</span>
                      <span>{post.pray_count} praying</span>
                      {post.dimension && <span className="uppercase">{post.dimension}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {post.status === 'pending' && (
                      <button
                        onClick={() => handleAction(post.id, 'approve')}
                        disabled={actioningId === post.id}
                        className="px-3 py-1.5 text-xs rounded border border-green-300 text-green-700 hover:bg-green-50 transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {post.is_visible ? (
                      <button
                        onClick={() => handleAction(post.id, 'hide')}
                        disabled={actioningId === post.id}
                        className="p-1.5 rounded border border-card-border hover:bg-gray-50 transition-colors"
                        title="Hide post"
                      >
                        <EyeOff className="w-4 h-4 text-foreground-muted" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(post.id, 'unhide')}
                        disabled={actioningId === post.id}
                        className="p-1.5 rounded border border-card-border hover:bg-gray-50 transition-colors"
                        title="Unhide post"
                      >
                        <Eye className="w-4 h-4 text-foreground-muted" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
