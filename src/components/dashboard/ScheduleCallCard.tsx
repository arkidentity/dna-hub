'use client';

import { Calendar, Phone } from 'lucide-react';
import { ScheduledCall } from '@/lib/types';
import { formatCallDate } from './utils';

interface ScheduleCallCardProps {
  calls: ScheduledCall[];
}

export default function ScheduleCallCard({ calls }: ScheduleCallCardProps) {
  const upcomingCall = calls.find(c => !c.completed && new Date(c.scheduled_at) > new Date());

  return (
    <div className="card">
      <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-teal" />
        Schedule a Call
      </h3>
      {upcomingCall && (
        <div className="p-3 bg-teal/5 rounded-lg border-l-4 border-teal mb-4">
          <p className="text-xs text-teal font-medium uppercase tracking-wide">Upcoming</p>
          <p className="font-medium text-navy capitalize mt-1">
            {upcomingCall.call_type.replace('_', ' ')} Call
          </p>
          <p className="text-sm text-foreground-muted">
            {formatCallDate(upcomingCall.scheduled_at)}
          </p>
        </div>
      )}
      <div className="space-y-2">
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
