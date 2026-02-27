'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  Mail,
  Heart,
  RefreshCw,
  X,
  Pencil,
  Search,
  LogIn,
  Bell,
} from 'lucide-react';
import { DNALeader, DNAGroup, DNAGroupPhase } from '@/lib/types';

interface HealthSummary {
  leader_id: string;
  status: 'healthy' | 'caution' | 'needs_attention';
  flag_areas: string[];
  due_date: string;
  completed_at?: string;
}

interface GroupWithCount extends DNAGroup {
  disciple_count?: number;
}

interface DNALeaderWithLogin extends Omit<DNALeader, never> {
  last_login_at?: string | null;
  flow_assessment_complete?: boolean;
  manual_complete?: boolean;
  training_stage?: string | null;
}

const TRAINING_STAGE_LABELS: Record<string, { label: string; color: string }> = {
  onboarding:   { label: 'Phase 0 — Onboarding',    color: 'bg-gray-100 text-gray-600' },
  training:     { label: 'Phase 1 — Training',       color: 'bg-blue-100 text-blue-700' },
  launching:    { label: 'Phase 2 — Launch Guide',   color: 'bg-purple-100 text-purple-700' },
  growing:      { label: 'Phase 3 — Leading Group',  color: 'bg-teal/15 text-teal' },
  multiplying:  { label: 'Phase 4 — Multiplying',    color: 'bg-gold/20 text-gold-dark' },
};

interface GroupsTabProps {
  churchId: string;
  churchName: string;
  isAdmin: boolean;
}

const PHASE_LABELS: Record<DNAGroupPhase, { label: string; color: string }> = {
  'pre-launch': { label: 'Pre-Launch', color: 'bg-gray-100 text-gray-700' },
  'invitation': { label: 'Invitation', color: 'bg-blue-100 text-blue-700' },
  'foundation': { label: 'Foundation', color: 'bg-purple-100 text-purple-700' },
  'growth': { label: 'Growth', color: 'bg-green-100 text-green-700' },
  'multiplication': { label: 'Multiplication', color: 'bg-gold/20 text-gold-dark' },
};

const HEALTH_STATUS: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  healthy: { label: 'Healthy', color: 'text-green-600', icon: CheckCircle },
  caution: { label: 'Caution', color: 'text-yellow-600', icon: AlertCircle },
  needs_attention: { label: 'Needs Attention', color: 'text-red-600', icon: AlertTriangle },
};

