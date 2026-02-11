'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface FeedPost {
  id: string;
  post_type: string;
  title: string;
  body: string;
  pinned: boolean;
  author_name: string;
  author_role: string;
  created_at: string;
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

const postTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
  announcement: { label: 'Announcement', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  update: { label: 'Update', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  resource: { label: 'Resource', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
};

export default function CohortFeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [userRole, setUserRole] = useState('leader');
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    fetch('/api/cohort')
      .then((r) => {
        if (r.status === 401) { router.push('/login'); return null; }
        return r.json();
      })
      .then((d) => {
        if (d) {
          setPosts(d.feed || []);
          setUserRole(d.currentUserRole || 'leader');
          setIsMock(d.mock || false);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold" />
      </div>
    );
  }

  const pinned = posts.filter((p) => p.pinned);
  const rest = posts.filter((p) => !p.pinned);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {isMock && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          <strong>Demo mode</strong> — showing sample data. A real cohort will display live posts.
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-navy">Announcements & Updates</h2>
        {userRole === 'trainer' && (
          <button className="bg-gold hover:bg-gold/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + New Post
          </button>
        )}
      </div>

      {pinned.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pinned</p>
          <div className="space-y-4">
            {pinned.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Recent</p>
          )}
          <div className="space-y-4">
            {rest.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        </div>
      )}

      {posts.length === 0 && (
        <div className="bg-white rounded-lg shadow px-6 py-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-navy font-semibold">No announcements yet</p>
          <p className="text-gray-500 text-sm mt-1">Your trainer will post updates here.</p>
        </div>
      )}
    </div>
  );
}

function PostCard({ post }: { post: FeedPost }) {
  const config = postTypeConfig[post.post_type] || { label: post.post_type, color: 'text-gray-600', bg: 'bg-white border-gray-200' };
  const [expanded, setExpanded] = useState(false);
  const isLong = post.body.length > 300;

  return (
    <div className={`rounded-lg border p-5 ${config.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {post.pinned && (
              <svg className="w-3.5 h-3.5 text-gold flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
              </svg>
            )}
            <span className={`text-xs font-semibold uppercase tracking-wide ${config.color}`}>
              {config.label}
            </span>
          </div>
          <h3 className="font-semibold text-navy">{post.title}</h3>
          <p className={`text-gray-700 text-sm mt-2 leading-relaxed ${!expanded && isLong ? 'line-clamp-4' : ''}`}>
            {post.body}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-gold hover:underline mt-1"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
          <p className="text-xs text-gray-400 mt-3">
            {post.author_name} &bull; {timeAgo(post.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
