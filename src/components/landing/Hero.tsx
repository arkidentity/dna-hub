'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useManualForm } from '@/hooks/useManualForm';

export default function Hero() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const { state, errorMsg, submit } = useManualForm();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit(email, firstName);
  }

  return (
    <section
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
          Your church wants<br />
          to multiply.<br />
          <em style={{ fontStyle: 'italic', color: 'var(--lp-gold)' }}>Nobody knows how.</em>
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
          DNA isn&apos;t accidental discipleship — it&apos;s loving people with a plan. A complete system that takes ordinary believers from &ldquo;wanting to make disciples&rdquo; to actually doing it. Reproducibly.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '420px' }}
        >
          <input
            type="text"
            placeholder="Your first name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={{
              padding: '0.9rem 1.25rem',
              border: '1.5px solid var(--lp-rule)',
              background: 'var(--lp-warm-white)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.95rem',
              color: 'var(--lp-ink)',
              outline: 'none',
              borderRadius: 0,
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="email"
              placeholder="Your email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                flex: 1,
                padding: '0.9rem 1.25rem',
                border: '1.5px solid var(--lp-rule)',
                background: 'var(--lp-warm-white)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.95rem',
                color: 'var(--lp-ink)',
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
                padding: '0.9rem 1.75rem',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.9rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                borderRadius: 0,
                transition: 'background 0.2s',
              }}
            >
              {state === 'submitting' ? 'Sending…' : state === 'success' ? '✓ Check your inbox!' : 'Get the Manual'}
            </button>
          </div>
          {state === 'error' && (
            <span style={{ fontSize: '0.78rem', color: '#c0392b' }}>{errorMsg}</span>
          )}
          <span style={{ fontSize: '0.78rem', color: 'var(--lp-mid)' }}>
            Free. No spam. Sent immediately to your inbox.
          </span>
        </form>
      </div>

      {/* Right */}
      <div
        style={{
          background: 'var(--lp-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2.5rem',
            padding: '3rem',
            width: '100%',
          }}
        >
          <Image
            src="/dna-logo-gold.png"
            alt="DNA"
            width={100}
            height={100}
            style={{ width: '100px', height: '100px', opacity: 0.9 }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%', maxWidth: '300px' }}>
            {[
              { num: '01', name: 'Foundation', desc: '90 days of tools, habits & transformation', delay: '0.15s' },
              { num: '02', name: 'Growth', desc: 'Disciples take ownership & lead', delay: '0.35s' },
              { num: '03', name: 'Multiplication', desc: 'One group becomes two. The cycle continues.', delay: '0.55s' },
            ].map((phase, i) => (
              <div key={phase.num}>
                {i > 0 && (
                  <div
                    style={{
                      width: '1px',
                      height: '1.25rem',
                      background: 'rgba(200,146,42,0.35)',
                      marginLeft: 'calc(1.5rem - 0.5px)',
                    }}
                  />
                )}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1rem 0',
                    opacity: 0,
                    animation: `lp-fadeSlideIn 0.5s ${phase.delay} forwards`,
                  }}
                >
                  <div
                    style={{
                      width: '3rem',
                      height: '3rem',
                      border: '1.5px solid rgba(200,146,42,0.5)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--lp-gold-light)',
                      flexShrink: 0,
                    }}
                  >
                    {phase.num}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#fff',
                        marginBottom: '0.15rem',
                      }}
                    >
                      {phase.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                      {phase.desc}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
