'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Calendar, Clock, MapPin, Loader2 } from 'lucide-react';

interface CohortEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  location?: string;
}

interface CohortMeta {
  cohortId: string;
  userRole: string;
  isMock: boolean;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDuration(start: string, end?: string) {
  if (!end) return formatTime(start);
  return `${formatTime(start)} – ${formatTime(end)}`;
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

// ============================================
// ADD EVENT MODAL
// ============================================

function AddEventModal({ cohortId, onClose, onSuccess }: {
  cohortId: string;
  onClose: () => void;
  onSuccess: (event: CohortEvent) => void;
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    time: '',
    duration: '120',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSaving(true);
    setError(null);

    try {
      const startTime = new Date(`${form.date}T${form.time}`);
      const endTime = new Date(startTime.getTime() + parseInt(form.duration) * 60000);

      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          location: form.location || null,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          event_type: 'cohort_event',
          cohort_id: cohortId,
          is_recurring: false,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create event');
      }

      const data = await res.json();
      onSuccess({
        id: data.event.id,
        title: form.title,
        description: form.description || undefined,
        location: form.location || undefined,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setSaving(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-navy flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gold" />
            Add Cohort Event
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-navy">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
              placeholder="Weekly Training Session"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm(p => ({ ...p, time: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Duration</label>
            <select
              value={form.duration}
              onChange={(e) => setForm(p => ({ ...p, duration: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
            >
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
              <option value="180">3 hours</option>
              <option value="480">Half day (8 hrs)</option>
              <option value="600">Full day (10 hrs)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              <MapPin className="w-3.5 h-3.5 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
              placeholder="Room 212, online, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
              rows={3}
              placeholder="What will you cover?"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-navy border border-gray-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-gold hover:bg-gold/90 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Creating...' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function CohortCalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CohortEvent[]>([]);
  const [meta, setMeta] = useState<CohortMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetch('/api/cohort')
      .then((r) => {
        if (r.status === 401) { router.push('/login'); return null; }
        return r.json();
      })
      .then((d) => {
        if (d) {
          setEvents(d.events || []);
          setMeta({
            cohortId: d.cohort?.id || '',
            userRole: d.currentUserRole || 'leader',
            isMock: d.mock || false,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold" />
      </div>
    );
  }

  const isTrainer = meta?.userRole === 'trainer';
  const isMock = meta?.isMock ?? true;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {isMock && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          <strong>Demo mode</strong> — showing sample events. A real cohort will display live calendar data.
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-navy">Upcoming Events</h2>
        {isTrainer && !isMock && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gold hover:bg-gold/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Add Event
          </button>
        )}
      </div>

      <div className="space-y-4">
        {events.map((event) => {
          const countdown = daysUntil(event.start_time);
          return (
            <div key={event.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="flex">
                <div className="bg-navy text-white flex flex-col items-center justify-center px-5 py-4 min-w-[72px]">
                  <span className="text-xs font-medium uppercase tracking-wide text-white/70">
                    {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="text-3xl font-bold leading-none mt-0.5">
                    {new Date(event.start_time).getDate()}
                  </span>
                  <span className="text-xs text-white/60 mt-0.5">
                    {new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
                <div className="flex-1 px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-navy">{event.title}</h3>
                    {countdown && (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                        countdown === 'Today' ? 'bg-red-100 text-red-700' :
                        countdown === 'Tomorrow' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {countdown}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-500">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    {formatDuration(event.start_time, event.end_time)}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      {event.location}
                    </div>
                  )}
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{event.description}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className="bg-white rounded-lg shadow px-6 py-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-navy font-semibold">No upcoming events</p>
          <p className="text-gray-500 text-sm mt-1">
            {isTrainer ? 'Add an event to get started.' : 'Your trainer will add cohort events here.'}
          </p>
        </div>
      )}

      {showAddModal && meta?.cohortId && (
        <AddEventModal
          cohortId={meta.cohortId}
          onClose={() => setShowAddModal(false)}
          onSuccess={(event) => {
            setEvents((prev) =>
              [...prev, event].sort(
                (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
              )
            );
          }}
        />
      )}
    </div>
  );
}
