'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function LandingNav() {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'var(--lp-accent)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        className="lp-nav-inner"
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '1rem 2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link href="/" style={{ display: 'block' }}>
          <Image
            src="/dna-logo-gold.png"
            alt="DNA Discipleship"
            width={120}
            height={40}
            style={{ height: '40px', width: 'auto', display: 'block' }}
            priority
          />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link
            href="/login"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.85rem',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.65)',
              textDecoration: 'none',
              letterSpacing: '0.02em',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#fff')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.65)')}
          >
            Leader Login
          </Link>
          <a
            href="#manual"
            style={{
              background: 'var(--lp-green)',
              color: '#fff',
              border: 'none',
              padding: '0.6rem 1.4rem',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.85rem',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'background 0.2s',
              textDecoration: 'none',
              display: 'inline-block',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'var(--lp-green-dark)')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'var(--lp-green)')}
          >
            Get the Free Manual
          </a>
        </div>
      </div>
    </nav>
  );
}
