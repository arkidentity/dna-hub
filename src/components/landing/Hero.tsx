'use client';

export default function Hero() {
  return (
    <section
      style={{
        background: 'var(--lp-paper)',
        padding: '9rem 5rem 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        maxWidth: '1100px',
        margin: '0 auto',
        width: '100%',
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
          fontSize: 'clamp(3rem, 5.5vw, 4.75rem)',
          lineHeight: 1.05,
          color: 'var(--lp-ink)',
          marginBottom: '2rem',
          fontWeight: 900,
          maxWidth: '680px',
        }}
      >
        Your church was made to multiply.<br />
        <em style={{ fontStyle: 'italic', color: 'var(--lp-gold)' }}>Give them a plan.</em><br />
        <em style={{ fontStyle: 'italic', color: 'var(--lp-green)' }}>Watch it grow.</em>
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

    </section>
  );
}
