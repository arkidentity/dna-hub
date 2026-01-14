'use client';

import { Calendar, Phone, CheckCircle, Clock } from 'lucide-react';
import { ScheduledCall } from '@/lib/types';
import { formatCallDate } from './utils';

interface ScheduleCallCardProps {
  calls: ScheduledCall[];
}

export default function ScheduleCallCard({ calls }: ScheduleCallCardProps) {
  // Find the next upcoming uncompleted call
  const upcomingCall = calls.find(c => !c.completed && new Date(c.scheduled_at) > new Date());

  // Get all uncompleted calls (including past ones that haven't been marked complete)
  const pendingCalls = calls.filter(c => !c.completed);

  // Get completed calls
  const completedCalls = calls.filter(c => c.completed);

  return (
    <div className="card">
      <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-teal" />
        Scheduled Calls
      </h3>

      {/* Show all scheduled calls */}
      {calls.length > 0 ? (
        <div className="space-y-3 mb-4">
          {/* Pending/Upcoming calls first */}
          {pendingCalls.map(call => {
            const isPast = new Date(call.scheduled_at) < new Date();
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
              </div>
            );
          })}

          {/* Completed calls */}
          {completedCalls.map(call => (
            <div
              key={call.id}
              className="p-3 rounded-lg bg-success/5 border-l-4 border-success"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <p className="text-xs font-medium uppercase tracking-wide text-success">
                  Completed
                </p>
              </div>
              <p className="font-medium text-navy capitalize mt-1">
                {call.call_type.replace('_', ' ')} Call
              </p>
              <p className="text-sm text-foreground-muted">
                {formatCallDate(call.scheduled_at)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-foreground-muted mb-4">No calls scheduled yet.</p>
      )}

      {/* Booking links */}
      <div className="space-y-2 pt-2 border-t border-card-border">
        <p className="text-xs text-foreground-muted mb-2">Need to schedule a call?</p>
        <a
          href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ06-H6-Lu-ReUlLa7bTB0qgXj9c1DxocZWH7WxTLw__s9chlLMDflEtH_my63oqNrQAaV7oahqR?gv=true"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors font-medium"
        >
          <Phone className="w-4 h-4" />
          Book 60-Minute Strategy Call
        </a>
        <a
          href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0LdUpKkvo_qoOrtiu6fQfPgkQJUZaG9RxPtYVieJrl1RAFnUmgTN9WATs6jAxSbkdo5M4-bpfI?gv=true"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2 border border-teal text-teal rounded-lg hover:bg-teal/5 transition-colors text-sm"
        >
          <Calendar className="w-4 h-4" />
          Quick 15-Minute Check-In
        </a>
      </div>
    </div>
  );
}
