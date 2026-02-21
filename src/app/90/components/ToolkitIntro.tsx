'use client';

const months = [
  {
    tag: 'Month 01',
    title: 'Foundation',
    weeks: 'Weeks 1–4',
    desc: 'Disciples take a Life Assessment, learn to hear God through the 3D Journal, establish daily prayer through 4D Prayer, and build theological bedrock through Creed Cards. The goal is consistency, trust, and a daily rhythm that will sustain them for life.',
    color: 'var(--lp-gold)',
  },
  {
    tag: 'Month 02',
    title: 'Deepening',
    weeks: 'Weeks 5–8',
    desc: 'Disciples move from learning the tools to experiencing them in community. They ask hard questions, hear God for each other in a Listening Prayer Circle, go on mission together, and build powerful testimonies from what God does.',
    color: 'var(--lp-green)',
  },
  {
    tag: 'Month 03',
    title: 'Breakthrough',
    weeks: 'Weeks 9–12',
    desc: 'The deepest work. Disciples break strongholds, shift into their identity in Christ, discover and activate their spiritual gifts, and retake the Life Assessment to measure how far they\'ve come. By Week 12, they are ready for Phase 2.',
    color: 'var(--lp-gold)',
  },
];

export default function ToolkitIntro() {
  return (
    <section
      style={{
        background: 'var(--lp-ink)',
        padding: '6rem 5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="tk-intro"
    >
      <div
        style={{
          position: 'absolute',
          bottom: '-200px',
          left: '-200px',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(74,158,127,0.08) 0%, transparent 70%)',
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
            How It Works
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
              fontWeight: 900,
              color: '#fff',
              marginBottom: '0.75rem',
              lineHeight: 1.25,
              maxWidth: '600px',
            }}
          >
            Three months. One unbroken sequence.{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--lp-gold)' }}>No shortcuts.</em>
          </h2>
          <p
            style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.45)',
              maxWidth: '560px',
              lineHeight: 1.7,
            }}
          >
            Each week builds on the last. The order is not optional. By the time disciples reach Week 12 they have a foundation, a testimony, a freed identity, and an activated calling — built one week at a time.
          </p>
        </div>

        {/* Month timeline */}
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
          {months.map((month, i) => (
            <div
              key={month.tag}
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 1px 1fr',
                gap: '0 2.5rem',
              }}
            >
              {/* Time label */}
              <div
                style={{
                  textAlign: 'right',
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.3)',
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  paddingTop: '2.2rem',
                  paddingBottom: '2rem',
                  lineHeight: 1.5,
                }}
              >
                {month.weeks}
              </div>

              {/* Timeline line + dot */}
              <div
                style={{
                  width: '1px',
                  background: i < months.length - 1 ? 'rgba(200,146,42,0.25)' : 'transparent',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  paddingTop: '2.15rem',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: month.color,
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: 1,
                  }}
                />
              </div>

              {/* Content */}
              <div style={{ padding: '2rem 0' }}>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: month.color,
                    marginBottom: '0.4rem',
                  }}
                >
                  {month.tag}
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
                  {month.title}
                </div>
                <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
                  {month.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
