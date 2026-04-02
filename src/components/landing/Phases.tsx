const phases = [
  {
    time: 'Months 1–3',
    tag: 'Phase 01',
    title: 'Foundation',
    detail:
      'Disciples build daily habits and spiritual disciplines over 90 days. Leaders model before they teach. This is where transformation happens and the DNA culture gets established.',
  },
  {
    time: 'Months 4–8',
    tag: 'Phase 02',
    title: 'Growth',
    detail:
      'Disciples move from being led to leading. They begin facilitating sessions, ministering to one another, and going on outreach. The leader shifts from teacher to coach — building ownership rather than dependence.',
  },
  {
    time: 'Months 9–12',
    tag: 'Phase 03',
    title: 'Multiplication',
    detail:
      'The Multiplication Readiness Assessment confirms who\'s ready. One group becomes two. The disciple is now the leader. The cycle begins again — exponentially. This is the moment the whole journey was building toward.',
  },
];

export default function Phases() {
  return (
    <section
      style={{
        background: 'var(--lp-accent)',
        padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 5rem)',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="lp-phases"
    >
      <div
        style={{
          position: 'absolute',
          bottom: '-200px',
          left: '-200px',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,146,42,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '720px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        <div className="fade-in" style={{ marginBottom: 'clamp(2.5rem, 6vw, 4rem)' }}>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--lp-gold)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <span style={{ display: 'block', width: '2rem', height: '1px', background: 'var(--lp-gold)', flexShrink: 0 }} />
            The DNA Journey
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.9rem, 4.5vw, 2.8rem)',
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1.15,
              marginBottom: '0.75rem',
            }}
          >
            Three phases.{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--lp-gold)' }}>6–12 months.</em>{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--lp-green)' }}>A disciple-maker on the other side.</em>
          </h2>
          <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1rem)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            No shortcuts. No guesswork. A reproducible process leaders can run on their own after one full cycle.
          </p>
        </div>

        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
          {phases.map((phase, i) => (
            <div
              key={phase.tag}
              style={{
                display: 'flex',
                gap: '1.5rem',
                paddingBottom: i < phases.length - 1 ? 'clamp(2rem, 5vw, 3rem)' : 0,
              }}
            >
              {/* Timeline indicator */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'var(--lp-gold)',
                    flexShrink: 0,
                    marginTop: '0.35rem',
                  }}
                />
                {i < phases.length - 1 && (
                  <div
                    style={{
                      width: '1px',
                      flex: 1,
                      background: 'rgba(200,146,42,0.3)',
                      marginTop: '0.5rem',
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div style={{ paddingBottom: i < phases.length - 1 ? 'clamp(1rem, 3vw, 1.5rem)' : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'var(--lp-gold)',
                    }}
                  >
                    {phase.tag}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'rgba(255,255,255,0.35)',
                      fontWeight: 500,
                      letterSpacing: '0.03em',
                    }}
                  >
                    {phase.time}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 'clamp(1.2rem, 3vw, 1.4rem)',
                    fontWeight: 700,
                    color: '#fff',
                    marginBottom: '0.5rem',
                  }}
                >
                  {phase.title}
                </div>
                <div style={{ fontSize: 'clamp(0.88rem, 2vw, 0.92rem)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75 }}>
                  {phase.detail}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
