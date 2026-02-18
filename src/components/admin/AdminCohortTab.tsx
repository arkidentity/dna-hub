'use client';

import { useEffect, useState } from 'react';
import { Users, MessageSquare, Rss, Calendar, Loader2, Plus, X, Pin } from 'lucide-react';

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
}

function FeedView({ posts, cohortId, onPostCreated }: FeedViewProps) {
  const [showModal, setShowModal] = useState(false);

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
              <div className="space-y-4">{pinned.map(p => <PostCard key={p.id} post={p} />)}</div>
            </div>
          )}
          {rest.length > 0 && (
            <div>
              {pinned.length > 0 && <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Recent</p>}
              <div className="space-y-4">{rest.map(p => <PostCard key={p.id} post={p} />)}</div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <NewPostModal
          cohortId={cohortId}
          onClose={() => setShowModal(false)}
          onCreated={onPostCreated}
        />
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
  );
}

interface DiscussionViewProps {
  posts: DiscussionPost[];
  cohortId: string;
  onPostCreated: (post: DiscussionPost) => void;
}

function DiscussionView({ posts, cohortId, onPostCreated }: DiscussionViewProps) {
  const [compose, setCompose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      if (!res.ok) {
        setError(data.error || 'Failed to post.');
        return;
      }
      onPostCreated(data.post);
      setCompose('');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Compose box */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <textarea
          value={compose}
          onChange={e => setCompose(e.target.value)}
          placeholder="Post a message or question to the cohort..."
          rows={3}
          className="w-full text-sm text-gray-700 resize-none focus:outline-none"
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        <div className="flex justify-end mt-3">
          <button
            onClick={handlePost}
            disabled={submitting || !compose.trim()}
            className="px-4 py-1.5 bg-gold text-white text-sm font-medium rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <EmptyState icon={<MessageSquare className="w-7 h-7 text-gray-400" />} title="No discussion yet" subtitle="Start a conversation with the cohort." />
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
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
                  {post.reply_count > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      {post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
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
}

function EventsView({ events, cohortId, onEventCreated }: EventsViewProps) {
  const [showModal, setShowModal] = useState(false);

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
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <AddEventModal
          cohortId={cohortId}
          onClose={() => setShowModal(false)}
          onCreated={onEventCreated}
        />
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

// ── Main Component ────────────────────────────────────────────────

type SubTab = 'feed' | 'discussion' | 'members' | 'events';

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

  const subTabs: { id: SubTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'feed', label: 'Feed', icon: <Rss className="w-4 h-4" />, count: data.feed.length },
    { id: 'discussion', label: 'Discussion', icon: <MessageSquare className="w-4 h-4" />, count: data.discussion.length },
    { id: 'members', label: 'Members', icon: <Users className="w-4 h-4" />, count: data.members.length },
    { id: 'events', label: 'Events', icon: <Calendar className="w-4 h-4" />, count: data.events.length },
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
          <FeedView posts={data.feed} cohortId={cohortId} onPostCreated={handlePostCreated} />
        )}
        {subTab === 'discussion' && (
          <DiscussionView posts={data.discussion} cohortId={cohortId} onPostCreated={handleDiscussionCreated} />
        )}
        {subTab === 'members' && <MembersView members={data.members} />}
        {subTab === 'events' && (
          <EventsView events={data.events} cohortId={cohortId} onEventCreated={handleEventCreated} />
        )}
      </div>
    </div>
  );
}
