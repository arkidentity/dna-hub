const phases = [
  {
    time: 'Months 1–3',
    tag: 'Phase 01',
    title: 'Foundation',
    detail:
      'The 90-day toolkit — 3D Journal, Creed Cards, Listening Prayer Circle, 4D Prayer, Life Assessment. Disciples build daily habits. Leaders model before they teach. This is where transformation happens and the DNA culture gets established.',
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
        padding: '7rem 5rem',
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
        }}
      />
      <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div className="fade-in" style={{ textAlign: 'center', marginBottom: '5rem' }}>
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
            The DNA Journey
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
              fontWeight: 900,
              color: '#fff',
              marginBottom: '0.75rem',
              lineHeight: 1.3,
            }}
          >
            Three Phases.<br />
            <em style={{ fontStyle: 'italic', color: 'var(--lp-gold)' }}>6 – 12 months.</em><br />
            <em style={{ fontStyle: 'italic', color: 'var(--lp-green)' }}>A disciple-maker on the other side.</em>
          </h2>
          <p
            style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.5)',
              maxWidth: '500px',
              margin: '0 auto',
              lineHeight: 1.65,
            }}
          >
            No shortcuts. No guesswork. A reproducible process leaders can run on their own after one full cycle.
          </p>
        </div>

        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
          {phases.map((phase) => (
            <div
              key={phase.tag}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1px 1fr',
                gap: '0 2rem',
              }}
            >
              <div
                style={{
                  textAlign: 'right',
                  fontSize: '0.78rem',
                  color: 'rgba(255,255,255,0.38)',
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  paddingTop: '2.2rem',
                  paddingBottom: '2rem',
                }}
              >
                {phase.time}
              </div>
              <div
                style={{
                  width: '1px',
                  background: 'rgba(200,146,42,0.3)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  paddingTop: '2.1rem',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: 'var(--lp-gold)',
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: 1,
                  }}
                />
              </div>
              <div style={{ padding: '2rem 0' }}>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--lp-gold)',
                    marginBottom: '0.4rem',
                  }}
                >
                  {phase.tag}
                </div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: '#fff',
                    marginBottom: '0.5rem',
                  }}
                >
                  {phase.title}
                </div>
                <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>
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
