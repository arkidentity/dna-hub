'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, MapPin, Clock, Edit2, Trash2, Loader2, ChevronDown, RefreshCw } from 'lucide-react';

interface GroupEvent {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start_time: string;
  end_time?: string | null;
  is_recurring: boolean;
  parent_event_id?: string | null;
}

interface GroupMeetingsProps {
  groupId: string;
  onScheduleNew: () => void;
}

type DeleteScope = 'this' | 'this_and_future' | 'all';

interface EditForm {
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  duration: string;
}

function toLocalInputs(isoStart: string, isoEnd?: string | null): { date: string; time: string; duration: string } {
  const start = new Date(isoStart);
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
  const time = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
  let duration = '60';
  if (isoEnd) {
    const end = new Date(isoEnd);
    duration = String(Math.round((end.getTime() - start.getTime()) / 60000));
  }
  return { date, time, duration };
}

export default function GroupMeetings({ groupId, onScheduleNew }: GroupMeetingsProps) {
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete state
  const [deletingEvent, setDeletingEvent] = useState<GroupEvent | null>(null);
  const [deleteScope, setDeleteScope] = useState<DeleteScope>('this');
  const [deleting, setDeleting] = useState(false);

  // Edit state
  const [editingEvent, setEditingEvent] = useState<GroupEvent | null>(null);
  const [editScope, setEditScope] = useState<DeleteScope>('this');
  const [editForm, setEditForm] = useState<EditForm>({ title: '', description: '', location: '', date: '', time: '', duration: '60' });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const savingRef = useRef(false);

  const fetchEvents = async () => {
    try {
      const now = new Date().toISOString();
      const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch(`/api/calendar/events?group_id=${groupId}&start=${now}&end=${future}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      setError('Failed to load scheduled meetings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [groupId]);

  // ── Delete ────────────────────────────────────────────────────────────────

  const openDelete = (event: GroupEvent) => {
    setDeletingEvent(event);
    setDeleteScope('this');
  };

  const confirmDelete = async () => {
    if (!deletingEvent) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/calendar/events/${deletingEvent.id}?scope=${deleteScope}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setDeletingEvent(null);
      await fetchEvents();
    } catch {
      // Keep modal open so user can retry
    } finally {
      setDeleting(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────

  const openEdit = (event: GroupEvent) => {
    const { date, time, duration } = toLocalInputs(event.start_time, event.end_time);
    setEditingEvent(event);
    setEditScope('this');
    setEditError(null);
    setEditForm({
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      date,
      time,
      duration,
    });
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current || !editingEvent) return;
    savingRef.current = true;
    setSaving(true);
    setEditError(null);

    try {
      const startTime = new Date(`${editForm.date}T${editForm.time}`);
      const endTime = new Date(startTime.getTime() + parseInt(editForm.duration) * 60000);

      const res = await fetch(`/api/calendar/events/${editingEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: editScope,
          title: editForm.title,
          description: editForm.description || null,
          location: editForm.location || null,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }

      setEditingEvent(null);
      await fetchEvents();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const formatEventDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatEventTime = (start: string, end?: string | null) => {
    const s = new Date(start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (!end) return s;
    const e = new Date(end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${s} – ${e}`;
  };

  const isRecurring = (event: GroupEvent) => !!event.parent_event_id;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Scheduled Meetings
          </h2>
          <button
            onClick={onScheduleNew}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            + Schedule Meeting
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="px-6 py-6 text-sm text-red-600">{error}</div>
        ) : events.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500 text-sm">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            No meetings scheduled yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.map(event => (
              <div key={event.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-navy text-sm">{event.title}</span>
                    {isRecurring(event) && (
                      <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                        <RefreshCw className="w-3 h-3" />
                        Recurring
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatEventDate(event.start_time)} &middot; {formatEventTime(event.start_time, event.end_time)}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-xs text-gray-400 mt-1 truncate">{event.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(event)}
                    className="p-1.5 text-gray-400 hover:text-navy rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDelete(event)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deletingEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-navy mb-1">Delete Meeting</h3>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium">{deletingEvent.title}</span>
              {' — '}{formatEventDate(deletingEvent.start_time)}
            </p>

            {isRecurring(deletingEvent) ? (
              <div className="space-y-2 mb-6">
                {(
                  [
                    { value: 'this', label: 'This meeting only', desc: 'Only this one occurrence is removed.' },
                    { value: 'this_and_future', label: 'This and all future meetings', desc: 'This occurrence and every one after it are removed.' },
                    { value: 'all', label: 'All meetings in this series', desc: 'Every occurrence in the series is removed.' },
                  ] as { value: DeleteScope; label: string; desc: string }[]
                ).map(opt => (
                  <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${deleteScope === opt.value ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="deleteScope"
                      value={opt.value}
                      checked={deleteScope === opt.value}
                      onChange={() => setDeleteScope(opt.value)}
                      className="mt-0.5 text-red-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-navy">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 mb-6">This meeting will be permanently removed.</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingEvent(null)}
                disabled={deleting}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-5 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-navy">Edit Meeting</h3>
              <button onClick={() => setEditingEvent(null)} className="text-gray-400 hover:text-navy">
                ✕
              </button>
            </div>

            <form onSubmit={submitEdit} className="p-6 space-y-4">
              {editError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {editError}
                </div>
              )}

              {/* Scope selector — only for recurring events */}
              {isRecurring(editingEvent) && (
                <div>
                  <label className="block text-sm font-medium text-navy mb-2">Edit which meetings?</label>
                  <div className="space-y-2">
                    {(
                      [
                        { value: 'this', label: 'This meeting only' },
                        { value: 'this_and_future', label: 'This and all future meetings' },
                        { value: 'all', label: 'All meetings in this series' },
                      ] as { value: DeleteScope; label: string }[]
                    ).map(opt => (
                      <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${editScope === opt.value ? 'border-gold bg-gold/5' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="radio"
                          name="editScope"
                          value={opt.value}
                          checked={editScope === opt.value}
                          onChange={() => setEditScope(opt.value)}
                          className="text-gold"
                        />
                        <span className="text-sm font-medium text-navy">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                  className="input w-full"
                  required
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Date</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Time</label>
                  <input
                    type="time"
                    value={editForm.time}
                    onChange={e => setEditForm(p => ({ ...p, time: e.target.value }))}
                    className="input w-full"
                    required
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Duration</label>
                <select
                  value={editForm.duration}
                  onChange={e => setEditForm(p => ({ ...p, duration: e.target.value }))}
                  className="input w-full"
                >
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Location
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))}
                  className="input w-full"
                  placeholder="Coffee shop, church, online..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                  className="input w-full"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                <button type="button" onClick={() => setEditingEvent(null)} className="btn-secondary" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
