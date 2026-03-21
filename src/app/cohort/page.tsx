'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin } from 'lucide-react';

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

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
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

  const upcomingEvents = data.events.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Feed + Discussion */}
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
              {data.feed.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-400 text-sm">No announcements yet.</div>
              )}
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
              {data.discussion.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-400 text-sm">No discussions yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Upcoming Events */}
        <div>
          <div className="bg-white rounded-lg shadow">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-navy flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold" />
                Upcoming Events
              </h3>
              <Link href="/cohort/calendar" className="text-sm text-gold hover:underline">View all</Link>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {upcomingEvents.map((event) => {
                  const countdown = daysUntil(event.start_time);
                  return (
                    <div key={event.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-navy text-sm">{event.title}</p>
                        {countdown && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                            countdown === 'Today' ? 'bg-red-100 text-red-700' :
                            countdown === 'Tomorrow' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {countdown}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        {formatEventDate(event.start_time)} &bull; {formatEventTime(event.start_time)}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">No upcoming events.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
