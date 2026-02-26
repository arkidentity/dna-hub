import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

/**
 * POST /api/admin/demo/[churchId]/seed
 * Seeds a full demo experience for a church's demo page.
 *
 * Creates / updates:
 *   1. Supabase Auth user   (demo-{subdomain}@dna.demo)
 *   2. disciples record
 *   3. disciple_app_accounts record  (id = auth user id)
 *   4. dna_groups + group_disciples  (only if a dna_leader exists for church)
 *   5. disciple_checkpoint_completions  (8 checkpoints, months 1–2)
 *   6. disciple_journal_entries         (5 entries, realistic Head/Heart/Hands)
 *   7. disciple_prayer_cards            (4 active + 1 answered)
 *   8. dna_calendar_events              (2 upcoming Thursdays)
 *
 * Idempotent: re-running re-seeds without duplicating data.
 */
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

    // ── 1. Verify church exists + get subdomain ─────────────────────────────
    const { data: church } = await supabase
      .from('churches')
      .select('id, name, subdomain')
      .eq('id', churchId)
      .single();

    if (!church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    const subdomain = church.subdomain as string;
    const demoEmail = `demo-${subdomain}@dna.demo`;
    // Deterministic password — used by app-session to sign in without magic links
    const demoPassword = `dna-demo-${subdomain}-session`;

    // ── 2. Get or create the demo Auth user ────────────────────────────────
    // Check if we already have a stored demo_user_id
    const { data: existingSettings } = await supabase
      .from('church_demo_settings')
      .select('demo_user_id')
      .eq('church_id', churchId)
      .single();

    let authUserId: string | null = existingSettings?.demo_user_id ?? null;

    if (!authUserId) {
      // Try to create a new auth user with a known password so app-session
      // can sign in via signInWithPassword (no magic link URL allowlist needed)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: demoEmail,
        password: demoPassword,
        email_confirm: true,
        user_metadata: {
          is_demo: true,
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
        // User already exists in auth — find via listUsers
        const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const existing = listData?.users?.find((u) => u.email === demoEmail);
        if (existing) {
          authUserId = existing.id;
        } else {
          console.error('[DEMO] Could not find existing auth user after conflict:', authError);
          return NextResponse.json({ error: 'Auth user conflict, could not resolve' }, { status: 500 });
        }
      } else if (authError) {
        console.error('[DEMO] Auth user creation error:', authError);
        return NextResponse.json({ error: 'Failed to create demo auth user' }, { status: 500 });
      }
    }

    if (!authUserId) {
      return NextResponse.json({ error: 'Could not obtain demo auth user ID' }, { status: 500 });
    }

    // Always ensure the demo password is set — covers re-seeds and users
    // created before this password field was added
    await supabase.auth.admin.updateUserById(authUserId, { password: demoPassword });

    // ── 3. Upsert disciples record ─────────────────────────────────────────
    const { data: disciple, error: discipleError } = await supabase
      .from('disciples')
      .upsert(
        {
          email: demoEmail,
          name: 'Demo Disciple',
        },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    if (discipleError || !disciple) {
      console.error('[DEMO] Disciples upsert error:', discipleError);
      return NextResponse.json({ error: 'Failed to upsert disciple record' }, { status: 500 });
    }

    const discipleId = disciple.id as string;

    // ── 4. Upsert disciple_app_accounts ────────────────────────────────────
    // id must equal the auth user id (it's a FK to auth.users)
    const { error: accountError } = await supabase
      .from('disciple_app_accounts')
      .upsert(
        {
          id: authUserId,
          disciple_id: discipleId,
          email: demoEmail,
          display_name: 'Demo Disciple',
          church_id: churchId,
          church_subdomain: subdomain,
          email_verified: true,
          is_active: true,
          auth_provider: 'email',
          role: 'dna_leader', // unlocks all pathway months + bypasses group gate
        },
        { onConflict: 'id' }
      );

    if (accountError) {
      console.error('[DEMO] disciple_app_accounts upsert error:', accountError);
      return NextResponse.json({ error: 'Failed to upsert app account' }, { status: 500 });
    }

    // ── 5. Conditional group + group_disciples ─────────────────────────────
    const { data: leader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('church_id', churchId)
      .limit(1)
      .single();

    let seededGroup = false;
    if (leader) {
      // Calculate start_date: 21 days ago
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 21);
      const startDateStr = startDate.toISOString().split('T')[0];

      // Upsert group: find by name prefix for idempotency
      const { data: existingGroup } = await supabase
        .from('dna_groups')
        .select('id')
        .eq('church_id', churchId)
        .ilike('group_name', '[DEMO]%')
        .limit(1)
        .single();

      let groupId: string;

      if (existingGroup) {
        groupId = existingGroup.id as string;
        // Update fields in case they changed
        await supabase
          .from('dna_groups')
          .update({
            leader_id: leader.id,
            current_phase: 'foundation',
            start_date: startDateStr,
          })
          .eq('id', groupId);
      } else {
        const { data: newGroup, error: groupError } = await supabase
          .from('dna_groups')
          .insert({
            group_name: '[DEMO] Life Group Alpha',
            leader_id: leader.id,
            church_id: churchId,
            current_phase: 'foundation',
            start_date: startDateStr,
            is_active: true,
          })
          .select('id')
          .single();

        if (groupError || !newGroup) {
          console.error('[DEMO] Group creation error:', groupError);
          // Non-fatal — continue with other seed steps
          groupId = '';
        } else {
          groupId = newGroup.id as string;
        }
      }

      if (groupId) {
        // Upsert group_disciples
        await supabase
          .from('group_disciples')
          .upsert(
            {
              group_id: groupId,
              disciple_id: discipleId,
              joined_date: startDateStr,
              current_status: 'active',
            },
            { onConflict: 'group_id,disciple_id' }
          );
        seededGroup = true;
      }
    }

    // ── 6. Seed checkpoint completions ─────────────────────────────────────
    // Delete existing demo checkpoints first (idempotent)
    await supabase
      .from('disciple_checkpoint_completions')
      .delete()
      .eq('account_id', authUserId);

    const checkpoints = [
      { checkpoint_key: 'w1-life-assessment', week_number: 1 },
      { checkpoint_key: 'w2-journal-entry', week_number: 2 },
      { checkpoint_key: 'w2-challenge-started', week_number: 2 },
      { checkpoint_key: 'w3-prayer-card', week_number: 3 },
      { checkpoint_key: 'w3-prayer-session', week_number: 3 },
      { checkpoint_key: 'w4-creed-reviewed', week_number: 4 },
      { checkpoint_key: 'w5-qa-deep-dive', week_number: 5 },
      { checkpoint_key: 'w6-listening-prayer', week_number: 6 },
    ];

    const now = new Date();
    const checkpointRows = checkpoints.map((c, i) => ({
      account_id: authUserId,
      checkpoint_key: c.checkpoint_key,
      week_number: c.week_number,
      completed_at: new Date(now.getTime() - (checkpoints.length - i) * 3 * 24 * 60 * 60 * 1000).toISOString(),
      marked_by: 'self',
    }));

    const { error: checkpointError } = await supabase
      .from('disciple_checkpoint_completions')
      .insert(checkpointRows);

    if (checkpointError) {
      console.error('[DEMO] Checkpoint seed error:', checkpointError);
      // Non-fatal
    }

    // ── 7. Seed journal entries ────────────────────────────────────────────
    await supabase
      .from('disciple_journal_entries')
      .delete()
      .eq('account_id', authUserId);

    const journalEntries = [
      {
        account_id: authUserId,
        local_id: `demo-j1-${authUserId}`,
        scripture: 'John 15:5',
        scripture_passage: 'I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing.',
        head: 'Jesus describes himself as the vine and his followers as branches. Apart from him, we have no source of life or fruitfulness. This is a call to abide — not strive.',
        heart: 'I realize I often try to produce fruit through effort rather than connection. This verse convicts me of my self-reliance and draws me back to dependence.',
        hands: 'I will spend 10 minutes in stillness before starting my day — not asking, just abiding. I want to practice presence before activity.',
      },
      {
        account_id: authUserId,
        local_id: `demo-j2-${authUserId}`,
        scripture: 'Romans 12:2',
        scripture_passage: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God\'s will is—his good, pleasing and perfect will.',
        head: 'Transformation starts in the mind, not behavior. The world shapes our thinking through culture, media, and repetition. God reshapes it through His Word and Spirit.',
        heart: 'I feel the tension between fitting in and being transformed. This verse gives me permission to think differently — and calls me to it.',
        hands: 'I\'ll replace 30 minutes of social media this week with Scripture reading. I want my mind to be more shaped by truth than by noise.',
      },
      {
        account_id: authUserId,
        local_id: `demo-j3-${authUserId}`,
        scripture: 'Psalm 23:1',
        scripture_passage: 'The Lord is my shepherd, I lack nothing.',
        head: 'David\'s declaration of trust. The shepherd metaphor implies total care — provision, direction, protection. Lack nothing — not just physical needs but deep contentment.',
        heart: 'I worry more than I trust. This verse reminds me that scarcity is often a mindset, not a reality, when I\'m walking with the Shepherd.',
        hands: 'I\'ll write down 3 ways God has provided for me this week and thank Him specifically for each one before bed tonight.',
      },
      {
        account_id: authUserId,
        local_id: `demo-j4-${authUserId}`,
        scripture: 'Matthew 28:19',
        scripture_passage: 'Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.',
        head: 'The Great Commission is active — go, make, baptize, teach. Discipleship is not an optional ministry program; it is the mission of the church.',
        heart: 'Being in this DNA group has shown me that discipleship is relational, not just informational. I want to be someone who multiplies, not just grows.',
        hands: 'I\'ll pray for one person in my life who needs discipleship and take a step toward intentional relationship with them this week.',
      },
      {
        account_id: authUserId,
        local_id: `demo-j5-${authUserId}`,
        scripture: 'Philippians 4:13',
        scripture_passage: 'I can do all this through him who gives me strength.',
        head: 'Paul wrote this from prison. "All this" refers to contentment in every circumstance — not superhuman achievement. The strength is Christ\'s, not Paul\'s.',
        heart: 'I\'ve used this verse to mean "I can accomplish anything I want." But the real meaning is peace and contentment in hard seasons — which I need more than I knew.',
        hands: 'I\'ll memorize this verse in context (v. 11–13) so I understand what "all this" actually means and can apply it truthfully.',
      },
    ];

    const { error: journalError } = await supabase
      .from('disciple_journal_entries')
      .insert(journalEntries);

    if (journalError) {
      console.error('[DEMO] Journal seed error:', journalError);
      // Non-fatal
    }

    // ── 8. Seed prayer cards ───────────────────────────────────────────────
    await supabase
      .from('disciple_prayer_cards')
      .delete()
      .eq('account_id', authUserId);

    const prayerCards = [
      {
        account_id: authUserId,
        local_id: `demo-p1-${authUserId}`,
        title: 'Wisdom for a big decision',
        details: "I'm facing a major crossroads with my job. I need clarity and peace about which path honors God and serves my family well.",
        scripture: 'James 1:5',
        status: 'active',
        prayer_count: 12,
      },
      {
        account_id: authUserId,
        local_id: `demo-p2-${authUserId}`,
        title: 'My neighbor Marcus',
        details: "Marcus lost his father this year and has drifted from faith. Praying for an opportunity to be present and share hope with him.",
        scripture: '2 Corinthians 1:3-4',
        status: 'active',
        prayer_count: 8,
      },
      {
        account_id: authUserId,
        local_id: `demo-p3-${authUserId}`,
        title: 'Our church\'s new season',
        details: 'Praying for our leadership team as we step into DNA Discipleship. That God would multiply us and that every group would bear real fruit.',
        scripture: 'John 15:8',
        status: 'active',
        prayer_count: 15,
      },
      {
        account_id: authUserId,
        local_id: `demo-p4-${authUserId}`,
        title: 'My consistency in the Word',
        details: "I struggle to be in Scripture daily. Asking God to build a genuine hunger in me — not just discipline, but delight.",
        status: 'active',
        prayer_count: 6,
      },
      {
        account_id: authUserId,
        local_id: `demo-p5-${authUserId}`,
        title: 'Healing for my mom',
        details: 'Prayed for months. God answered — her diagnosis came back clear. He is faithful.',
        status: 'answered',
        date_answered: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        testimony: 'I cried when I got the news. God heard every prayer. This is going in my testimony forever.',
        prayer_count: 32,
      },
    ];

    const { error: prayerError } = await supabase
      .from('disciple_prayer_cards')
      .insert(prayerCards);

    if (prayerError) {
      console.error('[DEMO] Prayer card seed error:', prayerError);
      // Non-fatal
    }

    // ── 9. Seed calendar events ────────────────────────────────────────────
    await supabase
      .from('dna_calendar_events')
      .delete()
      .eq('church_id', churchId)
      .ilike('title', '[DEMO]%');

    const getNextThursday = (offset: number): Date => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilThursday = ((4 - dayOfWeek + 7) % 7) || 7;
      const next = new Date(now);
      next.setDate(now.getDate() + daysUntilThursday + offset * 7);
      next.setHours(19, 0, 0, 0);
      return next;
    };

    const event1Start = getNextThursday(0);
    const event1End = new Date(event1Start.getTime() + 90 * 60 * 1000);
    const event2Start = getNextThursday(1);
    const event2End = new Date(event2Start.getTime() + 90 * 60 * 1000);

    await supabase.from('dna_calendar_events').insert([
      {
        title: '[DEMO] Life Group Meeting',
        description: 'Weekly DNA Life Group — Phase 1, Week 3. Bring your journal!',
        location: 'Church Fellowship Hall',
        start_time: event1Start.toISOString(),
        end_time: event1End.toISOString(),
        event_type: 'church_event' as const,
        church_id: churchId,
        group_id: null,
        cohort_id: null,
        is_recurring: false,
        created_by: null,
      },
      {
        title: '[DEMO] Leader Check-in',
        description: 'Monthly DNA leader alignment and prayer. All group leaders welcome.',
        location: "Pastor's Office",
        start_time: event2Start.toISOString(),
        end_time: event2End.toISOString(),
        event_type: 'church_event' as const,
        church_id: churchId,
        group_id: null,
        cohort_id: null,
        is_recurring: false,
        created_by: null,
      },
    ]);

    // ── 10. Seed free-tier demo user (no group, role=disciple) ─────────────
    // This powers the first "locked" iframe on the demo landing page.
    const demoFreeEmail = `demo-free-${subdomain}@dna.demo`;
    const demoFreePassword = `dna-demo-free-${subdomain}-session`;

    const { data: existingFreeSettings } = await supabase
      .from('church_demo_settings')
      .select('demo_free_user_id')
      .eq('church_id', churchId)
      .single();

    let freeAuthUserId: string | null = existingFreeSettings?.demo_free_user_id ?? null;

    if (!freeAuthUserId) {
      const { data: freeAuthData, error: freeAuthError } = await supabase.auth.admin.createUser({
        email: demoFreeEmail,
        password: demoFreePassword,
        email_confirm: true,
        user_metadata: {
          is_demo: true,
          demo_tier: 'free',
          church_id: churchId,
          church_subdomain: subdomain,
        },
      });

      if (freeAuthData?.user) {
        freeAuthUserId = freeAuthData.user.id;
      } else if (
        freeAuthError?.message?.toLowerCase().includes('already been registered') ||
        freeAuthError?.message?.toLowerCase().includes('already registered') ||
        freeAuthError?.code === 'email_exists' ||
        freeAuthError?.status === 422
      ) {
        const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const existingFree = listData?.users?.find((u) => u.email === demoFreeEmail);
        if (existingFree) freeAuthUserId = existingFree.id;
      } else if (freeAuthError) {
        console.error('[DEMO] Free-tier auth user creation error:', freeAuthError);
        // Non-fatal — continue without free tier
      }
    }

    if (freeAuthUserId) {
      // Ensure password is always current
      await supabase.auth.admin.updateUserById(freeAuthUserId, { password: demoFreePassword });

      // Upsert disciples record for free user
      const { data: freeDisciple } = await supabase
        .from('disciples')
        .upsert(
          { email: demoFreeEmail, name: 'Demo Disciple' },
          { onConflict: 'email', ignoreDuplicates: false }
        )
        .select('id')
        .single();

      if (freeDisciple) {
        // disciple_app_accounts: role='disciple' — no leader shortcut, no group
        await supabase
          .from('disciple_app_accounts')
          .upsert(
            {
              id: freeAuthUserId,
              disciple_id: freeDisciple.id,
              email: demoFreeEmail,
              display_name: 'Demo Disciple',
              church_id: churchId,
              church_subdomain: subdomain,
              email_verified: true,
              is_active: true,
              auth_provider: 'email',
              role: 'disciple', // NOT a leader — will hit the group gate
            },
            { onConflict: 'id' }
          );
        // Intentionally NO group_disciples row — this is the "not yet in a group" state
      }
    }

    // ── 11. Update church_demo_settings ────────────────────────────────────
    await supabase
      .from('church_demo_settings')
      .upsert(
        {
          church_id: churchId,
          demo_user_id: authUserId,
          demo_free_user_id: freeAuthUserId,
          demo_seeded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'church_id' }
      );

    return NextResponse.json({
      success: true,
      seeded: {
        auth_user_id: authUserId,
        demo_email: demoEmail,
        free_auth_user_id: freeAuthUserId,
        demo_free_email: demoFreeEmail,
        disciple_id: discipleId,
        group: seededGroup,
        checkpoints: checkpointRows.length,
        journal_entries: journalEntries.length,
        prayer_cards: prayerCards.length,
        calendar_events: 2,
      },
    });
  } catch (error) {
    console.error('[DEMO] Seed POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
