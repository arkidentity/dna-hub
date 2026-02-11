'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CohortEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  location?: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });
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

export default function CohortCalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CohortEvent[]>([]);
  const [userRole, setUserRole] = useState('leader');
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    fetch('/api/cohort')
      .then((r) => {
        if (r.status === 401) { router.push('/login'); return null; }
        return r.json();
      })
      .then((d) => {
        if (d) {
          setEvents(d.events || []);
          setUserRole(d.currentUserRole || 'leader');
          setIsMock(d.mock || false);
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {isMock && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          <strong>Demo mode</strong> — showing sample events. A real cohort will display live calendar data.
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-navy">Upcoming Events</h2>
        {userRole === 'trainer' && (
          <button className="bg-gold hover:bg-gold/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
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
                {/* Date column */}
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

                {/* Content */}
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
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDuration(event.start_time, event.end_time)}
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
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
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-navy font-semibold">No upcoming events</p>
          <p className="text-gray-500 text-sm mt-1">Your trainer will add cohort events here.</p>
        </div>
      )}
    </div>
  );
}
