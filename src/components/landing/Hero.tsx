'use client';

export default function Hero() {
  return (
    <section
      style={{
        background: 'var(--lp-paper)',
        padding: '9rem 5rem 6rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        maxWidth: '860px',
      }}
      className="hero-section"
    >
      <div
        style={{
          fontSize: '0.75rem',
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
        <span style={{ display: 'block', width: '2rem', height: '1px', background: 'var(--lp-gold)' }} />
        Discipleship Naturally Activated
      </div>

      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(3rem, 6vw, 5.5rem)',
          lineHeight: 1.0,
          color: 'var(--lp-ink)',
          marginBottom: '2rem',
          fontWeight: 900,
          maxWidth: '820px',
        }}
      >
        Your church was<br />
        made to multiply.<br />
        <em style={{ fontStyle: 'italic', color: 'var(--lp-gold)' }}>Give your people a<br />system worth following.</em>
      </h1>

      <p
        style={{
          fontSize: '1.15rem',
          lineHeight: 1.8,
          color: 'var(--lp-mid)',
          maxWidth: '580px',
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
        }}
      >
        <span style={{ display: 'block', width: '2rem', height: '1px', background: 'var(--lp-rule)' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--lp-mid)', lineHeight: 1.5 }}>
          Used in churches across the U.S. — start with the free manual below.
        </span>
      </div>
    </section>
  );
}
