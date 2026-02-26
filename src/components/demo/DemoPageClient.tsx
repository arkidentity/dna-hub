'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ArrowRight, Lock, Compass, Users, TrendingUp } from 'lucide-react';
import BookingModal from '@/components/demo/BookingModal';

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
  /** Booking URL for the embedded modal (Google Cal, Calendly, etc.) */
  bookingUrl?: string;
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

// ─── Brand Colors ─────────────────────────────────────────────────────────────

const GATE_GOLD = '#C4922A';
const BRAND_GREEN = '#2E7D5A';
const CREAM_BG = '#F5EFE0';
const WARM_NEUTRAL_BG = '#F7F3EC';

// ─── FAQ Items ────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'Is the app really free?',
    a: "Yes. The white-labeled app — with your church name, logo, and branding — is completely free. Your disciples get access to the 3D Journal and 4D Prayer at no cost. The full DNA experience, including the 90-Day Toolkit, DNA Groups, and the Leader Dashboard, unlocks through a coaching partnership. We'll talk through what that looks like on a discovery call.",
  },
  {
    q: 'How is this different from a Bible app or devotional?',
    a: "DNA isn't a content platform. It's a relational discipleship system built around accountability, group rhythm, and multiplication. The app supports the relationship — it doesn't replace it.",
  },
  {
    q: 'What does a coaching partnership actually involve?',
    a: "You get a dedicated DNA coach, leader training, group infrastructure, and hands-on support through your first multiplication cycle. The discovery call is where we figure out what the right fit looks like for your church specifically.",
  },
  {
    q: 'How long does it take to get started?',
    a: "Getting the free app into your disciples' hands can happen within days. But DNA Groups — the real engine of multiplication — take time to embed into the culture of your church. Most churches see their first groups launch within 3–6 months of committing to the process. This isn't microwave discipleship. It's a long game, and we walk every step with you.",
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
  bookingUrl,
}: DemoPageClientProps) {
  const cta = TEMP_CTA[temp];
  const primary = church.primary_color;
  const accent = church.accent_color;

  const videoId = demo.video_url ? extractYouTubeId(demo.video_url) : null;
  const isDirectVideo = demo.video_url ? isDirectVideoUrl(demo.video_url) : false;
  const hasVideo = !!(videoId || isDirectVideo);

  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [stickyHidden, setStickyHidden] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  // Full-experience iframe (gate section — dna_leader role, has group + pathway data)
  const [iframeSrc, setIframeSrc] = useState('');
  // Free-tier iframe (first preview — role=disciple, no group, shows NoGroupView)
  const [freeIframeSrc, setFreeIframeSrc] = useState('');
  const [logoError, setLogoError] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  // Mobile iframe scroll-trap prevention — touch devices only
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [freeIframeActive, setFreeIframeActive] = useState(false);
  const [fullIframeActive, setFullIframeActive] = useState(false);
  const finalCtaRef = useRef<HTMLDivElement>(null);
  const gateContentRef = useRef<HTMLDivElement>(null);

  // Clear Hub demo-mode keys on mount so DemoBanner doesn't appear on this page
  // (keys are set by HubDemoClient when navigating into the leader dashboard demo)
  useEffect(() => {
    try {
      localStorage.removeItem('dna_demo_mode');
      localStorage.removeItem('dna_demo_church');
      localStorage.removeItem('dna_demo_page_url');
      localStorage.removeItem('dna_demo_booking_url');
    } catch { /* ignore */ }
  }, []);

  // Detect touch/mobile device for iframe scroll-trap prevention
  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
  }, []);

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

  // Fetch both demo sessions in parallel
  useEffect(() => {
    const base = `https://${church.subdomain}.dailydna.app`;

    // Full-experience session (dna_leader role — bypasses group gate, shows full pathway)
    // sk=full gives this iframe its own Supabase localStorage key, isolating it from the
    // free iframe so the two sessions never overwrite each other.
    async function fetchFullSession() {
      try {
        const res = await fetch(`/api/demo/app-session/${church.subdomain}`);
        if (res.ok) {
          const data = await res.json();
          if (data.access_token) {
            setIframeSrc(`${base}/demo-entry?at=${data.access_token}&rt=${data.refresh_token}&redirect=/pathway&sk=full`);
            return;
          }
        }
      } catch { /* fallthrough */ }
      setIframeSrc(base);
    }

    // Free-tier session (role=disciple, no group — lands on journal, pathway is locked)
    // sk=free gives this iframe its own Supabase localStorage key, isolating it from the
    // full iframe so the two sessions never overwrite each other.
    async function fetchFreeSession() {
      try {
        const res = await fetch(`/api/demo/app-session-free/${church.subdomain}`);
        if (res.ok) {
          const data = await res.json();
          if (data.access_token) {
            setFreeIframeSrc(`${base}/demo-entry?at=${data.access_token}&rt=${data.refresh_token}&redirect=/journal&sk=free`);
            return;
          }
        }
      } catch { /* fallthrough */ }
      // Fallback: unauthenticated — app will redirect to login, not ideal but safe
      setFreeIframeSrc(base);
    }

    void fetchFullSession();
    void fetchFreeSession();
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
          padding: 0.625rem 1.25rem 1rem;
          background: #1A2332;
          box-shadow: 0 -2px 16px rgba(0,0,0,0.25);
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
          font-family: inherit; font-size: 1.05rem; font-weight: 500; color: #0f0e0c; gap: 1rem;
        }
        .dp-faq-a {
          max-height: 0; overflow: hidden; transition: max-height 0.3s ease;
          color: #555; line-height: 1.7; font-size: 1rem;
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
        background: '#1A2332',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {!logoError ? (
            <Image
              src="/dna-logo-gold.png"
              alt="DNA"
              width={28}
              height={28}
              onError={() => setLogoError(true)}
            />
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '6px',
              background: primary, color: '#fff',
              fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.02em',
            }}>
              DNA
            </span>
          )}
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)' }}>Discipleship</span>
        </div>
        {church.logo_url && (
          <img src={church.logo_url} alt={church.name} style={{ height: '26px', objectFit: 'contain', opacity: 0.9 }} />
        )}
      </header>

      {/* ── 2. HERO ──────────────────────────────────────────────── */}
      <section style={{
        paddingTop: '5.5rem', // clears fixed header
        paddingBottom: '1.75rem',
        paddingLeft: '1.25rem',
        paddingRight: '1.25rem',
        textAlign: 'center',
        background: CREAM_BG,
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
          {/* Headline */}
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.875rem, 6vw, 2.875rem)',
            lineHeight: 1.2,
            fontWeight: 700,
            color: '#0f0e0c',
            margin: 0,
          }}>
            This is what discipleship<br />
            looks like at<br />
            <span style={{ whiteSpace: 'nowrap', color: GATE_GOLD }}>{church.name}.</span>
          </h1>

          {/* Subline */}
          <p style={{ fontSize: '1.15rem', color: '#666', margin: 0, lineHeight: 1.5 }}>
            {subline}
          </p>
        </div>
      </section>

      {/* ── 3. PERSONAL VIDEO ────────────────────────────────────── */}
      {hasVideo && (
        <section style={{ padding: '0 1.25rem 3.5rem', background: CREAM_BG }}>
          <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.875rem', alignItems: 'center' }}>
            {/* 9:16 video */}
            <div style={{
              width: '100%',
              maxWidth: '336px',
              margin: '0 auto',
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

            {/* CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.625rem', marginTop: '0.5rem' }}>
              <button onClick={() => setBookingOpen(true)} className="dp-btn-primary" style={{ background: BRAND_GREEN }}>
                {cta.ctaText}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. FREE APP PREVIEW ──────────────────────────────────── */}
      <section
        id="app-preview"
        className="dp-section"
        style={{ background: WARM_NEUTRAL_BG, textAlign: 'center' }}
      >
        <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          {/* Section label */}
          <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: BRAND_GREEN }}>
            Your Free App
          </span>

          {/* Headline */}
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.5rem, 5vw, 2.25rem)',
            fontWeight: 700,
            color: '#0f0e0c',
            margin: 0,
            lineHeight: 1.15,
          }}>
            Branded and ready.
          </h2>

          {/* Subline */}
          <p style={{ fontSize: '1rem', color: '#444', margin: 0, lineHeight: 1.65, maxWidth: '400px', fontWeight: 600 }}>
            This is a live, fully functional app — tap the buttons and explore. This is exactly what a new disciple sees the moment they open the {church.name} app.
          </p>

          {/* iframe — free-tier view (no group, lands on journal, pathway is locked) */}
          {/* key changes when gate opens to re-establish the free session in localStorage,
              preventing the full-experience iframe from contaminating this one. */}
          <div style={{
            width: '100%',
            maxWidth: '430px',
            aspectRatio: '9 / 16',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            background: '#fff',
            position: 'relative',
          }}>
            {!freeIframeSrc && (
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
            {freeIframeSrc && (
              <>
                <iframe
                  src={freeIframeSrc}
                  title={`${church.name} DNA Daily App`}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  loading="lazy"
                  style={{
                    width: '100%', height: '100%', border: 'none',
                    pointerEvents: isTouchDevice && !freeIframeActive ? 'none' : 'auto',
                  }}
                />
                {/* Tap-to-activate overlay — touch/mobile only */}
                {isTouchDevice && !freeIframeActive && (
                  <div
                    onClick={() => setFreeIframeActive(true)}
                    style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(0,0,0,0.18)',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: '0.875rem', cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      background: 'rgba(255,255,255,0.97)',
                      borderRadius: '50px',
                      padding: '0.875rem 1.75rem',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}>
                      <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>👆</span>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: '#111' }}>Tap to explore</span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.8rem', fontWeight: 500 }}>
                      Scroll outside the app to continue
                    </span>
                  </div>
                )}
                {/* Dismiss chip — returns user to page scroll mode */}
                {isTouchDevice && freeIframeActive && (
                  <button
                    onClick={() => setFreeIframeActive(false)}
                    style={{
                      position: 'absolute', bottom: '14px', left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(0,0,0,0.62)',
                      color: '#fff',
                      border: 'none', borderRadius: '50px',
                      padding: '0.5rem 1.25rem',
                      fontSize: '0.8rem', fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.375rem',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      whiteSpace: 'nowrap',
                      zIndex: 10,
                    }}
                  >
                    ↕ Scroll page
                  </button>
                )}
              </>
            )}
          </div>

          {/* Gift copy — bold */}
          <p style={{ fontSize: '1.05rem', color: '#222', margin: 0, lineHeight: 1.7, fontWeight: 700 }}>
            The app is our gift to the body of Christ. Start using it today — no strings attached.
          </p>

          <button onClick={() => setBookingOpen(true)} className="dp-btn-primary" style={{ background: primary }}>
            Book a Discovery Call
            <ArrowRight className="w-4 h-4" />
          </button>
          <Link
            href={assessmentUrl}
            style={{ fontSize: '0.875rem', color: '#888', textDecoration: 'none', borderBottom: '1px solid #ddd', paddingBottom: '1px' }}
          >
            Take the 5-min assessment first →
          </Link>
        </div>
      </section>

      {/* ── 6. THE GATE ──────────────────────────────────────────── */}
      <section style={{ background: '#1A2332', textAlign: 'center', padding: '3.5rem 1.25rem' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
            There&rsquo;s More
          </span>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.625rem, 5vw, 2.375rem)',
            fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.15,
          }}>
            What happens when DNA is <span style={{ color: GATE_GOLD }}>fully unlocked?</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', margin: 0, lineHeight: 1.7 }}>
            Groups. Multiplication. A dashboard that shows you exactly where every disciple is in their journey. This is what coaching partners experience.
          </p>
          <button
            onClick={() => {
              const next = !gateOpen;
              setGateOpen(next);
              if (next) {
                setTimeout(() => gateContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
              }
            }}
            style={{
              width: '100%', maxWidth: '360px',
              padding: '1rem 1.5rem',
              background: BRAND_GREEN,
              color: '#fff',
              border: 'none', borderRadius: '8px',
              fontFamily: 'inherit', fontSize: '1rem', fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              transition: 'opacity 0.15s',
            }}
          >
            {gateOpen ? 'Close ↑' : 'See the Full DNA Experience →'}
          </button>
        </div>
      </section>

      {/* ── 7. FULL EXPERIENCE (hidden until gate opens) ─────────── */}
      {gateOpen && (
        <div ref={gateContentRef}>
          {/* 7A — Full App Demo */}
          <section className="dp-section" style={{ background: WARM_NEUTRAL_BG, textAlign: 'center' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: BRAND_GREEN }}>
                Full DNA Experience
              </span>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(1.5rem, 5vw, 2.25rem)',
                fontWeight: 700, color: '#0f0e0c', margin: 0, lineHeight: 1.15,
              }}>
                The full DNA Pathway — unlocked.
              </h2>
              <p style={{ fontSize: '1rem', color: '#666', margin: 0, lineHeight: 1.65, maxWidth: '400px' }}>
                This is what your disciples experience when your church partners with DNA. The full DNA Pathway, in-progress tracking, and everything you need to multiply disciples.
              </p>

              {/* iframe — fully unlocked */}
              <div style={{
                width: '100%',
                maxWidth: '430px',
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
                    title={`${church.name} DNA Daily App — Full Experience`}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    loading="lazy"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BRAND_GREEN }}>
                  Live Preview
                </span>
                <p style={{ fontSize: '1.15rem', color: '#333', margin: 0, fontWeight: 600 }}>
                  {church.name} Discipleship
                </p>
              </div>
            </div>
          </section>

          {/* 7B — Leader Dashboard */}
          <section className="dp-section" style={{ background: '#1A2332' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(1.375rem, 4vw, 1.875rem)',
                  fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.2,
                }}>
                  Behind every disciple is a leader who knows where they are.
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.975rem', margin: 0, lineHeight: 1.7 }}>
                  The DNA dashboard gives you full visibility into every group, every disciple, and every stage of the journey — without being intrusive. This is where multiplication becomes measurable.
                </p>
              </div>
              {hubDemoUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Link
                    href={hubDemoUrl}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.875rem 1.5rem', borderRadius: '8px',
                      border: '1.5px solid rgba(255,255,255,0.4)', color: '#fff',
                      fontFamily: 'inherit', fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none',
                    }}
                  >
                    Explore the Leader Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>No login required · Full preview available</span>
                </div>
              )}
            </div>
          </section>

          {/* 7C — Coaching Partnership */}
          <section className="dp-section" style={{ background: WARM_NEUTRAL_BG }}>
            <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BRAND_GREEN }}>
                  Partnership
                </span>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(1.375rem, 4vw, 1.875rem)',
                  fontWeight: 700, color: '#0f0e0c', margin: 0, lineHeight: 1.2,
                }}>
                  Discipleship isn&rsquo;t accidental. Neither is our coaching.
                </h2>
                <p style={{ color: '#666', fontSize: '0.975rem', margin: 0, lineHeight: 1.7 }}>
                  When your church partners with DNA, you don&rsquo;t get a software subscription. You get a coach. Someone who walks with you through your first group, your first multiplication cycle, and beyond. We don&rsquo;t just hand you a system — we build it with you.
                </p>
              </div>

              {/* Proof points */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.375rem', width: '100%' }}>
                {([
                  { Icon: Compass, label: 'A dedicated DNA coach', body: 'From launch through your first multiplication cycle.' },
                  { Icon: Users,   label: 'Group infrastructure',  body: 'Tools, training, and a dashboard built for real groups.' },
                  { Icon: TrendingUp, label: 'Measurable multiplication', body: 'Track disciples, leaders, and generations — not just attendance.' },
                ] as const).map(({ Icon, label, body }) => (
                  <div key={label} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{
                      flexShrink: 0,
                      width: '40px', height: '40px',
                      borderRadius: '10px',
                      background: `${primary}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={20} style={{ color: primary }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: '#0f0e0c', margin: '0 0 0.25rem', fontSize: '0.975rem' }}>{label}</p>
                      <p style={{ color: '#777', margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>{body}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
                <button onClick={() => setBookingOpen(true)} className="dp-btn-primary" style={{ background: primary }}>
                  Book a Discovery Call
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Link
                  href={assessmentUrl}
                  style={{ fontSize: '0.875rem', color: '#888', textDecoration: 'none', borderBottom: '1px solid #ddd', paddingBottom: '1px' }}
                >
                  Take the 5-min assessment first →
                </Link>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── 8. FAQ ───────────────────────────────────────────────── */}
      <section className="dp-section" style={{ background: WARM_NEUTRAL_BG }}>
        <div style={{ maxWidth: '580px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: 700, color: '#0f0e0c', margin: '0 0 2rem', lineHeight: 1.2,
          }}>
            Common questions.
          </h2>
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
                      color: BRAND_GREEN,
                    }}
                  />
                </button>
                <div className={`dp-faq-a${faqOpen === i ? ' open' : ''}`}>
                  {item.a}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
            <Link
              href={assessmentUrl}
              style={{ fontSize: '0.9rem', color: primary, fontWeight: 600, textDecoration: 'none', borderBottom: `1px solid ${primary}` }}
            >
              Still have questions? The 5-min assessment helps us answer them before the call. →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. FINAL CTA ─────────────────────────────────────────── */}
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
              30 minutes. No pressure. Just a real conversation about what multiplication could look like at {church.name}.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', alignItems: 'center' }}>
              <button onClick={() => setBookingOpen(true)} className="dp-btn-primary" style={{ background: GATE_GOLD, justifyContent: 'center', width: '100%', maxWidth: '320px' }}>
                Book a Discovery Call
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link href={assessmentUrl} className="dp-btn-outline" style={{ justifyContent: 'center', width: '100%', maxWidth: '320px' }}>
                Take the Assessment First
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* ── 10. FOOTER ───────────────────────────────────────────── */}
      <footer style={{
        background: '#0a0a0a',
        padding: '1.5rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        textAlign: 'center',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem' }}>
          DNA Discipleship is a free resource for the body of Christ.
        </span>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem' }}>
          © {new Date().getFullYear()} DNA Discipleship · Personalized demo for {church.name}
        </span>
      </footer>

      {/* ── STICKY MOBILE CTA BAR ────────────────────────────────── */}
      <div className={`dp-sticky-bottom${stickyHidden ? ' hidden' : ''}`}>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', margin: '0 0 0.5rem', textAlign: 'center', fontWeight: 500 }}>
          Free to start. No commitment.
        </p>
        <button
          onClick={() => setBookingOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            width: '100%', padding: '0.875rem',
            background: GATE_GOLD, color: '#fff',
            borderRadius: '8px', fontWeight: 700, fontSize: '1rem',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Book a Discovery Call
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── BOOKING MODAL ────────────────────────────────────────── */}
      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} url={bookingUrl} />}
    </div>
  );
}
