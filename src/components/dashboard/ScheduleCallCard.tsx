'use client';

import { Calendar, Phone, Clock, Video } from 'lucide-react';
import { ScheduledCall } from '@/lib/types';
import { formatCallDate } from './utils';

interface ScheduleCallCardProps {
  calls: ScheduledCall[];
}

export default function ScheduleCallCard({ calls }: ScheduleCallCardProps) {
  // Only show uncompleted calls (completed calls are hidden)
  const upcomingCalls = calls.filter(c => !c.completed);

  return (
    <div className="card">
      <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-teal" />
        Upcoming Calls
      </h3>

      {/* Show only upcoming/pending calls */}
      {upcomingCalls.length > 0 ? (
        <div className="space-y-3 mb-4">
          {upcomingCalls.map(call => {
            const isPast = new Date(call.scheduled_at) < new Date();
            const isUpcoming = !isPast;
            return (
              <div
                key={call.id}
                className={`p-3 rounded-lg border-l-4 ${
                  isPast
                    ? 'bg-amber-50 border-amber-400'
                    : 'bg-teal/5 border-teal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${isPast ? 'text-amber-500' : 'text-teal'}`} />
                  <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                    {isPast ? 'Pending Completion' : 'Upcoming'}
                  </p>
                </div>
                <p className="font-medium text-navy capitalize mt-1">
                  {call.call_type.replace('_', ' ')} Call
                </p>
                <p className="text-sm text-foreground-muted">
                  {formatCallDate(call.scheduled_at)}
                </p>
                {/* Show Meet link for upcoming calls */}
                {isUpcoming && call.meet_link && (
                  <a
                    href={call.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-teal text-white text-xs font-medium rounded hover:bg-teal/90 transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Join Google Meet
                  </a>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-foreground-muted mb-4">No upcoming calls scheduled.</p>
      )}

      {/* Booking links */}
      <div className="pt-2 border-t border-card-border">
        <p className="text-xs text-foreground-muted mb-2">Need to schedule a call?</p>
        <a
          href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ06-H6-Lu-ReUlLa7bTB0qgXj9c1DxocZWH7WxTLw__s9chlLMDflEtH_my63oqNrQAaV7oahqR?gv=true"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors font-medium"
        >
          <Phone className="w-4 h-4" />
          Book 60-Minute Call
        </a>
        <div className="flex gap-2 mt-2">
          <a
            href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ1E8bA8sb4SP7QBJw45-6zKwxVNFu6x7w4YMBABJ1qdiE9ALT7hGvOlJ2RUGcfV9LwopqFiGPGe?gv=true"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-teal text-teal rounded-lg hover:bg-teal/5 transition-colors text-sm"
          >
            <Calendar className="w-4 h-4" />
            30-Minute Call
          </a>
          <a
            href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0LdUpKkvo_qoOrtiu6fQfPgkQJUZaG9RxPtYVieJrl1RAFnUmgTN9WATs6jAxSbkdo5M4-bpfI?gv=true"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-teal text-teal rounded-lg hover:bg-teal/5 transition-colors text-sm"
          >
            <Calendar className="w-4 h-4" />
            15-Minute Check-In
          </a>
        </div>
      </div>
    </div>
  );
}
