import Image from 'next/image';

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
    <section
      style={{ background: 'var(--lp-warm-white)', paddingBottom: 'clamp(4rem, 8vw, 7rem)' }}
      className="lp-what"
    >
      {/* People photo fading into cream */}
      <div style={{ position: 'relative', width: '100%', height: 'clamp(220px, 40vw, 420px)', marginBottom: 'clamp(3rem, 6vw, 5rem)' }}>
        <Image
          src="/dna-group-web.jpg"
          alt="DNA discipleship group around a table"
          fill
          style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(255,251,245,0) 30%, var(--lp-warm-white) 100%)',
        }} />
      </div>

      <div style={{ padding: '0 clamp(1.5rem, 5vw, 5rem)' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

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
            What DNA Is
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.9rem, 4.5vw, 2.8rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              marginBottom: '1.25rem',
            }}
          >
            Not a program you run.<br />
            <em style={{ fontStyle: 'italic', color: 'var(--lp-gold)' }}>A plan you live.</em>
          </h2>
          <div style={{ fontSize: 'clamp(0.95rem, 2vw, 1rem)', lineHeight: 1.8, color: 'var(--lp-mid)' }}>
            <p>
              Jesus didn&apos;t accidentally make disciple-makers. He loved His twelve AND moved them intentionally through clear stages of development. DNA gives your church that same framework.
            </p>
          </div>
        </div>

        <div
          className="fade-in"
          style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--lp-rule)',
          }}
          id="lp-pillars"
        >
          {pillars.map((pillar, i) => (
            <div
              key={pillar.num}
              style={{
                padding: 'clamp(1.5rem, 4vw, 2.5rem)',
                borderBottom: i < pillars.length - 1 ? '1px solid var(--lp-rule)' : 'none',
              }}
            >
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
                  fontWeight: 900,
                  color: 'var(--lp-green)',
                  lineHeight: 1,
                  marginBottom: '0.75rem',
                }}
              >
                {pillar.num}
              </div>
              <div style={{ fontWeight: 600, fontSize: 'clamp(0.95rem, 2vw, 1rem)', marginBottom: '0.6rem' }}>
                {pillar.title}
              </div>
              <div style={{ fontSize: 'clamp(0.88rem, 2vw, 0.92rem)', lineHeight: 1.75, color: 'var(--lp-mid)' }}>
                {pillar.text}
              </div>
            </div>
          ))}
        </div>

      </div>
      </div>
    </section>
  );
}
