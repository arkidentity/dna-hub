'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const tabs = [
  { label: 'Overview', href: '/cohort' },
  { label: 'Feed', href: '/cohort/feed' },
  { label: 'Discussion', href: '/cohort/discussion' },
  { label: 'Members', href: '/cohort/members' },
  { label: 'Calendar', href: '/cohort/calendar' },
];

interface CohortHeader {
  church_name: string;
  currentUserRole: string;
  stats: { total_members: number; trainers: number; upcoming_events: number };
}

export default function CohortLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [header, setHeader] = useState<CohortHeader | null>(null);

  useEffect(() => {
    fetch('/api/cohort')
      .then((r) => r.json())
      .then((d) => {
        if (d && !d.error) {
          setHeader({
            church_name: d.cohort?.church_name || 'Your Church',
            currentUserRole: d.currentUserRole || 'leader',
            stats: d.stats || { total_members: 0, trainers: 0, upcoming_events: 0 },
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top row: title + stats + role badge */}
          <div className="flex items-center justify-between py-3 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-white truncate">
                  {header ? `${header.church_name} Cohort` : 'Cohort'}
                </h1>
                <p className="text-white/50 text-xs hidden sm:block">Leader peer community</p>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Stats — hidden on very small screens */}
              {header && (
                <div className="hidden sm:flex items-center gap-3 text-xs">
                  <span className="text-white/70">
                    <span className="font-semibold text-white">{header.stats.total_members}</span> Leaders
                  </span>
                  <span className="text-white/30">|</span>
                  <span className="text-white/70">
                    <span className="font-semibold text-white">{header.stats.trainers}</span> Trainers
                  </span>
                  <span className="text-white/30">|</span>
                  <span className="text-white/70">
                    <span className="font-semibold text-white">{header.stats.upcoming_events}</span> Events
                  </span>
                </div>
              )}

              {/* Role badge */}
              {header && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                  header.currentUserRole === 'trainer' ? 'bg-gold/20 text-gold' : 'bg-white/10 text-white/70'
                }`}>
                  {header.currentUserRole === 'trainer' ? 'Trainer' : 'Leader'}
                </span>
              )}
            </div>
          </div>

          {/* Mobile stats row */}
          {header && (
            <div className="flex sm:hidden items-center gap-3 text-xs pb-2 text-white/70">
              <span><span className="font-semibold text-white">{header.stats.total_members}</span> Leaders</span>
              <span className="text-white/30">|</span>
              <span><span className="font-semibold text-white">{header.stats.trainers}</span> Trainers</span>
              <span className="text-white/30">|</span>
              <span><span className="font-semibold text-white">{header.stats.upcoming_events}</span> Events</span>
            </div>
          )}

          {/* Tab navigation */}
          <nav className="flex gap-1 overflow-x-auto -mb-px">
            {tabs.map((tab) => {
              const isActive =
                tab.href === '/cohort'
                  ? pathname === '/cohort'
                  : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? 'border-gold text-white'
                      : 'border-transparent text-white/60 hover:text-white hover:border-white/30'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {children}
    </div>
  );
}
