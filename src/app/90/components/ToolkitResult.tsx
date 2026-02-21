'use client';

const outcomes = [
  'Hear God daily through Scripture and prayer',
  'Know what they believe — and why',
  'Stand in the gap for others through intercession',
  'Hear God for others with growing confidence',
  'Tell their story in a way that builds faith',
  'Name and break the lies that held them back',
  'Know who they are in Christ — backed by Scripture',
  'Know how God wired them and serve with their gifts',
  'Measure their own growth and set goals for what\'s next',
];

export default function ToolkitResult() {
  return (
    <>
      {/* Outcomes section */}
      <section
        style={{
          background: 'var(--lp-accent)',
          padding: '7rem 5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="tk-result"
      >
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,146,42,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

          <div className="fade-in" style={{ marginBottom: '4rem' }}>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--lp-gold)',
                marginBottom: '1.25rem',
              }}
            >
              By Week 12
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1.25,
                marginBottom: '0.75rem',
                maxWidth: '600px',
              }}
            >
              A disciple who is ready for what comes next.
            </h2>
            <p
              style={{
                fontSize: '1rem',
                color: 'rgba(255,255,255,0.45)',
                maxWidth: '540px',
                lineHeight: 1.7,
              }}
            >
              These are not aspirational outcomes. They are the measurable result of a disciple who engaged with every tool for 12 consecutive weeks. This is what readiness for Phase 2 looks like.
            </p>
          </div>

          {/* Outcome list */}
          <div
            className="fade-in tk-result-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1px',
              background: 'rgba(255,255,255,0.07)',
            }}
          >
            {outcomes.map((outcome, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--lp-accent)',
                  padding: '1.5rem 2rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'rgba(74,158,127,0.2)',
                    border: '1.5px solid var(--lp-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="var(--lp-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span
                  style={{
                    fontSize: '0.88rem',
                    color: 'rgba(255,255,255,0.75)',
                    lineHeight: 1.6,
                  }}
                >
                  {outcome}
                </span>
              </div>
            ))}
          </div>

          {/* Pull quote */}
          <div
            className="fade-in"
            style={{
              marginTop: '4rem',
              padding: '2.5rem 3rem',
              borderLeft: '3px solid var(--lp-gold)',
              background: 'rgba(212,168,83,0.06)',
            }}
          >
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
                fontStyle: 'italic',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.6,
                margin: '0 0 0.75rem',
              }}
            >
              &ldquo;This isn&rsquo;t a program. It&rsquo;s a formation process. Each tool is a practice disciples carry for the rest of their lives. The 90 days are just where they learn to pick them up.&rdquo;
            </p>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--lp-gold)',
              }}
            >
              — DNA Discipleship
            </div>
          </div>

        </div>
      </section>

      {/* CTA section */}
      <section
        style={{
          background: 'var(--lp-ink)',
          padding: '6rem 5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--lp-gold)',
              marginBottom: '1.5rem',
            }}
          >
            Ready to Launch DNA in Your Church?
          </div>
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
            Give your leaders a plan.{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--lp-gold)' }}>Watch it multiply.</em>
          </h2>
          <p
            style={{
              fontSize: '1rem',
              color: 'rgba(247,244,239,0.45)',
              marginBottom: '2.5rem',
              lineHeight: 1.7,
            }}
          >
            The 90-Day Toolkit is just Phase 1. DNA provides everything a church needs to run a full 12-month discipleship cycle — including the app, dashboard, and coaching your leaders need to make it reproducible.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/"
              style={{
                background: 'var(--lp-gold)',
                color: 'var(--lp-ink)',
                border: 'none',
                padding: '1rem 2.25rem',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.9rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'background 0.2s',
                borderRadius: 0,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--lp-gold-light)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--lp-gold)')}
            >
              Learn About DNA
            </a>
            <a
              href="mailto:info@dnadiscipleship.com"
              style={{
                background: 'transparent',
                color: 'rgba(247,244,239,0.65)',
                border: '1px solid rgba(247,244,239,0.2)',
                padding: '1rem 2.25rem',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.9rem',
                fontWeight: 500,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'border-color 0.2s, color 0.2s',
                borderRadius: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(247,244,239,0.5)';
                (e.currentTarget as HTMLElement).style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(247,244,239,0.2)';
                (e.currentTarget as HTMLElement).style.color = 'rgba(247,244,239,0.65)';
              }}
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
