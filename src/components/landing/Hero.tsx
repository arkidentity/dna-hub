'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useManualForm } from '@/hooks/useManualForm';

export default function Hero() {
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
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        paddingTop: '5rem',
      }}
      className="hero-section"
    >
      {/* Left */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '5rem 4rem 5rem 5rem',
        }}
        className="hero-left"
      >
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--lp-gold)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ display: 'block', width: '2rem', height: '1px', background: 'var(--lp-gold)' }} />
          Discipleship Naturally Activated
        </div>

        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
            lineHeight: 1.05,
            color: 'var(--lp-ink)',
            marginBottom: '1.5rem',
            fontWeight: 900,
          }}
        >
          Your church was<br />
          made to multiply.<br />
          <em style={{ fontStyle: 'italic', color: 'var(--lp-gold)' }}>Give your people a system worth following.</em>
        </h1>

        <p
          style={{
            fontSize: '1.1rem',
            lineHeight: 1.75,
            color: 'var(--lp-mid)',
            maxWidth: '480px',
            marginBottom: '2.5rem',
          }}
        >
          DNA isn&apos;t accidental discipleship — it&apos;s loving people with a plan. A proven, three-phase process that takes ordinary believers from &ldquo;wanting to make disciples&rdquo; to naturally multiplying year after year.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            paddingTop: '0.5rem',
          }}
        >
          <span
            style={{
              display: 'block',
              width: '2rem',
              height: '1px',
              background: 'var(--lp-rule)',
            }}
          />
          <span style={{ fontSize: '0.82rem', color: 'var(--lp-mid)', lineHeight: 1.5 }}>
            Used in churches across the U.S. — start with the free manual →
          </span>
        </div>
      </div>

      {/* Right — Manual card */}
      <div
        style={{
          background: 'var(--lp-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: '5rem 4rem',
        }}
        className="hero-right"
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(200,146,42,0.25) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 80%, rgba(200,146,42,0.12) 0%, transparent 50%)
            `,
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: '400px',
          }}
        >
          <Image
            src="/dna-logo-gold.png"
            alt="DNA"
            width={56}
            height={56}
            style={{ width: '56px', height: '56px', marginBottom: '1.75rem', opacity: 0.9 }}
          />
          <div
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--lp-gold)',
              marginBottom: '1rem',
            }}
          >
            Free Download
          </div>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.6rem',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '0.5rem',
              lineHeight: 1.25,
            }}
          >
            DNA Multiplication Manual
          </div>
          <div
            style={{
              fontSize: '0.82rem',
              color: 'rgba(247,244,239,0.45)',
              marginBottom: '2rem',
            }}
          >
            6 sessions · 49 pages · Sent immediately
          </div>
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
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
                background: state === 'success' ? 'var(--lp-accent-light)' : 'var(--lp-gold)',
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
              {state === 'submitting' ? 'Sending…' : state === 'success' ? '✓ Check your inbox!' : 'Get the Free Manual →'}
            </button>
            {state === 'error' && (
              <span style={{ fontSize: '0.78rem', color: '#f87171' }}>{errorMsg}</span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'rgba(247,244,239,0.35)', marginTop: '0.25rem' }}>
              Free. No spam. Sent immediately to your inbox.
            </span>
          </form>
        </div>
      </div>
    </section>
  );
}
