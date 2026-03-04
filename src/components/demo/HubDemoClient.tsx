'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  BookOpen,
  TrendingUp,
  Heart,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowLeft,
  Loader2,
  Compass,
  GraduationCap,
  MessageSquare,
  Megaphone,
  FileText,
  Rocket,
  PlusCircle,
} from 'lucide-react';
import { createClientSupabase } from '@/lib/supabase';
import BookingModal from '@/components/demo/BookingModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Church {
  name: string;
  subdomain: string;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
}

interface CalEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string | null;
  event_type: string;
}

interface HubDemoClientProps {
  church: Church;
  events: CalEvent[];
  demoPageUrl: string;
  bookingUrl?: string;
  embed?: boolean;
}

// ─── Hardcoded Seed Data ──────────────────────────────────────────────────────

const SEED_DISCIPLES = [
  {
    name: 'Marcus Webb',
    phase: 1,
    week: 3,
    journalCount: 7,
    prayerCount: 4,
    pathwayPct: 38,
    lastActive: '2 days ago',
    status: 'active' as const,
    checkpoints: ['Week 1 intro', 'Scripture method', 'Prayer structure', 'Week 2 reflection'],
  },
  {
    name: 'Jordan Salinas',
    phase: 1,
    week: 2,
    journalCount: 4,
    prayerCount: 6,
    pathwayPct: 22,
    lastActive: 'Today',
    status: 'active' as const,
    checkpoints: ['Week 1 intro', 'Scripture method'],
  },
  {
    name: 'Priya Nair',
    phase: 1,
    week: 3,
    journalCount: 9,
    prayerCount: 3,
    pathwayPct: 44,
    lastActive: 'Yesterday',
    status: 'active' as const,
    checkpoints: ['Week 1 intro', 'Scripture method', 'Prayer structure', 'Week 2 reflection', 'Identity week'],
  },
];

const SEED_GROUP = {
  name: 'Life Group Alpha',
  phase: 'foundation',
  week: 3,
  startDate: (() => {
    const d = new Date();
    d.setDate(d.getDate() - 21);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  })(),
};

const SEED_CHAT = [
  { sender: 'Sarah Mitchell', role: 'leader', text: 'Welcome to Life Group Alpha! Excited to walk through the Foundation phase together.', time: '10d ago' },
  { sender: 'Demo Disciple', role: 'member', text: 'Thank you! I just finished the Week 1 life assessment. Really eye-opening.', time: '9d ago' },
  { sender: 'Sarah Mitchell', role: 'leader', text: "That's great to hear! What stood out to you most?", time: '9d ago' },
  { sender: 'Demo Disciple', role: 'member', text: "Try journaling through John 15 this week — Head, Heart, and Hands.", time: '8d ago' },
];

const SEED_UPCOMING_EVENTS = [
  { title: 'Group Meeting — Week 4', day: 'Wed', date: (() => { const d = new Date(); d.setDate(d.getDate() + ((3 - d.getDay() + 7) % 7 || 7)); return d.getDate(); })(), time: '7:00 PM', location: 'Main Campus Room 204' },
  { title: 'Group Meeting — Week 5', day: 'Wed', date: (() => { const d = new Date(); d.setDate(d.getDate() + ((3 - d.getDay() + 7) % 7 || 7) + 7); return d.getDate(); })(), time: '7:00 PM', location: 'Main Campus Room 204' },
  { title: 'Scripture Deep-Dive', day: 'Sat', date: (() => { const d = new Date(); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); return d.getDate(); })(), time: '9:00 AM', location: 'Coffee House' },
];

const PHASES = ['Pre-Launch', 'Invitation', 'Foundation', 'Growth', 'Multiplication'];

// ─── Auth states ──────────────────────────────────────────────────────────────

type AuthState = 'loading' | 'redirecting' | 'fallback';

// ─── Loading / Entry Screen ───────────────────────────────────────────────────

