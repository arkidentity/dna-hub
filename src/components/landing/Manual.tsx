'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useManualForm } from '@/hooks/useManualForm';

const contents = [
  'The biblical case for multiplication — not just addition',
  'The complete 3-phase DNA process explained',
  'How to identify and invite the right disciples',
  'What makes a disciple actually ready to multiply',
  'The most common mistakes — and how to avoid them',
  'How to cast vision for multiplication in your church',
];

export default function Manual() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [church, setChurch] = useState('');
  const router = useRouter();
  const { state, errorMsg, submit } = useManualForm(() => router.push('/thank-you'));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit(email, firstName, church);
  }

  return (
    <section
      id="manual"
      style={{ background: 'var(--lp-accent)', padding: '5rem 5rem 6rem' }}
      className="lp-manual"
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '5rem',
          alignItems: 'start',
        }}
        className="lp-manual-inner"
      >
        {/* Left — cover + copy */}
        <div className="fade-in">
          {/* Cover + headline side by side */}
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div style={{ flexShrink: 0 }}>
              <Image
                src="/manual-cover.png"
                alt="DNA Multiplication Manual Cover"
                width={160}
                height={226}
                placeholder="empty"
                style={{
                  width: '160px',
                  height: 'auto',
                  display: 'block',
                  boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
                  background: 'transparent',
                }}
              />
            </div>
            <div style={{ paddingTop: '0.5rem' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--lp-gold)',
                  marginBottom: '1rem',
                }}
              >
                Start Here
              </div>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(1.6rem, 2.5vw, 2.4rem)',
                  fontWeight: 900,
                  lineHeight: 1.15,
                  color: '#fff',
                }}
              >
                The{' '}
                <em style={{ fontStyle: 'italic', color: 'var(--lp-gold)' }}>DNA Multiplication Manual</em>{' '}
                is free. Start with this.
              </h2>
            </div>
          </div>

          <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'rgba(247,244,239,0.7)', marginBottom: '1.75rem' }}>
            Before you launch anything, read this. Six sessions that give your leaders the &ldquo;why&rdquo; that makes the &ldquo;how&rdquo; stick — and the conviction to actually start.
          </p>
          <ul style={{ listStyle: 'none' }}>
            {contents.map((item) => (
              <li
                key={item}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: '0.6rem 0',
                  borderBottom: '1px solid rgba(247,244,239,0.1)',
                  fontSize: '0.92rem',
                  color: 'rgba(247,244,239,0.75)',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ color: 'var(--lp-gold)', fontWeight: 600, flexShrink: 0 }}>→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form card */}
        <div
          className="fade-in"
          style={{
            background: 'var(--lp-accent-light)',
            color: 'var(--lp-paper)',
            padding: '3rem',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(247,244,239,0.08)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(200,146,42,0.12) 0%, transparent 70%)',
            }}
          />
          <div
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--lp-gold)',
              marginBottom: '1.25rem',
              position: 'relative',
              zIndex: 1,
            }}
          >
            Free Download
          </div>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
              lineHeight: 1.3,
              position: 'relative',
              zIndex: 1,
            }}
          >
            DNA Multiplication Manual
          </div>
          <div
            className="lp-form-hint"
            style={{
              fontSize: '0.875rem',
              color: 'rgba(247,244,239,0.5)',
              marginBottom: '2rem',
              position: 'relative',
              zIndex: 1,
            }}
          >
            6 sessions · 49 pages · Sent immediately
          </div>
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', zIndex: 1 }}
          >
            <input
              type="text"
              placeholder="Your first name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={{
                padding: '0.85rem 1.1rem',
                background: 'rgba(247,244,239,0.07)',
                border: '1px solid rgba(247,244,239,0.18)',
                color: 'var(--lp-paper)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.92rem',
                outline: 'none',
                borderRadius: 0,
              }}
            />
            <input
              type="email"
              placeholder="Your email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: '0.85rem 1.1rem',
                background: 'rgba(247,244,239,0.07)',
                border: '1px solid rgba(247,244,239,0.18)',
                color: 'var(--lp-paper)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.92rem',
                outline: 'none',
                borderRadius: 0,
              }}
            />
            <input
              type="text"
              placeholder="Church name (optional)"
              value={church}
              onChange={(e) => setChurch(e.target.value)}
              style={{
                padding: '0.85rem 1.1rem',
                background: 'rgba(247,244,239,0.07)',
                border: '1px solid rgba(247,244,239,0.18)',
                color: 'var(--lp-paper)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.92rem',
                outline: 'none',
                borderRadius: 0,
              }}
            />
            <button
              type="submit"
              disabled={state === 'submitting' || state === 'success'}
              style={{
                background: state === 'success' ? '#3a5a4a' : 'var(--lp-gold)',
                color: state === 'success' ? '#fff' : 'var(--lp-ink)',
                border: 'none',
                padding: '1rem',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.9rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'center',
                borderRadius: 0,
                transition: 'background 0.2s',
              }}
            >
              {state === 'submitting' ? 'Sending…' : state === 'success' ? '✓ Check your inbox!' : 'Send Me the Manual →'}
            </button>
            {state === 'error' && (
              <span style={{ fontSize: '0.875rem', color: '#f87171' }}>{errorMsg}</span>
            )}
            <span className="lp-form-hint" style={{ fontSize: '0.875rem', color: 'rgba(247,244,239,0.45)', marginTop: '0.25rem' }}>
              No spam. Unsubscribe anytime.
            </span>
          </form>
        </div>
      </div>
    </section>
  );
}
