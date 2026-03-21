'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Edit2, Trash2, MoreVertical, X } from 'lucide-react';

interface DiscussionPost {
  id: string;
  body: string;
  author_name: string;
  author_id: string | null;
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
  const [cohortId, setCohortId] = useState<string | null>(null);
  const [currentLeaderId, setCurrentLeaderId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState('leader');
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  // Edit/delete state
  const [editingPost, setEditingPost] = useState<DiscussionPost | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingPost, setDeletingPost] = useState<DiscussionPost | null>(null);
  const [deleting, setDeleting] = useState(false);

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
          setCohortId(d.cohort?.id || null);
          setCurrentLeaderId(d.currentLeaderId || null);
          setUserRole(d.currentUserRole || 'leader');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPost.trim() || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setPostError(null);

    try {
      const res = await fetch('/api/cohort/discussion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_body: newPost.trim(), cohort_id: cohortId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to post');
      }

      const data = await res.json();
      setPosts((prev) => [data.post, ...prev]);
      setNewPost('');
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Failed to post');
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  }

  const canEditPost = (post: DiscussionPost) => {
    if (isMock) return false;
    if (userRole === 'trainer') return true;
    return !!(currentLeaderId && post.author_id === currentLeaderId);
  };

  const handleEditSave = async () => {
    if (!editingPost || !editBody.trim()) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/cohort/discussion/${editingPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_body: editBody.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }
      const data = await res.json();
      setPosts((prev) => prev.map((p) => p.id === editingPost.id ? { ...p, body: data.post.body } : p));
      setEditingPost(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPost) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/cohort/discussion/${deletingPost.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setPosts((prev) => prev.filter((p) => p.id !== deletingPost.id));
      setDeletingPost(null);
    } catch {
      // Keep modal open
    } finally {
      setDeleting(false);
    }
  };

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
        {postError && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{postError}</div>
        )}
        <form onSubmit={handleSubmit}>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder={isMock ? 'Posting is disabled in demo mode.' : 'Ask a question, share a win, or encourage someone...'}
            disabled={isMock}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none disabled:opacity-50 disabled:bg-gray-50"
            rows={3}
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={!newPost.trim() || submitting || isMock}
              className="bg-gold hover:bg-gold/90 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>

      {/* Thread list */}
      <div className="space-y-4">
        {posts.map((post) => (
          <DiscussionCard
            key={post.id}
            post={post}
            canEdit={canEditPost(post)}
            onEdit={() => { setEditingPost(post); setEditBody(post.body); setEditError(null); }}
            onDelete={() => setDeletingPost(post)}
          />
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

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-navy">Edit Post</h3>
              <button onClick={() => setEditingPost(null)} className="text-gray-400 hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {editError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{editError}</div>
              )}
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
                rows={5}
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditingPost(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-navy border border-gray-200 rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving || !editBody.trim()}
                  className="flex items-center gap-2 bg-gold hover:bg-gold/90 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
                >
                  {editSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-navy mb-1">Delete Post</h3>
            <p className="text-sm text-gray-600 mb-1">
              This post by <span className="font-medium">{deletingPost.author_name}</span> will be permanently removed.
            </p>
            {deletingPost.reply_count > 0 && (
              <p className="text-sm text-amber-600 mb-4">
                This will also delete {deletingPost.reply_count} {deletingPost.reply_count === 1 ? 'reply' : 'replies'}.
              </p>
            )}
            {deletingPost.reply_count === 0 && <div className="mb-4" />}
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingPost(null)} disabled={deleting} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-5 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DiscussionCard({ post, canEdit, onEdit, onDelete }: {
  post: DiscussionPost;
  canEdit: boolean | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-5">
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
            {canEdit && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 text-gray-400 hover:text-navy rounded transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-7 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[120px]">
                      <button
                        onClick={() => { setShowMenu(false); onEdit(); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => { setShowMenu(false); onDelete(); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
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
  );
}
