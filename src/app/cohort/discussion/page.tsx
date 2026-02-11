'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DiscussionPost {
  id: string;
  body: string;
  author_name: string;
  author_role: string;
  reply_count: number;
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

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

const avatarColors = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
  'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-red-500',
];

function avatarColor(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return avatarColors[hash % avatarColors.length];
}

export default function CohortDiscussionPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/cohort')
      .then((r) => {
        if (r.status === 401) { router.push('/login'); return null; }
        return r.json();
      })
      .then((d) => {
        if (d) {
          setPosts(d.discussion || []);
          setIsMock(d.mock || false);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPost.trim()) return;
    setSubmitting(true);
    // In mock mode, just prepend locally
    const mockEntry: DiscussionPost = {
      id: `local-${Date.now()}`,
      body: newPost.trim(),
      author_name: 'You',
      author_role: 'leader',
      reply_count: 0,
      created_at: new Date().toISOString(),
    };
    setPosts((prev) => [mockEntry, ...prev]);
    setNewPost('');
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {isMock && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          <strong>Demo mode</strong> — showing sample discussion. Posts you write here won&apos;t be saved.
        </div>
      )}

      {/* Compose */}
      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <h3 className="font-semibold text-navy mb-3">Share with the cohort</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Ask a question, share a win, or encourage someone..."
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={!newPost.trim() || submitting}
              className="bg-gold hover:bg-gold/90 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              Post
            </button>
          </div>
        </form>
      </div>

      {/* Thread list */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow p-5">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(post.author_name)}`}>
                {initials(post.author_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-navy text-sm">{post.author_name}</span>
                  {post.author_role === 'trainer' && (
                    <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full font-medium">Trainer</span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{timeAgo(post.created_at)}</span>
                </div>
                <p className="text-gray-700 text-sm mt-2 leading-relaxed">{post.body}</p>
                <div className="flex items-center gap-4 mt-3">
                  <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-navy transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {post.reply_count > 0
                      ? `${post.reply_count} ${post.reply_count === 1 ? 'reply' : 'replies'}`
                      : 'Reply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="bg-white rounded-lg shadow px-6 py-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-navy font-semibold">No discussion yet</p>
          <p className="text-gray-500 text-sm mt-1">Be the first to post something.</p>
        </div>
      )}
    </div>
  );
}
