'use client';

const tools = [
  {
    icon: '📱',
    title: 'White-Labeled Daily DNA App',
    desc: 'Your church\'s name, colors, and logo on a fully built discipleship app. 3D Journal, 4D Prayer, Creed Cards, Testimony Builder — ready for every disciple from day one.',
  },
  {
    icon: '📊',
    title: 'DNA Group Dashboard',
    desc: 'Track every disciple, group, and assessment across your church. Know who\'s thriving, who needs attention, and who\'s ready to multiply — all in one place.',
  },
  {
    icon: '📖',
    title: 'Multiplication Manual',
    desc: '6 sessions covering the biblical case for multiplication, the full DNA process, and how to identify disciples who are actually ready to reproduce.',
  },
  {
    icon: '🗺️',
    title: 'Launch Guide + DNA Toolkit',
    desc: 'Step-by-step roadmap through every phase — with complete session plans so leaders never wonder "what do we do next?"',
  },
  {
    icon: '📋',
    title: 'Church Assessment',
    desc: 'Diagnose what\'s blocking discipleship in your church before you try to build what you can\'t yet sustain. Know where you are before you map where you\'re going.',
  },
  {
    icon: '🤝',
    title: 'Coaching & Support',
    desc: 'Coaches who\'ve been through DNA themselves — a strategic partner invested in your church\'s multiplication, not a help desk.',
  },
];

export default function Tools() {
  return (
    <section
      style={{ background: 'var(--lp-paper)', padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 5rem)' }}
      className="lp-tools"
    >
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        <div className="fade-in" style={{ marginBottom: 'clamp(2.5rem, 6vw, 3.5rem)' }}>
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
            How It Works
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.9rem, 4.5vw, 2.8rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              marginBottom: '0.75rem',
            }}
          >
            Every piece connected. One simple system.
          </h2>
          <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1rem)', color: 'var(--lp-mid)', lineHeight: 1.7 }}>
            Most discipleship tools are isolated — an app here, a curriculum there. DNA connects your leaders&apos; daily app experience directly to what you see in your dashboard, so nothing falls through the cracks.
          </p>
        </div>

        <div
          className="fade-in"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5px',
            background: 'var(--lp-rule)',
            border: '1.5px solid var(--lp-rule)',
          }}
          id="lp-tools-grid"
        >
          {tools.map((tool) => (
            <div
              key={tool.title}
              style={{
                background: 'var(--lp-warm-white)',
                padding: 'clamp(1.25rem, 3vw, 2rem) clamp(1.25rem, 3vw, 2.25rem)',
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'flex-start',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#fff')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--lp-warm-white)')}
            >
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: 'var(--lp-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '1rem',
                }}
              >
                {tool.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 'clamp(0.9rem, 2vw, 0.95rem)', marginBottom: '0.4rem' }}>
                  {tool.title}
                </div>
                <div style={{ fontSize: 'clamp(0.85rem, 2vw, 0.88rem)', color: 'var(--lp-mid)', lineHeight: 1.7 }}>
                  {tool.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
