'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Edit2, Trash2, MoreVertical } from 'lucide-react';

interface FeedPost {
  id: string;
  post_type: string;
  title: string;
  body: string;
  pinned: boolean;
  author_name: string;
  author_id: string | null;
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

// ============================================
// NEW POST MODAL
// ============================================

function NewPostModal({ onClose, onSuccess, cohortId }: {
  onClose: () => void;
  onSuccess: (post: FeedPost) => void;
  cohortId: string | null;
}) {
  const [form, setForm] = useState({
    post_type: 'announcement',
    title: '',
    post_body: '',
    pinned: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/cohort/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cohort_id: cohortId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create post');
      }

      const data = await res.json();
      onSuccess(data.post);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setSaving(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-navy">New Post</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-navy">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Post Type</label>
            <select
              value={form.post_type}
              onChange={(e) => setForm(p => ({ ...p, post_type: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
            >
              <option value="announcement">Announcement</option>
              <option value="update">Update</option>
              <option value="resource">Resource</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
              placeholder="Post title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Body <span className="text-red-500">*</span></label>
            <textarea
              value={form.post_body}
              onChange={(e) => setForm(p => ({ ...p, post_body: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
              rows={5}
              placeholder="Write your post..."
              required
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => setForm(p => ({ ...p, pinned: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-gold focus:ring-gold/40"
            />
            <span className="text-sm text-navy">Pin this post</span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-navy border border-gray-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-gold hover:bg-gold/90 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// EDIT POST MODAL
// ============================================

function EditPostModal({ post, onClose, onSuccess }: {
  post: FeedPost;
  onClose: () => void;
  onSuccess: (updated: FeedPost) => void;
}) {
  const [form, setForm] = useState({
    post_type: post.post_type,
    title: post.title,
    post_body: post.body,
    pinned: post.pinned,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/cohort/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update post');
      }

      const data = await res.json();
      onSuccess(data.post);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post');
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-navy">Edit Post</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-navy">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Post Type</label>
            <select
              value={form.post_type}
              onChange={(e) => setForm(p => ({ ...p, post_type: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
            >
              <option value="announcement">Announcement</option>
              <option value="update">Update</option>
              <option value="resource">Resource</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Body</label>
            <textarea
              value={form.post_body}
              onChange={(e) => setForm(p => ({ ...p, post_body: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
              rows={5}
              required
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => setForm(p => ({ ...p, pinned: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-gold focus:ring-gold/40"
            />
            <span className="text-sm text-navy">Pin this post</span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-navy border border-gray-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-gold hover:bg-gold/90 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function CohortFeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cohortId, setCohortId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState('leader');
  const [currentLeaderId, setCurrentLeaderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<FeedPost | null>(null);
  const [deleting, setDeleting] = useState(false);

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
          setCurrentLeaderId(d.currentLeaderId || null);
          setIsMock(d.mock || false);
          setCohortId(d.cohort?.id || null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleDelete = async () => {
    if (!deletingPost) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/cohort/posts/${deletingPost.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setPosts((prev) => prev.filter((p) => p.id !== deletingPost.id));
      setDeletingPost(null);
    } catch {
      // Keep modal open
    } finally {
      setDeleting(false);
    }
  };

  const canEditPost = (post: FeedPost) => {
    if (isMock) return false;
    if (userRole === 'trainer') return true;
    return !!(currentLeaderId && post.author_id === currentLeaderId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold" />
      </div>
    );
  }

  const pinned = posts.filter((p) => p.pinned);
  const rest = posts.filter((p) => !p.pinned);
  const isTrainer = userRole === 'trainer';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {isMock && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          <strong>Demo mode</strong> — showing sample data. A real cohort will display live posts.
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-navy">Announcements & Updates</h2>
        {isTrainer && !isMock && (
          <button
            onClick={() => setShowNewPost(true)}
            className="bg-gold hover:bg-gold/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New Post
          </button>
        )}
      </div>

      {pinned.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pinned</p>
          <div className="space-y-4">
            {pinned.map((post) => (
              <PostCard key={post.id} post={post} canEdit={canEditPost(post)} onEdit={setEditingPost} onDelete={setDeletingPost} />
            ))}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Recent</p>
          )}
          <div className="space-y-4">
            {rest.map((post) => (
              <PostCard key={post.id} post={post} canEdit={canEditPost(post)} onEdit={setEditingPost} onDelete={setDeletingPost} />
            ))}
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
          <p className="text-gray-500 text-sm mt-1">
            {isTrainer ? 'Create the first post to get started.' : 'Your trainer will post updates here.'}
          </p>
        </div>
      )}

      {showNewPost && (
        <NewPostModal
          onClose={() => setShowNewPost(false)}
          cohortId={cohortId}
          onSuccess={(post) => {
            setPosts((prev) => {
              const updated = [post, ...prev];
              return [...updated.filter(p => p.pinned), ...updated.filter(p => !p.pinned)];
            });
          }}
        />
      )}

      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSuccess={(updated) => {
            setPosts((prev) => {
              const newPosts = prev.map((p) => p.id === updated.id ? updated : p);
              return [...newPosts.filter(p => p.pinned), ...newPosts.filter(p => !p.pinned)];
            });
          }}
        />
      )}

      {deletingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-navy mb-1">Delete Post</h3>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium">{deletingPost.title}</span> will be permanently removed.
            </p>
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

function PostCard({ post, canEdit, onEdit, onDelete }: {
  post: FeedPost;
  canEdit: boolean | null;
  onEdit: (post: FeedPost) => void;
  onDelete: (post: FeedPost) => void;
}) {
  const config = postTypeConfig[post.post_type] || { label: post.post_type, color: 'text-gray-600', bg: 'bg-white border-gray-200' };
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isLong = post.body.length > 300;

  return (
    <div className={`rounded-lg border p-5 ${config.bg} relative`}>
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
            <button onClick={() => setExpanded(!expanded)} className="text-sm text-gold hover:underline mt-1">
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
          <p className="text-xs text-gray-400 mt-3">
            {post.author_name} &bull; {timeAgo(post.created_at)}
          </p>
        </div>

        {canEdit && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-gray-400 hover:text-navy rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[120px]">
                  <button
                    onClick={() => { setShowMenu(false); onEdit(post); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); onDelete(post); }}
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
    </div>
  );
}
