'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import EventModal from '@/components/groups/EventModal';
import GroupMeetings from '@/components/groups/GroupMeetings';

interface Disciple {
  id: string;
  name: string;
  email: string;
  phone?: string;
  joined_date: string;
  current_status: 'active' | 'completed' | 'dropped';
  week1_assessment_status?: 'not_sent' | 'sent' | 'completed';
  week1_assessment_score?: number | null;
  week12_assessment_status?: 'not_sent' | 'sent' | 'completed';
  week12_assessment_score?: number | null;
  app_connected?: boolean;
  current_streak?: number | null;
  last_activity_date?: string | null;
  total_journal_entries?: number;
  total_prayer_cards?: number;
  creed_cards_mastered?: number;
}

interface LeaderAppStats {
  current_streak: number;
  total_journal_entries: number;
  total_prayer_cards: number;
  creed_cards_mastered: number;
}

interface GroupData {
  id: string;
  group_name: string;
  current_phase: string;
  start_date: string;
  multiplication_target_date?: string;
  is_active: boolean;
  leader: {
    id: string;
    name: string;
    app_stats?: LeaderAppStats | null;
  };
  co_leader?: {
    id: string;
    name: string;
    app_stats?: LeaderAppStats | null;
  } | null;
  pending_co_leader?: {
    id: string;
    name: string;
    email: string;
  } | null;
  co_leader_invited_at?: string | null;
  disciples: Disciple[];
}

function GroupDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const groupId = params.id as string;
  const isNew = searchParams.get('new') === 'true';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupData | null>(null);
  const [showNewBanner, setShowNewBanner] = useState(isNew);

  // Phase advancement modal state
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  // Co-leader modal state
  const [showCoLeaderModal, setShowCoLeaderModal] = useState(false);
  const [coLeaderTab, setCoLeaderTab] = useState<'find' | 'invite'>('find');
  const [availableLeaders, setAvailableLeaders] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState('');
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  const [coLeaderError, setCoLeaderError] = useState<string | null>(null);
  const [settingCoLeader, setSettingCoLeader] = useState(false);
  const [removingCoLeader, setRemovingCoLeader] = useState(false);
  const [leaderEmailSearch, setLeaderEmailSearch] = useState('');
  const [searchingLeader, setSearchingLeader] = useState(false);
  // Invite by email tab state
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  // Add disciple modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingDisciple, setAddingDisciple] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newDisciple, setNewDisciple] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Edit group modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete group state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Event modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [meetingsKey, setMeetingsKey] = useState(0);


  // Phase display helpers
  const phaseLabels: Record<string, string> = {
    'pre-launch': 'Pre-Launch',
    'invitation': 'Invitation',
    'foundation': 'Foundation',
    'growth': 'Growth',
    'multiplication': 'Multiplication',
  };

  const phaseColors: Record<string, string> = {
    'pre-launch': 'bg-gray-100 text-gray-700',
    'invitation': 'bg-blue-100 text-blue-700',
    'foundation': 'bg-yellow-100 text-yellow-700',
    'growth': 'bg-green-100 text-green-700',
    'multiplication': 'bg-purple-100 text-purple-700',
  };

  // Phase advancement helpers
  const phaseOrder = ['pre-launch', 'invitation', 'foundation', 'growth', 'multiplication'];
  const currentPhaseIndex = group ? phaseOrder.indexOf(group.current_phase) : -1;
  const nextPhase = currentPhaseIndex >= 0 && currentPhaseIndex < phaseOrder.length - 1
    ? phaseOrder[currentPhaseIndex + 1]
    : null;

  const handleAdvancePhase = async () => {
    if (!nextPhase || !group) return;
    setAdvancing(true);

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_phase: nextPhase }),
      });

      const data = await response.json();
      if (response.ok && data.group) {
        setGroup({ ...group, current_phase: data.group.current_phase });
        setShowAdvanceModal(false);
      }
    } catch (err) {
      console.error('Phase advance error:', err);
    }

    setAdvancing(false);
  };

  const openCoLeaderModal = async () => {
    setShowCoLeaderModal(true);
    setCoLeaderError(null);
    setSelectedLeaderId('');
    setLeaderEmailSearch('');
    setLoadingLeaders(true);

    try {
      const response = await fetch('/api/groups/leaders');
      const data = await response.json();
      if (response.ok && data.leaders) {
        setAvailableLeaders(data.leaders);
      }
    } catch (err) {
      console.error('Fetch leaders error:', err);
      setCoLeaderError('Failed to load available leaders');
    }
    setLoadingLeaders(false);
  };

  const handleLeaderEmailSearch = async (email: string) => {
    setLeaderEmailSearch(email);
    setSelectedLeaderId('');
    if (!email.trim()) {
      // Reload default list
      const response = await fetch('/api/groups/leaders');
      const data = await response.json();
      if (response.ok && data.leaders) setAvailableLeaders(data.leaders);
      return;
    }
    setSearchingLeader(true);
    try {
      const response = await fetch(`/api/groups/leaders?email=${encodeURIComponent(email.trim())}`);
      const data = await response.json();
      if (response.ok && data.leaders) setAvailableLeaders(data.leaders);
    } catch (err) {
      console.error('Leader search error:', err);
    }
    setSearchingLeader(false);
  };

  const handleSetCoLeader = async () => {
    if (!selectedLeaderId) return;
    setSettingCoLeader(true);
    setCoLeaderError(null);

    try {
      const response = await fetch(`/api/groups/${groupId}/co-leader`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leader_id: selectedLeaderId }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        setCoLeaderError(data.error || 'Failed to set co-leader');
        setSettingCoLeader(false);
        return;
      }

      // Update group with pending co-leader (awaiting acceptance)
      if (group) {
        setGroup({ ...group, pending_co_leader: data.pending_co_leader, co_leader_invited_at: new Date().toISOString() });
      }
      setShowCoLeaderModal(false);
    } catch (err) {
      console.error('Set co-leader error:', err);
      setCoLeaderError('Failed to set co-leader');
    }
    setSettingCoLeader(false);
  };

  const handleInviteByEmail = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    setSettingCoLeader(true);
    setCoLeaderError(null);

    try {
      const response = await fetch(`/api/groups/${groupId}/co-leader`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inviteName.trim(), email: inviteEmail.trim().toLowerCase() }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        setCoLeaderError(data.error || 'Failed to send invitation');
        setSettingCoLeader(false);
        return;
      }

      if (group) {
        setGroup({ ...group, pending_co_leader: data.pending_co_leader, co_leader_invited_at: new Date().toISOString() });
      }
      setShowCoLeaderModal(false);
      setInviteName('');
      setInviteEmail('');
    } catch (err) {
      console.error('Invite by email error:', err);
      setCoLeaderError('Failed to send invitation');
    }
    setSettingCoLeader(false);
  };

  const handleRemoveCoLeader = async () => {
    if (!confirm('Are you sure you want to remove the co-leader from this group?')) return;
    setRemovingCoLeader(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/co-leader`, {
        method: 'DELETE',
      });

      if (response.ok && group) {
        setGroup({ ...group, co_leader: null, pending_co_leader: null, co_leader_invited_at: null });
      }
    } catch (err) {
      console.error('Remove co-leader error:', err);
    }
    setRemovingCoLeader(false);
  };

  useEffect(() => {
    async function fetchGroup() {
      try {
        const response = await fetch(`/api/groups/${groupId}`);

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        const data = await response.json();

        if (response.status === 404) {
          setError(data.error || 'Group not found');
          setLoading(false);
          return;
        }

        if (!response.ok || data.error) {
          setError(data.error || 'Failed to load group');
          setLoading(false);
          return;
        }

        setGroup(data.group);
        setLoading(false);
      } catch (err) {
        console.error('Group fetch error:', err);
        setError('Failed to load group');
        setLoading(false);
      }
    }

    if (groupId) {
      fetchGroup();
    }
  }, [groupId, router]);

  const handleAddDisciple = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingDisciple(true);
    setAddError(null);

    try {
      const response = await fetch(`/api/groups/${groupId}/disciples`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDisciple.name.trim(),
          email: newDisciple.email.trim().toLowerCase(),
          phone: newDisciple.phone.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setAddError(data.error || 'Failed to add disciple');
        setAddingDisciple(false);
        return;
      }

      // Refresh group data
      const refreshResponse = await fetch(`/api/groups/${groupId}`);
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok && refreshData.group) {
        setGroup(refreshData.group);
      }

      // Reset form and close modal
      setNewDisciple({ name: '', email: '', phone: '' });
      setShowAddModal(false);
      setAddingDisciple(false);
    } catch (err) {
      console.error('Add disciple error:', err);
      setAddError('Failed to add disciple. Please try again.');
      setAddingDisciple(false);
    }
  };

  const handleEditGroup = async () => {
    if (!group) return;
    setSavingEdit(true);
    try {
      const updates: Record<string, string> = {};
      if (editGroupName.trim() && editGroupName.trim() !== group.group_name) {
        updates.group_name = editGroupName.trim();
      }
      if (editStartDate && editStartDate !== group.start_date) {
        updates.start_date = editStartDate;
      }
      if (editTargetDate !== (group.multiplication_target_date || '')) {
        updates.multiplication_target_date = editTargetDate || '';
      }

      if (Object.keys(updates).length === 0) {
        setShowEditModal(false);
        setSavingEdit(false);
        return;
      }

      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to update group');
        setSavingEdit(false);
        return;
      }

      // Refresh group data
      const refreshRes = await fetch(`/api/groups/${groupId}`);
      const refreshData = await refreshRes.json();
      if (refreshRes.ok && refreshData.group) {
        setGroup(refreshData.group);
      }
      setShowEditModal(false);
    } catch (err) {
      console.error('Edit group error:', err);
      alert('Failed to update group');
    }
    setSavingEdit(false);
  };

  const handleDeleteGroup = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to delete group');
        setDeleting(false);
        return;
      }

      router.push('/groups');
    } catch (err) {
      console.error('Delete group error:', err);
      alert('Failed to delete group');
      setDeleting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
          <p className="mt-4 text-navy">Loading group...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !group) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Group not found'}</p>
          <Link
            href="/groups"
            className="inline-block bg-gold hover:bg-gold/90 text-white font-semibold py-3 px-6 rounded-lg"
          >
            Back to Groups
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-navy text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          {/* Top row: back + name + actions */}
          <div className="flex items-start gap-3">
            <Link
              href="/groups"
              className="text-white/70 hover:text-white transition-colors mt-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{group.group_name}</h1>
                <button
                  onClick={() => {
                    setEditGroupName(group.group_name);
                    setEditStartDate(group.start_date);
                    setEditTargetDate(group.multiplication_target_date || '');
                    setShowEditModal(true);
                  }}
                  className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors flex-shrink-0"
                  title="Edit group"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1 text-white/40 hover:text-red-300 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                  title="Delete group"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              {/* Meta row */}
              <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-white/60 flex-wrap">
                <span>Started {new Date(group.start_date).toLocaleDateString()}</span>
                {group.multiplication_target_date && (
                  <>
                    <span className="hidden sm:inline">&bull;</span>
                    <span>Target: {new Date(group.multiplication_target_date).toLocaleDateString()}</span>
                  </>
                )}
                <span className="hidden sm:inline">&bull;</span>
                {group.co_leader ? (
                  <span className="flex items-center gap-1">
                    Co-Leader: <span className="text-white/80 font-medium">{group.co_leader.name}</span>
                    <button
                      onClick={handleRemoveCoLeader}
                      disabled={removingCoLeader}
                      className="text-white/40 hover:text-red-300 text-xs"
                    >
                      {removingCoLeader ? '...' : '✕'}
                    </button>
                  </span>
                ) : group.pending_co_leader ? (
                  <span className="flex items-center gap-1">
                    Co-Leader: <span className="text-yellow-300">{group.pending_co_leader.name || group.pending_co_leader.email}</span>
                    <span className="text-yellow-400/70">(pending)</span>
                    <button
                      onClick={handleRemoveCoLeader}
                      disabled={removingCoLeader}
                      className="text-white/40 hover:text-red-300 text-xs"
                    >
                      {removingCoLeader ? '...' : '✕'}
                    </button>
                  </span>
                ) : (
                  <button onClick={openCoLeaderModal} className="text-gold hover:text-gold-light">
                    + Co-Leader
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Phase stepper — integrated into header */}
          <div className="mt-4 flex items-center gap-1.5">
            {phaseOrder.map((phase, index) => {
              const isCurrent = phase === group.current_phase;
              const isCompleted = index < currentPhaseIndex;
              return (
                <div key={phase} className="flex-1">
                  <div className={`h-1.5 rounded-full ${
                    isCompleted ? 'bg-green-400' : isCurrent ? 'bg-gold' : 'bg-white/15'
                  }`} />
                  <p className={`text-[10px] sm:text-xs mt-1 text-center ${
                    isCurrent ? 'text-white font-semibold' : isCompleted ? 'text-green-300' : 'text-white/30'
                  }`}>
                    {phaseLabels[phase]}
                  </p>
                </div>
              );
            })}
            {nextPhase && (
              <button
                onClick={() => setShowAdvanceModal(true)}
                className="ml-2 text-xs bg-gold/20 hover:bg-gold/30 text-gold border border-gold/40 font-medium py-1 px-3 rounded-full transition-colors flex-shrink-0"
              >
                Advance
              </button>
            )}
          </div>
        </div>
      </header>

      {/* New group banner */}
      {showNewBanner && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-green-800 text-sm">Group Created!</p>
                  <p className="text-xs text-green-700">Add disciples to start your journey.</p>
                </div>
              </div>
              <button onClick={() => setShowNewBanner(false)} className="text-green-600 hover:text-green-800">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Disciples section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-navy">
              Disciples ({group.disciples.filter(d => d.current_status === 'active').length})
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gold hover:bg-gold/90 text-white font-medium py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg text-sm transition-colors"
            >
              + Add Disciple
            </button>
          </div>

          {/* Leader & Co-Leader Stats */}
          {(group.leader?.app_stats || group.co_leader?.app_stats) && (
            <div className="px-4 sm:px-6 py-3 border-b border-gray-200 bg-gray-50/50">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Leadership Stats</p>
              <div className="flex flex-wrap gap-4 sm:gap-6">
                {[
                  { label: group.leader?.name || 'Leader', stats: group.leader?.app_stats },
                  ...(group.co_leader?.app_stats ? [{ label: group.co_leader.name, stats: group.co_leader.app_stats }] : []),
                ].filter(l => l.stats).map(({ label, stats }) => (
                  <div key={label} className="flex items-center gap-3 text-xs">
                    <span className="font-medium text-navy">{label}</span>
                    {stats!.current_streak > 0 && <span className="text-amber-600">🔥 {stats!.current_streak}d</span>}
                    <span className="text-teal-700">📓 {stats!.total_journal_entries}</span>
                    <span>🙏 {stats!.total_prayer_cards}</span>
                    {stats!.creed_cards_mastered > 0 && <span className="text-gold">🛡️ {stats!.creed_cards_mastered}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {group.disciples.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">No disciples yet</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Add disciples to your group so they can take the Life Assessment and begin their DNA journey.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 bg-gold hover:bg-gold/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Your First Disciple
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table view */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500">Name</th>
                      <th className="text-center px-3 py-2.5 font-medium text-gray-500">Status</th>
                      <th className="text-center px-3 py-2.5 font-medium text-gray-500" title="Life Assessments">W1 / W12</th>
                      <th className="text-center px-3 py-2.5 font-medium text-gray-500" title="Current streak">🔥 Streak</th>
                      <th className="text-center px-3 py-2.5 font-medium text-gray-500" title="Journal entries">📓 Journals</th>
                      <th className="text-center px-3 py-2.5 font-medium text-gray-500" title="Prayer cards">🙏 Prayer</th>
                      <th className="text-center px-3 py-2.5 font-medium text-gray-500" title="Creed cards mastered">🛡️ Creed</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.disciples.map((disciple) => (
                      <tr
                        key={disciple.id}
                        onClick={() => router.push(`/groups/${groupId}/disciples/${disciple.id}`)}
                        className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-navy">{disciple.name}</span>
                            {disciple.app_connected ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" title="App connected"></span>
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" title="No app"></span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">{disciple.email}</div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            disciple.current_status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : disciple.current_status === 'completed'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {disciple.current_status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-xs">
                            <span className={`px-1.5 py-0.5 rounded ${
                              disciple.week1_assessment_status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : disciple.week1_assessment_status === 'sent'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}>
                              {disciple.week1_assessment_status === 'completed'
                                ? (disciple.week1_assessment_score != null ? `${Math.round(disciple.week1_assessment_score)}%` : '✓')
                                : disciple.week1_assessment_status === 'sent' ? '…' : '—'}
                            </span>
                            <span className="text-gray-300">/</span>
                            <span className={`px-1.5 py-0.5 rounded ${
                              disciple.week12_assessment_status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : disciple.week12_assessment_status === 'sent'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}>
                              {disciple.week12_assessment_status === 'completed'
                                ? (disciple.week12_assessment_score != null ? `${Math.round(disciple.week12_assessment_score)}%` : '✓')
                                : disciple.week12_assessment_status === 'sent' ? '…' : '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {disciple.app_connected && disciple.current_streak != null && disciple.current_streak > 0 ? (
                            <span className="text-amber-600 font-medium">{disciple.current_streak}d</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {disciple.total_journal_entries ? (
                            <span className="text-teal-700 font-medium">{disciple.total_journal_entries}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {disciple.total_prayer_cards ? (
                            <span>{disciple.total_prayer_cards}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {disciple.creed_cards_mastered ? (
                            <span className="text-gold font-medium">{disciple.creed_cards_mastered}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-2 py-3">
                          <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div className="sm:hidden divide-y divide-gray-100">
                {group.disciples.map((disciple) => (
                  <Link
                    key={disciple.id}
                    href={`/groups/${groupId}/disciples/${disciple.id}`}
                    className="block px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    {/* Name row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-navy truncate">{disciple.name}</span>
                        {disciple.app_connected ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0"></span>
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0"></span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${
                          disciple.current_status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : disciple.current_status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {disciple.current_status}
                        </span>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    {/* Stats row */}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      {/* Assessments */}
                      <span className="flex items-center gap-1">
                        <span className={disciple.week1_assessment_status === 'completed' ? 'text-green-600' : ''}>
                          W1{disciple.week1_assessment_status === 'completed'
                            ? (disciple.week1_assessment_score != null ? ` ${Math.round(disciple.week1_assessment_score)}%` : '✓')
                            : ''}
                        </span>
                        <span className="text-gray-300">/</span>
                        <span className={disciple.week12_assessment_status === 'completed' ? 'text-green-600' : ''}>
                          W12{disciple.week12_assessment_status === 'completed'
                            ? (disciple.week12_assessment_score != null ? ` ${Math.round(disciple.week12_assessment_score)}%` : '✓')
                            : ''}
                        </span>
                      </span>
                      <span className="text-gray-200">|</span>
                      {/* Engagement stats */}
                      {disciple.app_connected ? (
                        <>
                          {disciple.current_streak != null && disciple.current_streak > 0 && (
                            <span className="text-amber-600 font-medium">🔥 {disciple.current_streak}d</span>
                          )}
                          {disciple.total_journal_entries ? (
                            <span>📓 {disciple.total_journal_entries}</span>
                          ) : null}
                          {disciple.total_prayer_cards ? (
                            <span>🙏 {disciple.total_prayer_cards}</span>
                          ) : null}
                          {disciple.creed_cards_mastered ? (
                            <span className="text-gold font-medium">🛡️ {disciple.creed_cards_mastered}</span>
                          ) : null}
                          {!disciple.current_streak && !disciple.total_journal_entries && !disciple.total_prayer_cards && !disciple.creed_cards_mastered && (
                            <span className="text-gray-400 italic">No activity yet</span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400 italic">No app</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Scheduled Meetings */}
        <GroupMeetings
          key={meetingsKey}
          groupId={groupId}
          onScheduleNew={() => setShowEventModal(true)}
        />

      </main>

      {/* Advance Phase Modal */}
      {showAdvanceModal && nextPhase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-navy">Advance Phase</h2>
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${phaseColors[group.current_phase]}`}>
                    {phaseLabels[group.current_phase]}
                  </span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${phaseColors[nextPhase]}`}>
                    {phaseLabels[nextPhase]}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Are you sure you want to advance this group to the <strong>{phaseLabels[nextPhase]}</strong> phase? This action marks the current phase as complete.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAdvanceModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAdvancePhase}
                disabled={advancing}
                className="bg-gold hover:bg-gold/90 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {advancing ? 'Advancing...' : 'Advance Phase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Co-Leader Modal */}
      {showCoLeaderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-navy">Invite Co-Leader</h2>
              <button
                onClick={() => { setShowCoLeaderModal(false); setCoLeaderTab('find'); setInviteName(''); setInviteEmail(''); setCoLeaderError(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-5">
              <button
                type="button"
                onClick={() => { setCoLeaderTab('find'); setCoLeaderError(null); }}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${coLeaderTab === 'find' ? 'border-gold text-gold' : 'border-transparent text-gray-500 hover:text-navy'}`}
              >
                Find Existing Leader
              </button>
              <button
                type="button"
                onClick={() => { setCoLeaderTab('invite'); setCoLeaderError(null); }}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${coLeaderTab === 'invite' ? 'border-gold text-gold' : 'border-transparent text-gray-500 hover:text-navy'}`}
              >
                Invite by Email
              </button>
            </div>

            {coLeaderError && (
              <div className="bg-red-50 text-red-700 rounded-lg p-4 mb-4 text-sm">
                {coLeaderError}
              </div>
            )}

            {/* Tab: Find existing leader */}
            {coLeaderTab === 'find' && (
              loadingLeaders ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading leaders...</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-navy mb-2">
                    Search by email
                  </label>
                  <input
                    type="email"
                    value={leaderEmailSearch}
                    onChange={(e) => handleLeaderEmailSearch(e.target.value)}
                    placeholder="Enter co-leader's email address"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold mb-3"
                  />

                  {searchingLeader ? (
                    <p className="text-sm text-gray-400 py-2">Searching...</p>
                  ) : availableLeaders.length === 0 ? (
                    <div>
                      <p className="text-sm text-gray-400 py-2">
                        {leaderEmailSearch.trim() ? 'No active leader found with that email.' : 'No other leaders in your church yet.'}
                      </p>
                      {leaderEmailSearch.trim() && (
                        <p className="text-sm text-gray-500 mt-1">
                          Not a leader yet?{' '}
                          <button
                            type="button"
                            onClick={() => { setCoLeaderTab('invite'); setInviteEmail(leaderEmailSearch); setCoLeaderError(null); }}
                            className="text-gold hover:underline font-medium"
                          >
                            Invite them by email
                          </button>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg divide-y max-h-48 overflow-y-auto">
                      {availableLeaders.map(leader => (
                        <button
                          key={leader.id}
                          type="button"
                          onClick={() => setSelectedLeaderId(leader.id === selectedLeaderId ? '' : leader.id)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selectedLeaderId === leader.id ? 'bg-gold/10 border-l-2 border-gold' : ''}`}
                        >
                          <p className="font-medium text-navy text-sm">{leader.name}</p>
                          <p className="text-xs text-gray-500">{leader.email}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => { setShowCoLeaderModal(false); setCoLeaderTab('find'); setInviteName(''); setInviteEmail(''); setCoLeaderError(null); }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSetCoLeader}
                      disabled={!selectedLeaderId || settingCoLeader}
                      className="bg-gold hover:bg-gold/90 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {settingCoLeader ? 'Sending...' : 'Send Invitation'}
                    </button>
                  </div>
                </div>
              )
            )}

            {/* Tab: Invite by email (new user) */}
            {coLeaderTab === 'invite' && (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  Invite someone who isn&apos;t a DNA leader yet. They&apos;ll receive an email to create their account and will be automatically set as co-leader once they sign up.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">
                      Their Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="John Smith"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">
                      Their Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => { setShowCoLeaderModal(false); setCoLeaderTab('find'); setInviteName(''); setInviteEmail(''); setCoLeaderError(null); }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInviteByEmail}
                    disabled={!inviteName.trim() || !inviteEmail.trim() || settingCoLeader}
                    className="bg-gold hover:bg-gold/90 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {settingCoLeader ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Disciple Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-navy">Add Disciple</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddError(null);
                  setNewDisciple({ name: '', email: '', phone: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {addError && (
              <div className="bg-red-50 text-red-700 rounded-lg p-4 mb-4 text-sm">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddDisciple} className="space-y-4">
              <div>
                <label htmlFor="discipleName" className="block text-sm font-medium text-navy mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  id="discipleName"
                  value={newDisciple.name}
                  onChange={(e) => setNewDisciple(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label htmlFor="discipleEmail" className="block text-sm font-medium text-navy mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="discipleEmail"
                  value={newDisciple.email}
                  onChange={(e) => setNewDisciple(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="disciplePhone" className="block text-sm font-medium text-navy mb-1">
                  Phone <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="tel"
                  id="disciplePhone"
                  value={newDisciple.phone}
                  onChange={(e) => setNewDisciple(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddError(null);
                    setNewDisciple({ name: '', email: '', phone: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingDisciple || !newDisciple.name.trim() || !newDisciple.email.trim()}
                  className="bg-gold hover:bg-gold/90 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingDisciple ? 'Adding...' : 'Add Disciple'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          groupId={groupId}
          onClose={() => setShowEventModal(false)}
          onSuccess={() => {
            setShowEventModal(false);
            setMeetingsKey(k => k + 1);
          }}
        />
      )}

      {/* Edit Group Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-navy">Edit Group</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Group Name *</label>
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Start Date</label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">
                  Multiplication Target Date <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="date"
                  value={editTargetDate}
                  onChange={(e) => setEditTargetDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleEditGroup}
                disabled={savingEdit || !editGroupName.trim()}
                className="bg-gold hover:bg-gold/90 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-red-600">Delete Group</h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600">
                Are you sure you want to delete <strong className="text-navy">{group.group_name}</strong>?
              </p>
              {group.disciples.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  {group.disciples.length} disciple{group.disciples.length !== 1 ? 's' : ''} will be removed from this group.
                </p>
              )}
              <p className="text-sm text-red-500 mt-2">This action cannot be undone.</p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading fallback
function GroupLoading() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
        <p className="mt-4 text-navy">Loading...</p>
      </div>
    </div>
  );
}

export default function GroupDetailPage() {
  return (
    <Suspense fallback={<GroupLoading />}>
      <GroupDetailContent />
    </Suspense>
  );
}
