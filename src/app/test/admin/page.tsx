'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  FileText,
  Phone,
  Ban,
  Play,
  Pause,
  Eye,
  Mail,
  ArrowLeft,
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

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending_assessment: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
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

// Mock data
const mockChurches: ChurchSummary[] = [
  {
    id: '1',
    name: 'Grace Community Church',
    status: 'active',
    current_phase: 2,
    created_at: '2024-01-15',
    updated_at: '2024-03-01',
    leader_name: 'Pastor John Smith',
    leader_email: 'john@gracechurch.org',
    leader_id: 'l1',
    completed_milestones: 9,
    total_milestones: 20,
    has_overdue: true,
    last_activity: '2024-03-01',
  },
  {
    id: '2',
    name: 'New Hope Fellowship',
    status: 'active',
    current_phase: 3,
    created_at: '2023-11-10',
    updated_at: '2024-02-28',
    leader_name: 'Pastor Sarah Johnson',
    leader_email: 'sarah@newhope.org',
    leader_id: 'l2',
    completed_milestones: 14,
    total_milestones: 20,
    has_overdue: false,
    last_activity: '2024-02-28',
    next_call: {
      call_type: 'strategy',
      scheduled_at: '2024-03-15',
    },
  },
  {
    id: '3',
    name: 'River of Life Church',
    status: 'awaiting_strategy',
    current_phase: 0,
    created_at: '2024-02-20',
    updated_at: '2024-02-25',
    leader_name: 'Pastor Mike Davis',
    leader_email: 'mike@riveroflife.org',
    leader_id: 'l3',
    completed_milestones: 0,
    total_milestones: 20,
    has_overdue: false,
    last_activity: '2024-02-25',
  },
  {
    id: '4',
    name: 'Cornerstone Baptist',
    status: 'awaiting_agreement',
    current_phase: 0,
    created_at: '2024-02-15',
    updated_at: '2024-02-20',
    leader_name: 'Pastor David Lee',
    leader_email: 'david@cornerstonebaptist.org',
    leader_id: 'l4',
    completed_milestones: 0,
    total_milestones: 20,
    has_overdue: false,
    last_activity: '2024-02-20',
  },
  {
    id: '5',
    name: 'Faith Community',
    status: 'pending_assessment',
    current_phase: 0,
    created_at: '2024-03-01',
    updated_at: '2024-03-01',
    leader_name: 'Pastor Emily Chen',
    leader_email: 'emily@faithcommunity.org',
    leader_id: 'l5',
    completed_milestones: 0,
    total_milestones: 20,
    has_overdue: false,
  },
  {
    id: '6',
    name: 'First Presbyterian',
    status: 'awaiting_discovery',
    current_phase: 0,
    created_at: '2024-02-28',
    updated_at: '2024-02-28',
    leader_name: 'Pastor Robert Wilson',
    leader_email: 'robert@firstpres.org',
    leader_id: 'l6',
    completed_milestones: 0,
    total_milestones: 20,
    has_overdue: false,
  },
  {
    id: '7',
    name: 'Mountain View Church',
    status: 'proposal_sent',
    current_phase: 0,
    created_at: '2024-02-10',
    updated_at: '2024-02-18',
    leader_name: 'Pastor Lisa Brown',
    leader_email: 'lisa@mountainview.org',
    leader_id: 'l7',
    completed_milestones: 0,
    total_milestones: 20,
    has_overdue: false,
  },
  {
    id: '8',
    name: 'Living Word Church',
    status: 'completed',
    current_phase: 5,
    created_at: '2023-06-01',
    updated_at: '2024-01-15',
    leader_name: 'Pastor James Miller',
    leader_email: 'james@livingword.org',
    leader_id: 'l8',
    completed_milestones: 20,
    total_milestones: 20,
    has_overdue: false,
    last_activity: '2024-01-15',
  },
  {
    id: '9',
    name: 'Harvest Church',
    status: 'paused',
    current_phase: 2,
    created_at: '2023-09-15',
    updated_at: '2024-01-20',
    leader_name: 'Pastor Tom Anderson',
    leader_email: 'tom@harvestchurch.org',
    leader_id: 'l9',
    completed_milestones: 8,
    total_milestones: 20,
    has_overdue: false,
    last_activity: '2024-01-20',
  },
];

const mockStats: AdminStats = {
  total: mockChurches.length,
  byStatus: {
    pending_assessment: 1,
    awaiting_discovery: 1,
    proposal_sent: 1,
    awaiting_agreement: 1,
    awaiting_strategy: 1,
    active: 2,
    completed: 1,
    paused: 1,
  },
  activeThisWeek: 3,
};

export default function TestAdminPage() {
  const [churches, setChurches] = useState<ChurchSummary[]>(mockChurches);
  const [stats] = useState<AdminStats>(mockStats);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Tier selection modal state
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [tierModalChurch, setTierModalChurch] = useState<ChurchSummary | null>(null);
  const [selectedTier, setSelectedTier] = useState('growth');

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  const handleStatusChange = async (churchId: string, newStatus: string) => {
    setChurches(prev =>
      prev.map(c =>
        c.id === churchId ? { ...c, status: newStatus } : c
      )
    );
    alert(`Status changed to: ${STATUS_LABELS[newStatus]?.label || newStatus} (test mode - not persisted)`);
  };

  const openTierModal = (church: ChurchSummary) => {
    setTierModalChurch(church);
    setSelectedTier('growth');
    setTierModalOpen(true);
  };

  const handleTierConfirm = async () => {
    if (!tierModalChurch) return;

    const tierLabel = TIER_OPTIONS.find(t => t.value === selectedTier)?.label || 'DNA Implementation';
    handleStatusChange(tierModalChurch.id, 'awaiting_strategy');
    alert(`Agreement signed with ${tierLabel} (test mode - not persisted)`);

    setTierModalOpen(false);
    setTierModalChurch(null);
  };

  const sendMagicLink = async (email: string, name: string) => {
    alert(`Magic link would be sent to ${name} (${email}) (test mode)`);
  };

  const filteredChurches = churches.filter(church => {
    const matchesSearch = church.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      church.leader_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      church.leader_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || church.status === statusFilter;
    return matchesSearch && matchesStatus;
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/test" className="text-gray-300 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="text-gold font-medium text-sm tracking-wide">DNA ADMIN (TEST)</p>
              <p className="font-semibold">Church Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-300 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              className="text-gray-300 hover:text-white transition-colors"
              title="Logout (disabled in test mode)"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Test Mode Banner */}
        <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-navy">
            <strong>Test Mode:</strong> This is a preview with mock data. Changes won&apos;t be saved to the database.
          </p>
        </div>

        {/* Stats Overview */}
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
                className="min-w-[160px]"
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
            </div>
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
              const StatusIcon = statusInfo.icon;
              const progressPercent = church.total_milestones > 0
                ? Math.round((church.completed_milestones / church.total_milestones) * 100)
                : 0;

              return (
                <div key={church.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
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
                          href="/test/dashboard"
                          className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                        <button
                          onClick={() => sendMagicLink(church.leader_email, church.leader_name)}
                          className="flex items-center gap-2 px-3 py-2 border border-teal text-teal rounded-lg hover:bg-teal/10 transition-colors text-sm"
                          title="Send login link to leader"
                        >
                          <Mail className="w-4 h-4" />
                          Send Login
                        </button>
                      </div>

                      {/* Status Actions */}
                      <div className="flex items-center gap-2">
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
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

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
    </div>
  );
}
