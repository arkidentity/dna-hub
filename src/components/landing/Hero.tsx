'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Hero() {
  const [showBooking, setShowBooking] = useState(false);

  return (
    <>
      <section
        style={{
          background: 'var(--lp-paper)',
          padding: 'clamp(5.5rem, 10vw, 9rem) clamp(1.5rem, 5vw, 5rem) clamp(3rem, 6vw, 5rem)',
          maxWidth: '1100px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--lp-gold)',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ display: 'block', width: '2rem', height: '1px', background: 'var(--lp-gold)', flexShrink: 0 }} />
          Discipleship Naturally Activated
        </div>

        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.6rem, 7vw, 4.75rem)',
            lineHeight: 1.05,
            color: 'var(--lp-ink)',
            marginBottom: '1.75rem',
            fontWeight: 900,
          }}
        >
          Finally.<br />
          <em style={{ fontStyle: 'italic', color: 'var(--lp-gold)' }}>An app built for disciple-making churches.</em>
        </h1>

        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '0 0 2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          {[
            'A proven discipleship system.',
            'Your white-labeled church app — set up in 60 seconds, free.',
          ].map((item) => (
            <li
              key={item}
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
                lineHeight: 1.7,
                color: 'var(--lp-mid)',
              }}
            >
              <span style={{ color: 'var(--lp-gold)', fontWeight: 700, flexShrink: 0, marginTop: '0.05em' }}>→</span>
              {item}
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
          <Link
            id="hero-cta"
            href="/signup/conference"
            style={{
              background: 'var(--lp-green)',
              color: '#fff',
              padding: 'clamp(0.85rem, 2vw, 1rem) clamp(1.75rem, 4vw, 2.5rem)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textDecoration: 'none',
              display: 'inline-block',
              borderRadius: '4px',
              transition: 'background 0.2s',
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
              color: 'var(--lp-mid)',
              borderBottom: '1px solid var(--lp-rule)',
              paddingBottom: '1px',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'color 0.2s',
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
