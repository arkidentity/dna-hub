'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CohortData {
  mock: boolean;
  cohort: {
    id: string;
    name: string;
    generation: number;
    status: string;
    started_at: string;
    church_name: string;
  };
  currentUserRole: string;
  stats: {
    total_members: number;
    trainers: number;
    upcoming_events: number;
  };
  feed: Array<{
    id: string;
    post_type: string;
    title: string;
    body: string;
    pinned: boolean;
    author_name: string;
    created_at: string;
  }>;
  discussion: Array<{
    id: string;
    body: string;
    author_name: string;
    reply_count: number;
    created_at: string;
  }>;
  events: Array<{
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time?: string;
    location?: string;
  }>;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function formatEventDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatEventTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const postTypeColors: Record<string, string> = {
  announcement: 'bg-blue-100 text-blue-700',
  update: 'bg-yellow-100 text-yellow-700',
  resource: 'bg-green-100 text-green-700',
};

export default function CohortOverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<CohortData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/cohort')
      .then((r) => {
        if (r.status === 401) { router.push('/login'); return null; }
        return r.json();
      })
      .then((d) => {
        if (d?.error) { setError(d.error); } else if (d) { setData(d); }
        setLoading(false);
      })
      .catch(() => { setError('Failed to load cohort'); setLoading(false); });
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto" />
          <p className="mt-4 text-navy">Loading cohort...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-red-600">{error || 'Something went wrong'}</p>
      </div>
    );
  }

  const nextEvent = data.events[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cohort identity card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-navy">{data.cohort.name}</h2>
            {data.mock && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Demo</span>
            )}
          </div>
          <p className="text-gray-500 text-sm">{data.cohort.church_name}</p>
          {data.cohort.started_at && (
            <p className="text-gray-400 text-xs mt-1">
              Started {new Date(data.cohort.started_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          data.currentUserRole === 'trainer' ? 'bg-gold/20 text-gold' : 'bg-gray-100 text-gray-600'
        }`}>
          {data.currentUserRole === 'trainer' ? 'Trainer' : 'Leader'}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-5 text-center">
          <p className="text-3xl font-bold text-navy">{data.stats.total_members}</p>
          <p className="text-sm text-gray-500 mt-1">Leaders</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 text-center">
          <p className="text-3xl font-bold text-navy">{data.stats.trainers}</p>
          <p className="text-sm text-gray-500 mt-1">Trainer{data.stats.trainers !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 text-center">
          <p className="text-3xl font-bold text-navy">{data.stats.upcoming_events}</p>
          <p className="text-sm text-gray-500 mt-1">Upcoming Events</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Feed + Discussion preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latest from Feed */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-navy">Latest Announcements</h3>
              <Link href="/cohort/feed" className="text-sm text-gold hover:underline">See all</Link>
            </div>
            <div className="divide-y divide-gray-100">
              {data.feed.slice(0, 2).map((post) => (
                <div key={post.id} className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {post.pinned && (
                          <svg className="w-3.5 h-3.5 text-gold flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
                          </svg>
                        )}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${postTypeColors[post.post_type] || 'bg-gray-100 text-gray-600'}`}>
                          {post.post_type}
                        </span>
                      </div>
                      <p className="font-medium text-navy text-sm">{post.title}</p>
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">{post.body}</p>
                      <p className="text-xs text-gray-400 mt-2">{post.author_name} &bull; {timeAgo(post.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Discussion */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-navy">Recent Discussion</h3>
              <Link href="/cohort/discussion" className="text-sm text-gold hover:underline">Join the conversation</Link>
            </div>
            <div className="divide-y divide-gray-100">
              {data.discussion.slice(0, 3).map((post) => (
                <div key={post.id} className="px-6 py-4">
                  <p className="text-sm text-gray-700 line-clamp-2">{post.body}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="font-medium text-gray-500">{post.author_name}</span>
                    <span>&bull;</span>
                    <span>{timeAgo(post.created_at)}</span>
                    {post.reply_count > 0 && (
                      <>
                        <span>&bull;</span>
                        <span>{post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Next event + quick links */}
        <div className="space-y-4">
          {nextEvent && (
            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="font-semibold text-navy mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Next Event
              </h3>
              <p className="font-medium text-navy">{nextEvent.title}</p>
              <p className="text-sm text-gold font-medium mt-1">{formatEventDate(nextEvent.start_time)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{formatEventTime(nextEvent.start_time)}</p>
              {nextEvent.location && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {nextEvent.location}
                </p>
              )}
              <Link href="/cohort/calendar" className="block mt-4 text-sm text-gold hover:underline">
                View all events →
              </Link>
            </div>
          )}

          {/* Quick nav */}
          <div className="bg-white rounded-lg shadow p-5 space-y-2">
            <h3 className="font-semibold text-navy mb-3">Quick Access</h3>
            {[
              { href: '/cohort/feed', label: 'Announcements & Updates', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
              { href: '/cohort/discussion', label: 'Leader Discussion', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
              { href: '/cohort/members', label: 'Cohort Members', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
              { href: '/cohort/calendar', label: 'Cohort Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700 hover:text-navy"
              >
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
