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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2.5rem',
        background: 'rgba(247, 244, 239, 0.94)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--lp-rule)',
      }}
    >
      <Link href="/" style={{ display: 'block' }}>
        <Image
          src="/dna-logo-black.png"
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
            color: 'var(--lp-mid)',
            textDecoration: 'none',
            letterSpacing: '0.02em',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--lp-ink)')}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--lp-mid)')}
        >
          Leader Login
        </Link>
        <a
          href="#manual"
          style={{
            background: 'var(--lp-ink)',
            color: 'var(--lp-paper)',
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
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'var(--lp-gold-dark)')}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'var(--lp-ink)')}
        >
          Get the Free Manual
        </a>
      </div>
    </nav>
  );
}
