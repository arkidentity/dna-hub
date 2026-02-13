export default function WhatDNA() {
  const pillars = [
    {
      num: '01',
      title: 'Structured but Spirit-led',
      text: 'DNA gives you a clear process without turning discipleship into a checklist. Every tool creates space for the Holy Spirit — it doesn\'t replace Him.',
    },
    {
      num: '02',
      title: 'Experience before expertise',
      text: 'Leaders complete every DNA tool as disciples before they facilitate them for others. You can\'t give away what you haven\'t experienced.',
    },
    {
      num: '03',
      title: 'Exponential by design',
      text: 'Every DNA group is planned from day one to multiply. Success isn\'t measured by who stays — it\'s measured by who gets sent to start something new.',
    },
  ];

  return (
    <section style={{ background: 'var(--lp-warm-white)', padding: '7rem 5rem' }} className="lp-what">
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div
          className="fade-in lp-what-header"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4rem',
            marginBottom: '5rem',
            alignItems: 'start',
          }}
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
              What DNA Is
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
                fontWeight: 900,
                lineHeight: 1.15,
              }}
            >
              Not a program you run.<br />
              <em style={{ fontStyle: 'italic', color: 'var(--lp-gold)' }}>A plan you live.</em>
            </h2>
          </div>
          <div style={{ fontSize: '1rem', lineHeight: 1.8, color: 'var(--lp-mid)', paddingTop: '0.5rem' }}>
            <p>
              DNA is discipleship infrastructure. It turns your good intentions into a repeatable process your leaders can actually follow — and reproduce on their own.
            </p>
            <p style={{ marginTop: '1rem' }}>
              Jesus didn&apos;t accidentally make disciple-makers. He loved His twelve AND moved them intentionally through clear stages of development. DNA gives your church that same framework.
            </p>
          </div>
        </div>

        <div
          className="fade-in"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 0,
            border: '1px solid var(--lp-rule)',
          }}
          id="lp-pillars"
        >
          {pillars.map((pillar, i) => (
            <div
              key={pillar.num}
              style={{
                padding: '2.5rem',
                borderRight: i < pillars.length - 1 ? '1px solid var(--lp-rule)' : 'none',
              }}
              className="lp-pillar"
            >
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '3.5rem',
                  fontWeight: 900,
                  color: 'var(--lp-rule)',
                  lineHeight: 1,
                  marginBottom: '1rem',
                }}
              >
                {pillar.num}
              </div>
              <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.75rem' }}>
                {pillar.title}
              </div>
              <div style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--lp-mid)' }}>
                {pillar.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
