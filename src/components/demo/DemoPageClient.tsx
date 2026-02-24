'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BookOpen,
  Heart,
  Calendar,
  Map,
  ChevronDown,
  ArrowRight,
  Check,
  LayoutDashboard,
  Users,
  TrendingUp,
} from 'lucide-react';

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
  appUrl: string;
  hubDemoUrl: string;
  bookCallUrl: string;
  assessmentUrl: string;
}

// ─── Temperature Content ─────────────────────────────────────────────────────

const TEMP_COPY = {
  cold: {
    eyebrow: 'DNA Discipleship',
    headline: 'See how DNA Discipleship works for churches like yours',
    subheadline: "A proven 90-day framework that's multiplied disciples in hundreds of churches. Built around your people, your context, your culture.",
    ctaText: 'Schedule a Free Overview Call',
    ctaSubtext: 'No commitment required — 30 minutes',
    videoLabel: 'A message from your DNA coach',
    appSectionHeadline: 'The app your disciples would use every day',
    appSectionSub: 'DNA Daily is a guided discipleship tool — prayer, Scripture, a daily pathway, and group connection in one place.',
  },
  warm: {
    eyebrow: 'Your Personalized Demo',
    headline: 'We put this together specifically for {{church_name}}',
    subheadline: "Here's what DNA discipleship would look like — your branding, your people, your church. Tap through the app below to explore your experience.",
    ctaText: 'Book a Discovery Call',
    ctaSubtext: "Let's see if this is the right fit",
    videoLabel: 'A personal message for {{church_name}}',
    appSectionHeadline: "{{church_name}}'s app, ready to explore",
    appSectionSub: "Your church's branded DNA Daily app — exactly what your disciples would see on Day 1.",
  },
  hot: {
    eyebrow: '{{church_name}} is ready',
    headline: '{{church_name}} is ready for this',
    subheadline: "Your app is branded and live. Your disciples' first experience starts here. Let's book a strategy call and set a launch date.",
    ctaText: 'Book Your Strategy Call',
    ctaSubtext: 'Your launch window is open',
    videoLabel: 'From your DNA coach',
    appSectionHeadline: 'Your app is live. Meet it.',
    appSectionSub: "This is exactly what your disciples will see when they tap the link in their invitation. It's already yours.",
  },
};

function interpolate(template: string, churchName: string): string {
  return template.replace(/\{\{church_name\}\}/g, churchName);
}

// ─── YouTube Utils ────────────────────────────────────────────────────────────

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

