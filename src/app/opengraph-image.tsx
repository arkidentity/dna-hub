import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'DNA Discipleship — Loving People With a Plan';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const logoData = await fetch(
    new URL('/dna-logo-gold-cream.png', 'https://dnadiscipleship.com')
  ).then((r) => r.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          background: '#1A2332',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 36,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoData as unknown as string}
          width={520}
          style={{ objectFit: 'contain' }}
          alt="DNA Discipleship"
        />
        <p
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: 30,
            fontFamily: 'sans-serif',
            margin: 0,
            letterSpacing: '0.02em',
          }}
        >
          Loving People With a Plan
        </p>
      </div>
    ),
    { ...size }
  );
}
