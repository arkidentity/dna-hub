'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FooterCTA() {
  const [showBooking, setShowBooking] = useState(false);

  return (
    <>
      <section
        style={{
          background: 'var(--lp-ink)',
          padding: 'clamp(4rem, 8vw, 6rem) clamp(1.5rem, 5vw, 5rem)',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 900,
            color: 'var(--lp-paper)',
            marginBottom: '1rem',
            lineHeight: 1.15,
          }}
        >
          Your church has people<br />
          ready to{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--lp-gold)' }}>multiply.</em>
        </h2>
        <p
          style={{
            fontSize: 'clamp(0.95rem, 2vw, 1rem)',
            color: 'rgba(247,244,239,0.5)',
            maxWidth: '420px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.7,
          }}
        >
          Give them a plan. Give them an app. Set up yours free in 60 seconds.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Link
            href="/signup/conference"
            style={{
              background: 'var(--lp-gold)',
              color: 'var(--lp-ink)',
              padding: 'clamp(0.85rem, 2vw, 1rem) clamp(2rem, 4vw, 3rem)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textDecoration: 'none',
              display: 'inline-block',
              borderRadius: '4px',
              transition: 'opacity 0.2s',
            }}
          >
            Set Up Your Church App →
          </Link>
          <button
            onClick={() => setShowBooking(true)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontSize: '0.88rem',
              color: 'rgba(247,244,239,0.45)',
              borderBottom: '1px solid rgba(247,244,239,0.2)',
              paddingBottom: '1px',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            or book a discovery call
          </button>
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
