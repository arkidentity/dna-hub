import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Check Your Inbox — DNA Discipleship',
  description: 'The DNA Multiplication Manual is on its way.',
  robots: 'noindex',
};

const ASSESSMENT_URL = '/assessment';
const DISCOVERY_URL = 'mailto:travis@arkidentity.com?subject=DNA Discovery Call';

export default function ThankYou() {
  return (
    <div
      className="landing-page"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: 'var(--lp-paper)',
        color: 'var(--lp-ink)',
        minHeight: '100vh',
      }}
    >
      {/* Minimal nav */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 2.5rem',
          borderBottom: '1px solid var(--lp-rule)',
          background: 'var(--lp-warm-white)',
        }}
      >
        <Link href="/">
          <Image
            src="/dna-logo-black.png"
            alt="DNA Discipleship"
            width={120}
            height={40}
            style={{ height: '36px', width: 'auto', display: 'block' }}
            priority
          />
        </Link>
        <Link
          href="/login"
          style={{
            fontSize: '0.82rem',
            color: 'var(--lp-mid)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Leader Login
        </Link>
      </nav>

      {/* Hero confirmation */}
      <section
        style={{
          maxWidth: '680px',
          margin: '0 auto',
          padding: '5rem 2rem 3rem',
          textAlign: 'center',
        }}
      >
        {/* Check mark */}
        <div
          style={{
            width: '4rem',
            height: '4rem',
            background: 'var(--lp-accent)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            fontSize: '1.5rem',
          }}
        >
          <span style={{ color: 'var(--lp-gold)', fontWeight: 700 }}>✓</span>
        </div>

        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--lp-gold)',
            marginBottom: '1rem',
          }}
        >
          Manual Sent
        </div>

        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 4vw, 2.8rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '1.25rem',
          }}
        >
          Check your inbox.
        </h1>

        <p
          style={{
            fontSize: '1.05rem',
            lineHeight: 1.75,
            color: 'var(--lp-mid)',
            maxWidth: '520px',
            margin: '0 auto 0.75rem',
          }}
        >
          The DNA Multiplication Manual is on its way. If you don&apos;t see it in the next few minutes, check your spam folder.
        </p>

        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--lp-mid)',
            marginBottom: '4rem',
          }}
        >
          6 sessions · 49 pages · From{' '}
          <span style={{ color: 'var(--lp-ink)', fontWeight: 500 }}>travis@arkidentity.com</span>
        </p>
      </section>

      {/* Divider */}
      <div
        style={{
          maxWidth: '680px',
          margin: '0 auto',
          padding: '0 2rem',
          borderTop: '1px solid var(--lp-rule)',
        }}
      />

      {/* While you wait — pivot to assessment */}
      <section
        style={{
          maxWidth: '680px',
          margin: '0 auto',
          padding: '3.5rem 2rem',
        }}
      >
        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--lp-gold)',
            marginBottom: '1rem',
          }}
        >
          While you wait
        </div>

        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 900,
            lineHeight: 1.2,
            marginBottom: '0.85rem',
          }}
        >
          Is your church ready to implement DNA?
        </h2>

        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.75,
            color: 'var(--lp-mid)',
            marginBottom: '2rem',
          }}
        >
          The Discipleship Infrastructure Assessment takes 5 minutes and shows you exactly where your church stands — and what to address before you try to build on it.
        </p>

        {/* Assessment CTA card */}
        <div
          style={{
            background: 'var(--lp-accent)',
            padding: '2.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--lp-gold)',
              marginBottom: '0.75rem',
            }}
          >
            Free · 5 minutes
          </div>
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.35rem',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '0.6rem',
              lineHeight: 1.3,
            }}
          >
            Discipleship Infrastructure Assessment
          </h3>
          <p
            style={{
              fontSize: '0.88rem',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.65,
              marginBottom: '1.75rem',
            }}
          >
            Find out if you have the leadership buy-in, relational culture, and structural readiness to launch DNA — before you try.
          </p>

          <ul style={{ listStyle: 'none', marginBottom: '2rem' }}>
            {[
              'Your church\'s readiness level — ready, building, or exploring',
              'The specific gaps most likely to stall your launch',
              'Personalized next steps based on where you are',
            ].map((item) => (
              <li
                key={item}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: '0.4rem 0',
                  fontSize: '0.88rem',
                  color: 'rgba(255,255,255,0.65)',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ color: 'var(--lp-gold)', flexShrink: 0, fontWeight: 600 }}>→</span>
                {item}
              </li>
            ))}
          </ul>

          <Link
            href={ASSESSMENT_URL}
            style={{
              background: 'var(--lp-gold)',
              color: 'var(--lp-ink)',
              padding: '0.9rem 2rem',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.9rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textDecoration: 'none',
              display: 'inline-block',
              borderRadius: 0,
              transition: 'background 0.2s',
            }}
          >
            Take the Assessment →
          </Link>
        </div>

        {/* Already read the manual? */}
        <div
          style={{
            border: '1px solid var(--lp-rule)',
            padding: '2rem 2.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: '0.95rem',
                marginBottom: '0.35rem',
              }}
            >
              Already read the manual?
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--lp-mid)' }}>
              Book a 30-minute discovery call — we&apos;ll listen to your context and be honest about fit.
            </div>
          </div>
          <a
            href={DISCOVERY_URL}
            style={{
              border: '1.5px solid var(--lp-ink)',
              background: 'transparent',
              color: 'var(--lp-ink)',
              padding: '0.75rem 1.5rem',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.85rem',
              fontWeight: 500,
              letterSpacing: '0.03em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              textDecoration: 'none',
              display: 'inline-block',
              borderRadius: 0,
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            Book a Call
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--lp-rule)',
          padding: '2rem 2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'var(--lp-charcoal)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Image
            src="/dna-logo-gold.png"
            alt="DNA"
            width={80}
            height={28}
            style={{ height: '24px', width: 'auto', opacity: 0.5 }}
          />
          <span style={{ fontSize: '0.75rem', color: 'rgba(247,244,239,0.35)' }}>
            A ministry of ARK Identity Discipleship
          </span>
        </div>
        <Link
          href="/"
          style={{
            fontSize: '0.78rem',
            color: 'rgba(247,244,239,0.35)',
            textDecoration: 'none',
          }}
        >
          ← Back to dnadiscipleship.com
        </Link>
      </footer>
    </div>
  );
}