export default function GroupsTab({ churchId, churchName, isAdmin }: GroupsTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaders, setLeaders] = useState<DNALeaderWithLogin[]>([]);
  const [groups, setGroups] = useState<GroupWithCount[]>([]);
  const [healthSummaries, setHealthSummaries] = useState<HealthSummary[]>([]);
  const [stats, setStats] = useState({
    totalLeaders: 0,
    activeLeaders: 0,
    pendingInvites: 0,
    totalGroups: 0,
    totalDisciples: 0,
    healthyLeaders: 0,
    needsAttentionLeaders: 0,
  });

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Edit modal state
  const [editingLeader, setEditingLeader] = useState<DNALeaderWithLogin | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Reminder state
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [reminderStatus, setReminderStatus] = useState<{ id: string; ok: boolean } | null>(null);

  // Search / filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending'>('all');

  useEffect(() => {
    fetchData();
  }, [churchId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/churches/${churchId}/dna-groups`);
      if (!response.ok) {
        throw new Error('Failed to fetch DNA groups data');
      }

      const data = await response.json();
      setLeaders(data.leaders || []);
      setGroups(data.groups || []);
      setHealthSummaries(data.healthSummaries || []);
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching DNA groups:', err);
      setError('Failed to load DNA groups data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);

    try {
      const response = await fetch('/api/dna-leaders/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inviteForm.name,
          email: inviteForm.email,
          phone: inviteForm.phone || undefined,
          churchId: churchId,
          personalMessage: inviteForm.message || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send invitation');
      }

      setInviteSuccess(true);
      setInviteForm({ name: '', email: '', phone: '', message: '' });

      // Refresh data after a short delay
      setTimeout(() => {
        fetchData();
        setShowInviteModal(false);
        setInviteSuccess(false);
      }, 2000);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const openEditModal = (leader: DNALeaderWithLogin) => {
    setEditingLeader(leader);
    setEditForm({ name: leader.name, email: leader.email, phone: leader.phone || '' });
    setEditError(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLeader) return;
    setSaving(true);
    setEditError(null);

    try {
      const response = await fetch(
        `/api/churches/${churchId}/dna-leaders/${editingLeader.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editForm.name,
            email: editForm.email,
            phone: editForm.phone || null,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update leader');
      }

      setEditingLeader(null);
      fetchData();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update leader');
    } finally {
      setSaving(false);
    }
  };

  const handleSendReminder = async (leader: DNALeaderWithLogin) => {
    setSendingReminder(leader.id);
    setReminderStatus(null);
    try {
      const res = await fetch(
        `/api/churches/${churchId}/dna-leaders/${leader.id}/remind`,
        { method: 'POST' }
      );
      setReminderStatus({ id: leader.id, ok: res.ok });
    } catch {
      setReminderStatus({ id: leader.id, ok: false });
    } finally {
      setSendingReminder(null);
      setTimeout(() => setReminderStatus(null), 3000);
    }
  };

  const filteredLeaders = leaders.filter(leader => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      leader.name.toLowerCase().includes(q) ||
      leader.email.toLowerCase().includes(q) ||
      (leader.phone?.toLowerCase().includes(q) ?? false);

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && !!leader.activated_at) ||
      (filterStatus === 'pending' && !leader.activated_at);

    return matchesSearch && matchesStatus;
  });

  const getHealthForLeader = (leaderId: string): HealthSummary | undefined => {
    return healthSummaries.find(h => h.leader_id === leaderId);
  };

  const getGroupsForLeader = (leaderId: string): GroupWithCount[] => {
    return groups.filter(g => g.leader_id === leaderId);
  };

  const formatLastLogin = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'Never logged in';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
        <p className="text-foreground-muted mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="btn-primary inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal/10 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-teal" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">{stats.activeLeaders}</p>
              <p className="text-xs text-foreground-muted">Active Leaders</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">{stats.totalGroups}</p>
              <p className="text-xs text-foreground-muted">DNA Groups</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">{stats.totalDisciples}</p>
              <p className="text-xs text-foreground-muted">Disciples</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">{stats.pendingInvites}</p>
              <p className="text-xs text-foreground-muted">Pending Invites</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search, Filter, and Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'pending')}
          className="sm:w-36"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
        </select>
        <button
          onClick={() => setShowInviteModal(true)}
          className="btn-primary inline-flex items-center gap-2 whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          Invite Leader
        </button>
      </div>

      {/* Result count */}
      {(searchQuery || filterStatus !== 'all') && (
        <p className="text-sm text-foreground-muted">
          {filteredLeaders.length} leader{filteredLeaders.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Leaders List */}
      {leaders.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
          <h3 className="font-medium text-navy mb-2">No DNA Leaders Yet</h3>
          <p className="text-foreground-muted text-sm mb-4">
            Invite leaders to start discipleship groups at {churchName}
          </p>
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Invite Your First Leader
          </button>
        </div>
      ) : filteredLeaders.length === 0 ? (
        <div className="card text-center py-12">
          <Search className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
          <h3 className="font-medium text-navy mb-2">No Leaders Found</h3>
          <p className="text-foreground-muted text-sm">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLeaders.map((leader) => {
            const health = getHealthForLeader(leader.id);
            const leaderGroups = getGroupsForLeader(leader.id);
            const healthStatus = health ? HEALTH_STATUS[health.status] : null;
            const isPending = !leader.activated_at;

            return (
              <div key={leader.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-navy">{leader.name}</h3>
                      {isPending ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 whitespace-nowrap">
                          Pending Invite
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 whitespace-nowrap">
                          Active
                        </span>
                      )}
                      {healthStatus && (
                        <span className={`flex items-center gap-1 text-xs whitespace-nowrap ${healthStatus.color}`}>
                          <healthStatus.icon className="w-3 h-3" />
                          {healthStatus.label}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground-muted mb-2">
                      <a
                        href={`mailto:${leader.email}`}
                        className="flex items-center gap-1 text-teal hover:text-teal-light min-w-0"
                      >
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{leader.email}</span>
                      </a>
                      {leader.phone && (
                        <span className="whitespace-nowrap">{leader.phone}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-foreground-muted mb-3">
                      <LogIn className="w-3 h-3" />
                      <span className={!leader.last_login_at ? 'text-yellow-600' : ''}>
                        {formatLastLogin(leader.last_login_at)}
                      </span>
                    </div>

                    {/* Training progress indicators */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${leader.flow_assessment_complete ? 'text-green-600' : 'text-foreground-muted'}`}>
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${leader.flow_assessment_complete ? 'bg-green-500' : 'bg-gray-300'}`} />
                        Flow Assessment
                      </span>
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${leader.manual_complete ? 'text-green-600' : 'text-foreground-muted'}`}>
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${leader.manual_complete ? 'bg-green-500' : 'bg-gray-300'}`} />
                        DNA Manual
                      </span>
                      {leader.training_stage && TRAINING_STAGE_LABELS[leader.training_stage] && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${TRAINING_STAGE_LABELS[leader.training_stage].color}`}>
                          {TRAINING_STAGE_LABELS[leader.training_stage].label}
                        </span>
                      )}
                    </div>

                    {/* Health flags */}
                    {health && health.flag_areas && health.flag_areas.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {health.flag_areas.map((flag, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 rounded bg-red-50 text-red-700"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Groups */}
                    {leaderGroups.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-card-border">
                        <p className="text-xs text-foreground-muted mb-2">
                          {leaderGroups.length} Group{leaderGroups.length !== 1 ? 's' : ''}
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                          {leaderGroups.map((group) => {
                            const phaseInfo = PHASE_LABELS[group.current_phase as DNAGroupPhase] || PHASE_LABELS['pre-launch'];
                            return (
                              <div
                                key={group.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-background-secondary rounded-lg min-w-0"
                              >
                                <span className="font-medium text-sm text-navy truncate">
                                  {group.group_name}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${phaseInfo.color}`}>
                                  {phaseInfo.label}
                                </span>
                                <span className="text-xs text-foreground-muted whitespace-nowrap flex-shrink-0">
                                  {group.disciple_count || 0} disciples
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {reminderStatus?.id === leader.id && (
                      <span className={`text-xs px-2 py-1 rounded-full ${reminderStatus.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {reminderStatus.ok ? 'Sent!' : 'Failed'}
                      </span>
                    )}
                    <button
                      onClick={() => handleSendReminder(leader)}
                      disabled={sendingReminder === leader.id}
                      className="p-1.5 text-foreground-muted hover:text-teal hover:bg-background-secondary rounded-lg transition-colors"
                      title={leader.activated_at ? 'Send login reminder' : 'Resend setup email'}
                    >
                      {sendingReminder === leader.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Bell className="w-4 h-4" />
                      }
                    </button>
                    <button
                      onClick={() => openEditModal(leader)}
                      className="p-1.5 text-foreground-muted hover:text-navy hover:bg-background-secondary rounded-lg transition-colors"
                      title="Edit leader"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Leader Modal */}
      {editingLeader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-navy">Edit Leader</h3>
              <button
                onClick={() => setEditingLeader(null)}
                className="p-1 text-foreground-muted hover:text-navy"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEdit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                    className="w-full"
                  />
                  {editingLeader.activated_at && (
                    <p className="text-xs text-foreground-muted mt-1">
                      Note: changing the email will update the leader&apos;s login address.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="w-full"
                  />
                </div>

                {editError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {editError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingLeader(null)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-background-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-navy">Invite DNA Leader</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteError(null);
                  setInviteSuccess(false);
                }}
                className="p-1 text-foreground-muted hover:text-navy"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h4 className="font-medium text-navy mb-2">Invitation Sent!</h4>
                <p className="text-sm text-foreground-muted">
                  {inviteForm.name || 'The leader'} will receive an email with instructions to set up their account.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInvite}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                      required
                      placeholder="Leader's full name"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      required
                      placeholder="leader@example.com"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={inviteForm.phone}
                      onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">
                      Personal Message (optional)
                    </label>
                    <textarea
                      value={inviteForm.message}
                      onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                      placeholder="Add a personal note to the invitation email..."
                      rows={3}
                      className="w-full"
                    />
                  </div>

                  {inviteError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                      {inviteError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowInviteModal(false);
                        setInviteError(null);
                      }}
                      className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-background-secondary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={inviting}
                      className="flex-1 btn-primary flex items-center justify-center gap-2"
                    >
                      {inviting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Send Invitation
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
