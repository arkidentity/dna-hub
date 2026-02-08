'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Disciple {
  id: string;
  name: string;
  email: string;
  phone?: string;
  joined_date: string;
  current_status: 'active' | 'completed' | 'dropped';
  week1_assessment_status?: 'not_sent' | 'sent' | 'completed';
  week12_assessment_status?: 'not_sent' | 'sent' | 'completed';
  app_connected?: boolean;
  current_streak?: number | null;
  last_activity_date?: string | null;
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
  };
  co_leader?: {
    id: string;
    name: string;
  } | null;
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
  const [availableLeaders, setAvailableLeaders] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState('');
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  const [coLeaderError, setCoLeaderError] = useState<string | null>(null);
  const [settingCoLeader, setSettingCoLeader] = useState(false);
  const [removingCoLeader, setRemovingCoLeader] = useState(false);

  // Add disciple modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingDisciple, setAddingDisciple] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newDisciple, setNewDisciple] = useState({
    name: '',
    email: '',
    phone: '',
  });

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

      // Update group with new co-leader
      if (group) {
        setGroup({ ...group, co_leader: data.co_leader });
      }
      setShowCoLeaderModal(false);
    } catch (err) {
      console.error('Set co-leader error:', err);
      setCoLeaderError('Failed to set co-leader');
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
        setGroup({ ...group, co_leader: null });
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

        if (response.status === 404) {
          setError('Group not found');
          setLoading(false);
          return;
        }

        const data = await response.json();

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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/groups"
              className="text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{group.group_name}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${phaseColors[group.current_phase] || 'bg-gray-100 text-gray-700'}`}>
                  {phaseLabels[group.current_phase] || group.current_phase}
                </span>
              </div>
              <p className="text-white/70 text-sm mt-1">
                Started {new Date(group.start_date).toLocaleDateString()}
                {group.multiplication_target_date && (
                  <span> &bull; Target: {new Date(group.multiplication_target_date).toLocaleDateString()}</span>
                )}
              </p>
              {/* Co-leader info */}
              <div className="flex items-center gap-2 mt-2">
                {group.co_leader ? (
                  <>
                    <span className="text-white/70 text-sm">
                      Co-Leader: <span className="text-white font-medium">{group.co_leader.name}</span>
                    </span>
                    <button
                      onClick={handleRemoveCoLeader}
                      disabled={removingCoLeader}
                      className="text-xs text-white/50 hover:text-red-300 transition-colors"
                    >
                      {removingCoLeader ? 'Removing...' : '(Remove)'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={openCoLeaderModal}
                    className="text-sm text-gold hover:text-gold-light transition-colors"
                  >
                    + Invite Co-Leader
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* New group banner */}
      {showNewBanner && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-green-800">Group Created!</p>
                  <p className="text-sm text-green-700">Now add disciples to start your journey.</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewBanner(false)}
                className="text-green-600 hover:text-green-800"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Phase Progress Stepper */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-navy uppercase tracking-wide">Group Journey</h2>
            {nextPhase && (
              <button
                onClick={() => setShowAdvanceModal(true)}
                className="text-sm bg-gold hover:bg-gold/90 text-white font-medium py-1.5 px-4 rounded-lg transition-colors"
              >
                Advance Phase
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            {phaseOrder.map((phase, index) => {
              const isCurrent = phase === group.current_phase;
              const isCompleted = index < currentPhaseIndex;
              return (
                <div key={phase} className="flex-1 flex items-center">
                  <div className="flex-1">
                    <div className={`h-2 rounded-full ${
                      isCompleted
                        ? 'bg-green-500'
                        : isCurrent
                        ? 'bg-gold'
                        : 'bg-gray-200'
                    }`} />
                    <p className={`text-xs mt-1.5 text-center ${
                      isCurrent ? 'text-navy font-semibold' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {phaseLabels[phase]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Disciples section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy">
              Disciples ({group.disciples.length})
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gold hover:bg-gold/90 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              + Add Disciple
            </button>
          </div>

          {group.disciples.length === 0 ? (
            /* Empty state */
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
            /* Disciples list */
            <div className="divide-y divide-gray-200">
              {group.disciples.map((disciple) => (
                <Link
                  key={disciple.id}
                  href={`/groups/${groupId}/disciples/${disciple.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-navy">{disciple.name}</h3>
                        {disciple.app_connected ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-teal-50 text-teal-700" title="Connected to Daily DNA app">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                            App
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-400" title="Not on Daily DNA app">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                            No app
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">{disciple.email}</p>
                        {disciple.app_connected && disciple.current_streak != null && disciple.current_streak > 0 && (
                          <span className="text-xs text-orange-600 font-medium">{disciple.current_streak}d streak</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Assessment status indicators */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded ${
                          disciple.week1_assessment_status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : disciple.week1_assessment_status === 'sent'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          W1 {disciple.week1_assessment_status === 'completed' ? '✓' : disciple.week1_assessment_status === 'sent' ? 'Sent' : '—'}
                        </span>
                        <span className={`px-2 py-1 rounded ${
                          disciple.week12_assessment_status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : disciple.week12_assessment_status === 'sent'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          W12 {disciple.week12_assessment_status === 'completed' ? '✓' : disciple.week12_assessment_status === 'sent' ? 'Sent' : '—'}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        disciple.current_status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : disciple.current_status === 'completed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {disciple.current_status}
                      </span>
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-navy">Invite Co-Leader</h2>
              <button
                onClick={() => setShowCoLeaderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {coLeaderError && (
              <div className="bg-red-50 text-red-700 rounded-lg p-4 mb-4 text-sm">
                {coLeaderError}
              </div>
            )}

            {loadingLeaders ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading leaders...</p>
              </div>
            ) : availableLeaders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No available DNA leaders found.</p>
                <p className="text-sm text-gray-400 mt-1">Leaders must be active and from the same church.</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-navy mb-2">
                  Select a DNA Leader
                </label>
                <select
                  value={selectedLeaderId}
                  onChange={(e) => setSelectedLeaderId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                >
                  <option value="">Choose a leader...</option>
                  {availableLeaders.map(leader => (
                    <option key={leader.id} value={leader.id}>
                      {leader.name} ({leader.email})
                    </option>
                  ))}
                </select>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCoLeaderModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSetCoLeader}
                    disabled={!selectedLeaderId || settingCoLeader}
                    className="bg-gold hover:bg-gold/90 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {settingCoLeader ? 'Inviting...' : 'Set Co-Leader'}
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