function LoadingScreen({ church }: { church: Church }) {
  const primary = church.primary_color ?? '#143348';
  const accent = church.accent_color ?? '#e8b562';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f7f5f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        fontFamily: "'DM Sans', sans-serif",
        padding: '2rem',
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');`}</style>

      <div style={{ textAlign: 'center' }}>
        {church.logo_url ? (
          <img src={church.logo_url} alt={church.name} style={{ height: '56px', objectFit: 'contain', marginBottom: '0.75rem' }} />
        ) : (
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: primary,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 700,
            margin: '0 auto 0.75rem',
          }}>
            {church.name.charAt(0)}
          </div>
        )}
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f0e0c' }}>{church.name}</div>
        <div style={{ fontSize: '0.875rem', color: '#888', marginTop: '0.25rem' }}>DNA Hub · Leader Dashboard</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <Loader2
          className="animate-spin"
          style={{ width: '32px', height: '32px', color: accent }}
        />
        <div style={{ fontSize: '0.875rem', color: '#888' }}>Preparing your personalized demo…</div>
      </div>

      <div style={{ fontSize: '0.75rem', color: '#bbb', marginTop: '1rem' }}>
        Powered by DNA Discipleship
      </div>
    </div>
  );
}

// ─── Static Mini-Dashboard ──────────────────────────────────────────────────

type HubView = 'groups' | 'group-detail' | 'cohort' | 'training';

