'use client';

import { useEffect, useState } from 'react';
import { Users, MessageSquare, Rss, Calendar, Loader2 } from 'lucide-react';

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

// ── Sub-views ─────────────────────────────────────────────────────

function FeedView({ posts }: { posts: FeedPost[] }) {
  if (posts.length === 0) {
    return <EmptyState icon={<Rss className="w-7 h-7 text-gray-400" />} title="No posts yet" subtitle="The trainer hasn't posted anything yet." />;
  }
  const pinned = posts.filter(p => p.pinned);
  const rest = posts.filter(p => !p.pinned);
  return (
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

function DiscussionView({ posts }: { posts: DiscussionPost[] }) {
  if (posts.length === 0) {
    return <EmptyState icon={<MessageSquare className="w-7 h-7 text-gray-400" />} title="No discussion yet" subtitle="No one has posted in the discussion yet." />;
  }
  return (
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
  );
}

function MembersView({ members }: { members: CohortMember[] }) {
  if (members.length === 0) {
    return <EmptyState icon={<Users className="w-7 h-7 text-gray-400" />} title="No members yet" subtitle="Members will appear here after Migration 061 runs." />;
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

function EventsView({ events }: { events: CohortEvent[] }) {
  if (events.length === 0) {
    return <EmptyState icon={<Calendar className="w-7 h-7 text-gray-400" />} title="No upcoming events" subtitle="No cohort events scheduled yet." />;
  }
  return (
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

  // No cohort exists yet for this church
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

      {/* Admin read-only notice */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
        You&apos;re viewing this cohort as an admin. Content is read-only from this panel — trainers manage posts and events from their Cohort dashboard.
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
        {subTab === 'feed' && <FeedView posts={data.feed} />}
        {subTab === 'discussion' && <DiscussionView posts={data.discussion} />}
        {subTab === 'members' && <MembersView members={data.members} />}
        {subTab === 'events' && <EventsView events={data.events} />}
      </div>
    </div>
  );
}
