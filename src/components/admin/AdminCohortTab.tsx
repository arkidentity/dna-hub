'use client';

import { useEffect, useState } from 'react';
import { Users, MessageSquare, Rss, Calendar, Loader2, Plus, X, Pin, Globe, ExternalLink, Edit2, Trash2, MoreVertical, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';
import ChurchAppQRCard from '@/components/shared/ChurchAppQRCard';

// ── Types ─────────────────────────────────────────────────────────

interface CohortMember {
  id: string;
  name: string;
  role: string;
  joined_at: string;
}

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

interface DiscussionPost {
  id: string;
  body: string;
  author_name: string;
  author_role: string;
  reply_count: number;
  created_at: string;
}

interface CohortEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
}

interface CohortData {
  mock: boolean;
  adminView: boolean;
  cohort: {
    id: string;
    name: string;
    generation: number;
    status: string;
    started_at: string;
    church_name: string;
    church_subdomain?: string | null;
  } | null;
  currentUserRole: string;
  stats: { total_members: number; trainers: number; upcoming_events: number };
  feed: FeedPost[];
  discussion: DiscussionPost[];
  members: CohortMember[];
  events: CohortEvent[];
  churchName?: string;
}

// ── Helpers ───────────────────────────────────────────────────────

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

const postTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
  announcement: { label: 'Announcement', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  update: { label: 'Update', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  resource: { label: 'Resource', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
};

// ── New Post Modal ─────────────────────────────────────────────────

interface NewPostModalProps {
  cohortId: string;
  onClose: () => void;
  onCreated: (post: FeedPost) => void;
}

function NewPostModal({ cohortId, onClose, onCreated }: NewPostModalProps) {
  const [postType, setPostType] = useState<'announcement' | 'update' | 'resource'>('announcement');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/cohort/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, post_body: body, post_type: postType, pinned, cohort_id: cohortId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create post.');
        return;
      }
      onCreated(data.post);
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-navy">New Cohort Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <div className="flex gap-2">
              {(['announcement', 'update', 'resource'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPostType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                    postType === t
                      ? 'bg-navy text-white border-navy'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Post title..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={pinned}
              onChange={e => setPinned(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Pin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">Pin this post</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Event Modal ────────────────────────────────────────────────

interface AddEventModalProps {
  cohortId: string;
  onClose: () => void;
  onCreated: (event: CohortEvent) => void;
}

function AddEventModal({ cohortId, onClose, onCreated }: AddEventModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('1');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date || !time) {
      setError('Title, date, and time are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const startTime = new Date(`${date}T${time}`).toISOString();
      const endTime = new Date(new Date(`${date}T${time}`).getTime() + parseFloat(duration) * 60 * 60 * 1000).toISOString();

      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          start_time: startTime,
          end_time: endTime,
          event_type: 'cohort_event',
          cohort_id: cohortId,
          is_recurring: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create event.');
        return;
      }
      onCreated(data.event);
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-navy">Add Cohort Event</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Event title..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <select
              value={duration}
              onChange={e => setDuration(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            >
              <option value="0.5">30 minutes</option>
              <option value="1">1 hour</option>
              <option value="1.5">1.5 hours</option>
              <option value="2">2 hours</option>
              <option value="3">3 hours</option>
              <option value="4">4 hours</option>
              <option value="8">Full day (8 hrs)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Room, address, or online link..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What's happening at this event?"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving...' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sub-views ─────────────────────────────────────────────────────

interface FeedViewProps {
  posts: FeedPost[];
  cohortId: string;
  onPostCreated: (post: FeedPost) => void;
  onPostDeleted: (id: string) => void;
  onPostUpdated: (post: FeedPost) => void;
}

function FeedView({ posts, cohortId, onPostCreated, onPostDeleted, onPostUpdated }: FeedViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<FeedPost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState({ post_type: '', title: '', post_body: '', pinned: false });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const openEdit = (post: FeedPost) => {
    setEditingPost(post);
    setEditForm({ post_type: post.post_type, title: post.title, post_body: post.body, pinned: post.pinned });
    setEditError('');
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    setEditSaving(true);
    setEditError('');
    try {
      const res = await fetch(`/api/cohort/posts/${editingPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to update'); }
      const d = await res.json();
      onPostUpdated(d.post);
      setEditingPost(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingPost) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/cohort/posts/${deletingPost.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      onPostDeleted(deletingPost.id);
      setDeletingPost(null);
    } catch { /* keep open */ } finally { setDeleting(false); }
  };

  const pinned = posts.filter(p => p.pinned);
  const rest = posts.filter(p => !p.pinned);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {posts.length === 0 ? (
        <EmptyState icon={<Rss className="w-7 h-7 text-gray-400" />} title="No posts yet" subtitle="Post an announcement, update, or resource for this cohort." />
      ) : (
        <div>
          {pinned.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pinned</p>
              <div className="space-y-4">{pinned.map(p => <PostCard key={p.id} post={p} onEdit={openEdit} onDelete={setDeletingPost} />)}</div>
            </div>
          )}
          {rest.length > 0 && (
            <div>
              {pinned.length > 0 && <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Recent</p>}
              <div className="space-y-4">{rest.map(p => <PostCard key={p.id} post={p} onEdit={openEdit} onDelete={setDeletingPost} />)}</div>
            </div>
          )}
        </div>
      )}

      {showModal && <NewPostModal cohortId={cohortId} onClose={() => setShowModal(false)} onCreated={onPostCreated} />}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-navy">Edit Post</h2>
              <button onClick={() => setEditingPost(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitEdit} className="p-6 space-y-4">
              {editError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{editError}</p>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="flex gap-2">
                  {(['announcement', 'update', 'resource'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setEditForm(p => ({ ...p, post_type: t }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize ${editForm.post_type === t ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-300'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                <textarea value={editForm.post_body} onChange={e => setEditForm(p => ({ ...p, post_body: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none" rows={5} required />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={editForm.pinned} onChange={e => setEditForm(p => ({ ...p, pinned: e.target.checked }))} className="rounded border-gray-300" />
                <Pin className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-700">Pin this post</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingPost(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={editSaving} className="flex-1 px-4 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {editSaving && <Loader2 className="w-4 h-4 animate-spin" />}{editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Post Modal */}
      {deletingPost && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-navy mb-1">Delete Post</h3>
            <p className="text-sm text-gray-600 mb-4"><span className="font-medium">{deletingPost.title}</span> will be permanently removed.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingPost(null)} disabled={deleting} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-5 rounded-lg text-sm disabled:opacity-50 flex items-center gap-2">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PostCard({ post, onEdit, onDelete }: { post: FeedPost; onEdit: (post: FeedPost) => void; onDelete: (post: FeedPost) => void }) {
  const config = postTypeConfig[post.post_type] || { label: post.post_type, color: 'text-gray-600', bg: 'bg-white border-gray-200' };
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isLong = post.body.length > 300;
  return (
    <div className={`rounded-lg border p-5 ${config.bg} relative`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {post.pinned && (
              <svg className="w-3.5 h-3.5 text-gold flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
              </svg>
            )}
            <span className={`text-xs font-semibold uppercase tracking-wide ${config.color}`}>{config.label}</span>
          </div>
          <h3 className="font-semibold text-navy">{post.title}</h3>
          <p className={`text-gray-700 text-sm mt-2 leading-relaxed ${!expanded && isLong ? 'line-clamp-4' : ''}`}>{post.body}</p>
          {isLong && (
            <button onClick={() => setExpanded(!expanded)} className="text-sm text-gold hover:underline mt-1">
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
          <p className="text-xs text-gray-400 mt-3">{post.author_name} &bull; {timeAgo(post.created_at)}</p>
        </div>
        <div className="relative flex-shrink-0">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 text-gray-400 hover:text-navy rounded transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[120px]">
                <button onClick={() => { setShowMenu(false); onEdit(post); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                <button onClick={() => { setShowMenu(false); onDelete(post); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface DiscussionViewProps {
  posts: DiscussionPost[];
  cohortId: string;
  onPostCreated: (post: DiscussionPost) => void;
  onPostDeleted: (id: string) => void;
  onPostUpdated: (id: string, body: string) => void;
}

function DiscussionView({ posts, cohortId, onPostCreated, onPostDeleted, onPostUpdated }: DiscussionViewProps) {
  const [compose, setCompose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingPost, setEditingPost] = useState<DiscussionPost | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [deletingPost, setDeletingPost] = useState<DiscussionPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handlePost() {
    if (!compose.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/cohort/discussion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_body: compose, cohort_id: cohortId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to post.'); return; }
      onPostCreated(data.post);
      setCompose('');
    } catch { setError('Network error. Please try again.'); } finally { setSubmitting(false); }
  }

  const openEdit = (post: DiscussionPost) => { setEditingPost(post); setEditBody(post.body); setEditError(''); };

  const submitEdit = async () => {
    if (!editingPost || !editBody.trim()) return;
    setEditSaving(true);
    setEditError('');
    try {
      const res = await fetch(`/api/cohort/discussion/${editingPost.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_body: editBody.trim() }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const d = await res.json();
      onPostUpdated(editingPost.id, d.post.body);
      setEditingPost(null);
    } catch (err) { setEditError(err instanceof Error ? err.message : 'Failed'); } finally { setEditSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deletingPost) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/cohort/discussion/${deletingPost.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      onPostDeleted(deletingPost.id);
      setDeletingPost(null);
    } catch { /* keep open */ } finally { setDeleting(false); }
  };

  return (
    <div>
      {/* Compose box */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <textarea value={compose} onChange={e => setCompose(e.target.value)} placeholder="Post a message or question to the cohort..." rows={3} className="w-full text-sm text-gray-700 resize-none focus:outline-none" />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        <div className="flex justify-end mt-3">
          <button onClick={handlePost} disabled={submitting || !compose.trim()} className="px-4 py-1.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors">
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <EmptyState icon={<MessageSquare className="w-7 h-7 text-gray-400" />} title="No discussion yet" subtitle="Start a conversation with the cohort." />
      ) : (
        <div className="space-y-4">
          {posts.map(post => {
            return (
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
                      <button onClick={() => openEdit(post)} className="p-1 text-gray-400 hover:text-navy rounded" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeletingPost(post)} className="p-1 text-gray-400 hover:text-red-500 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <p className="text-gray-700 text-sm mt-2 leading-relaxed">{post.body}</p>
                    {post.reply_count > 0 && (
                      <p className="text-xs text-gray-400 mt-2">{post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Discussion Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-navy">Edit Post</h3>
              <button onClick={() => setEditingPost(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {editError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{editError}</p>}
              <textarea value={editBody} onChange={e => setEditBody(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none" rows={5} />
              <div className="flex gap-3">
                <button onClick={() => setEditingPost(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={submitEdit} disabled={editSaving || !editBody.trim()} className="flex-1 px-4 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {editSaving && <Loader2 className="w-4 h-4 animate-spin" />}{editSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Discussion Modal */}
      {deletingPost && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-navy mb-1">Delete Post</h3>
            <p className="text-sm text-gray-600 mb-1">Post by <span className="font-medium">{deletingPost.author_name}</span> will be permanently removed.</p>
            {deletingPost.reply_count > 0 && <p className="text-sm text-amber-600 mb-4">This will also delete {deletingPost.reply_count} {deletingPost.reply_count === 1 ? 'reply' : 'replies'}.</p>}
            {deletingPost.reply_count === 0 && <div className="mb-4" />}
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingPost(null)} disabled={deleting} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-5 rounded-lg text-sm disabled:opacity-50 flex items-center gap-2">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MembersView({ members }: { members: CohortMember[] }) {
  if (members.length === 0) {
    return <EmptyState icon={<Users className="w-7 h-7 text-gray-400" />} title="No members yet" subtitle="Members will appear here once enrolled." />;
  }
  const trainers = members.filter(m => m.role === 'trainer');
  const leaders = members.filter(m => m.role !== 'trainer');
  return (
    <div>
      {trainers.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Trainer{trainers.length !== 1 ? 's' : ''}</p>
          <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
            {trainers.map(m => <MemberRow key={m.id} member={m} />)}
          </div>
        </div>
      )}
      {leaders.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">DNA Leaders</p>
          <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
            {leaders.map(m => <MemberRow key={m.id} member={m} />)}
          </div>
        </div>
      )}
      <p className="text-center text-xs text-gray-400 mt-4">{members.length} total member{members.length !== 1 ? 's' : ''}</p>
    </div>
  );
}

function MemberRow({ member }: { member: CohortMember }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(member.name)}`}>
        {initials(member.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-navy text-sm">{member.name}</p>
        {member.joined_at && (
          <p className="text-xs text-gray-400">
            Joined {new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
        member.role === 'trainer' ? 'bg-gold/20 text-gold' : 'bg-gray-100 text-gray-600'
      }`}>
        {member.role === 'trainer' ? 'Trainer' : 'Leader'}
      </span>
    </div>
  );
}

interface EventsViewProps {
  events: CohortEvent[];
  cohortId: string;
  onEventCreated: (event: CohortEvent) => void;
  onRefresh: () => void;
}

function toLocalInputs(isoStart: string, isoEnd?: string): { date: string; time: string; duration: string } {
  const start = new Date(isoStart);
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
  const time = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
  let duration = '1';
  if (isoEnd) {
    const end = new Date(isoEnd);
    duration = String(Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60) * 10) / 10);
  }
  return { date, time, duration };
}

function EventsView({ events, cohortId, onEventCreated, onRefresh }: EventsViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CohortEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<CohortEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({ title: '', date: '', time: '', duration: '1', location: '', description: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const openEdit = (event: CohortEvent) => {
    const { date, time, duration } = toLocalInputs(event.start_time, event.end_time);
    setEditingEvent(event);
    setEditForm({ title: event.title, date, time, duration, location: event.location || '', description: event.description || '' });
    setEditError('');
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setEditSaving(true);
    setEditError('');
    try {
      const startTime = new Date(`${editForm.date}T${editForm.time}`).toISOString();
      const endTime = new Date(new Date(`${editForm.date}T${editForm.time}`).getTime() + parseFloat(editForm.duration) * 60 * 60 * 1000).toISOString();
      const res = await fetch(`/api/calendar/events/${editingEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'this', title: editForm.title, description: editForm.description || null, location: editForm.location || null, start_time: startTime, end_time: endTime }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to update'); }
      setEditingEvent(null);
      onRefresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingEvent) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/calendar/events/${deletingEvent.id}?scope=this`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setDeletingEvent(null);
      onRefresh();
    } catch { /* keep modal open */ } finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{events.length} upcoming event{events.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {events.length === 0 ? (
        <EmptyState icon={<Calendar className="w-7 h-7 text-gray-400" />} title="No upcoming events" subtitle="Schedule a cohort event like a retreat or training session." />
      ) : (
        <div className="space-y-4">
          {events.map(event => {
            const start = new Date(event.start_time);
            const end = new Date(event.end_time);
            const durationMs = end.getTime() - start.getTime();
            const durationHrs = Math.round(durationMs / (1000 * 60 * 60) * 10) / 10;
            return (
              <div key={event.id} className="bg-white rounded-lg shadow p-5 flex gap-4">
                <div className="text-center min-w-[48px]">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    {start.toLocaleDateString('en-US', { month: 'short' })}
                  </p>
                  <p className="text-2xl font-bold text-navy leading-none">{start.getDate()}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-navy">{event.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    {' — '}{durationHrs}hr
                    {event.location && <> &bull; {event.location}</>}
                  </p>
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{event.description}</p>
                  )}
                </div>
                <div className="flex items-start gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(event)} className="p-1.5 text-gray-400 hover:text-navy rounded transition-colors" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeletingEvent(event)} className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <AddEventModal cohortId={cohortId} onClose={() => setShowModal(false)} onCreated={onEventCreated} />
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-navy">Edit Event</h2>
              <button onClick={() => setEditingEvent(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitEdit} className="p-6 space-y-4">
              {editError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{editError}</p>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" value={editForm.time} onChange={e => setEditForm(p => ({ ...p, time: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select value={editForm.duration} onChange={e => setEditForm(p => ({ ...p, duration: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40">
                  <option value="0.5">30 minutes</option><option value="1">1 hour</option><option value="1.5">1.5 hours</option><option value="2">2 hours</option><option value="3">3 hours</option><option value="4">4 hours</option><option value="8">Full day (8 hrs)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" value={editForm.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" placeholder="Room, address, or online link..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none" rows={3} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingEvent(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={editSaving} className="flex-1 px-4 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {editSaving && <Loader2 className="w-4 h-4 animate-spin" />}{editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Event Modal */}
      {deletingEvent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-navy mb-1">Delete Event</h3>
            <p className="text-sm text-gray-600 mb-4"><span className="font-medium">{deletingEvent.title}</span> will be permanently removed.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingEvent(null)} disabled={deleting} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-5 rounded-lg text-sm disabled:opacity-50 flex items-center gap-2">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="bg-white rounded-lg shadow px-6 py-12 text-center">
      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">{icon}</div>
      <p className="text-navy font-semibold">{title}</p>
      <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
    </div>
  );
}

// ── Training Groups ───────────────────────────────────────────────

interface TrainingGroupMember {
  group_id: string;
  leader_id: string;
  role: string;
  leader_name: string;
}

interface TrainingGroup {
  id: string;
  groupName: string;
  currentPhase: string;
  startDate: string;
  members: TrainingGroupMember[];
}

interface CohortMemberOption {
  leaderId: string;
  name: string;
  email: string;
  cohortRole: string;
}

interface CreateGroupModalProps {
  cohortId: string;
  cohortMembers: CohortMemberOption[];
  onClose: () => void;
  onCreated: (group: TrainingGroup) => void;
}

function CreateTrainingGroupModal({ cohortId, cohortMembers, onClose, onCreated }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [leaderId, setLeaderId] = useState('');
  const [coLeaderId, setCoLeaderId] = useState('');
  const [discipleIds, setDiscipleIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function toggleDisciple(id: string) {
    setDiscipleIds(prev => {
      if (prev.includes(id)) return prev.filter(d => d !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }

  const assignedIds = new Set([leaderId, coLeaderId, ...discipleIds].filter(Boolean));
  const leaderOptions = cohortMembers;
  const coLeaderOptions = cohortMembers.filter(m => m.leaderId !== leaderId);
  const discipleOptions = cohortMembers.filter(
    m => m.leaderId !== leaderId && m.leaderId !== coLeaderId
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim()) { setError('Group name is required.'); return; }
    if (!leaderId) { setError('A leader is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/cohort/training-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohortId,
          groupName: groupName.trim(),
          leaderId,
          coLeaderId: coLeaderId || undefined,
          discipleIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create group.'); return; }

      // Build the returned group for optimistic update
      const buildMember = (id: string, role: string): TrainingGroupMember => {
        const m = cohortMembers.find(c => c.leaderId === id);
        return { group_id: data.id, leader_id: id, role, leader_name: m?.name || 'Unknown' };
      };
      const newGroup: TrainingGroup = {
        id: data.id,
        groupName: groupName.trim(),
        currentPhase: 'foundation',
        startDate: new Date().toISOString().split('T')[0],
        members: [
          buildMember(leaderId, 'leader'),
          ...(coLeaderId ? [buildMember(coLeaderId, 'co_leader')] : []),
          ...discipleIds.map(d => buildMember(d, 'disciple')),
        ],
      };
      onCreated(newGroup);
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="font-semibold text-navy">Create Training Group</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="e.g. Training Group 1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leader <span className="text-red-500">*</span></label>
            <select
              value={leaderId}
              onChange={e => { setLeaderId(e.target.value); setCoLeaderId(''); setDiscipleIds([]); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            >
              <option value="">Select a leader...</option>
              {leaderOptions.map(m => (
                <option key={m.leaderId} value={m.leaderId}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Co-leader <span className="text-gray-400 font-normal">(optional)</span></label>
            <select
              value={coLeaderId}
              onChange={e => { setCoLeaderId(e.target.value); setDiscipleIds([]); }}
              disabled={!leaderId}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold disabled:opacity-50"
            >
              <option value="">None</option>
              {coLeaderOptions.map(m => (
                <option key={m.leaderId} value={m.leaderId}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Disciples <span className="text-gray-400 font-normal">(up to 4)</span>
              {discipleIds.length > 0 && (
                <span className="ml-2 text-xs bg-gold/10 text-gold-700 font-medium px-2 py-0.5 rounded-full">{discipleIds.length} selected</span>
              )}
            </label>
            {!leaderId ? (
              <p className="text-sm text-gray-400 italic">Select a leader first</p>
            ) : discipleOptions.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No remaining cohort members available</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {discipleOptions.map(m => {
                  const checked = discipleIds.includes(m.leaderId);
                  const disabled = !checked && discipleIds.length >= 4;
                  return (
                    <label
                      key={m.leaderId}
                      className={`flex items-center gap-3 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                        checked ? 'bg-gold/10' : disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => !disabled && toggleDisciple(m.leaderId)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-800">{m.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{m.cohortRole}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditGroupModalProps {
  group: TrainingGroup;
  cohortMembers: CohortMemberOption[];
  onClose: () => void;
  onSaved: (updated: TrainingGroup) => void;
}

function EditTrainingGroupModal({ group, cohortMembers, onClose, onSaved }: EditGroupModalProps) {
  const existing = {
    leader: group.members.find(m => m.role === 'leader'),
    coLeader: group.members.find(m => m.role === 'co_leader'),
    disciples: group.members.filter(m => m.role === 'disciple'),
  };

  const [groupName, setGroupName] = useState(group.groupName);
  const [leaderId, setLeaderId] = useState(existing.leader?.leader_id || '');
  const [coLeaderId, setCoLeaderId] = useState(existing.coLeader?.leader_id || '');
  const [discipleIds, setDiscipleIds] = useState<string[]>(existing.disciples.map(d => d.leader_id));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function toggleDisciple(id: string) {
    setDiscipleIds(prev => {
      if (prev.includes(id)) return prev.filter(d => d !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }

  const leaderOptions = cohortMembers;
  const coLeaderOptions = cohortMembers.filter(m => m.leaderId !== leaderId);
  const discipleOptions = cohortMembers.filter(
    m => m.leaderId !== leaderId && m.leaderId !== coLeaderId
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim()) { setError('Group name is required.'); return; }
    if (!leaderId) { setError('A leader is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/cohort/training-groups/${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName: groupName.trim(), leaderId, coLeaderId: coLeaderId || undefined, discipleIds }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save changes.'); return; }

      const buildMember = (id: string, role: string): TrainingGroupMember => {
        const m = cohortMembers.find(c => c.leaderId === id);
        return { group_id: group.id, leader_id: id, role, leader_name: m?.name || 'Unknown' };
      };
      const updated: TrainingGroup = {
        ...group,
        groupName: groupName.trim(),
        members: [
          buildMember(leaderId, 'leader'),
          ...(coLeaderId ? [buildMember(coLeaderId, 'co_leader')] : []),
          ...discipleIds.map(d => buildMember(d, 'disciple')),
        ],
      };
      onSaved(updated);
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="font-semibold text-navy">Edit Training Group</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leader <span className="text-red-500">*</span></label>
            <select
              value={leaderId}
              onChange={e => { setLeaderId(e.target.value); setCoLeaderId(''); setDiscipleIds([]); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            >
              <option value="">Select a leader...</option>
              {leaderOptions.map(m => (
                <option key={m.leaderId} value={m.leaderId}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Co-leader <span className="text-gray-400 font-normal">(optional)</span></label>
            <select
              value={coLeaderId}
              onChange={e => { setCoLeaderId(e.target.value); setDiscipleIds([]); }}
              disabled={!leaderId}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold disabled:opacity-50"
            >
              <option value="">None</option>
              {coLeaderOptions.map(m => (
                <option key={m.leaderId} value={m.leaderId}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Disciples <span className="text-gray-400 font-normal">(up to 4)</span>
              {discipleIds.length > 0 && (
                <span className="ml-2 text-xs bg-gold/10 text-gold-700 font-medium px-2 py-0.5 rounded-full">{discipleIds.length} selected</span>
              )}
            </label>
            {!leaderId ? (
              <p className="text-sm text-gray-400 italic">Select a leader first</p>
            ) : discipleOptions.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No remaining cohort members available</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {discipleOptions.map(m => {
                  const checked = discipleIds.includes(m.leaderId);
                  const disabled = !checked && discipleIds.length >= 4;
                  return (
                    <label
                      key={m.leaderId}
                      className={`flex items-center gap-3 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                        checked ? 'bg-gold/10' : disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => !disabled && toggleDisciple(m.leaderId)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-800">{m.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{m.cohortRole}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90 disabled:opacity-50 transition-colors">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface TrainingGroupsViewProps {
  cohortId: string;
}

function TrainingGroupsView({ cohortId }: TrainingGroupsViewProps) {
  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [cohortMembers, setCohortMembers] = useState<CohortMemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TrainingGroup | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/cohort/training-groups?cohortId=${cohortId}`)
      .then(r => r.json())
      .then(d => {
        setGroups(d.trainingGroups || []);
        setCohortMembers(d.cohortMembers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [cohortId]);

  async function handleDelete(groupId: string) {
    setDeletingId(groupId);
    try {
      const res = await fetch(`/api/cohort/training-groups/${groupId}`, { method: 'DELETE' });
      if (res.ok) setGroups(prev => prev.filter(g => g.id !== groupId));
    } finally {
      setDeletingId(null);
    }
  }

  const roleLabel: Record<string, string> = { leader: 'Leader', co_leader: 'Co-Leader', disciple: 'Disciple' };
  const roleBadge: Record<string, string> = {
    leader: 'bg-navy/10 text-navy',
    co_leader: 'bg-teal/10 text-teal',
    disciple: 'bg-gray-100 text-gray-600',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">
            {groups.length === 0
              ? 'No training groups yet.'
              : `${groups.length} training ${groups.length === 1 ? 'group' : 'groups'}`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="w-7 h-7 text-gray-400" />}
          title="No training groups yet"
          subtitle="Create training groups to assign cohort members as leaders-in-training."
        />
      ) : (
        <div className="space-y-3">
          {groups.map(group => {
            const leader = group.members.find(m => m.role === 'leader');
            const coLeader = group.members.find(m => m.role === 'co_leader');
            const disciples = group.members.filter(m => m.role === 'disciple');
            const isExpanded = expandedId === group.id;

            return (
              <div key={group.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-navy text-sm">{group.groupName}</h3>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Training</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                      {leader && ` · Led by ${leader.leader_name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : group.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                      title="View members"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setEditingGroup(group)}
                      className="p-1.5 text-gray-400 hover:text-navy rounded transition-colors"
                      title="Edit group"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      disabled={deletingId === group.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors disabled:opacity-40"
                      title="Archive group"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                    <div className="space-y-2">
                      {leader && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-800">{leader.leader_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge.leader}`}>{roleLabel.leader}</span>
                        </div>
                      )}
                      {coLeader && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-800">{coLeader.leader_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge.co_leader}`}>{roleLabel.co_leader}</span>
                        </div>
                      )}
                      {disciples.map(d => (
                        <div key={d.leader_id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-800">{d.leader_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge.disciple}`}>{roleLabel.disciple}</span>
                        </div>
                      ))}
                      {/* Empty slots */}
                      {!coLeader && (
                        <div className="flex items-center justify-between opacity-40">
                          <span className="text-sm text-gray-400 italic">No co-leader assigned</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Co-Leader</span>
                        </div>
                      )}
                      {Array.from({ length: Math.max(0, 4 - disciples.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="flex items-center justify-between opacity-30">
                          <span className="text-sm text-gray-400 italic">Open disciple slot</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Disciple</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateTrainingGroupModal
          cohortId={cohortId}
          cohortMembers={cohortMembers}
          onClose={() => setShowCreate(false)}
          onCreated={(g) => setGroups(prev => [...prev, g])}
        />
      )}

      {editingGroup && (
        <EditTrainingGroupModal
          group={editingGroup}
          cohortMembers={cohortMembers}
          onClose={() => setEditingGroup(null)}
          onSaved={(updated) => {
            setGroups(prev => prev.map(g => g.id === updated.id ? updated : g));
            setEditingGroup(null);
          }}
        />
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────

type SubTab = 'feed' | 'discussion' | 'members' | 'events' | 'training_groups';

export default function AdminCohortTab({ churchId }: { churchId: string }) {
  const [data, setData] = useState<CohortData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<SubTab>('feed');

  useEffect(() => {
    fetch(`/api/cohort?churchId=${churchId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [churchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="py-12 text-center text-gray-500">Failed to load cohort data.</div>;
  }

  if (!data.cohort) {
    return (
      <div className="py-12 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-navy font-semibold">No cohort yet</p>
        <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
          A cohort will be created automatically when the first DNA leader is added to this church.
        </p>
      </div>
    );
  }

  const cohortId = data.cohort.id;

  function handlePostCreated(post: FeedPost) {
    setData(prev => {
      if (!prev) return prev;
      const newPosts = post.pinned
        ? [post, ...prev.feed]
        : [...prev.feed.filter(p => p.pinned), ...prev.feed.filter(p => !p.pinned), post];
      return { ...prev, feed: newPosts };
    });
  }

  function handleDiscussionCreated(post: DiscussionPost) {
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, discussion: [post, ...prev.discussion] };
    });
  }

  function handleEventCreated(event: CohortEvent) {
    setData(prev => {
      if (!prev) return prev;
      const newEvents = [...prev.events, event].sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
      return {
        ...prev,
        events: newEvents,
        stats: { ...prev.stats, upcoming_events: prev.stats.upcoming_events + 1 },
      };
    });
  }

  function refreshData() {
    fetch(`/api/cohort?churchId=${churchId}`)
      .then(r => r.json())
      .then(d => { if (d) setData(d); })
      .catch(() => {});
  }

  function handlePostDeleted(postId: string) {
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, feed: prev.feed.filter(p => p.id !== postId) };
    });
  }

  function handlePostUpdated(updated: FeedPost) {
    setData(prev => {
      if (!prev) return prev;
      const newFeed = prev.feed.map(p => p.id === updated.id ? updated : p);
      return { ...prev, feed: [...newFeed.filter(p => p.pinned), ...newFeed.filter(p => !p.pinned)] };
    });
  }

  function handleDiscussionDeleted(postId: string) {
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, discussion: prev.discussion.filter(p => p.id !== postId) };
    });
  }

  function handleDiscussionUpdated(postId: string, newBody: string) {
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, discussion: prev.discussion.map(p => p.id === postId ? { ...p, body: newBody } : p) };
    });
  }

  const subTabs: { id: SubTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'feed', label: 'Feed', icon: <Rss className="w-4 h-4" />, count: data.feed.length },
    { id: 'discussion', label: 'Discussion', icon: <MessageSquare className="w-4 h-4" />, count: data.discussion.length },
    { id: 'members', label: 'Members', icon: <Users className="w-4 h-4" />, count: data.members.length },
    { id: 'events', label: 'Events', icon: <Calendar className="w-4 h-4" />, count: data.events.length },
    { id: 'training_groups', label: 'Training Groups', icon: <GraduationCap className="w-4 h-4" /> },
  ];

  return (
    <div>
      {/* Cohort header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-navy">{data.cohort.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Generation {data.cohort.generation}
            {data.cohort.started_at && (
              <> &bull; Started {new Date(data.cohort.started_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</>
            )}
            <span className="ml-2 inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              DNA Coach
            </span>
          </p>
          {data.cohort.church_subdomain && (
            <a
              href={`https://${data.cohort.church_subdomain}.dailydna.app`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold/80 mt-1"
            >
              <Globe className="w-3 h-3" />
              {data.cohort.church_subdomain}.dailydna.app
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        {/* Stats */}
        <div className="flex items-center gap-6 text-center">
          <div>
            <p className="text-xl font-bold text-navy">{data.stats.total_members}</p>
            <p className="text-xs text-gray-400">Members</p>
          </div>
          <div>
            <p className="text-xl font-bold text-navy">{data.stats.trainers}</p>
            <p className="text-xs text-gray-400">Trainers</p>
          </div>
          <div>
            <p className="text-xl font-bold text-navy">{data.stats.upcoming_events}</p>
            <p className="text-xs text-gray-400">Upcoming</p>
          </div>
        </div>
      </div>

      {/* Church App QR Code — shown when subdomain is configured */}
      {data.cohort.church_subdomain && (
        <div className="mb-6">
          <ChurchAppQRCard
            url={`https://${data.cohort.church_subdomain}.dailydna.app/join`}
            downloadName={data.cohort.church_subdomain}
          />
        </div>
      )}

      {/* Sub-tab navigation */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
              subTab === tab.id
                ? 'border-gold text-navy font-medium'
                : 'border-transparent text-gray-500 hover:text-navy'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 text-xs bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 font-medium">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <div>
        {subTab === 'feed' && (
          <FeedView posts={data.feed} cohortId={cohortId} onPostCreated={handlePostCreated} onPostDeleted={handlePostDeleted} onPostUpdated={handlePostUpdated} />
        )}
        {subTab === 'discussion' && (
          <DiscussionView posts={data.discussion} cohortId={cohortId} onPostCreated={handleDiscussionCreated} onPostDeleted={handleDiscussionDeleted} onPostUpdated={handleDiscussionUpdated} />
        )}
        {subTab === 'members' && <MembersView members={data.members} />}
        {subTab === 'events' && (
          <EventsView events={data.events} cohortId={cohortId} onEventCreated={handleEventCreated} onRefresh={refreshData} />
        )}
        {subTab === 'training_groups' && data.cohort && (
          <TrainingGroupsView cohortId={data.cohort.id} />
        )}
      </div>
    </div>
  );
}