function StaticMiniDashboard({ church, demoPageUrl, bookingUrl, embed }: HubDemoClientProps) {
  const [activeView, setActiveView] = useState<HubView>('groups');
  const [bookingOpen, setBookingOpen] = useState(false);
  const primary = church.primary_color;
  const accent = church.accent_color;

  const navItems = [
    { id: 'groups' as HubView, icon: <Users className="w-4 h-4" />, label: 'Groups' },
    { id: 'cohort' as HubView, icon: <Compass className="w-4 h-4" />, label: 'Cohort' },
    { id: 'training' as HubView, icon: <GraduationCap className="w-4 h-4" />, label: 'Training' },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', background: '#f7f5f0', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .hub-demo-nav-item {
          display: flex; align-items: center; gap: 0.625rem;
          padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer;
          color: #555; font-size: 0.875rem; font-weight: 500;
          border: none; background: none; font-family: inherit;
          transition: background 0.15s, color 0.15s;
          width: 100%; text-align: left;
        }
        .hub-demo-nav-item:hover { background: rgba(0,0,0,0.05); }
        .hub-demo-nav-item.active { background: ${primary}18; color: ${primary}; font-weight: 600; }
        .hub-demo-card { background: #fff; border-radius: 12px; border: 1px solid #e8e4dc; padding: 1.5rem; }
        .hub-demo-progress-bar { height: 6px; background: #eee; border-radius: 3px; overflow: hidden; }
        .hub-demo-progress-fill { height: 100%; border-radius: 3px; background: ${accent}; }
        .hub-demo-banner { display: flex; }
        @media (max-width: 768px) {
          .hub-demo-layout { flex-direction: column !important; }
          .hub-demo-sidebar { width: 100% !important; flex-direction: row !important; padding: 0.75rem 1rem !important; gap: 0 !important; }
          .hub-demo-sidebar-header { display: none !important; }
          .hub-demo-nav-item { padding: 0.5rem 0.75rem; font-size: 0.8rem; }
          .hub-demo-nav-item span { display: none; }
        }
        @media (max-width: 500px) {
          .hub-demo-banner { display: none !important; }
        }
      `}</style>

      {/* ── Demo Banner (hidden in embed mode + narrow widths) ─────── */}
      {!embed && (
        <div className="hub-demo-banner" style={{ background: primary, padding: '0.5rem 1.25rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href={demoPageUrl} style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: '0.8rem',
            fontWeight: 500,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back to demo
          </Link>
          <button onClick={() => setBookingOpen(true)} style={{
            background: accent,
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: 700,
            padding: '0.25rem 0.875rem',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            Book a Call →
          </button>
        </div>
      )}

      {/* ── Top Nav ─────────────────────────────────────────────── */}
      <header style={{ background: primary, padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {church.logo_url ? (
          <img src={church.logo_url} alt={church.name} style={{ height: '28px', objectFit: 'contain' }} />
        ) : (
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', fontFamily: "'DM Sans', sans-serif" }}>{church.name}</span>
        )}
        <span style={{ background: accent + '33', color: accent, fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          DNA Hub
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>
          {church.name.charAt(0)}
        </div>
      </header>

      {/* ── Layout ──────────────────────────────────────────────── */}
      <div className="hub-demo-layout" style={{ display: 'flex', flex: 1, maxWidth: '1100px', margin: '0 auto', width: '100%', gap: '1.5rem', padding: '1.5rem' }}>

        {/* Sidebar */}
        <aside className="hub-demo-sidebar" style={{ width: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div className="hub-demo-sidebar-header" style={{ padding: '0.25rem 1rem 0.75rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa' }}>
            Navigation
          </div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`hub-demo-nav-item${activeView === item.id || (activeView === 'group-detail' && item.id === 'groups') ? ' active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #e8e4dc' }}>
            <div style={{ padding: '0.625rem 1rem', fontSize: '0.8rem', color: '#aaa' }}>
              DNA Discipleship
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* ── GROUPS VIEW ─────────────────────────────────────── */}
          {activeView === 'groups' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 700, color: '#0f0e0c', margin: '0 0 0.25rem' }}>
                  DNA Groups
                </h1>
                <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>Welcome back · {church.name}</p>
              </div>

              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                {[
                  { label: 'Active Groups', value: '1', icon: <Users className="w-5 h-5" /> },
                  { label: 'Total Disciples', value: '3', icon: <TrendingUp className="w-5 h-5" /> },
                  { label: 'All-Time Groups', value: '1', icon: <BookOpen className="w-5 h-5" /> },
                ].map((stat, i) => (
                  <div key={i} className="hub-demo-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ color: primary, opacity: 0.7 }}>{stat.icon}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f0e0c', lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#333' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* My Groups heading */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#0f0e0c' }}>My Groups</h2>
                <button style={{ background: primary, color: '#fff', fontSize: '0.8rem', fontWeight: 600, padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <PlusCircle className="w-3.5 h-3.5" /> New Group
                </button>
              </div>

              {/* Group card */}
              <div
                className="hub-demo-card"
                style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                onClick={() => setActiveView('group-detail')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 600, color: '#0f0e0c' }}>{SEED_GROUP.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#888' }}>Started {SEED_GROUP.startDate}</p>
                  </div>
                  <span style={{ background: accent + '22', color: accent, fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.625rem', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Foundation
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Users className="w-3.5 h-3.5" /> 3 disciples</span>
                  <span style={{ fontSize: '0.82rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar className="w-3.5 h-3.5" /> Week {SEED_GROUP.week}</span>
                  <span style={{ fontSize: '0.82rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><BookOpen className="w-3.5 h-3.5" /> Phase 1</span>
                </div>
              </div>
            </div>
          )}

          {/* ── GROUP DETAIL VIEW ───────────────────────────────── */}
          {activeView === 'group-detail' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Breadcrumb */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button onClick={() => setActiveView('groups')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}>
                  <ArrowLeft className="w-4 h-4" /> Groups
                </button>
                <span style={{ color: '#ccc' }}>/</span>
                <span style={{ fontWeight: 500, fontSize: '0.875rem', color: '#333' }}>{SEED_GROUP.name}</span>
              </div>

              {/* Group header */}
              <div className="hub-demo-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 700, color: '#0f0e0c' }}>{SEED_GROUP.name}</h2>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#888' }}>Led by Sarah Mitchell · Started {SEED_GROUP.startDate}</p>
                </div>
                <span style={{ background: accent + '22', color: accent, fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.625rem', borderRadius: '12px', textTransform: 'uppercase' }}>
                  Foundation
                </span>
              </div>

              {/* Phase stepper */}
              <div className="hub-demo-card" style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                  {PHASES.map((phase, i) => {
                    const isActive = phase === 'Foundation';
                    const isPast = i < 2; // Pre-Launch and Invitation are "done"
                    return (
                      <div key={phase} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: isActive ? primary : isPast ? accent : '#e8e4dc',
                          color: isActive || isPast ? '#fff' : '#aaa',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.65rem', fontWeight: 700, zIndex: 1,
                        }}>
                          {isPast ? '✓' : i + 1}
                        </div>
                        <span style={{ fontSize: '0.6rem', color: isActive ? primary : '#aaa', fontWeight: isActive ? 600 : 400, marginTop: '0.25rem', textAlign: 'center', lineHeight: 1.1 }}>
                          {phase}
                        </span>
                        {i < PHASES.length - 1 && (
                          <div style={{ position: 'absolute', top: '12px', left: '50%', width: '100%', height: '2px', background: isPast || isActive ? accent : '#e8e4dc', zIndex: 0 }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Disciples list */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0f0e0c' }}>Disciples</h3>
                  <span style={{ fontSize: '0.82rem', color: '#888' }}>{SEED_DISCIPLES.length} active</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {SEED_DISCIPLES.map((d, i) => (
                    <div key={i} className="hub-demo-card" style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: primary + '22', color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                          {d.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.925rem', color: '#0f0e0c', marginBottom: '0.125rem' }}>{d.name}</div>
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.78rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><BookOpen className="w-3 h-3" /> {d.journalCount}</span>
                            <span style={{ fontSize: '0.78rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Heart className="w-3 h-3" /> {d.prayerCount}</span>
                            <span style={{ fontSize: '0.78rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Clock className="w-3 h-3" /> {d.lastActive}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: primary }}>{d.pathwayPct}%</div>
                          <div className="hub-demo-progress-bar" style={{ width: '60px', marginTop: '2px' }}>
                            <div className="hub-demo-progress-fill" style={{ width: `${d.pathwayPct}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar section */}
              <div>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#0f0e0c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar className="w-4 h-4" style={{ color: primary }} /> Upcoming Events
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {SEED_UPCOMING_EVENTS.map((ev, i) => (
                    <div key={i} className="hub-demo-card" style={{ padding: '0.875rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: '8px', background: primary + '14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: primary }}>
                        <div style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ev.day}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1 }}>{ev.date}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f0e0c', marginBottom: '0.125rem' }}>{ev.title}</div>
                        <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.78rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Clock className="w-3 h-3" /> {ev.time}</span>
                          <span style={{ fontSize: '0.78rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><MapPin className="w-3 h-3" /> {ev.location}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Group chat preview */}
              <div>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#0f0e0c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare className="w-4 h-4" style={{ color: primary }} /> Group Chat
                </h3>
                <div className="hub-demo-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {SEED_CHAT.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: msg.role === 'leader' ? primary + '22' : accent + '22', color: msg.role === 'leader' ? primary : accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0 }}>
                        {msg.sender.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', marginBottom: '0.125rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0f0e0c' }}>{msg.sender}</span>
                          {msg.role === 'leader' && (
                            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: primary, background: primary + '14', padding: '0.1rem 0.375rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leader</span>
                          )}
                          <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{msg.time}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#555', lineHeight: 1.45 }}>{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── COHORT VIEW ─────────────────────────────────────── */}
          {activeView === 'cohort' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 700, color: '#0f0e0c', margin: '0 0 0.25rem' }}>
                  DNA Cohort
                </h1>
                <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>Your peer-to-peer leader community</p>
              </div>

              {/* Cohort identity card */}
              <div className="hub-demo-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 600, color: '#0f0e0c' }}>DNA Cohort — Generation 1</h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#888' }}>{church.name}</p>
                  </div>
                  <span style={{ background: '#e8f5e9', color: '#27ae60', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.625rem', borderRadius: '12px', textTransform: 'uppercase' }}>
                    Leader
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#aaa' }}>Started 2 months ago</p>
              </div>

              {/* Cohort stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
                {[
                  { label: 'Leaders', value: '6', icon: <Users className="w-4 h-4" /> },
                  { label: 'Trainers', value: '2', icon: <GraduationCap className="w-4 h-4" /> },
                  { label: 'Events', value: '3', icon: <Calendar className="w-4 h-4" /> },
                ].map((s, i) => (
                  <div key={i} className="hub-demo-card" style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ color: primary, opacity: 0.7, display: 'flex', justifyContent: 'center', marginBottom: '0.375rem' }}>{s.icon}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f0e0c', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.25rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Announcements */}
              <div>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#0f0e0c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Megaphone className="w-4 h-4" style={{ color: primary }} /> Announcements
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {[
                    { title: 'Welcome to DNA Cohort', author: 'Coach Travis', time: '2 weeks ago', body: 'Excited to begin this journey together. You are the leaders God is raising up.' },
                    { title: 'Phase 1 Resources Available', author: 'Coach Travis', time: '1 week ago', body: 'Foundation resources and the Multiplication Manual are now available in your Training tab.' },
                  ].map((a, i) => (
                    <div key={i} className="hub-demo-card" style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.375rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f0e0c' }}>{a.title}</span>
                        <span style={{ fontSize: '0.72rem', color: '#aaa', flexShrink: 0 }}>{a.time}</span>
                      </div>
                      <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: '#555', lineHeight: 1.5 }}>{a.body}</p>
                      <span style={{ fontSize: '0.72rem', color: '#aaa' }}>by {a.author}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next event */}
              <div>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#0f0e0c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar className="w-4 h-4" style={{ color: primary }} /> Next Event
                </h3>
                <div className="hub-demo-card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: '10px', background: primary + '14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: primary }}>
                    <div style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase' }}>Mon</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1 }}>
                      {(() => { const d = new Date(); d.setDate(d.getDate() + ((1 - d.getDay() + 7) % 7 || 7)); return d.getDate(); })()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.925rem', color: '#0f0e0c', marginBottom: '0.125rem' }}>Monthly Cohort Gathering</div>
                    <div style={{ display: 'flex', gap: '0.875rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Clock className="w-3 h-3" /> 6:30 PM</span>
                      <span style={{ fontSize: '0.78rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><MapPin className="w-3 h-3" /> Fellowship Hall</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TRAINING VIEW ───────────────────────────────────── */}
          {activeView === 'training' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 700, color: '#0f0e0c', margin: '0 0 0.25rem' }}>
                  DNA Training
                </h1>
                <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>Your leadership development journey</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {([
                  {
                    icon: <CheckCircle2 className="w-5 h-5" />,
                    title: 'Flow Assessment',
                    desc: 'Discover your unique ministry gifts and leadership style.',
                    completed: true,
                  },
                  {
                    icon: <FileText className="w-5 h-5" />,
                    title: 'Multiplication Manual',
                    desc: '6 sessions covering the heart and theology of multiplication discipleship.',
                    completed: false,
                  },
                  {
                    icon: <Rocket className="w-5 h-5" />,
                    title: 'Launch Guide',
                    desc: '5 phases to prepare for launching your first DNA group.',
                    completed: false,
                  },
                  {
                    icon: <PlusCircle className="w-5 h-5" />,
                    title: 'Create DNA Group',
                    desc: 'Set up your first group and start the Foundation phase.',
                    completed: true,
                  },
                ] as const).map((card, i) => (
                  <div key={i} className="hub-demo-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1.125rem 1.25rem' }}>
                    <div style={{
                      flexShrink: 0,
                      width: 40, height: 40,
                      borderRadius: '10px',
                      background: card.completed ? '#e8f5e9' : primary + '14',
                      color: card.completed ? '#27ae60' : primary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {card.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#0f0e0c' }}>{card.title}</span>
                        {card.completed && (
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#27ae60', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', lineHeight: 1.5 }}>{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} url={bookingUrl} />}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function HubDemoClient({ church, events, demoPageUrl, bookingUrl, embed }: HubDemoClientProps) {
  const [authState, setAuthState] = useState<AuthState>(embed ? 'fallback' : 'loading');

  useEffect(() => {
    if (embed) return;

    async function establishSession() {
      try {
        const res = await fetch(`/api/demo/hub-session/${church.subdomain}`);
        const data = await res.json();

        if (!data.demo_auth) {
          setAuthState('fallback');
          return;
        }

        const supabase = createClientSupabase();
        const { error } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (error) {
          console.error('[DEMO] setSession error:', error.message);
          setAuthState('fallback');
          return;
        }

        try {
          localStorage.setItem('dna_demo_mode', '1');
          localStorage.setItem('dna_demo_church', church.name);
          localStorage.setItem('dna_demo_page_url', demoPageUrl);
          if (bookingUrl) localStorage.setItem('dna_demo_booking_url', bookingUrl);
          else localStorage.removeItem('dna_demo_booking_url');
        } catch {
          // ignore
        }

        setAuthState('redirecting');
        setTimeout(() => {
          window.location.href = '/groups';
        }, 600);
      } catch (err) {
        console.error('[DEMO] Hub session error:', err);
        setAuthState('fallback');
      }
    }

    void establishSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embed, church.subdomain, church.name, demoPageUrl, bookingUrl]);

  if (authState === 'loading' || authState === 'redirecting') {
    return <LoadingScreen church={church} />;
  }

  return <StaticMiniDashboard church={church} events={events} demoPageUrl={demoPageUrl} bookingUrl={bookingUrl} embed={embed} />;
}
