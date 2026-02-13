const tools = [
  {
    icon: '📱',
    title: 'White-Labeled Daily DNA App',
    desc: 'Your church\'s name and logo on a fully built discipleship app. 3D Journal, Listening Prayer, Creed Cards — ready for every disciple.',
  },
  {
    icon: '📊',
    title: 'DNA Group Dashboard',
    desc: 'Track every disciple, group, and assessment across your church. Know who\'s thriving, who needs attention, and who\'s ready to multiply.',
  },
  {
    icon: '📖',
    title: 'Multiplication Manual',
    desc: '6 sessions covering the biblical case, the full DNA process, and how to identify disciples who are actually ready to reproduce.',
  },
  {
    icon: '🗺️',
    title: 'Launch Guide + 90-Day Toolkit',
    desc: 'Step-by-step roadmap through every phase — with complete session plans so leaders never wonder "what do we do next?"',
  },
  {
    icon: '📋',
    title: 'Flow Assessment',
    desc: 'Diagnose what\'s blocking discipleship in your church before you try to build what you can\'t yet sustain.',
  },
  {
    icon: '🤝',
    title: 'Coaching & Support',
    desc: 'Regional coaches who\'ve been through DNA themselves — a strategic partner invested in your church\'s multiplication, not a help desk.',
  },
];

export default function Tools() {
  return (
    <section style={{ background: 'var(--lp-paper)', padding: '7rem 5rem' }} className="lp-tools">
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div className="fade-in" style={{ textAlign: 'center', marginBottom: '4rem' }}>
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
            What You Get
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
              fontWeight: 900,
              marginBottom: '0.75rem',
            }}
          >
            Everything you need to make discipleship reproducible
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--lp-mid)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
            Church partnership includes a full platform, white-labeled app, and ongoing coaching — not just a PDF.
          </p>
        </div>

        <div
          className="fade-in"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
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
                padding: '2rem 2.25rem',
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
                  borderRadius: 0,
                }}
              >
                {tool.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.4rem' }}>{tool.title}</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--lp-mid)', lineHeight: 1.6 }}>{tool.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
