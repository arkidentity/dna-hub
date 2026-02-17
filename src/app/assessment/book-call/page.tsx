'use client';

import { useSearchParams } from 'next/navigation';
import { CheckCircle, Mail, CalendarClock } from 'lucide-react';
import { Suspense, useState, useEffect, useRef } from 'react';

const DISCOVERY_CALENDAR_EMBED =
  process.env.NEXT_PUBLIC_DISCOVERY_CALENDAR_URL ||
  'https://calendar.google.com/calendar/appointments/schedules/AcZssZ0LdUpKkvo_qoOrtiu6fQfPgkQJUZaG9RxPtYVieJrl1RAFnUmgTN9WATs6jAxSbkdo5M4-bpfI?gv=true';

function BookCallContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const firstName = searchParams.get('name') || '';
  const churchName = searchParams.get('church') || 'your church';
  const level = searchParams.get('level') || 'building';

  const [accessSent, setAccessSent] = useState(false);
  const [error, setError] = useState(false);
  const hasFired = useRef(false);

  // Fire the book-call API as soon as the page loads — the pastor has
  // already clicked "Book a Discovery Call" from the thank-you page to
  // get here, so this is the right moment to grant access.
  useEffect(() => {
    if (!email || hasFired.current) return;
    hasFired.current = true;

    fetch('/api/assessment/book-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firstName, churchName, readinessLevel: level }),
    })
      .then((res) => {
        if (res.ok) setAccessSent(true);
        else setError(true);
      })
      .catch(() => setError(true));
  }, [email, firstName, churchName, level]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold font-medium text-sm tracking-wide">DNA CHURCH HUB</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">

        {/* Page heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-6">
            <CalendarClock className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-3xl font-bold text-navy mb-2">Book Your Discovery Call</h1>
          <p className="text-foreground-muted max-w-lg mx-auto">
            Choose a time that works for you. This is a free 15-minute conversation to talk through DNA and see if it&apos;s the right fit for {churchName}.
          </p>
        </div>

        {/* Access confirmation banner */}
        {accessSent && (
          <div className="bg-success/10 border border-success/20 rounded-lg px-5 py-4 mb-8 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-success text-sm">Your dashboard access is on its way</p>
              <p className="text-foreground-muted text-sm mt-0.5">
                Check your email — we&apos;ve sent a login link to <strong>{email}</strong>. It gives you immediate access to your DNA Church Dashboard and the Launch Guide.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-4 mb-8 flex items-start gap-3">
            <Mail className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800 text-sm">
              We had trouble sending your access email. Don&apos;t worry — go ahead and book your call and we&apos;ll follow up with your dashboard link.
            </p>
          </div>
        )}

        {/* Embedded Google Calendar */}
        <div className="card">
          <div className="rounded-lg overflow-hidden border border-border">
            <iframe
              src={DISCOVERY_CALENDAR_EMBED}
              style={{ border: 0 }}
              width="100%"
              height="650"
              frameBorder="0"
              title="Book Your Discovery Call"
            />
          </div>
        </div>

        {/* What to expect */}
        <div className="mt-8 card bg-navy/5 border border-navy/10">
          <h3 className="font-semibold text-navy mb-3">What to expect on the call</h3>
          <ul className="space-y-2 text-sm text-foreground-muted">
            <li className="flex items-start gap-2"><span className="text-gold font-bold">—</span> We&apos;ll review your assessment results together</li>
            <li className="flex items-start gap-2"><span className="text-gold font-bold">—</span> Answer any questions you have about DNA Discipleship</li>
            <li className="flex items-start gap-2"><span className="text-gold font-bold">—</span> Discuss whether now is the right time for your church to launch</li>
            <li className="flex items-start gap-2"><span className="text-gold font-bold">—</span> Walk through the DNA Launch Guide and next steps if it&apos;s a good fit</li>
          </ul>
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center text-foreground-muted text-sm">
          Questions? Email{' '}
          <a href="mailto:info@dnadiscipleship.com" className="text-teal hover:text-teal-light">
            info@dnadiscipleship.com
          </a>
        </div>

      </main>
    </div>
  );
}

export default function BookCallPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground-muted">Loading...</div>
      </div>
    }>
      <BookCallContent />
    </Suspense>
  );
}
