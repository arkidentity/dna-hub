'use client';

import Image from 'next/image';
import Link from 'next/link';

const included = [
  {
    label: 'Your Church App',
    description: 'White-labeled and ready in 60 seconds. Your name, your colors, your logo — on a fully built discipleship app your leaders will actually use.',
    badge: null,
    image: '/app-screen.jpg',
  },
  {
    label: 'DNA Group Dashboard',
    description: 'Track every disciple, group, and assessment across your church. Know who\'s thriving, who needs support, and who\'s ready to multiply.',
    badge: null,
    image: '/dash-screen.jpg',
  },
  {
    label: 'DNA Multiplication Manual',
    description: '6 sessions covering the biblical case for multiplication, the full DNA process, and how to identify disciples who are ready to reproduce.',
    badge: null,
    image: '/multiplication-manual-web.jpg',
  },
  {
    label: 'Table Up or Temple Down',
    description: 'A pastoral leadership guide for building a culture of multiplication — includes the Strategic Church Audit and Culture Shift Checklist.',
    badge: 'Coming Soon',
    image: '/tableup-web.jpg',
  },
];

export default function Manual() {
  return (
    <section
      id="included"
      style={{
        background: 'var(--lp-accent)',
        padding: 'clamp(4rem, 8vw, 6rem) clamp(1.5rem, 5vw, 5rem)',
      }}
      className="lp-manual"
    >
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--lp-gold)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ display: 'block', width: '2rem', height: '1px', background: 'var(--lp-gold)', flexShrink: 0 }} />
          What You Get Free
        </div>

        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            color: '#fff',
            marginBottom: '1rem',
            maxWidth: '640px',
          }}
        >
          Your church app comes with everything to get started.
        </h2>

        <p
          style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
            lineHeight: 1.8,
            color: 'rgba(247,244,239,0.65)',
            maxWidth: '560px',
            marginBottom: 'clamp(2.5rem, 5vw, 3.5rem)',
          }}
        >
          No trial. No credit card. Set up your white-labeled app and you get access to all of this immediately.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
            borderTop: '1px solid rgba(247,244,239,0.1)',
          }}
        >
          {included.map((item) => (
            <div
              key={item.label}
              style={{
                padding: 'clamp(1.25rem, 3vw, 1.75rem) 0',
                borderBottom: '1px solid rgba(247,244,239,0.1)',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '1.5rem',
              }}
            >
              {/* Cover image */}
              {item.image && (
                <div style={{ flexShrink: 0 }}>
                  <Image
                    src={item.image}
                    alt={item.label}
                    width={130}
                    height={170}
                    style={{
                      width: 'clamp(70px, 12vw, 100px)',
                      height: 'auto',
                      borderRadius: '4px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                      display: 'block',
                    }}
                  />
                </div>
              )}

              {/* Text */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      color: 'var(--lp-gold)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--lp-gold)',
                        border: '1px solid rgba(200,146,42,0.5)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '20px',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontSize: 'clamp(0.88rem, 2vw, 0.95rem)',
                    lineHeight: 1.7,
                    color: 'rgba(247,244,239,0.6)',
                    margin: 0,
                  }}
                >
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'clamp(2rem, 5vw, 3rem)' }}>
          <Link
            href="/signup/conference"
            style={{
              background: 'var(--lp-green)',
              color: '#fff',
              padding: 'clamp(0.85rem, 2vw, 1rem) clamp(1.75rem, 4vw, 2.5rem)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textDecoration: 'none',
              display: 'inline-block',
              borderRadius: '4px',
              transition: 'background 0.2s',
            }}
          >
            Set Up Your Church App →
          </Link>
        </div>

      </div>
    </section>
  );
}
