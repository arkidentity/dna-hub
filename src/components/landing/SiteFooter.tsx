import Image from 'next/image';
import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer
      style={{
        background: 'var(--lp-charcoal)',
        padding: '2rem 5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
      className="lp-site-footer"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <Image
          src="/dna-logo-gold.png"
          alt="DNA"
          width={80}
          height={28}
          style={{ height: '28px', width: 'auto', opacity: 0.55 }}
        />
        <div style={{ fontSize: '0.78rem', color: 'rgba(247,244,239,0.35)', lineHeight: 1.45 }}>
          DNA Discipleship<br />
          <span style={{ color: 'rgba(247,244,239,0.52)' }}>A ministry of ARK Identity Discipleship</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '2rem' }}>
        {[
          { href: '/login', label: 'Login' },
          { href: 'mailto:travis@arkidentity.com', label: 'Contact' },
          { href: '/assessment', label: 'Assessment' },
        ].map((link) => (
          <Link
            key={link.label}
            href={link.href}
            style={{
              fontSize: '0.8rem',
              color: 'rgba(247,244,239,0.35)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--lp-gold)')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'rgba(247,244,239,0.35)')}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </footer>
  );
}
