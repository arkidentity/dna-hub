'use client';

export default function ToolkitHero() {
  return (
    <section
      style={{
        background: 'var(--lp-accent)',
        padding: '9rem 5rem 6rem',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="tk-hero"
    >
      {/* Decorative radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '-150px',
          right: '-150px',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,146,42,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Eyebrow label */}
        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--lp-gold)',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ display: 'block', width: '2rem', height: '1px', background: 'var(--lp-gold)' }} />
          The 90-Day Toolkit — Phase 1 Foundation
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.5rem, 5vw, 4.25rem)',
            lineHeight: 1.08,
            color: '#fff',
            marginBottom: '1.75rem',
            fontWeight: 900,
            maxWidth: '750px',
          }}
        >
          Twelve tools.<br />
          <em style={{ fontStyle: 'italic', color: 'var(--lp-gold)' }}>Ninety days.</em>{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--lp-green)' }}>A disciple who can multiply.</em>
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontSize: '1.1rem',
            lineHeight: 1.8,
            color: 'rgba(255,255,255,0.55)',
            maxWidth: '600px',
            marginBottom: '3rem',
          }}
        >
          The 90-Day Toolkit is the structured heart of Phase 1 — a week-by-week sequence of tools that takes a brand-new disciple from self-assessment to spiritual freedom, daily habits, and readiness to lead others. This is what happens inside a DNA group for the first 12 weeks.
        </p>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: '3rem',
            flexWrap: 'wrap',
          }}
        >
          {[
            { number: '12', label: 'Weeks' },
            { number: '3', label: 'Months' },
            { number: '12', label: 'Tools' },
            { number: '1', label: 'Transformed Disciple' },
          ].map((stat) => (
            <div key={stat.label}>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: 'var(--lp-gold)',
                  lineHeight: 1,
                  marginBottom: '0.3rem',
                }}
              >
                {stat.number}
              </div>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
