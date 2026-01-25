'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  X,
  Mail,
  Building2,
  Search,
  Filter,
  Heart,
} from 'lucide-react';
import { DNALeader } from '@/lib/types';

interface LeaderWithStats extends DNALeader {
  church_name?: string;
  group_count: number;
  disciple_count: number;
}

interface DNALeadersStats {
  total: number;
  active: number;
  pending: number;
  independent: number;
  churchAffiliated: number;
  totalGroups: number;
  totalDisciples: number;
}

interface ChurchOption {
  id: string;
  name: string;
}

export default function DNALeadersTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaders, setLeaders] = useState<LeaderWithStats[]>([]);
  const [stats, setStats] = useState<DNALeadersStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'independent' | 'church'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending'>('all');

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [churches, setChurches] = useState<ChurchOption[]>([]);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    phone: '',
    churchId: '', // Empty = independent
    message: '',
  });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/dna-leaders');
      if (!response.ok) {
        throw new Error('Failed to fetch DNA leaders');
      }

      const data = await response.json();
      setLeaders(data.leaders || []);
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching DNA leaders:', err);
      setError('Failed to load DNA leaders');
    } finally {
      setLoading(false);
    }
  };

  const fetchChurches = async () => {
    try {
      const response = await fetch('/api/admin/churches');
      if (response.ok) {
        const data = await response.json();
        setChurches(data.churches.map((c: { id: string; name: string }) => ({
          id: c.id,
          name: c.name,
        })));
      }
    } catch (err) {
      console.error('Error fetching churches:', err);
    }
  };

  const handleOpenInviteModal = () => {
    fetchChurches();
    setShowInviteModal(true);
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
          churchId: inviteForm.churchId || undefined, // undefined = independent
          personalMessage: inviteForm.message || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send invitation');
      }

      setInviteSuccess(true);
      setInviteForm({ name: '', email: '', phone: '', churchId: '', message: '' });

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

  const filteredLeaders = leaders.filter(leader => {
    const matchesSearch =
      leader.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leader.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (leader.church_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesType =
      filterType === 'all' ||
      (filterType === 'independent' && !leader.church_id) ||
      (filterType === 'church' && leader.church_id);

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && leader.activated_at) ||
      (filterStatus === 'pending' && !leader.activated_at);

    return matchesSearch && matchesType && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal/10 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-teal" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{stats.active}</p>
                <p className="text-xs text-foreground-muted">Active Leaders</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{stats.pending}</p>
                <p className="text-xs text-foreground-muted">Pending Invites</p>
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
                <p className="text-xs text-foreground-muted">Total Groups</p>
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
                <p className="text-xs text-foreground-muted">Total Disciples</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-1 gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <input
                type="text"
                placeholder="Search leaders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-foreground-muted" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'independent' | 'church')}
                className="min-w-[140px]"
              >
                <option value="all">All Types</option>
                <option value="independent">Independent</option>
                <option value="church">Church-Affiliated</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'pending')}
                className="min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleOpenInviteModal}
            className="btn-primary inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Invite Leader
          </button>
        </div>
      </div>

      {/* Leaders List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground-muted">
            {filteredLeaders.length} leader{filteredLeaders.length !== 1 ? 's' : ''}
          </p>
        </div>

        {filteredLeaders.length === 0 ? (
          <div className="card text-center py-12">
            <Users className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
            <h3 className="font-medium text-navy mb-2">No DNA Leaders Found</h3>
            <p className="text-foreground-muted text-sm mb-4">
              {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Invite your first DNA leader to get started'}
            </p>
            {!searchQuery && filterType === 'all' && filterStatus === 'all' && (
              <button
                onClick={handleOpenInviteModal}
                className="btn-primary inline-flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Invite Your First Leader
              </button>
            )}
          </div>
        ) : (
          filteredLeaders.map((leader) => {
            const isPending = !leader.activated_at;

            return (
              <div key={leader.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-navy">{leader.name}</h3>
                      {isPending ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                          Pending Invite
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                      {!leader.church_id ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                          Independent
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {leader.church_name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-foreground-muted mb-3">
                      <a
                        href={`mailto:${leader.email}`}
                        className="flex items-center gap-1 text-teal hover:text-teal-light"
                      >
                        <Mail className="w-4 h-4" />
                        {leader.email}
                      </a>
                      {leader.phone && <span>{leader.phone}</span>}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-foreground-muted">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {leader.group_count} group{leader.group_count !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {leader.disciple_count} disciple{leader.disciple_count !== 1 ? 's' : ''}
                      </span>
                      <span>
                        Invited {formatDate(leader.invited_at || leader.created_at)}
                      </span>
                      {leader.activated_at && (
                        <span>
                          Activated {formatDate(leader.activated_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

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
                  The leader will receive an email with instructions to set up their account.
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
                      Church Affiliation
                    </label>
                    <select
                      value={inviteForm.churchId}
                      onChange={(e) => setInviteForm({ ...inviteForm, churchId: e.target.value })}
                      className="w-full"
                    >
                      <option value="">Independent (No Church)</option>
                      {churches.map((church) => (
                        <option key={church.id} value={church.id}>
                          {church.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-foreground-muted mt-1">
                      Leave as &quot;Independent&quot; for leaders not affiliated with a specific church
                    </p>
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
