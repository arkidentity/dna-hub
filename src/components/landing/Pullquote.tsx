import Image from 'next/image';

export default function Pullquote() {
  return (
    <section
      style={{
        background: 'var(--lp-green)',
        padding: 'clamp(3.5rem, 8vw, 5rem) clamp(1.5rem, 5vw, 5rem)',
        textAlign: 'center',
      }}
    >
      <Image
        src="/dna-logo-gold.png"
        alt="DNA"
        width={52}
        height={52}
        style={{ width: '52px', height: '52px', margin: '0 auto 1.5rem' }}
      />
      <p
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(1.35rem, 3.5vw, 2.25rem)',
          fontWeight: 700,
          fontStyle: 'italic',
          color: '#fff',
          maxWidth: '680px',
          margin: '0 auto 1.5rem',
          lineHeight: 1.45,
        }}
      >
        &ldquo;Discipleship is not accidental — it&apos;s loving people with a plan.&rdquo;
      </p>
      <div
        style={{
          fontSize: '0.82rem',
          color: 'rgba(255,255,255,0.75)',
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        DNA Discipleship
      </div>
    </section>
  );
}
