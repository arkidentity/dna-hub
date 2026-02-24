'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Calendar,
  FileText,
  Ban,
  Play,
  Pause,
  Eye,
  Mail,
  Download,
  Square,
  CheckSquare,
  X,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Phone,
  PlusCircle,
} from 'lucide-react';

interface ChurchSummary {
  id: string;
  name: string;
  status: string;
  current_phase: number;
  created_at: string;
  updated_at: string;
  leader_name: string;
  leader_email: string;
  leader_id: string;
  completed_milestones: number;
  total_milestones: number;
  has_overdue: boolean;
  next_call?: {
    call_type: string;
    scheduled_at: string;
  };
  last_activity?: string;
}

interface AdminStats {
  total: number;
  byStatus: Record<string, number>;
  activeThisWeek: number;
}

interface AnalyticsData {
  summary: {
    total: number;
    active: number;
    completed: number;
    inPipeline: number;
    atRisk: number;
    recentlyActive: number;
    newThisMonth: number;
  };
  pipeline: Array<{ key: string; label: string; count: number }>;
  conversions: Array<{ from: string; to: string; rate: number; count: number }>;
  atRiskChurches: Array<{
    id: string;
    name: string;
    status: string;
    leader_name: string;
    leader_email: string;
    days_inactive: number;
  }>;
  phaseDistribution: Record<number, number>;
  avgTenure: Record<string, number>;
}

interface ChurchesTabProps {
  churches: ChurchSummary[];
  stats: AdminStats | null;
  onRefresh: () => Promise<void>;
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  prospect: { label: 'Prospect', color: 'bg-slate-100 text-slate-600', icon: Eye },
  demo: { label: 'Demo', color: 'bg-violet-100 text-violet-700', icon: Play },
  pending_assessment: { label: 'Pending Assessment', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  awaiting_discovery: { label: 'Awaiting Discovery', color: 'bg-blue-100 text-blue-800', icon: Phone },
  proposal_sent: { label: 'Proposal Sent', color: 'bg-purple-100 text-purple-800', icon: FileText },
  awaiting_agreement: { label: 'Awaiting Agreement', color: 'bg-indigo-100 text-indigo-800', icon: FileText },
  awaiting_strategy: { label: 'Awaiting Strategy', color: 'bg-teal-100 text-teal-800', icon: Calendar },
  active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: Play },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  paused: { label: 'Paused', color: 'bg-orange-100 text-orange-800', icon: Pause },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-800', icon: Ban },
};

const TIER_OPTIONS = [
  { value: 'foundation', label: 'Foundation Tier' },
  { value: 'growth', label: 'Growth Tier' },
  { value: 'multiplier', label: 'Multiplier Tier' },
  { value: 'custom', label: 'Custom Package' },
];

