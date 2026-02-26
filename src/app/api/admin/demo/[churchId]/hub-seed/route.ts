import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

/**
 * POST /api/admin/demo/[churchId]/hub-seed
 * Admin-only. Seeds a full Hub leader demo experience for a church.
 *
 * Creates / updates:
 *   1.  Supabase Auth user         (demo-hub-{subdomain}@dna.demo)
 *   2.  users row                  (unified auth lookup table)
 *   3.  user_roles rows            (dna_leader + church_leader + training_participant)
 *   4.  church_leaders row         (backward compat)
 *   5.  dna_leaders row            (pre-activated, for groups dashboard)
 *   6.  3 dna_groups               (Life Group Alpha/Beta/Gamma, different phases)
 *   7.  12 disciples               (realistic names, email-keyed for idempotency)
 *   8.  group_disciples            (linking disciples to their groups)
 *   9.  3 dna_cohort_posts         (in church's active cohort, demo leader as author)
 *  10.  3 dna_calendar_events      (one per group, next 3 weekdays at 7pm)
 *  11.  church_demo_settings       (hub_demo_leader_id + hub_demo_seeded_at)
 *
 * Idempotent — safe to re-run.
 */

// ── Seed data ─────────────────────────────────────────────────────────────────

const GROUPS = [
  {
    key: 'alpha',
    name: 'Life Group Alpha',
    phase: 'foundation' as const,
    startDaysAgo: 21,    // ~Week 3
    disciples: [
      { key: 'disc-1', name: 'Marcus Webb' },
      { key: 'disc-2', name: 'Jordan Salinas' },
      { key: 'disc-3', name: 'Priya Nair' },
      { key: 'disc-4', name: 'Taylor Brooks' },
      { key: 'disc-5', name: 'Cameron Osei' },
    ],
    location: 'Church Fellowship Hall',
    eventDay: 4, // Thursday
  },
  {
    key: 'beta',
    name: 'Life Group Beta',
    phase: 'foundation' as const,
    startDaysAgo: 49,    // ~Week 7
    disciples: [
      { key: 'disc-6', name: 'Layla Torres' },
      { key: 'disc-7', name: 'Devon Marsh' },
      { key: 'disc-8', name: 'Amara Okafor' },
      { key: 'disc-9', name: 'Chris Nguyen' },
    ],
    location: 'Room 204',
    eventDay: 3, // Wednesday
  },
  {
    key: 'gamma',
    name: 'Life Group Gamma',
    phase: 'growth' as const,
    startDaysAgo: 91,    // ~Week 13 (Growth phase)
    disciples: [
      { key: 'disc-10', name: 'Zoe Petersen' },
      { key: 'disc-11', name: 'Isaiah Flores' },
      { key: 'disc-12', name: 'Micah Chen' },
    ],
    location: 'Main Campus — Room 101',
    eventDay: 2, // Tuesday
  },
] as const;

const COHORT_POSTS = [
  {
    post_type: 'announcement' as const,
    title: 'Week 4 Training Recap — Listening Prayer',
    body: 'Great session this week! The depth of sharing during the listening prayer exercise was incredible. Several of you heard things that were clearly Spirit-led. Next week we move into the Creed — come ready to memorize and reflect together.',
    pinned: true,
    daysAgo: 2,
  },
  {
    post_type: 'resource' as const,
    title: 'DNA Manual — Session 3 Discussion Guide',
    body: "Sharing the Session 3 discussion guide for relational discipleship. Use this in your group time this week. Pay special attention to the 'Who discipled you?' question — it opens incredible conversations.",
    pinned: false,
    daysAgo: 5,
  },
  {
    post_type: 'update' as const,
    title: 'Mid-Cohort Retreat Details',
    body: 'Our mid-cohort retreat is coming up next month. Two days of reflection, prayer, and peer accountability. Details going out in your email this week — mark your calendars and plan to be there.',
    pinned: false,
    daysAgo: 9,
  },
];

