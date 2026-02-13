export default function Problem() {
  return (
    <section
      style={{
        background: 'var(--lp-ink)',
        color: 'var(--lp-paper)',
        padding: '6rem 5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="lp-problem"
    >
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,146,42,0.08) 0%, transparent 70%)',
        }}
      />
      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '5rem',
          alignItems: 'center',
        }}
        className="lp-problem-inner"
      >
        <div>
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
            The Real Problem
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2rem, 3.5vw, 3rem)',
              lineHeight: 1.15,
              fontWeight: 900,
              marginBottom: '1.5rem',
            }}
          >
            Everyone agrees on multiplication. No one knows how to do it.
          </h2>
          <div style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'rgba(247,244,239,0.7)' }}>
            <p>
              Right now, you probably have 20 people in your church who genuinely want to make disciples. They nod when you preach on it. They mean it when they say it. And they have absolutely no idea where to start.
            </p>
            <p style={{ marginTop: '1rem' }}>
              It&apos;s not a motivation problem. It&apos;s not a curriculum problem. It&apos;s a{' '}
              <strong>system problem.</strong> Most churches have great content but no infrastructure to turn willing people into reproducing disciple-makers.
            </p>
            <p style={{ marginTop: '1rem' }}>
              DNA gives you that infrastructure — not another program to run, but a plan to live.
            </p>
          </div>
        </div>

        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {[
            { num: '3', label: 'phases that move a believer from foundations to multiplying — in 6 to 12 months' },
            { num: '90', label: 'days to build the foundation — daily habits and tools that stick for life' },
            { num: '2×', label: 'every group is designed to become two groups — multiplication by design, not by accident' },
          ].map((stat) => (
            <div key={stat.num} style={{ borderLeft: '2px solid var(--lp-gold)', paddingLeft: '1.5rem' }}>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '3rem',
                  fontWeight: 900,
                  color: 'var(--lp-gold)',
                  lineHeight: 1,
                  marginBottom: '0.35rem',
                }}
              >
                {stat.num}
              </div>
              <div style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'rgba(247,244,239,0.6)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
