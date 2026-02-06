'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { DiscipleshipLogEntry, DiscipleProfile, DNAGroupPhase } from '@/lib/types';

type LogFilter = 'all' | 'note' | 'prayer' | 'milestone';

function DiscipleProfileContent() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const discipleId = params.discipleId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disciple, setDisciple] = useState<DiscipleProfile | null>(null);

  // Log filter
  const [logFilter, setLogFilter] = useState<LogFilter>('all');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'note' | 'prayer'>('note');
  const [modalContent, setModalContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Answer prayer modal
  const [answeringEntry, setAnsweringEntry] = useState<DiscipleshipLogEntry | null>(null);
  const [answerNotes, setAnswerNotes] = useState('');

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

  const statusColors: Record<string, string> = {
    'active': 'bg-green-100 text-green-700',
    'completed': 'bg-blue-100 text-blue-700',
    'dropped': 'bg-gray-100 text-gray-500',
  };

  useEffect(() => {
    fetchProfile();
  }, [groupId, discipleId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchProfile() {
    try {
      const response = await fetch(`/api/groups/${groupId}/disciples/${discipleId}`);

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok || data.error) {
        setError(data.error || 'Failed to load disciple profile');
        setLoading(false);
        return;
      }

      setDisciple(data.disciple);
      setLoading(false);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Failed to load disciple profile');
      setLoading(false);
    }
  }

  function openAddModal(type: 'note' | 'prayer') {
    setModalType(type);
    setModalContent('');
    setSubmitError(null);
    setShowAddModal(true);
  }

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!modalContent.trim()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/groups/${groupId}/disciples/${discipleId}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_type: modalType,
          content: modalContent.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        setSubmitError(data.error || 'Failed to add entry');
        setSubmitting(false);
        return;
      }

      // Add new entry to the top of the list
      if (disciple) {
        setDisciple({
          ...disciple,
          log_entries: [data.entry, ...disciple.log_entries],
        });
      }

      setShowAddModal(false);
      setModalContent('');
      setSubmitting(false);
    } catch (err) {
      console.error('Add entry error:', err);
      setSubmitError('Failed to add entry. Please try again.');
      setSubmitting(false);
    }
  }

  async function handleMarkAnswered(entry: DiscipleshipLogEntry) {
    try {
      const response = await fetch(`/api/groups/${groupId}/disciples/${discipleId}/log/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_answered: true,
          answer_notes: answerNotes.trim() || null,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) return;

      // Update entry in list
      if (disciple) {
        setDisciple({
          ...disciple,
          log_entries: disciple.log_entries.map(e =>
            e.id === entry.id ? data.entry : e
          ),
        });
      }

      setAnsweringEntry(null);
      setAnswerNotes('');
    } catch (err) {
      console.error('Mark answered error:', err);
    }
  }

  async function handleDeleteEntry(entryId: string) {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const response = await fetch(`/api/groups/${groupId}/disciples/${discipleId}/log/${entryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) return;

      // Remove entry from list
      if (disciple) {
        setDisciple({
          ...disciple,
          log_entries: disciple.log_entries.filter(e => e.id !== entryId),
        });
      }
    } catch (err) {
      console.error('Delete entry error:', err);
    }
  }

  // Filter log entries
  const filteredEntries = disciple?.log_entries.filter(entry => {
    if (logFilter === 'all') return true;
    return entry.entry_type === logFilter;
  }) || [];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
          <p className="mt-4 text-navy">Loading disciple profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !disciple) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Disciple not found'}</p>
          <Link
            href={`/groups/${groupId}`}
            className="inline-block bg-gold hover:bg-gold/90 text-white font-semibold py-3 px-6 rounded-lg"
          >
            Back to Group
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
              href={`/groups/${groupId}`}
              className="text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{disciple.name}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[disciple.current_status] || 'bg-gray-100 text-gray-700'}`}>
                  {disciple.current_status}
                </span>
              </div>
              <p className="text-white/70 text-sm mt-1">
                {disciple.group.group_name}
                <span className="mx-2">&bull;</span>
                <span className={`inline-block px-2 py-0.5 rounded text-xs ${phaseColors[disciple.group.current_phase] || 'bg-gray-100 text-gray-700'}`}>
                  {phaseLabels[disciple.group.current_phase] || disciple.group.current_phase}
                </span>
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Info Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-navy font-medium">{disciple.email}</p>
            </div>
            {disciple.phone && (
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-navy font-medium">{disciple.phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Joined</p>
              <p className="text-navy font-medium">{new Date(disciple.joined_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Assessments</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded text-xs ${
                  disciple.week1_assessment_status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : disciple.week1_assessment_status === 'sent'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  W1 {disciple.week1_assessment_status === 'completed' ? '✓' : disciple.week1_assessment_status === 'sent' ? 'Sent' : '—'}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  disciple.week8_assessment_status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : disciple.week8_assessment_status === 'sent'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  W8 {disciple.week8_assessment_status === 'completed' ? '✓' : disciple.week8_assessment_status === 'sent' ? 'Sent' : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => openAddModal('note')}
            className="flex items-center gap-2 bg-gold hover:bg-gold/90 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Add Note
          </button>
          <button
            onClick={() => openAddModal('prayer')}
            className="flex items-center gap-2 bg-teal hover:bg-teal/90 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Add Prayer Request
          </button>
        </div>

        {/* Discipleship Log */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-navy">Discipleship Log</h2>
              <span className="text-sm text-gray-500">{filteredEntries.length} entries</span>
            </div>
            {/* Filter tabs */}
            <div className="flex gap-2 mt-3">
              {(['all', 'note', 'prayer', 'milestone'] as LogFilter[]).map(filter => (
                <button
                  key={filter}
                  onClick={() => setLogFilter(filter)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    logFilter === filter
                      ? 'bg-navy text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter === 'note' ? 'Notes' : filter === 'prayer' ? 'Prayers' : 'Milestones'}
                </button>
              ))}
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">No entries yet</h3>
              <p className="text-gray-600 mb-4 max-w-sm mx-auto">
                Start documenting your discipleship journey with notes and prayer requests.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredEntries.map(entry => (
                <div key={entry.id} className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    {/* Entry type icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      entry.entry_type === 'note'
                        ? 'bg-blue-100'
                        : entry.entry_type === 'prayer'
                        ? 'bg-purple-100'
                        : 'bg-green-100'
                    }`}>
                      {entry.entry_type === 'note' ? (
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      ) : entry.entry_type === 'prayer' ? (
                        <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Entry content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {entry.entry_type === 'prayer' ? 'Prayer Request' : entry.entry_type === 'note' ? 'Note' : 'Milestone'}
                        </span>
                        {entry.entry_type === 'prayer' && entry.is_answered && (
                          <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Answered
                          </span>
                        )}
                      </div>
                      <p className="text-navy whitespace-pre-wrap">{entry.content}</p>

                      {/* Answered prayer details */}
                      {entry.entry_type === 'prayer' && entry.is_answered && entry.answer_notes && (
                        <div className="mt-2 pl-3 border-l-2 border-green-300">
                          <p className="text-sm text-green-700 italic">{entry.answer_notes}</p>
                          {entry.answered_at && (
                            <p className="text-xs text-green-600 mt-1">
                              Answered {new Date(entry.answered_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Footer: author + date + actions */}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400">
                          {entry.created_by_name && `${entry.created_by_name} · `}
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>

                        {/* Mark as answered button (prayers only) */}
                        {entry.entry_type === 'prayer' && !entry.is_answered && (
                          <button
                            onClick={() => { setAnsweringEntry(entry); setAnswerNotes(''); }}
                            className="text-xs text-teal hover:text-teal/80 font-medium"
                          >
                            Mark Answered
                          </button>
                        )}

                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-xs text-gray-400 hover:text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Note/Prayer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-navy">
                {modalType === 'note' ? 'Add Note' : 'Add Prayer Request'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {submitError && (
              <div className="bg-red-50 text-red-700 rounded-lg p-4 mb-4 text-sm">
                {submitError}
              </div>
            )}

            <form onSubmit={handleAddEntry}>
              <textarea
                value={modalContent}
                onChange={(e) => setModalContent(e.target.value)}
                rows={4}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold resize-none"
                placeholder={modalType === 'note'
                  ? 'Write your note about this disciple...'
                  : 'Write the prayer request...'
                }
              />

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !modalContent.trim()}
                  className={`font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white ${
                    modalType === 'note'
                      ? 'bg-gold hover:bg-gold/90'
                      : 'bg-teal hover:bg-teal/90'
                  }`}
                >
                  {submitting ? 'Adding...' : modalType === 'note' ? 'Add Note' : 'Add Prayer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Prayer Answered Modal */}
      {answeringEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-navy">Mark Prayer Answered</h2>
              <button
                onClick={() => setAnsweringEntry(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-purple-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-purple-800">{answeringEntry.content}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1">
                How was this prayer answered? <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={answerNotes}
                onChange={(e) => setAnswerNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold resize-none"
                placeholder="Share how God answered this prayer..."
              />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setAnsweringEntry(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMarkAnswered(answeringEntry)}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Mark Answered
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileLoading() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
        <p className="mt-4 text-navy">Loading...</p>
      </div>
    </div>
  );
}

export default function DiscipleProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <DiscipleProfileContent />
    </Suspense>
  );
}
