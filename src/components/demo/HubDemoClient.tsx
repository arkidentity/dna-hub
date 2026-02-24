'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  BookOpen,
  LayoutDashboard,
  ChevronLeft,
  TrendingUp,
  Heart,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowLeft,
  Info,
} from 'lucide-react';

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
}

// ─── Hardcoded Seed Disciples ─────────────────────────────────────────────────

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

// ─── Sub-views ────────────────────────────────────────────────────────────────

type HubView = 'overview' | 'disciples' | 'disciple-detail' | 'calendar';

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HubDemoClient({ church, events, demoPageUrl }: HubDemoClientProps) {
  const [activeView, setActiveView] = useState<HubView>('overview');
  const [selectedDisciple, setSelectedDisciple] = useState<typeof SEED_DISCIPLES[0] | null>(null);
  const primary = church.primary_color;
  const accent = church.accent_color;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const navItems = [
    { id: 'overview' as HubView, icon: <LayoutDashboard className="w-4 h-4" />, label: 'Overview' },
    { id: 'disciples' as HubView, icon: <Users className="w-4 h-4" />, label: 'Disciples' },
    { id: 'calendar' as HubView, icon: <Calendar className="w-4 h-4" />, label: 'Calendar' },
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
        @media (max-width: 768px) {
          .hub-demo-layout { flex-direction: column !important; }
          .hub-demo-sidebar { width: 100% !important; flex-direction: row !important; padding: 0.75rem 1rem !important; gap: 0 !important; }
          .hub-demo-sidebar-header { display: none !important; }
          .hub-demo-nav-item { padding: 0.5rem 0.75rem; font-size: 0.8rem; }
          .hub-demo-nav-item span { display: none; }
        }
      `}</style>

      {/* ── Demo Notice Banner ──────────────────────────────────── */}
      <div style={{ background: accent + 'dd', padding: '0.625rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
        <Info className="w-4 h-4" style={{ color: '#fff', flexShrink: 0 }} />
        <span style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500 }}>
          You&apos;re previewing the DNA Hub leader dashboard for <strong>{church.name}</strong> — sample data only.
        </span>
        <Link href={demoPageUrl} style={{ color: '#fff', fontSize: '0.8rem', opacity: 0.8, textDecoration: 'underline', flexShrink: 0 }}>
          ← Back to demo
        </Link>
      </div>

      {/* ── Top Nav ─────────────────────────────────────────────── */}
      <header style={{ background: primary, padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {church.logo_url ? (
          <img src={church.logo_url} alt={church.name} style={{ height: '28px', objectFit: 'contain' }} />
        ) : (
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', fontFamily: "'DM Sans', sans-serif" }}>{church.name}</span>
        )}
        <span style={{ background: accent + '33', color: accent, fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Leader Hub
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
              className={`hub-demo-nav-item${activeView === item.id || (activeView === 'disciple-detail' && item.id === 'disciples') ? ' active' : ''}`}
              onClick={() => {
                setActiveView(item.id);
                setSelectedDisciple(null);
              }}
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

          {/* ── OVERVIEW ─────────────────────────────────────── */}
          {activeView === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 700, color: '#0f0e0c', margin: '0 0 0.25rem' }}>
                  Dashboard
                </h1>
                <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>{church.name} · DNA Leader Overview</p>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                {[
                  { label: 'Active Group', value: '1', sub: SEED_GROUP.name, icon: <Users className="w-5 h-5" /> },
                  { label: 'Disciples', value: '3', sub: 'All active', icon: <TrendingUp className="w-5 h-5" /> },
                  { label: 'Journals This Week', value: '7', sub: 'Across all disciples', icon: <BookOpen className="w-5 h-5" /> },
                  { label: 'Prayers Logged', value: '13', sub: 'Active + answered', icon: <Heart className="w-5 h-5" /> },
                ].map((stat, i) => (
                  <div key={i} className="hub-demo-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ color: primary, opacity: 0.7 }}>{stat.icon}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f0e0c', lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#333' }}>{stat.label}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Group preview */}
              <div className="hub-demo-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{SEED_GROUP.name}</h3>
                  <span style={{ background: accent + '22', color: accent, fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.625rem', borderRadius: '12px' }}>
                    Phase 1 · Week {SEED_GROUP.week}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {SEED_DISCIPLES.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.625rem', borderRadius: '8px', background: '#faf8f4', cursor: 'pointer' }}
                      onClick={() => { setSelectedDisciple(d); setActiveView('disciple-detail'); }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: primary + '22', color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                        {d.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem', color: '#0f0e0c' }}>{d.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#888' }}>Week {d.week} · Active {d.lastActive}</div>
                      </div>
                      <div style={{ width: '80px' }}>
                        <div className="hub-demo-progress-bar">
                          <div className="hub-demo-progress-fill" style={{ width: `${d.pathwayPct}%` }} />
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#aaa', marginTop: '2px', textAlign: 'right' }}>{d.pathwayPct}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── DISCIPLES ───────────────────────────────────── */}
          {activeView === 'disciples' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 700, color: '#0f0e0c', margin: '0 0 0.25rem' }}>
                  Disciples
                </h1>
                <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>{SEED_GROUP.name} · 3 active members</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {SEED_DISCIPLES.map((d, i) => (
                  <div
                    key={i}
                    className="hub-demo-card"
                    style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                    onClick={() => { setSelectedDisciple(d); setActiveView('disciple-detail'); }}
                  >
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: primary + '22', color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                        {d.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '1rem', color: '#0f0e0c', marginBottom: '0.25rem' }}>{d.name}</div>
                        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.82rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <BookOpen className="w-3 h-3" /> {d.journalCount} journals
                          </span>
                          <span style={{ fontSize: '0.82rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Heart className="w-3 h-3" /> {d.prayerCount} prayers
                          </span>
                          <span style={{ fontSize: '0.82rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock className="w-3 h-3" /> {d.lastActive}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: primary }}>{d.pathwayPct}%</div>
                        <div style={{ fontSize: '0.75rem', color: '#aaa' }}>Phase {d.phase} progress</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '0.875rem' }}>
                      <div className="hub-demo-progress-bar">
                        <div className="hub-demo-progress-fill" style={{ width: `${d.pathwayPct}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DISCIPLE DETAIL ─────────────────────────────── */}
          {activeView === 'disciple-detail' && selectedDisciple && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => { setActiveView('disciples'); setSelectedDisciple(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}
                >
                  <ArrowLeft className="w-4 h-4" /> Disciples
                </button>
                <ChevronLeft className="w-4 h-4" style={{ color: '#ccc' }} />
                <span style={{ fontWeight: 500, fontSize: '0.875rem', color: '#333' }}>{selectedDisciple.name}</span>
              </div>

              {/* Profile header */}
              <div className="hub-demo-card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: primary + '22', color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.4rem', flexShrink: 0 }}>
                  {selectedDisciple.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 700, color: '#0f0e0c' }}>{selectedDisciple.name}</h2>
                  <p style={{ margin: 0, color: '#888', fontSize: '0.875rem' }}>Phase {selectedDisciple.phase} · Week {selectedDisciple.week} · Last active {selectedDisciple.lastActive}</p>
                </div>
                <span style={{ background: '#e8f5e9', color: '#27ae60', fontSize: '0.78rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: '12px' }}>
                  Active
                </span>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                {[
                  { label: 'Journal Entries', value: String(selectedDisciple.journalCount), icon: <BookOpen className="w-4 h-4" /> },
                  { label: 'Prayer Cards', value: String(selectedDisciple.prayerCount), icon: <Heart className="w-4 h-4" /> },
                  { label: 'Pathway Progress', value: `${selectedDisciple.pathwayPct}%`, icon: <TrendingUp className="w-4 h-4" /> },
                  { label: 'Checkpoints Done', value: String(selectedDisciple.checkpoints.length), icon: <CheckCircle2 className="w-4 h-4" /> },
                ].map((s, i) => (
                  <div key={i} className="hub-demo-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ color: primary, opacity: 0.7 }}>{s.icon}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f0e0c', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Pathway progress */}
              <div className="hub-demo-card">
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Pathway Progress</h3>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#333' }}>Phase {selectedDisciple.phase} — Foundation</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: primary }}>{selectedDisciple.pathwayPct}%</span>
                  </div>
                  <div className="hub-demo-progress-bar" style={{ height: '10px' }}>
                    <div className="hub-demo-progress-fill" style={{ width: `${selectedDisciple.pathwayPct}%` }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  {selectedDisciple.checkpoints.map((cp, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem', color: '#555' }}>
                      <CheckCircle2 className="w-4 h-4" style={{ color: '#27ae60', flexShrink: 0 }} />
                      {cp}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CALENDAR ──────────────────────────────────── */}
          {activeView === 'calendar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 700, color: '#0f0e0c', margin: '0 0 0.25rem' }}>
                  Calendar
                </h1>
                <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>Upcoming group events for {church.name}</p>
              </div>

              {events.length === 0 ? (
                <div className="hub-demo-card" style={{ textAlign: 'center', color: '#aaa', padding: '3rem' }}>
                  No upcoming events yet. Use the Demo tab in admin to seed calendar events.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {events.map((ev) => (
                    <div key={ev.id} className="hub-demo-card">
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        {/* Date block */}
                        <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: '10px', background: primary + '18', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: primary }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {new Date(ev.start_time).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1 }}>
                            {new Date(ev.start_time).getDate()}
                          </div>
                        </div>

                        <div style={{ flex: 1 }}>
                          {/* Strip [DEMO] prefix for display */}
                          <div style={{ fontWeight: 600, fontSize: '1rem', color: '#0f0e0c', marginBottom: '0.25rem' }}>
                            {ev.title.replace(/^\[DEMO\]\s*/, '')}
                          </div>
                          {ev.description && (
                            <p style={{ margin: '0 0 0.5rem', color: '#666', fontSize: '0.875rem', lineHeight: 1.5 }}>{ev.description}</p>
                          )}
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.82rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock className="w-3.5 h-3.5" />
                              {formatDate(ev.start_time)} at {formatTime(ev.start_time)}
                              {ev.end_time && ` – ${formatTime(ev.end_time)}`}
                            </span>
                            {ev.location && (
                              <span style={{ fontSize: '0.82rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <MapPin className="w-3.5 h-3.5" />
                                {ev.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