/** Returns the next occurrence of a given day-of-week (0=Sun…6=Sat) from today */
function nextWeekday(dayOfWeek: number, offsetWeeks = 0): Date {
  const now = new Date();
  const current = now.getDay();
  const daysUntil = ((dayOfWeek - current + 7) % 7) || 7;
  const d = new Date(now);
  d.setDate(now.getDate() + daysUntil + offsetWeeks * 7);
  d.setHours(19, 0, 0, 0);
  return d;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ churchId: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { churchId } = await params;
    const supabase = getSupabaseAdmin();

    // ── 0. Verify church + get subdomain ───────────────────────────────────
    const { data: church } = await supabase
      .from('churches')
      .select('id, name, subdomain')
      .eq('id', churchId)
      .single();

    if (!church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    const subdomain = church.subdomain as string;
    const demoEmail = `demo-hub-${subdomain}@dna.demo`;
    const demoPassword = `dna-hub-demo-${subdomain}-session`;

    // ── 1. Get or create Supabase Auth user ────────────────────────────────
    const { data: existingSettings } = await supabase
      .from('church_demo_settings')
      .select('hub_demo_leader_id')
      .eq('church_id', churchId)
      .single();

    let authUserId: string | null = existingSettings?.hub_demo_leader_id ?? null;

    if (!authUserId) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: demoEmail,
        password: demoPassword,
        email_confirm: true,
        user_metadata: {
          is_demo: true,
          is_hub_demo: true,
          church_id: churchId,
          church_subdomain: subdomain,
        },
      });

      if (authData?.user) {
        authUserId = authData.user.id;
      } else if (
        authError?.message?.toLowerCase().includes('already been registered') ||
        authError?.message?.toLowerCase().includes('already registered') ||
        authError?.code === 'email_exists' ||
        authError?.status === 422
      ) {
        const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const existing = listData?.users?.find((u) => u.email === demoEmail);
        if (existing) {
          authUserId = existing.id;
        } else {
          console.error('[HUB SEED] Could not find existing auth user after conflict:', authError);
          return NextResponse.json({ error: 'Auth user conflict, could not resolve' }, { status: 500 });
        }
      } else if (authError) {
        console.error('[HUB SEED] Auth user creation error:', authError);
        return NextResponse.json({ error: 'Failed to create demo Hub auth user' }, { status: 500 });
      }
    }

    if (!authUserId) {
      return NextResponse.json({ error: 'Could not obtain demo Hub auth user ID' }, { status: 500 });
    }

    // Always ensure password is current (covers re-seeds)
    await supabase.auth.admin.updateUserById(authUserId, { password: demoPassword });

    // ── 2. Upsert unified `users` row ──────────────────────────────────────
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .upsert(
        { email: demoEmail, name: 'Demo Leader' },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    if (userError || !userRow) {
      console.error('[HUB SEED] users upsert error:', userError);
      return NextResponse.json({ error: 'Failed to upsert users row' }, { status: 500 });
    }

    const userId = userRow.id as string;

    // ── 3. Upsert user_roles ────────────────────────────────────────────────
    const rolesToCreate: { user_id: string; role: string; church_id: string | null }[] = [
      { user_id: userId, role: 'dna_leader', church_id: churchId },
      { user_id: userId, role: 'church_leader', church_id: churchId },
      { user_id: userId, role: 'training_participant', church_id: null },
    ];

    for (const roleRow of rolesToCreate) {
      const query = supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', roleRow.role);

      if (roleRow.church_id) {
        query.eq('church_id', roleRow.church_id);
      } else {
        query.is('church_id', null);
      }

      const { data: existing } = await query.maybeSingle();
      if (!existing) {
        await supabase.from('user_roles').insert(roleRow);
      }
    }

    // ── 4. Upsert church_leaders row ───────────────────────────────────────
    const { data: existingCL } = await supabase
      .from('church_leaders')
      .select('id')
      .eq('email', demoEmail)
      .eq('church_id', churchId)
      .maybeSingle();

    if (!existingCL) {
      await supabase.from('church_leaders').insert({
        email: demoEmail,
        name: 'Demo Leader',
        church_id: churchId,
        user_id: userId,
      });
    }

    // ── 5. Upsert dna_leaders row ──────────────────────────────────────────
    const { data: dnaLeader, error: leaderError } = await supabase
      .from('dna_leaders')
      .upsert(
        {
          email: demoEmail,
          name: 'Demo Leader',
          church_id: churchId,
          user_id: userId,
          is_active: true,
          activated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select('id')
      .single();

    if (leaderError || !dnaLeader) {
      console.error('[HUB SEED] dna_leaders upsert error:', leaderError);
      return NextResponse.json({ error: 'Failed to upsert dna_leaders row' }, { status: 500 });
    }

    const demoLeaderId = dnaLeader.id as string;

    // ── 6. Seed groups + disciples ─────────────────────────────────────────
    const createdGroupIds: string[] = [];
    const now = new Date();

    for (const groupDef of GROUPS) {
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - groupDef.startDaysAgo);
      const startDateStr = startDate.toISOString().split('T')[0];

      // Find or create group by (leader_id, group_name)
      const { data: existingGroup } = await supabase
        .from('dna_groups')
        .select('id')
        .eq('leader_id', demoLeaderId)
        .eq('group_name', groupDef.name)
        .maybeSingle();

      let groupId: string;

      if (existingGroup) {
        groupId = existingGroup.id as string;
        await supabase
          .from('dna_groups')
          .update({
            current_phase: groupDef.phase,
            start_date: startDateStr,
            is_active: true,
          })
          .eq('id', groupId);
      } else {
        const { data: newGroup, error: groupError } = await supabase
          .from('dna_groups')
          .insert({
            group_name: groupDef.name,
            leader_id: demoLeaderId,
            church_id: churchId,
            current_phase: groupDef.phase,
            start_date: startDateStr,
            is_active: true,
          })
          .select('id')
          .single();

        if (groupError || !newGroup) {
          console.error('[HUB SEED] Group creation error:', groupError);
          continue;
        }
        groupId = newGroup.id as string;
      }

      createdGroupIds.push(groupId);

      // Upsert disciples + group_disciples for this group
      for (const discDef of groupDef.disciples) {
        const discEmail = `demo-${discDef.key}-${subdomain}@dna.demo`;

        const { data: disciple } = await supabase
          .from('disciples')
          .upsert(
            { email: discEmail, name: discDef.name },
            { onConflict: 'email', ignoreDuplicates: false }
          )
          .select('id')
          .single();

        if (disciple?.id) {
          await supabase
            .from('group_disciples')
            .upsert(
              {
                group_id: groupId,
                disciple_id: disciple.id,
                joined_date: startDateStr,
                current_status: 'active',
              },
              { onConflict: 'group_id,disciple_id' }
            );
        }
      }
    }

    // ── 7. Seed cohort posts ───────────────────────────────────────────────
    // Find the active cohort for this church (auto-created when dna_leaders was inserted)
    const { data: cohort } = await supabase
      .from('dna_cohorts')
      .select('id')
      .eq('church_id', churchId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let seededPosts = 0;
    if (cohort?.id) {
      // Delete existing demo posts by this author
      await supabase
        .from('dna_cohort_posts')
        .delete()
        .eq('author_id', demoLeaderId);

      const postRows = COHORT_POSTS.map((p) => ({
        cohort_id: cohort.id,
        author_id: demoLeaderId,
        post_type: p.post_type,
        author_role: 'trainer' as const,
        title: p.title,
        body: p.body,
        pinned: p.pinned,
        created_at: new Date(Date.now() - p.daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      }));

      const { error: postError } = await supabase
        .from('dna_cohort_posts')
        .insert(postRows);

      if (postError) {
        console.error('[HUB SEED] Cohort posts error:', postError);
        // Non-fatal
      } else {
        seededPosts = postRows.length;
      }
    }

    // ── 8. Seed calendar events (one per group) ────────────────────────────
    // Delete any existing events tied to our demo groups
    if (createdGroupIds.length > 0) {
      await supabase
        .from('dna_calendar_events')
        .delete()
        .in('group_id', createdGroupIds);
    }

    const eventRows = GROUPS.map((groupDef, i) => {
      const groupId = createdGroupIds[i];
      if (!groupId) return null;
      const start = nextWeekday(groupDef.eventDay, 0);
      const end = new Date(start.getTime() + 90 * 60 * 1000);
      return {
        title: `${groupDef.name} Meeting`,
        description: `Weekly DNA Life Group meeting — ${groupDef.phase === 'growth' ? 'Growth' : 'Foundation'} phase.`,
        location: groupDef.location,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        event_type: 'church_event' as const,
        church_id: churchId,
        group_id: groupId,
        cohort_id: null,
        is_recurring: false,
        created_by: null,
      };
    }).filter(Boolean);

    if (eventRows.length > 0) {
      const { error: eventError } = await supabase
        .from('dna_calendar_events')
        .insert(eventRows);

      if (eventError) {
        console.error('[HUB SEED] Calendar events error:', eventError);
        // Non-fatal
      }
    }

    // ── 9. Update church_demo_settings ─────────────────────────────────────
    await supabase
      .from('church_demo_settings')
      .upsert(
        {
          church_id: churchId,
          hub_demo_leader_id: authUserId,
          hub_demo_seeded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'church_id' }
      );

    return NextResponse.json({
      success: true,
      seeded: {
        hub_auth_user_id: authUserId,
        demo_email: demoEmail,
        dna_leader_id: demoLeaderId,
        groups: createdGroupIds.length,
        disciples: GROUPS.reduce((sum, g) => sum + g.disciples.length, 0),
        cohort_posts: seededPosts,
        calendar_events: eventRows.length,
      },
    });
  } catch (error) {
    console.error('[HUB SEED] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
