export default function Partner() {
  const steps = [
    {
      n: '01',
      title: 'Get the Manual',
      text: 'Read it with your key leaders. Decide if multiplication discipleship is the direction your church is ready to move.',
      arrow: true,
    },
    {
      n: '02',
      title: 'Take the Assessment',
      text: 'The Discipleship Infrastructure Audit shows where you are and what gaps exist before you try to build on them.',
      arrow: true,
    },
    {
      n: '03',
      title: 'Book a Discovery Call',
      text: '30 minutes with a DNA coach. We\'ll listen to your context and be honest about whether a partnership makes sense.',
      arrow: false,
    },
  ];

  return (
    <section style={{ background: 'var(--lp-paper)', padding: '7rem 5rem' }} className="lp-partner">
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
            Church Partnership
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
              fontWeight: 900,
              marginBottom: '0.75rem',
            }}
          >
            Ready to implement DNA in your church?
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--lp-mid)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.65 }}>
            The manual is step one. Here&apos;s how churches go from reading to actually multiplying disciples.
          </p>
        </div>

        <div
          className="fade-in"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2px',
            background: 'var(--lp-rule)',
            border: '1px solid var(--lp-rule)',
            marginBottom: '3rem',
          }}
          id="lp-partner-steps"
        >
          {steps.map((step) => (
            <div
              key={step.n}
              style={{
                background: 'var(--lp-warm-white)',
                padding: '2.5rem 2rem',
                position: 'relative',
              }}
            >
              {step.arrow && (
                <div
                  style={{
                    position: 'absolute',
                    right: '-1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '2rem',
                    height: '2rem',
                    background: 'var(--lp-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--lp-ink)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    zIndex: 2,
                  }}
                  className="lp-step-arrow"
                >
                  →
                </div>
              )}
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: 'var(--lp-green)',
                  marginBottom: '0.75rem',
                  lineHeight: 1,
                }}
              >
                {step.n}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem' }}>{step.title}</div>
              <div style={{ fontSize: '0.83rem', lineHeight: 1.6, color: 'var(--lp-mid)' }}>{step.text}</div>
            </div>
          ))}
        </div>

        <div
          className="fade-in"
          style={{
            background: 'var(--lp-accent)',
            padding: '3.5rem 4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '3rem',
          }}
          id="lp-partner-cta"
        >
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--lp-gold)',
                marginBottom: '0.75rem',
              }}
            >
              Church Partnership
            </div>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1.75rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '0.6rem',
                lineHeight: 1.25,
              }}
            >
              Already read the manual?<br />Let&apos;s talk about your church.
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: '380px' }}>
              30 minutes with a DNA coach. We&apos;ll listen to where you are, share what we&apos;ve seen work in churches like yours, and be honest if DNA isn&apos;t the right fit right now.
            </p>
          </div>
          <a
            href="mailto:travis@arkidentity.com?subject=DNA Discovery Call"
            style={{
              border: '1.5px solid rgba(255,255,255,0.45)',
              background: 'transparent',
              color: '#fff',
              padding: '0.9rem 2rem',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.88rem',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              textDecoration: 'none',
              display: 'inline-block',
              letterSpacing: '0.03em',
              borderRadius: 0,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'var(--lp-gold)';
              el.style.borderColor = 'var(--lp-gold)';
              el.style.color = 'var(--lp-ink)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'transparent';
              el.style.borderColor = 'rgba(255,255,255,0.45)';
              el.style.color = '#fff';
            }}
          >
            Book a Discovery Call
          </a>
        </div>
      </div>
    </section>
  );
}
