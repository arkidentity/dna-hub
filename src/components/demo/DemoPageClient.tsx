'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ArrowRight } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type Temp = 'cold' | 'warm' | 'hot';

interface Church {
  id: string;
  name: string;
  subdomain: string;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
  icon_url: string | null;
  app_title: string;
  header_style: string;
}

interface Demo {
  video_url: string | null;
  default_temp: Temp;
  demo_seeded_at: string | null;
}

interface DemoPageClientProps {
  church: Church;
  demo: Demo;
  temp: Temp;
  hubDemoUrl: string;
  bookCallUrl: string;
  assessmentUrl: string;
  coachName: string;
}

// ─── Temperature CTA Copy ─────────────────────────────────────────────────────
// Headline/subline are fixed per spec. Only CTA button text differs per temp.
// Full warm/hot/cold copy variants to be expanded in a future pass.

const TEMP_CTA = {
  cold: {
    ctaText: 'Schedule a Free Overview Call',
    ctaSubtext: 'No commitment required — 30 minutes',
  },
  warm: {
    ctaText: 'Book a Discovery Call',
    ctaSubtext: "Let's see if this is the right fit",
  },
  hot: {
    ctaText: 'Book Your Strategy Call',
    ctaSubtext: 'Your launch window is open',
  },
};

// ─── YouTube / Video Utils ────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
}

function isDirectVideoUrl(url: string): boolean {
  if (!url) return false;
  return (
    /\.(mp4|mov|webm|ogg)(\?|$)/i.test(url) ||
    (!url.includes('youtube') && !url.includes('youtu.be') && url.startsWith('http'))
  );
}