// ─── Feature Cards ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <Map className="w-6 h-6" />,
    title: 'Guided 90-Day Pathway',
    desc: 'Step-by-step content that takes each disciple through three phases — Foundation, Growth, and Multiplication — at their own pace.',
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: 'Scripture & 3D Journal',
    desc: 'Daily Bible passages with a Head, Heart, Hands journaling framework that helps disciples internalize and apply what they read.',
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: '4D Prayer Cards',
    desc: 'Organized prayer for self, group, church, and world. Track answered prayers, build a testimony journal over time.',
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    title: 'Group Connection',
    desc: 'See upcoming group meetings, stay connected to your DNA family, and never miss a beat in the discipleship rhythm.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'How long does it take to set up for our church?',
    a: 'Most churches are fully configured within a week of their strategy call. Branding, subdomain, and leader onboarding all happen before launch. Your first group can be discipling within 7–10 days.',
  },
  {
    q: 'Does this replace our existing discipleship curriculum?',
    a: "DNA Discipleship is a complete framework — not a plugin. It replaces ad-hoc approaches with a proven, reproducible system. That said, it's flexible enough to incorporate your church's theological distinctives.",
  },
  {
    q: "What if our members aren't tech-savvy?",
    a: "The Daily DNA app is intentionally simple — one button, three sections. We've seen it adopted by 70-year-olds and teenagers alike. Leaders are trained to walk their group through the first session together.",
  },
  {
    q: 'How is this different from a Bible app or devotional app?',
    a: 'DNA is a relational discipleship system, not a content platform. The app is built around accountability, group rhythm, and real multiplication — not individual consumption.',
  },
  {
    q: "What's the time commitment for group leaders?",
    a: 'Most leaders invest 60–90 minutes per week with their group, plus a few minutes daily in the app alongside their disciples. The system is designed to be sustainable, not overwhelming.',
  },
  {
    q: 'What support does our church get after launch?',
    a: "You're assigned a DNA coach who supports your launch, your first group cycle, and your multiplication. Ongoing training, a cohort of other church leaders, and a resource library are all included.",
  },
  {
    q: 'Is there a long-term contract?',
    a: "No lock-in. We believe in earning your partnership every cycle. Most churches stay because the results speak — but you're never trapped.",
  },
  {
    q: "Can we customize the app for our church's branding?",
    a: "Yes — completely. Your church name, logo, colors, and even custom links are applied to the app. Your disciples see your church identity, not a generic product.",
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DemoPageClient({
  church,
  demo,
  temp,
  appUrl: _appUrl,
  hubDemoUrl,
  bookCallUrl,
  assessmentUrl,
}: DemoPageClientProps) {
  const copy = TEMP_COPY[temp];
  const primary = church.primary_color;
  const accent = church.accent_color;
  const videoId = demo.video_url ? extractYouTubeId(demo.video_url) : null;

  const [showStickyCta, setShowStickyCta] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [iframeSrc, setIframeSrc] = useState('');
  const heroRef = useRef<HTMLDivElement>(null);

  // Show sticky CTA after hero scrolls out of view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCta(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  // Scroll fade-in for .demo-fade elements
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.demo-fade');
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) (e.target as HTMLElement).style.opacity = '1';
        }),
      { threshold: 0.12 }
    );
    els.forEach((el) => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      obs.observe(el);
    });
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

  const headline = interpolate(copy.headline, church.name);
  const subheadline = interpolate(copy.subheadline, church.name);
  const eyebrow = interpolate(copy.eyebrow, church.name);
  const videoLabel = interpolate(copy.videoLabel, church.name);
  const appSectionHeadline = interpolate(copy.appSectionHeadline, church.name);
  const appSectionSub = interpolate(copy.appSectionSub, church.name);

  return (
    <div
      className="demo-page"
      style={{ fontFamily: "'DM Sans', sans-serif", background: '#faf8f4', color: '#0f0e0c', overflowX: 'hidden' }}
    >
      {/* ── Google Fonts + Styles ─────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        .demo-page * { box-sizing: border-box; }

        /* Sticky CTA bar */
        .demo-sticky-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: ${primary}f0; backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.75rem 2rem; gap: 1rem;
          transform: translateY(-100%); transition: transform 0.3s ease;
          border-bottom: 1px solid ${primary}40;
        }
        .demo-sticky-bar.visible { transform: translateY(0); }

        /* Two-column hero */
        .demo-hero-cols {
          display: flex;
          gap: 3rem;
          align-items: flex-start;
          max-width: 1100px;
          margin: 0 auto;
        }
        .demo-hero-text { flex: 0 0 55%; min-width: 0; }
        .demo-hero-video { flex: 0 0 40%; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 0.875rem; }

        /* App iframe — natural proportions, no phone frame */
        .demo-app-iframe-wrap {
          width: 100%;
          max-width: 390px;
          aspect-ratio: 9 / 16;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 32px 72px rgba(0,0,0,0.5);
          background: #fff;
          flex-shrink: 0;
          position: relative;
        }
        .demo-app-iframe-wrap iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }
        .demo-app-loading {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 0.875rem; background: #111827;
        }
        @keyframes demo-spin {
          to { transform: rotate(360deg); }
        }
        .demo-spinner {
          width: 28px; height: 28px;
          border: 3px solid rgba(255,255,255,0.15);
          border-top-color: ${primary};
          border-radius: 50%;
          animation: demo-spin 0.75s linear infinite;
        }

        /* FAQ */
        .demo-faq-item { border-bottom: 1px solid #e8e4dc; }
        .demo-faq-q {
          width: 100%; background: none; border: none; text-align: left; cursor: pointer;
          padding: 1.25rem 0; display: flex; justify-content: space-between; align-items: center;
          font-family: inherit; font-size: 1rem; font-weight: 500; color: #0f0e0c;
          gap: 1rem;
        }
        .demo-faq-a {
          overflow: hidden; transition: max-height 0.3s ease;
          padding-bottom: 1.25rem; color: #555; line-height: 1.7; font-size: 0.95rem;
        }

        /* Scroll fade */
        .demo-fade { opacity: 0; transform: translateY(18px); }

        /* Responsive */
        @media (max-width: 900px) {
          .demo-hero-cols { flex-direction: column; gap: 2.5rem; }
          .demo-hero-text { flex: 1 1 auto; }
          .demo-hero-video { flex: 1 1 auto; width: 100%; max-width: 300px; margin: 0 auto; }
          .demo-app-section-inner { flex-direction: column !important; align-items: center !important; }
          .demo-features-col { max-width: 100% !important; }
          .demo-sticky-bar { padding: 0.6rem 1rem; }
          .demo-sticky-church { display: none !important; }
        }
        @media (max-width: 600px) {
          .demo-hero-inner { padding: 5rem 1.25rem 3rem !important; }
          .demo-section { padding: 3.5rem 1.25rem !important; }
        }
      `}</style>

      {/* ── Sticky CTA Bar ───────────────────────────────────────── */}
      <div className={`demo-sticky-bar${showStickyCta ? ' visible' : ''}`}>
        <span className="demo-sticky-church" style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem', opacity: 0.85 }}>
          {church.name}&rsquo;s Demo
        </span>
        <div style={{ flex: 1 }} />
        <Link
          href={bookCallUrl}
          style={{
            background: accent,
            color: '#fff',
            padding: '0.5rem 1.25rem',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            whiteSpace: 'nowrap',
          }}
        >
          {copy.ctaText}
        </Link>
      </div>

      {/* ── NAV ──────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 90,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.25rem 2.5rem',
        background: 'rgba(250,248,244,0.88)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Image src="/dna-logo.svg" alt="DNA" width={32} height={32} style={{ opacity: 0.9 }} onError={() => {}} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#555' }}>DNA Discipleship</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {church.logo_url && (
            <img src={church.logo_url} alt={church.name} style={{ height: '28px', objectFit: 'contain', opacity: 0.9 }} />
          )}
        </div>
      </nav>

      {/* ── HERO (two-column on desktop) ──────────────────────────── */}
      <section
        ref={heroRef}
        className="demo-hero-inner"
        style={{ padding: '6rem 2.5rem 4rem', background: '#faf8f4' }}
      >
        <div className="demo-hero-cols">

          {/* Left: text content */}
          <div className="demo-hero-text" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: accent, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              <span style={{ display: 'block', width: '2rem', height: '1px', background: accent }} />
              {eyebrow}
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)',
              lineHeight: 1.08,
              fontWeight: 700,
              color: '#0f0e0c',
              margin: 0,
            }}>
              {headline}
            </h1>

            {/* Subheadline */}
            <p style={{ fontSize: '1.1rem', lineHeight: 1.65, color: '#555', margin: 0 }}>
              {subheadline}
            </p>

            {/* Single scroll-anchor CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
              <a
                href="#app-preview"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('app-preview')?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: accent,
                  color: '#fff',
                  padding: '0.85rem 1.75rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.975rem',
                  alignSelf: 'flex-start',
                  cursor: 'pointer',
                }}
              >
                View Your App
                <ArrowRight className="w-4 h-4" />
              </a>
              <p style={{ fontSize: '0.82rem', color: '#888', margin: 0 }}>
                Your branded app is live below
              </p>
            </div>
          </div>

          {/* Right: vertical coach video */}
          {videoId && (
            <div className="demo-hero-video">
              {/* Video label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: accent, fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', alignSelf: 'flex-start' }}>
                <span style={{ display: 'block', width: '1.5rem', height: '1px', background: accent }} />
                {videoLabel}
              </div>
              {/* 9:16 video */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '9 / 16',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 24px 56px rgba(0,0,0,0.2)',
                  background: '#000',
                }}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`}
                  title="Coach video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ── APP PREVIEW ──────────────────────────────────────────── */}
      <section
        id="app-preview"
        className="demo-fade"
        style={{ background: '#0d1520', padding: '6rem 2.5rem' }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', color: accent, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              <span style={{ display: 'block', width: '2rem', height: '1px', background: accent }} />
              Live App Preview
              <span style={{ display: 'block', width: '2rem', height: '1px', background: accent }} />
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 700, color: '#fff', margin: '0 0 1rem', lineHeight: 1.15 }}>
              {appSectionHeadline}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto', lineHeight: 1.65 }}>
              {appSectionSub}
            </p>
          </div>

          {/* App iframe + Feature callouts */}
          <div className="demo-app-section-inner" style={{ display: 'flex', alignItems: 'flex-start', gap: '4rem', justifyContent: 'center' }}>

            {/* Natural proportions iframe — no phone frame */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div className="demo-app-iframe-wrap">
                {!iframeSrc && (
                  <div className="demo-app-loading">
                    <div className="demo-spinner" />
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
                      Loading your app…
                    </p>
                  </div>
                )}
                {iframeSrc && (
                  <iframe
                    src={iframeSrc}
                    title={`${church.name} DNA Daily App`}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    loading="lazy"
                  />
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                Live preview · {church.app_title}
              </p>
            </div>

            {/* Feature callouts */}
            <div className="demo-features-col" style={{ maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '1.5rem' }}>
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  className="demo-fade"
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)',
                  }}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                    background: accent + '22', color: accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.25rem', fontSize: '0.975rem' }}>
                      {f.title}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {f.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LEADER DASHBOARD TEASER ──────────────────────────────── */}
      <section
        className="demo-fade"
        style={{
          background: '#0a0f18',
          padding: '6rem 2.5rem',
          color: '#fff',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: accent, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            <span style={{ display: 'block', width: '2rem', height: '1px', background: accent }} />
            Leader Dashboard
            <span style={{ display: 'block', width: '2rem', height: '1px', background: accent }} />
          </div>

          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 700, lineHeight: 1.1, margin: 0, maxWidth: '680px' }}>
            Behind every app is a powerful leader dashboard
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', maxWidth: '540px', lineHeight: 1.65, margin: 0 }}>
            Pastors and group leaders get full visibility into how their disciples are growing — without being intrusive.
          </p>

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { icon: <Users className="w-5 h-5" />, title: 'Group & Disciple Management', desc: 'See every group, every disciple, their journey progress, and engagement at a glance.' },
              { icon: <TrendingUp className="w-5 h-5" />, title: 'Discipleship Insights', desc: 'Pathway progress, prayer activity, journal consistency — without requiring a report.' },
              { icon: <LayoutDashboard className="w-5 h-5" />, title: 'Full Church Dashboard', desc: "One place for your church's discipleship calendar, cohort, and leadership pipeline." },
            ].map((b, i) => (
              <div key={i} style={{ maxWidth: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: accent + '22', color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {b.icon}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.975rem' }}>{b.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', lineHeight: 1.6 }}>{b.desc}</div>
              </div>
            ))}
          </div>

          <Link
            href={hubDemoUrl}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.8rem 1.75rem',
              borderRadius: '8px',
              background: accent,
              color: '#fff',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.975rem',
            }}
          >
            See the Leader Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', margin: '-1rem 0 0' }}>
            No login required — explore the full dashboard preview
          </p>
        </div>
      </section>

      {/* ── HAVE QUESTIONS? ──────────────────────────────────────── */}
      <section
        className="demo-fade"
        style={{ background: '#faf8f4', padding: '5.5rem 2.5rem' }}
      >
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          {/* Section heading — always visible */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: 700,
              color: '#0f0e0c',
              margin: '0 0 0.75rem',
              lineHeight: 1.1,
            }}>
              Have Questions?
            </h2>
            <p style={{ color: '#666', fontSize: '1.05rem', margin: 0, lineHeight: 1.6 }}>
              {"We've answered the most common ones below."}
            </p>
          </div>

          {/* FAQ Accordion — always visible */}
          <div style={{ borderTop: '1px solid #e8e4dc' }}>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="demo-faq-item">
                <button
                  className="demo-faq-q"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  aria-expanded={faqOpen === i}
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className="w-4 h-4"
                    style={{ flexShrink: 0, transform: faqOpen === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', color: accent }}
                  />
                </button>
                <div
                  className="demo-faq-a"
                  style={{ maxHeight: faqOpen === i ? '400px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}
                >
                  {item.a}
                </div>
              </div>
            ))}

            {/* Assessment CTA inside FAQ section */}
            <div style={{ marginTop: '2.5rem', padding: '2rem', background: '#fff', borderRadius: '12px', border: '1px solid #eee', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <p style={{ fontWeight: 600, color: '#0f0e0c', margin: 0, fontSize: '1.05rem' }}>
                Still have questions? Our assessment will help us answer them for you.
              </p>
              <Link
                href={assessmentUrl}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.7rem 1.5rem', borderRadius: '8px',
                  border: `2px solid ${primary}`, color: primary,
                  fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none',
                }}
              >
                <Check className="w-4 h-4" />
                Take the Church Assessment
              </Link>
              <p style={{ fontSize: '0.82rem', color: '#888', margin: 0 }}>
                5 minutes · Helps us understand your context before any call
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ───────────────────────────────────────────── */}
      <section
        className="demo-fade"
        style={{
          background: primary,
          padding: '6rem 2.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.1 }}>
            Ready to take the next step?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', margin: 0, lineHeight: 1.65 }}>
            A discovery call is a no-pressure 30-minute conversation to see if DNA is the right fit for {church.name}.
          </p>
          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link
              href={bookCallUrl}
              style={{
                background: accent,
                color: '#fff',
                padding: '0.875rem 2rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {copy.ctaText}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={assessmentUrl}
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.85)',
                padding: '0.875rem 1.75rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '1rem',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              Take the Assessment
            </Link>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', margin: 0 }}>{copy.ctaSubtext}</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{ background: '#0f0e0c', padding: '2rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
          © {new Date().getFullYear()} DNA Discipleship
        </span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
          Personalized demo for {church.name}
        </span>
      </footer>
    </div>
  );
}
