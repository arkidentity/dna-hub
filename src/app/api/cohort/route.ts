import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole, isAdmin } from '@/lib/unified-auth';

// Mock data used when no real cohort exists (demo mode)
function getMockCohortData(leaderName: string, churchName: string) {
  return {
    cohort: {
      id: 'mock-cohort-1',
      name: `${churchName} G1 — Spring 2026`,
      generation: 1,
      status: 'active',
      started_at: '2026-01-06',
      church_name: churchName,
    },
    currentUserRole: 'trainer',
    stats: {
      total_members: 12,
      trainers: 1,
      upcoming_events: 2,
    },
    feed: [
      {
        id: 'post-1',
        post_type: 'announcement',
        title: 'Week 4 Training Recap — Listening Prayer',
        body: 'Great session this week! I was blown away by the depth of sharing during the listening prayer exercise. Several of you heard things that were clearly Spirit-led. Next week we move into the Creed — come ready to memorize together.',
        pinned: true,
        author_name: leaderName,
        author_role: 'trainer',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'post-2',
        post_type: 'resource',
        title: 'DNA Manual — Session 3 Discussion Guide',
        body: 'Uploading the discussion guide for Session 3 (Relational Discipleship). Use this in your group time this week. Pay special attention to the "Who discipled you?" question — it opens incredible conversations.',
        pinned: false,
        author_name: leaderName,
        author_role: 'trainer',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'post-3',
        post_type: 'update',
        title: 'Reminder: Mid-Cohort Retreat — Feb 22',
        body: "Just a reminder that our mid-cohort retreat is coming up on Saturday, February 22nd at Camp Cho-Yeh. We'll leave at 8am from the church parking lot. Please confirm your RSVP if you haven't already.",
        pinned: false,
        author_name: leaderName,
        author_role: 'trainer',
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    discussion: [
      {
        id: 'disc-1',
        body: 'Anyone else find the Spiritual Gifts results surprising? I scored highest in Mercy, which caught me off guard. But the more I think about it, the more it makes sense for why I always want to follow up with people who are struggling.',
        author_name: 'Marcus Rivera',
        author_role: 'leader',
        reply_count: 3,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'disc-2',
        body: "Question for the group — how are you all structuring your weekly check-ins with your disciples outside of the group time? Trying to figure out the right rhythm.",
        author_name: 'Sarah Chen',
        author_role: 'leader',
        reply_count: 5,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'disc-3',
        body: 'Week 3 Testimony Builder exercise was powerful. One of my guys broke down writing his "before" story. Prayed together for a long time after. This stuff is real.',
        author_name: 'James Okafor',
        author_role: 'leader',
        reply_count: 7,
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'disc-4',
        body: 'Heads up — the Daily DNA app had an update this week. New progress tracker on the Pathway section makes it much easier to see where your disciples are. Check it out!',
        author_name: 'Priya Nair',
        author_role: 'leader',
        reply_count: 2,
        created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    members: [
      { id: 'm-1', name: leaderName, role: 'trainer', joined_at: '2026-01-06' },
      { id: 'm-2', name: 'Marcus Rivera', role: 'leader', joined_at: '2026-01-06' },
      { id: 'm-3', name: 'Sarah Chen', role: 'leader', joined_at: '2026-01-06' },
      { id: 'm-4', name: 'David Kim', role: 'leader', joined_at: '2026-01-06' },
      { id: 'm-5', name: 'Aisha Washington', role: 'leader', joined_at: '2026-01-06' },
      { id: 'm-6', name: 'James Okafor', role: 'leader', joined_at: '2026-01-06' },
      { id: 'm-7', name: 'Priya Nair', role: 'leader', joined_at: '2026-01-06' },
      { id: 'm-8', name: 'Carlos Mendez', role: 'leader', joined_at: '2026-01-06' },
      { id: 'm-9', name: 'Rachel Thompson', role: 'leader', joined_at: '2026-01-06' },
      { id: 'm-10', name: 'Tyler Brooks', role: 'leader', joined_at: '2026-01-06' },
      { id: 'm-11', name: 'Naomi Osei', role: 'leader', joined_at: '2026-01-06' },
      { id: 'm-12', name: 'Ben Matthews', role: 'leader', joined_at: '2026-01-06' },
    ],
    events: [
      {
        id: 'evt-1',
        title: 'Mid-Cohort Retreat',
        description: 'Full-day retreat for all G1 leaders. Deep dive into multiplication vision and personal calling.',
        start_time: '2026-02-22T08:00:00Z',
        end_time: '2026-02-22T18:00:00Z',
        location: 'Camp Cho-Yeh',
      },
      {
        id: 'evt-2',
        title: 'Weekly Training Session — Week 5',
        description: 'DNA Manual Session 5: Creed & Identity. Come with your creed card memorized.',
        start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        location: 'Room 212, Main Building',
      },
      {
        id: 'evt-3',
        title: 'G1 Launch Celebration',
        description: 'Celebrate our G1 leaders completing training and officially launching their DNA groups!',
        start_time: '2026-04-05T17:00:00Z',
        end_time: '2026-04-05T20:00:00Z',
        location: 'Fellowship Hall',
      },
    ],
  };
}

// Resolve the dna_leaders record for the current session email.
// church_leaders who are also dna_leaders will match. Pure church_leaders fall through.
async function resolveLeader(email: string, supabase: ReturnType<typeof getSupabaseAdmin>) {
  const { data } = await supabase
    .from('dna_leaders')
    .select('id, name, email, church:churches(id, name)')
    .eq('email', email)
    .single();

  if (!data) return null;

  return {
    id: data.id as string,
    name: data.name as string,
    email: data.email as string,
    church: data.church as unknown as { id: string; name: string } | null,
  };
}

// GET /api/cohort
// Returns the current user's cohort data (or mock data for demo)
export async function GET() {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasRole(session, 'dna_leader') && !hasRole(session, 'church_leader') && !isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    const leader = await resolveLeader(session.email, supabase);

    if (!leader) {
      // church_leader with no dna_leaders record — show mock
      return NextResponse.json({
        mock: true,
        ...getMockCohortData(session.email, 'Your Church'),
      });
    }

    const leaderName = leader.name || session.email;
    const churchName = leader.church?.name || 'Your Church';

    // Check cohort membership (only non-exempt members)
    const { data: membership } = await supabase
      .from('dna_cohort_members')
      .select('cohort_id, role')
      .eq('leader_id', leader.id)
      .eq('cohort_exempt', false)
      .single();

    if (!membership) {
      return NextResponse.json({
        mock: true,
        ...getMockCohortData(leaderName, churchName),
      });
    }

    const cohortId = membership.cohort_id;

    const [cohortRes, membersRes, postsRes, discussionRes, eventsRes] = await Promise.all([
      supabase
        .from('dna_cohorts')
        .select('*, church:churches(name)')
        .eq('id', cohortId)
        .single(),
      supabase
        .from('dna_cohort_members')
        .select('id, role, joined_at, leader:dna_leaders(id, name)')
        .eq('cohort_id', cohortId)
        .eq('cohort_exempt', false)
        .order('joined_at', { ascending: true }),
      supabase
        .from('dna_cohort_posts')
        .select('id, post_type, title, body, pinned, created_at, author_role, author:dna_leaders(id, name)')
        .eq('cohort_id', cohortId)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('dna_cohort_discussion')
        .select('id, body, created_at, author:dna_leaders(id, name), parent_id')
        .eq('cohort_id', cohortId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(20),
      // Cohort events live in dna_calendar_events (event_type = 'cohort_event')
      supabase
        .from('dna_calendar_events')
        .select('id, title, description, start_time, end_time, location')
        .eq('cohort_id', cohortId)
        .eq('event_type', 'cohort_event')
        .eq('is_recurring', false)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10),
    ]);

    const cohort = cohortRes.data;
    const members = membersRes.data || [];
    const posts = postsRes.data || [];
    const discussion = discussionRes.data || [];
    const events = eventsRes.data || [];

    // Build trainer id set for accurate author_role on discussion posts
    const trainerIds = new Set(
      members
        .filter((m) => m.role === 'trainer')
        .map((m) => (m.leader as unknown as { id: string } | null)?.id)
        .filter(Boolean)
    );

    // Get reply counts for discussion threads
    const threadIds = discussion.map((d) => d.id);
    const replyCounts: Record<string, number> = {};
    if (threadIds.length > 0) {
      const { data: replies } = await supabase
        .from('dna_cohort_discussion')
        .select('parent_id')
        .in('parent_id', threadIds);
      (replies || []).forEach((r) => {
        replyCounts[r.parent_id] = (replyCounts[r.parent_id] || 0) + 1;
      });
    }

    return NextResponse.json({
      mock: false,
      cohort: {
        id: cohort?.id,
        name: cohort?.name,
        generation: cohort?.generation,
        status: cohort?.status,
        started_at: cohort?.started_at,
        church_name: churchName,
      },
      currentUserRole: membership.role,
      stats: {
        total_members: members.length,
        trainers: members.filter((m) => m.role === 'trainer').length,
        upcoming_events: events.length,
      },
      feed: posts.map((p) => ({
        id: p.id,
        post_type: p.post_type,
        title: p.title,
        body: p.body,
        pinned: p.pinned,
        author_name: (p.author as unknown as { name: string } | null)?.name || 'Trainer',
        author_role: (p as any).author_role || 'trainer',
        created_at: p.created_at,
      })),
      discussion: discussion.map((d) => {
        const authorId = (d.author as unknown as { id: string } | null)?.id;
        return {
          id: d.id,
          body: d.body,
          author_name: (d.author as unknown as { name: string } | null)?.name || 'Leader',
          author_role: authorId && trainerIds.has(authorId) ? 'trainer' : 'leader',
          reply_count: replyCounts[d.id] || 0,
          created_at: d.created_at,
        };
      }),
      members: members.map((m) => ({
        id: m.id,
        name: (m.leader as unknown as { id: string; name: string } | null)?.name || 'Leader',
        role: m.role,
        joined_at: m.joined_at,
      })),
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        start_time: e.start_time,
        end_time: e.end_time,
        location: e.location,
      })),
    });
  } catch (err) {
    console.error('Cohort API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
