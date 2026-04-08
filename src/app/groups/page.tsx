'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import UpgradeNudgeModal from '@/components/billing/UpgradeNudgeModal';

interface DNAGroup {
  id: string;
  group_name: string;
  current_phase: string;
  start_date: string;
  multiplication_target_date?: string;
  disciple_count: number;
}

interface DNALeader {
  id: string;
  name: string;
  email: string;
  church?: {
    id: string;
    name: string;
    logo_url?: string;
    subdomain?: string | null;
  } | null;
}

interface DashboardData {
  leader: DNALeader;
  groups: DNAGroup[];
  stats: {
    total_groups: number;
    total_disciples: number;
    active_groups: number;
  };
  isPaid: boolean;
}

const RESOURCES = [
  {
    label: 'DNA Toolkit — Leader Guides',
    description: 'Guides for each DNA tool',
    href: '/training/toolkit',
    icon: (
      <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Launch Guide',
    description: 'Step-by-step group launch plan',
    href: '/training/launch-guide/1',
    icon: (
      <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
  },
  {
    label: 'DNA Manual',
    description: 'Complete discipleship manual',
    href: '/training',
    icon: (
      <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
];

function DNALeaderDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isWelcome = searchParams.get('welcome') === 'true';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [showWelcome, setShowWelcome] = useState(isWelcome);
  const [showNudgeModal, setShowNudgeModal] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<Array<{
    id: string;
    token: string;
    group: { id: string; group_name: string };
    invited_by: { id: string; name: string; email: string };
  }>>([]);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch('/api/groups/dashboard');

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        const result = await response.json();

        if (!response.ok || result.error) {
          setError(result.error || 'Failed to load dashboard');
          setLoading(false);
          return;
        }

        setData(result);
        setLoading(false);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard');
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [router]);

  // Phase display helpers
  const phaseLabels: Record<string, string> = {
    'pre-launch': 'Pre-Launch',
    'invitation': 'Invitation',
    'foundation': 'Foundation',
    'growth': 'Growth',
    'multiplication': 'Multiplication',
  };

  const phaseColors: Record<string, string> = {
    'pre-launch': 'bg-gray-100 text-gray-700',
    'invitation': 'bg-blue-100 text-blue-700',
    'foundation': 'bg-yellow-100 text-yellow-700',
    'growth': 'bg-green-100 text-green-700',
    'multiplication': 'bg-purple-100 text-purple-700',
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
          <p className="mt-4 text-navy">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gold hover:bg-gold/90 text-white font-semibold py-3 px-6 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header with inline stats */}
      <div className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">DNA Groups</h1>
              <p className="text-white/70 text-sm mt-0.5">
                Welcome back, {data.leader.name}
                {data.leader.church && (
                  <span> &bull; {data.leader.church.name}</span>
                )}
              </p>
              {data.leader.church?.subdomain && (
                <a
                  href={`https://${data.leader.church.subdomain}.dailydna.app`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold/80 mt-0.5"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  {data.leader.church.subdomain}.dailydna.app
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              )}
            </div>
            {(!data.isPaid && data.groups.length >= 2) ? (
              <button
                onClick={() => setShowNudgeModal(true)}
                className="bg-gold hover:bg-gold/90 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                + New Group
              </button>
            ) : (
              <Link
                href="/groups/new"
                className="bg-gold hover:bg-gold/90 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                + New Group
              </Link>
            )}
          </div>

          {/* Inline stats bar */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{data.stats.active_groups}</span>
              <span className="text-xs text-white/50 uppercase tracking-wide">Active Groups</span>
            </div>
            <div className="w-px h-6 bg-white/15" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{data.stats.total_disciples}</span>
              <span className="text-xs text-white/50 uppercase tracking-wide">Disciples</span>
            </div>
            <div className="w-px h-6 bg-white/15" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{data.stats.total_groups}</span>
              <span className="text-xs text-white/50 uppercase tracking-wide">All-Time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome banner (first time) */}
      {showWelcome && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-green-800">Welcome to DNA Groups!</p>
                  <p className="text-sm text-green-700">Your account is set up. Create your first group to get started.</p>
                </div>
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className="text-green-600 hover:text-green-800"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending co-leader invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="font-semibold text-yellow-800 mb-2">
              You have {pendingInvitations.length} pending co-leader invitation{pendingInvitations.length > 1 ? 's' : ''}:
            </p>
            <div className="space-y-2">
              {pendingInvitations.map(inv => (
                <div key={inv.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-yellow-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{inv.invited_by.name || inv.invited_by.email}</span>
                    {' '}invited you to co-lead <span className="font-medium text-navy">{(inv.group as { id: string; group_name: string }).group_name}</span>
                  </p>
                  <Link
                    href={`/groups/invitations/${inv.token}`}
                    className="text-sm font-medium text-gold hover:text-gold/80 ml-4 whitespace-nowrap"
                  >
                    Respond &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content — two-column layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Groups */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-navy">My Groups</h2>
              </div>

              {data.groups.length === 0 ? (
                /* Empty state */
                <div className="px-6 py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-navy mb-2">No groups yet</h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    Create your first DNA group to start leading disciples through the 90-day journey.
                  </p>
                  <Link
                    href="/groups/new"
                    className="inline-flex items-center gap-2 bg-gold hover:bg-gold/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Your First Group
                  </Link>
                </div>
              ) : (
                /* Groups grid — 1 col mobile, 2 col when space allows */
                <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.groups.map((group) => (
                    <Link
                      key={group.id}
                      href={`/groups/${group.id}`}
                      className="block rounded-xl border border-gray-200 hover:border-gold hover:shadow-md transition-all bg-white overflow-hidden group"
                    >
                      {/* Card header accent */}
                      <div className="h-1.5 bg-gradient-to-r from-navy to-navy/60" />
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="font-semibold text-navy text-base leading-tight group-hover:text-gold transition-colors">
                            {group.group_name}
                          </h3>
                          <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${phaseColors[group.current_phase] || 'bg-gray-100 text-gray-700'}`}>
                            {phaseLabels[group.current_phase] || group.current_phase}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {group.disciple_count} {group.disciple_count === 1 ? 'disciple' : 'disciples'}
                          </span>
                          <span className="text-gray-300">&bull;</span>
                          <span>Started {new Date(group.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Resources sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-navy">Leader Resources</h3>
              </div>
              <div className="p-2">
                {RESOURCES.map((res) => (
                  <Link
                    key={res.href}
                    href={res.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gold/5 transition-colors group/link"
                  >
                    <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      {res.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy group-hover/link:text-gold transition-colors leading-tight">{res.label}</p>
                      <p className="text-xs text-gray-400 leading-tight">{res.description}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover/link:text-gold transition-colors flex-shrink-0 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <UpgradeNudgeModal
        open={showNudgeModal}
        onClose={() => setShowNudgeModal(false)}
        variant="dna-leader"
        limitLabel="groups"
        limit={2}
      />
    </div>
  );
}

// Loading fallback
function DashboardLoading() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
        <p className="mt-4 text-navy">Loading...</p>
      </div>
    </div>
  );
}

export default function DNALeaderDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DNALeaderDashboardContent />
    </Suspense>
  );
}
