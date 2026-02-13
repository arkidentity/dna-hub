'use client';

import { useState } from 'react';
import { useManualForm } from '@/hooks/useManualForm';

export default function FooterCTA() {
  const [email, setEmail] = useState('');
  const { state, errorMsg, submit } = useManualForm();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit(email);
  }

  return (
    <section
      style={{
        background: 'var(--lp-ink)',
        padding: '6rem 5rem',
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(2rem, 4vw, 3rem)',
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
          fontSize: '1rem',
          color: 'rgba(247,244,239,0.5)',
          maxWidth: '480px',
          margin: '0 auto 2.5rem',
          lineHeight: 1.65,
        }}
      >
        Give them a plan. Start with the free Multiplication Manual.
      </p>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', gap: '0.5rem', maxWidth: '460px', margin: '0 auto 1rem' }}
        className="lp-footer-form"
      >
        <input
          type="email"
          placeholder="Your email address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            flex: 1,
            padding: '0.9rem 1.25rem',
            background: 'rgba(247,244,239,0.08)',
            border: '1px solid rgba(247,244,239,0.18)',
            color: 'var(--lp-paper)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.95rem',
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
      </form>
      {state === 'error' && (
        <p style={{ fontSize: '0.78rem', color: '#f87171', marginBottom: '0.25rem' }}>{errorMsg}</p>
      )}
      <p className="lp-form-hint" style={{ fontSize: '0.875rem', color: 'rgba(247,244,239,0.45)' }}>
        Free. No spam. Sent immediately.
      </p>
    </section>
  );
}