export default function ChurchesTab({ churches, stats, onRefresh }: ChurchesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated' | 'phase'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Tier selection modal state
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [tierModalChurch, setTierModalChurch] = useState<ChurchSummary | null>(null);
  const [selectedTier, setSelectedTier] = useState('growth');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkSendEmail, setBulkSendEmail] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Add church modal state
  const [showAddChurch, setShowAddChurch] = useState(false);
  const [addChurchForm, setAddChurchForm] = useState({
    churchName: '',
    city: '',
    state: '',
    leaderName: '',
    leaderEmail: '',
    leaderPhone: '',
    leaderRole: '',
    initialStatus: 'prospect',
  });
  const [addChurchLoading, setAddChurchLoading] = useState(false);
  const [addChurchError, setAddChurchError] = useState<string | null>(null);

  useEffect(() => {
    if (showAnalytics && !analytics) {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAnalytics]);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch('/api/admin/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleAddChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddChurchLoading(true);
    setAddChurchError(null);

    try {
      const response = await fetch('/api/admin/churches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addChurchForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create church');
      }

      setShowAddChurch(false);
      setAddChurchForm({
        churchName: '', city: '', state: '', leaderName: '',
        leaderEmail: '', leaderPhone: '', leaderRole: '', initialStatus: 'prospect',
      });
      await onRefresh();
    } catch (err) {
      setAddChurchError(err instanceof Error ? err.message : 'Failed to create church');
    } finally {
      setAddChurchLoading(false);
    }
  };

  const handleStatusChange = async (churchId: string, newStatus: string, tierName?: string) => {
    try {
      const response = await fetch('/api/admin/churches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId, status: newStatus, tierName }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      await onRefresh();
    } catch (error) {
      console.error('Status update error:', error);
      alert('Failed to update church status');
    }
  };

  const openTierModal = (church: ChurchSummary) => {
    setTierModalChurch(church);
    setSelectedTier('growth');
    setTierModalOpen(true);
  };

  const handleTierConfirm = async () => {
    if (!tierModalChurch) return;

    const tierLabel = TIER_OPTIONS.find(t => t.value === selectedTier)?.label || 'DNA Implementation';
    await handleStatusChange(tierModalChurch.id, 'awaiting_strategy', tierLabel);

    setTierModalOpen(false);
    setTierModalChurch(null);
  };

  const sendLoginLink = async (email: string, name: string) => {
    try {
      const response = await fetch('/api/admin/send-login-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      if (response.ok) {
        alert(`Login link sent to ${name} (${email})`);
      } else {
        throw new Error('Failed to send login link');
      }
    } catch (error) {
      console.error('Login link error:', error);
      alert('Failed to send login link');
    }
  };

  // Bulk selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredChurches.map(c => c.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleBulkAction = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;

    setBulkProcessing(true);
    try {
      const response = await fetch('/api/admin/churches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulk: true,
          churchIds: Array.from(selectedIds),
          action: 'status_change',
          status: bulkStatus,
          sendEmail: bulkSendEmail,
        }),
      });

      if (!response.ok) {
        throw new Error('Bulk operation failed');
      }

      const data = await response.json();
      alert(`Bulk update complete: ${data.results.success} succeeded, ${data.results.failed} failed`);

      // Refresh data and clear selection
      await onRefresh();
      setSelectedIds(new Set());
      setBulkActionOpen(false);
      setBulkStatus('');
      setBulkSendEmail(false);
    } catch (error) {
      console.error('Bulk action error:', error);
      alert('Failed to perform bulk action');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkSendLogin = async () => {
    if (selectedIds.size === 0) return;

    const selectedChurches = churches.filter(c => selectedIds.has(c.id));
    const confirmMsg = `Send login links to ${selectedChurches.length} church leaders?`;
    if (!confirm(confirmMsg)) return;

    setBulkProcessing(true);
    let sent = 0;
    let failed = 0;

    for (const church of selectedChurches) {
      try {
        const response = await fetch('/api/admin/send-login-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: church.leader_email, name: church.leader_name }),
        });

        if (response.ok) {
          sent++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    alert(`Login links sent: ${sent} succeeded, ${failed} failed`);
    setBulkProcessing(false);
    setSelectedIds(new Set());
  };

  const filteredChurches = churches
    .filter(church => {
      const matchesSearch = church.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        church.leader_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        church.leader_email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || church.status === statusFilter;
      const matchesPhase = phaseFilter === 'all' || church.current_phase === parseInt(phaseFilter);
      return matchesSearch && matchesStatus && matchesPhase;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'updated':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case 'phase':
          comparison = a.current_phase - b.current_phase;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPhaseLabel = (phase: number) => {
    if (phase === 0) return 'Onboarding';
    return `Phase ${phase}`;
  };

  return (
    <>
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{stats.total}</p>
                <p className="text-xs text-foreground-muted">Total Churches</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{stats.byStatus.active || 0}</p>
                <p className="text-xs text-foreground-muted">Active</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">
                  {(stats.byStatus.pending_assessment || 0) +
                    (stats.byStatus.awaiting_discovery || 0) +
                    (stats.byStatus.proposal_sent || 0) +
                    (stats.byStatus.awaiting_agreement || 0) +
                    (stats.byStatus.awaiting_strategy || 0)}
                </p>
                <p className="text-xs text-foreground-muted">In Pipeline</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{stats.activeThisWeek}</p>
                <p className="text-xs text-foreground-muted">Active This Week</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Toggle */}
      <button
        onClick={() => setShowAnalytics(!showAnalytics)}
        className="flex items-center gap-2 mb-6 text-teal hover:text-teal-light transition-colors"
      >
        <BarChart3 className="w-5 h-5" />
        <span className="font-medium">Funnel Analytics</span>
        {showAnalytics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="mb-8 space-y-6">
          {analyticsLoading ? (
            <div className="card flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
          ) : analytics ? (
            <>
              {/* Pipeline Funnel */}
              <div className="card">
                <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gold" />
                  Pipeline Overview
                </h3>
                <div className="flex items-end justify-between gap-2 h-32">
                  {analytics.pipeline.map((stage, index) => {
                    const maxCount = Math.max(...analytics.pipeline.map(s => s.count));
                    const height = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
                    const colors = [
                      'bg-yellow-400',
                      'bg-blue-400',
                      'bg-purple-400',
                      'bg-indigo-400',
                      'bg-teal-400',
                      'bg-green-400',
                      'bg-gray-400',
                    ];
                    return (
                      <div key={stage.key} className="flex-1 flex flex-col items-center">
                        <span className="text-sm font-bold text-navy mb-1">{stage.count}</span>
                        <div
                          className={`w-full ${colors[index]} rounded-t transition-all`}
                          style={{ height: `${Math.max(height, 5)}%` }}
                        />
                        <span className="text-xs text-foreground-muted mt-2 text-center truncate w-full">
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Conversion Rates */}
              <div className="card">
                <h3 className="font-semibold text-navy mb-4">Conversion Rates</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {analytics.conversions.slice(0, 6).map((conv, index) => (
                    <div key={index} className="text-center p-3 bg-background-secondary rounded-lg">
                      <p className="text-2xl font-bold text-gold">{conv.rate}%</p>
                      <p className="text-xs text-foreground-muted mt-1">
                        {conv.from} → {conv.to}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* At Risk Churches */}
              {analytics.atRiskChurches.length > 0 && (
                <div className="card border-l-4 border-error">
                  <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-error" />
                    Churches at Risk ({analytics.atRiskChurches.length})
                    <span className="text-xs text-foreground-muted font-normal">No activity in 14+ days</span>
                  </h3>
                  <div className="space-y-2">
                    {analytics.atRiskChurches.slice(0, 5).map(church => (
                      <div
                        key={church.id}
                        className="flex items-center justify-between p-3 bg-error/5 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-navy">{church.name}</p>
                          <p className="text-xs text-foreground-muted">
                            {church.leader_name} • {STATUS_LABELS[church.status]?.label || church.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-error font-medium">
                            {church.days_inactive} days inactive
                          </span>
                          <Link
                            href={`/admin/church/${church.id}`}
                            className="text-xs px-3 py-1 bg-navy text-white rounded hover:bg-navy/90"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                    {analytics.atRiskChurches.length > 5 && (
                      <p className="text-sm text-foreground-muted text-center">
                        +{analytics.atRiskChurches.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="card text-center">
                  <p className="text-3xl font-bold text-success">{analytics.summary.newThisMonth}</p>
                  <p className="text-xs text-foreground-muted">New This Month</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-bold text-teal">{analytics.summary.recentlyActive}</p>
                  <p className="text-xs text-foreground-muted">Active Last 7 Days</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-bold text-gold">{analytics.summary.completed}</p>
                  <p className="text-xs text-foreground-muted">Completed</p>
                </div>
              </div>
            </>
          ) : (
            <div className="card text-center py-8 text-foreground-muted">
              Failed to load analytics
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search churches or leaders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-foreground-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-w-[140px]"
            >
              <option value="all">All Statuses</option>
              <option value="pending_assessment">Pending Review</option>
              <option value="awaiting_discovery">Awaiting Discovery</option>
              <option value="proposal_sent">Proposal Sent</option>
              <option value="awaiting_agreement">Awaiting Agreement</option>
              <option value="awaiting_strategy">Awaiting Strategy</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="declined">Declined</option>
            </select>
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className="min-w-[120px]"
            >
              <option value="all">All Phases</option>
              <option value="0">Onboarding</option>
              <option value="1">Phase 1</option>
              <option value="2">Phase 2</option>
              <option value="3">Phase 3</option>
              <option value="4">Phase 4</option>
              <option value="5">Phase 5</option>
            </select>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-') as ['name' | 'created' | 'updated' | 'phase', 'asc' | 'desc'];
                setSortBy(field);
                setSortOrder(order);
              }}
              className="min-w-[140px]"
            >
              <option value="created-desc">Newest First</option>
              <option value="created-asc">Oldest First</option>
              <option value="updated-desc">Recently Updated</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="phase-asc">Phase (Low-High)</option>
              <option value="phase-desc">Phase (High-Low)</option>
            </select>
          </div>
          <button
            onClick={() => { setAddChurchForm({ churchName: '', city: '', state: '', leaderName: '', leaderEmail: '', leaderPhone: '', leaderRole: '', initialStatus: 'prospect' }); setAddChurchError(null); setShowAddChurch(true); }}
            className="btn-primary inline-flex items-center gap-2 whitespace-nowrap self-start"
          >
            <PlusCircle className="w-4 h-4" />
            Add Church
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="card mb-6 bg-navy text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium">{selectedIds.size} selected</span>
              <button
                onClick={deselectAll}
                className="text-sm text-gray-300 hover:text-white flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkSendLogin}
                disabled={bulkProcessing}
                className="flex items-center gap-2 px-3 py-1.5 bg-teal text-white rounded hover:bg-teal-light transition-colors text-sm"
              >
                <Mail className="w-4 h-4" />
                Send Login Links
              </button>
              <button
                onClick={() => setBulkActionOpen(true)}
                disabled={bulkProcessing}
                className="flex items-center gap-2 px-3 py-1.5 bg-gold text-white rounded hover:bg-gold/90 transition-colors text-sm"
              >
                Change Status
              </button>
              <a
                href={`/api/admin/export?ids=${Array.from(selectedIds).join(',')}`}
                download
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white rounded hover:bg-white/20 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Export Selected
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Select All Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => selectedIds.size === filteredChurches.length ? deselectAll() : selectAll()}
            className="flex items-center gap-2 text-sm text-foreground-muted hover:text-navy transition-colors"
          >
            {selectedIds.size === filteredChurches.length && filteredChurches.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-gold" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {selectedIds.size === filteredChurches.length && filteredChurches.length > 0
              ? 'Deselect All'
              : 'Select All'}
          </button>
          <span className="text-sm text-foreground-muted">
            {filteredChurches.length} churches
          </span>
        </div>
      </div>

      {/* Churches List */}
      <div className="space-y-3">
        {filteredChurches.length === 0 ? (
          <div className="card text-center py-12">
            <Building2 className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
            <p className="text-foreground-muted">No churches found</p>
          </div>
        ) : (
          filteredChurches.map(church => {
            const statusInfo = STATUS_LABELS[church.status] || STATUS_LABELS.pending_assessment;
            const progressPercent = church.total_milestones > 0
              ? Math.round((church.completed_milestones / church.total_milestones) * 100)
              : 0;

            return (
              <div key={church.id} className={`card hover:shadow-md transition-shadow ${selectedIds.has(church.id) ? 'ring-2 ring-gold' : ''}`}>
                <div className="flex items-start gap-4">
                  {/* Selection Checkbox */}
                  <button
                    onClick={() => toggleSelect(church.id)}
                    className="flex-shrink-0 mt-1"
                  >
                    {selectedIds.has(church.id) ? (
                      <CheckSquare className="w-5 h-5 text-gold" />
                    ) : (
                      <Square className="w-5 h-5 text-foreground-muted hover:text-navy" />
                    )}
                  </button>

                  {/* Church Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-navy text-lg truncate">{church.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      {church.has_overdue && (
                        <span className="text-xs px-2 py-1 rounded-full bg-error/10 text-error font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Overdue
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-foreground-muted mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {church.leader_name}
                      </span>
                      <a
                        href={`mailto:${church.leader_email}`}
                        className="flex items-center gap-1 text-teal hover:text-teal-light"
                      >
                        <Mail className="w-4 h-4" />
                        {church.leader_email}
                      </a>
                    </div>

                    {/* Progress bar for active churches */}
                    {church.status === 'active' && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-foreground-muted mb-1">
                          <span>{getPhaseLabel(church.current_phase)}</span>
                          <span>{progressPercent}% complete</span>
                        </div>
                        <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gold transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Next call info */}
                    {church.next_call && (
                      <p className="text-xs text-teal flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Next: {church.next_call.call_type} call on {formatDate(church.next_call.scheduled_at)}
                      </p>
                    )}

                    <p className="text-xs text-foreground-muted mt-2">
                      Added {formatDate(church.created_at)}
                      {church.last_activity && ` • Last activity ${formatDate(church.last_activity)}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2">
                    {/* View Dashboard Button */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/church/${church.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                      <button
                        onClick={() => sendLoginLink(church.leader_email, church.leader_name)}
                        className="flex items-center gap-2 px-3 py-2 border border-teal text-teal rounded-lg hover:bg-teal/10 transition-colors text-sm"
                        title="Send login link to leader"
                      >
                        <Mail className="w-4 h-4" />
                        Send Login
                      </button>
                    </div>

                    {/* Status Actions */}
                    <div className="flex items-center gap-2">
                      {church.status === 'prospect' && (
                        <button
                          onClick={() => handleStatusChange(church.id, 'demo')}
                          className="text-xs px-3 py-1.5 bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors"
                        >
                          Mark Demo Ready
                        </button>
                      )}

                      {church.status === 'demo' && (
                        <button
                          onClick={() => handleStatusChange(church.id, 'pending_assessment')}
                          className="text-xs px-3 py-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                        >
                          Send Assessment
                        </button>
                      )}

                      {church.status === 'pending_assessment' && (
                        <button
                          onClick={() => handleStatusChange(church.id, 'awaiting_discovery')}
                          className="text-xs px-3 py-1.5 bg-teal text-white rounded hover:bg-teal-light transition-colors"
                        >
                          Approve for Discovery
                        </button>
                      )}

                      {church.status === 'awaiting_discovery' && (
                        <button
                          onClick={() => handleStatusChange(church.id, 'proposal_sent')}
                          className="text-xs px-3 py-1.5 bg-gold text-white rounded hover:bg-gold-dark transition-colors"
                        >
                          Mark Proposal Sent
                        </button>
                      )}

                      {church.status === 'proposal_sent' && (
                        <button
                          onClick={() => handleStatusChange(church.id, 'awaiting_agreement')}
                          className="text-xs px-3 py-1.5 bg-gold text-white rounded hover:bg-gold-dark transition-colors"
                        >
                          Mark Awaiting Agreement
                        </button>
                      )}

                      {church.status === 'awaiting_agreement' && (
                        <button
                          onClick={() => openTierModal(church)}
                          className="text-xs px-3 py-1.5 bg-gold text-white rounded hover:bg-gold-dark transition-colors"
                        >
                          Mark Agreement Signed
                        </button>
                      )}

                      {church.status === 'awaiting_strategy' && (
                        <button
                          onClick={() => handleStatusChange(church.id, 'active')}
                          className="text-xs px-3 py-1.5 bg-success text-white rounded hover:bg-success/90 transition-colors"
                        >
                          Activate Dashboard
                        </button>
                      )}

                      {church.status === 'active' && (
                        <button
                          onClick={() => handleStatusChange(church.id, 'paused')}
                          className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                        >
                          Pause
                        </button>
                      )}

                      {church.status === 'paused' && (
                        <button
                          onClick={() => handleStatusChange(church.id, 'active')}
                          className="text-xs px-3 py-1.5 bg-success text-white rounded hover:bg-success/90 transition-colors"
                        >
                          Resume
                        </button>
                      )}

                      {!['active', 'completed', 'declined'].includes(church.status) && (
                        <button
                          onClick={() => {
                            if (confirm('Mark this church as declined?')) {
                              handleStatusChange(church.id, 'declined');
                            }
                          }}
                          className="text-xs px-3 py-1.5 text-error hover:bg-error/10 rounded transition-colors"
                        >
                          Decline
                        </button>
                      )}

                      {/* Override dropdown — move to any status freely */}
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) handleStatusChange(church.id, e.target.value);
                        }}
                        className="text-xs py-1.5 pl-2 pr-6 border border-border rounded text-foreground-muted bg-white hover:border-foreground-muted transition-colors cursor-pointer"
                        title="Move to any status"
                      >
                        <option value="" disabled>Move to…</option>
                        {Object.entries(STATUS_LABELS)
                          .filter(([key]) => key !== church.status)
                          .map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tier Selection Modal */}
      {tierModalOpen && tierModalChurch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-navy mb-2">
              Agreement Signed: {tierModalChurch.name}
            </h3>
            <p className="text-foreground-muted text-sm mb-4">
              Select the tier this church has agreed to. An email will be sent to {tierModalChurch.leader_name} confirming their agreement and prompting them to book a strategy call.
            </p>

            <div className="space-y-2 mb-6">
              {TIER_OPTIONS.map(tier => (
                <label
                  key={tier.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTier === tier.value
                      ? 'border-gold bg-gold/5'
                      : 'border-border hover:border-foreground-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="tier"
                    value={tier.value}
                    checked={selectedTier === tier.value}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="accent-gold"
                  />
                  <span className="font-medium text-navy">{tier.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setTierModalOpen(false);
                  setTierModalChurch(null);
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-background-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTierConfirm}
                className="flex-1 px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors"
              >
                Confirm Agreement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Status Change Modal */}
      {bulkActionOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-navy mb-2">
              Bulk Status Change
            </h3>
            <p className="text-foreground-muted text-sm mb-4">
              Change status for {selectedIds.size} selected churches.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-navy mb-2">New Status</label>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="w-full"
              >
                <option value="">Select status...</option>
                <option value="pending_assessment">Pending Review</option>
                <option value="awaiting_discovery">Awaiting Discovery</option>
                <option value="proposal_sent">Proposal Sent</option>
                <option value="awaiting_agreement">Awaiting Agreement</option>
                <option value="awaiting_strategy">Awaiting Strategy</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="declined">Declined</option>
              </select>
            </div>

            <label className="flex items-center gap-2 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={bulkSendEmail}
                onChange={(e) => setBulkSendEmail(e.target.checked)}
                className="accent-gold"
              />
              <span className="text-sm text-foreground-muted">
                Send notification emails (for proposal_sent or active status)
              </span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setBulkActionOpen(false);
                  setBulkStatus('');
                  setBulkSendEmail(false);
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-background-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAction}
                disabled={!bulkStatus || bulkProcessing}
                className="flex-1 px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {bulkProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                Apply to {selectedIds.size} Churches
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Church Modal */}
      {showAddChurch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-navy">Add Church</h3>
              <button
                onClick={() => setShowAddChurch(false)}
                className="p-1 text-foreground-muted hover:text-navy"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddChurch}>
              <div className="space-y-5">
                {/* Church Info */}
                <div>
                  <h4 className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">Church Info</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1">Church Name *</label>
                      <input
                        type="text"
                        value={addChurchForm.churchName}
                        onChange={(e) => setAddChurchForm({ ...addChurchForm, churchName: e.target.value })}
                        required
                        placeholder="Grace Community Church"
                        className="w-full"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1">City</label>
                        <input
                          type="text"
                          value={addChurchForm.city}
                          onChange={(e) => setAddChurchForm({ ...addChurchForm, city: e.target.value })}
                          placeholder="Nashville"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1">State</label>
                        <input
                          type="text"
                          value={addChurchForm.state}
                          onChange={(e) => setAddChurchForm({ ...addChurchForm, state: e.target.value })}
                          placeholder="TN"
                          maxLength={2}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1">Initial Status</label>
                      <select
                        value={addChurchForm.initialStatus}
                        onChange={(e) => setAddChurchForm({ ...addChurchForm, initialStatus: e.target.value })}
                        className="w-full"
                      >
                        <option value="prospect">Prospect (default — no email sent)</option>
                        <option value="demo">Demo Ready</option>
                        <option value="pending_assessment">Pending Assessment</option>
                        <option value="active">Active (full dashboard access)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <hr className="border-border" />

                {/* Church Leader */}
                <div>
                  <h4 className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">Church Leader</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1">Name *</label>
                      <input
                        type="text"
                        value={addChurchForm.leaderName}
                        onChange={(e) => setAddChurchForm({ ...addChurchForm, leaderName: e.target.value })}
                        required
                        placeholder="Pastor John Smith"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1">Email *</label>
                      <input
                        type="email"
                        value={addChurchForm.leaderEmail}
                        onChange={(e) => setAddChurchForm({ ...addChurchForm, leaderEmail: e.target.value })}
                        required
                        placeholder="john@gracechurch.com"
                        className="w-full"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1">Phone</label>
                        <input
                          type="tel"
                          value={addChurchForm.leaderPhone}
                          onChange={(e) => setAddChurchForm({ ...addChurchForm, leaderPhone: e.target.value })}
                          placeholder="(555) 123-4567"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1">Role / Title</label>
                        <input
                          type="text"
                          value={addChurchForm.leaderRole}
                          onChange={(e) => setAddChurchForm({ ...addChurchForm, leaderRole: e.target.value })}
                          placeholder="Senior Pastor"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {addChurchError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {addChurchError}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddChurch(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-background-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addChurchLoading}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {addChurchLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        Add Church
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
