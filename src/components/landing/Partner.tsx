'use client';

import { useState } from 'react';
import Link from 'next/link';

const steps = [
  {
    n: '01',
    title: 'Set Up Your Church App',
    text: 'Start free. Your white-labeled discipleship app is live in 60 seconds — your name, your colors, your logo. No credit card required.',
  },
  {
    n: '02',
    title: 'Explore Your Dashboard',
    text: 'Browse DNA groups, training resources, and your church\'s discipleship tools. Get familiar with the system before you go all in.',
  },
  {
    n: '03',
    title: 'Book a Discovery Call',
    text: '30 minutes with a DNA coach. We\'ll listen to your context and be honest about whether a full partnership makes sense.',
  },
];

export default function Partner() {
  const [showBooking, setShowBooking] = useState(false);

  return (
    <>
      <section
        style={{ background: 'var(--lp-paper)', padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 5rem)' }}
        className="lp-partner"
      >
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>

          <div className="fade-in" style={{ marginBottom: 'clamp(2.5rem, 6vw, 3.5rem)' }}>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--lp-gold)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <span style={{ display: 'block', width: '2rem', height: '1px', background: 'var(--lp-gold)', flexShrink: 0 }} />
              Getting Started
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(1.9rem, 4.5vw, 2.8rem)',
                fontWeight: 900,
                lineHeight: 1.15,
                marginBottom: '0.75rem',
              }}
            >
              Ready to implement DNA in your church?
            </h2>
            <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1rem)', color: 'var(--lp-mid)', lineHeight: 1.7 }}>
              Here&apos;s how churches go from first click to multiplying disciples.
            </p>
          </div>

          <div
            className="fade-in"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              background: 'var(--lp-rule)',
              border: '1px solid var(--lp-rule)',
              marginBottom: 'clamp(2rem, 5vw, 3rem)',
            }}
            id="lp-partner-steps"
          >
            {steps.map((step) => (
              <div
                key={step.n}
                style={{
                  background: 'var(--lp-warm-white)',
                  padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1.25rem, 3vw, 2rem)',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 'clamp(2rem, 5vw, 2.5rem)',
                    fontWeight: 900,
                    color: 'var(--lp-green)',
                    marginBottom: '0.6rem',
                    lineHeight: 1,
                  }}
                >
                  {step.n}
                </div>
                <div style={{ fontWeight: 600, fontSize: 'clamp(0.92rem, 2vw, 0.95rem)', marginBottom: '0.4rem' }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 'clamp(0.85rem, 2vw, 0.88rem)', lineHeight: 1.7, color: 'var(--lp-mid)' }}>
                  {step.text}
                </div>
              </div>
            ))}
          </div>

          <div
            className="fade-in"
            style={{
              background: 'var(--lp-accent)',
              padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1.5rem, 4vw, 3rem)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.75rem',
            }}
            id="lp-partner-cta"
          >
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--lp-gold)',
                  marginBottom: '0.75rem',
                }}
              >
                Let&apos;s Talk
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(1.4rem, 3.5vw, 1.75rem)',
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: '0.6rem',
                  lineHeight: 1.25,
                }}
              >
                Ready to have a conversation?<br />Let&apos;s talk about your church.
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
              <button
                onClick={() => setShowBooking(true)}
                style={{
                  border: '1.5px solid rgba(255,255,255,0.45)',
                  background: 'transparent',
                  color: '#fff',
                  padding: '0.9rem 2rem',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  letterSpacing: '0.03em',
                  borderRadius: 0,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'var(--lp-gold)';
                  el.style.borderColor = 'var(--lp-gold)';
                  el.style.color = 'var(--lp-ink)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'transparent';
                  el.style.borderColor = 'rgba(255,255,255,0.45)';
                  el.style.color = '#fff';
                }}
              >
                Book a Discovery Call
              </button>
              <Link
                href="/signup/conference"
                style={{
                  fontSize: '0.88rem',
                  color: 'rgba(255,255,255,0.5)',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.2)',
                  paddingBottom: '1px',
                }}
              >
                or set up your church app first →
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Booking modal */}
      {showBooking && (
        <div
          onClick={() => setShowBooking(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #eee',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'var(--lp-ink)',
                }}
              >
                Book a Discovery Call
              </span>
              <button
                onClick={() => setShowBooking(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.4rem',
                  lineHeight: 1,
                  color: '#999',
                  padding: '0 0.25rem',
                  fontFamily: 'sans-serif',
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <iframe
              src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ1E8bA8sb4SP7QBJw45-6zKwxVNFu6x7w4YMBABJ1qdiE9ALT7hGvOlJ2RUGcfV9LwopqFiGPGe?gv=true"
              style={{ border: 0, flex: 1, minHeight: '560px' }}
              width="100%"
              frameBorder={0}
              title="Book a Discovery Call"
            />
          </div>
        </div>
      )}
    </>
  );
}