// ─── FAQ Items ────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'How long does it take to set up for our church?',
    a: 'Most churches are fully configured within a week of their strategy call. Branding, subdomain, and leader onboarding all happen before launch. Your first group can be discipling within 7–10 days.',
  },
  {
    q: 'How is this different from a Bible app or devotional app?',
    a: 'DNA is a relational discipleship system, not a content platform. The app is built around accountability, group rhythm, and real multiplication — not individual consumption. It tracks relationships, not just reading plans.',
  },
  {
    q: 'Is there a long-term contract?',
    a: "No lock-in. We believe in earning your partnership every cycle. Most churches stay because the results speak — but you're never trapped.",
  },
  {
    q: "Can we customize the app for our church's branding?",
    a: "Yes — completely. Your church name, logo, colors, and custom links are all applied to the app. Your disciples see your church identity from Day 1.",
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DemoPageClient({
  church,
  demo,
  temp,
  hubDemoUrl,
  bookCallUrl,
  assessmentUrl,
  coachName,
}: DemoPageClientProps) {
  const cta = TEMP_CTA[temp];
  const primary = church.primary_color;
  const accent = church.accent_color;

  const videoId = demo.video_url ? extractYouTubeId(demo.video_url) : null;
  const isDirectVideo = demo.video_url ? isDirectVideoUrl(demo.video_url) : false;
  const hasVideo = !!(videoId || isDirectVideo);

  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [stickyHidden, setStickyHidden] = useState(false);
  const [iframeSrc, setIframeSrc] = useState('');
  const finalCtaRef = useRef<HTMLDivElement>(null);

  // Hide sticky mobile bar when final CTA section is in view
  useEffect(() => {
    const el = finalCtaRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setStickyHidden(entry.isIntersecting),
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Fetch demo session tokens for auto-login iframe
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/demo/app-session/${church.subdomain}`);
        if (res.ok) {
          const data = await res.json();
          if (data.access_token) {
            setIframeSrc(
              `https://${church.subdomain}.dailydna.app/#access_token=${data.access_token}&refresh_token=${data.refresh_token}&type=recovery`
            );
            return;
          }
        }
      } catch {
        // fallthrough to plain URL
      }
      setIframeSrc(`https://${church.subdomain}.dailydna.app`);
    }
    fetchSession();
  }, [church.subdomain]);

  const headline = `This is what discipleship looks like at ${church.name}.`;
  const subline = 'We built this for you.';

  return (
    <div
      className="dp"
      style={{ fontFamily: "'DM Sans', sans-serif", background: '#fff', color: '#0f0e0c', overflowX: 'hidden' }}
    >
      {/* ── Fonts + Styles ───────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        .dp * { box-sizing: border-box; }

        /* Sticky bottom CTA — mobile only */
        .dp-sticky-bottom {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
          padding: 0.875rem 1.25rem;
          background: ${primary};
          box-shadow: 0 -2px 16px rgba(0,0,0,0.15);
          transform: translateY(0); transition: transform 0.3s ease;
        }
        .dp-sticky-bottom.hidden { transform: translateY(110%); }
        @media (min-width: 901px) { .dp-sticky-bottom { display: none !important; } }

        /* Sections */
        .dp-section { padding: 4rem 1.25rem; }
        @media (min-width: 600px) { .dp-section { padding: 5rem 2.5rem; } }

        /* FAQ */
        .dp-faq-item { border-bottom: 1px solid #ebebeb; }
        .dp-faq-q {
          width: 100%; background: none; border: none; text-align: left; cursor: pointer;
          padding: 1.125rem 0; display: flex; justify-content: space-between; align-items: center;
          font-family: inherit; font-size: 1rem; font-weight: 500; color: #0f0e0c; gap: 1rem;
        }
        .dp-faq-a {
          max-height: 0; overflow: hidden; transition: max-height 0.3s ease;
          color: #555; line-height: 1.7; font-size: 0.95rem;
        }
        .dp-faq-a.open { max-height: 300px; padding-bottom: 1.125rem; }

        /* Proof points row */
        .dp-proof-row {
          display: flex; justify-content: space-around; gap: 1rem;
          max-width: 480px; margin: 0 auto;
        }
        .dp-proof-item {
          display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
          flex: 1; min-width: 0;
        }

        /* Buttons */
        .dp-btn-primary {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.875rem 1.75rem; border-radius: 8px;
          background: ${primary}; color: #fff;
          font-family: inherit; font-size: 1rem; font-weight: 600;
          text-decoration: none; border: none; cursor: pointer;
          transition: opacity 0.15s;
        }
        .dp-btn-primary:hover { opacity: 0.9; }
        .dp-btn-outline {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.875rem 1.75rem; border-radius: 8px;
          background: transparent; color: rgba(255,255,255,0.85);
          font-family: inherit; font-size: 1rem; font-weight: 500;
          text-decoration: none; border: 1px solid rgba(255,255,255,0.35);
          transition: opacity 0.15s;
        }
        .dp-btn-outline:hover { opacity: 0.8; }

        /* Spinner */
        @keyframes dp-spin { to { transform: rotate(360deg); } }
        .dp-spinner {
          width: 26px; height: 26px;
          border: 3px solid rgba(255,255,255,0.15);
          border-top-color: ${primary};
          border-radius: 50%;
          animation: dp-spin 0.75s linear infinite;
        }

        /* Page bottom padding so sticky bar doesn't cover footer on mobile */
        @media (max-width: 900px) { .dp { padding-bottom: 72px; } }
      `}</style>

      {/* ── 1. HEADER ────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Image src="/dna-logo.svg" alt="DNA" width={28} height={28} style={{ opacity: 0.85 }} onError={() => {}} />
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#555' }}>DNA Discipleship</span>
        </div>
        {church.logo_url && (
          <img src={church.logo_url} alt={church.name} style={{ height: '26px', objectFit: 'contain', opacity: 0.9 }} />
        )}
      </header>

      {/* ── 2. HERO ──────────────────────────────────────────────── */}
      <section style={{
        paddingTop: '5.5rem', // clears fixed header
        paddingBottom: '3.5rem',
        paddingLeft: '1.25rem',
        paddingRight: '1.25rem',
        textAlign: 'center',
        background: '#fff',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
          {/* Headline */}
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.875rem, 6vw, 2.875rem)',
            lineHeight: 1.1,
            fontWeight: 700,
            color: '#0f0e0c',
            margin: 0,
          }}>
            {headline}
          </h1>

          {/* Subline */}
          <p style={{ fontSize: '1.05rem', color: '#666', margin: 0, lineHeight: 1.5 }}>
            {subline}
          </p>

          {/* Primary CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.625rem', marginTop: '0.25rem' }}>
            <Link href={bookCallUrl} className="dp-btn-primary" style={{ background: primary }}>
              {cta.ctaText}
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Secondary text link */}
            <Link
              href={assessmentUrl}
              style={{ fontSize: '0.875rem', color: '#888', textDecoration: 'none', borderBottom: '1px solid #ddd', paddingBottom: '1px' }}
            >
              Or take the 5-min church assessment →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. PERSONAL VIDEO ────────────────────────────────────── */}
      {hasVideo && (
        <section style={{ padding: '0 1.25rem 3.5rem', background: '#fff' }}>
          <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.875rem', alignItems: 'center' }}>
            {/* 9:16 video */}
            <div style={{
              width: '100%',
              aspectRatio: '9 / 16',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#000',
              boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
            }}>
              {videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&controls=1&rel=0&modestbranding=1`}
                  title="Coach video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <video
                  src={demo.video_url ?? ''}
                  autoPlay
                  muted
                  playsInline
                  controls
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>

            {/* Caption */}
            <p style={{ fontSize: '0.825rem', color: '#999', margin: 0, textAlign: 'center' }}>
              {coachName} · Founder, DNA Discipleship
            </p>
          </div>
        </section>
      )}

      {/* ── 4. LIVE APP PREVIEW ──────────────────────────────────── */}
      <section
        id="app-preview"
        className="dp-section"
        style={{ background: '#f7f7f5', textAlign: 'center' }}
      >
        <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          {/* Label + headline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent }}>
              Your Branded App
            </span>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.5rem, 5vw, 2.25rem)',
              fontWeight: 700,
              color: '#0f0e0c',
              margin: 0,
              lineHeight: 1.15,
            }}>
              {church.name}&apos;s app — ready to explore.
            </h2>
          </div>

          {/* iframe — natural 9:16, no phone chrome */}
          <div style={{
            width: '100%',
            maxWidth: '390px',
            aspectRatio: '9 / 16',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            background: '#fff',
            position: 'relative',
          }}>
            {!iframeSrc && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '0.875rem', background: '#f0f0f0',
              }}>
                <div className="dp-spinner" style={{ borderTopColor: primary }} />
                <p style={{ color: '#888', fontSize: '0.875rem', margin: 0 }}>Loading your app…</p>
              </div>
            )}
            {iframeSrc && (
              <iframe
                src={iframeSrc}
                title={`${church.name} DNA Daily App`}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                loading="lazy"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            )}
          </div>

          {/* Tagline */}
          <p style={{ fontSize: '0.875rem', color: '#888', margin: 0, lineHeight: 1.5 }}>
            This is exactly what your disciples would see on Day 1.
          </p>
        </div>
      </section>

      {/* ── 5. PROOF POINTS ──────────────────────────────────────── */}
      <section className="dp-section" style={{ background: '#fff', paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
        <div className="dp-proof-row">
          {[
            { emoji: '📱', label: 'Branded for your church' },
            { emoji: '👥', label: 'Built for groups' },
            { emoji: '📈', label: 'Leader dashboard included' },
          ].map((p, i) => (
            <div key={i} className="dp-proof-item">
              <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>{p.emoji}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#333', textAlign: 'center', lineHeight: 1.3 }}>
                {p.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. LEADER DASHBOARD CTA (conditional) ────────────────── */}
      {hubDemoUrl && (
        <section className="dp-section" style={{ background: '#f7f7f5', paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
          <div style={{
            maxWidth: '480px', margin: '0 auto',
            background: '#fff', border: '1px solid #e5e5e5', borderRadius: '16px',
            padding: '1.75rem 1.5rem',
            display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <h3 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1.25rem', fontWeight: 700, color: '#0f0e0c', margin: 0, lineHeight: 1.2,
              }}>
                {"There's a dashboard behind every app."}
              </h3>
              <p style={{ color: '#666', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                Pastors get full visibility into how their disciples are growing.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%' }}>
              <Link
                href={hubDemoUrl}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.7rem 1.25rem', borderRadius: '7px',
                  background: primary, color: '#fff',
                  fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
                  alignSelf: 'flex-start',
                }}
              >
                Explore the Leader Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span style={{ fontSize: '0.78rem', color: '#aaa' }}>No login required</span>
            </div>
          </div>
        </section>
      )}

      {/* ── 7. FAQ ───────────────────────────────────────────────── */}
      <section className="dp-section" style={{ background: '#fff' }}>
        <div style={{ maxWidth: '580px', margin: '0 auto' }}>
          <div style={{ borderTop: '1px solid #ebebeb' }}>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="dp-faq-item">
                <button
                  className="dp-faq-q"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  aria-expanded={faqOpen === i}
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className="w-4 h-4"
                    style={{
                      flexShrink: 0,
                      transform: faqOpen === i ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.25s',
                      color: accent,
                    }}
                  />
                </button>
                <div className={`dp-faq-a${faqOpen === i ? ' open' : ''}`}>
                  {item.a}
                </div>
              </div>
            ))}
          </div>

          {/* Assessment text link below FAQ */}
          <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
            <p style={{ color: '#888', fontSize: '0.9rem', margin: '0 0 0.375rem' }}>
              Still have questions? The assessment helps us answer them.
            </p>
            <Link
              href={assessmentUrl}
              style={{ fontSize: '0.9rem', color: primary, fontWeight: 600, textDecoration: 'none', borderBottom: `1px solid ${primary}` }}
            >
              Take the 5-minute assessment →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 8. FINAL CTA ─────────────────────────────────────────── */}
      <div ref={finalCtaRef}>
        <section
          className="dp-section"
          style={{ background: '#0d1520', textAlign: 'center' }}
        >
          <div style={{ maxWidth: '520px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2rem, 6vw, 3rem)',
              fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.05,
            }}>
              Ready to talk?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', margin: 0, lineHeight: 1.55 }}>
              30 minutes. No pressure. Just clarity.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', alignItems: 'center' }}>
              <Link href={bookCallUrl} className="dp-btn-primary" style={{ background: accent, justifyContent: 'center', width: '100%', maxWidth: '320px' }}>
                {cta.ctaText}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href={assessmentUrl} className="dp-btn-outline" style={{ justifyContent: 'center', width: '100%', maxWidth: '320px' }}>
                Take the Assessment First
              </Link>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', margin: 0 }}>
              {cta.ctaSubtext}
            </p>
          </div>
        </section>
      </div>

      {/* ── 9. FOOTER ────────────────────────────────────────────── */}
      <footer style={{
        background: '#0a0a0a',
        padding: '1.5rem 1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.25rem',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem' }}>
          © {new Date().getFullYear()} DNA Discipleship
        </span>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem' }}>
          Personalized demo for {church.name}
        </span>
      </footer>

      {/* ── STICKY MOBILE CTA BAR ────────────────────────────────── */}
      <div className={`dp-sticky-bottom${stickyHidden ? ' hidden' : ''}`}>
        <Link
          href={bookCallUrl}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            width: '100%', padding: '0.875rem',
            background: accent, color: '#fff',
            borderRadius: '8px', fontWeight: 700, fontSize: '1rem',
            textDecoration: 'none',
          }}
        >
          Book a Discovery Call
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
