import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

/**
 * POST /api/admin/demo/global-seed
 * Admin-only. Run once (idempotent — safe to re-run).
 *
 * Creates the single shared global demo account used by ALL church demo
 * iframes. Eliminates per-church auth user + group/disciple pollution.
 *
 * Creates / updates:
 *   1. Supabase Auth user   (demo-global@dna.demo)
 *   2. disciples record     (email = demo-global@dna.demo)
 *   3. disciple_app_accounts (role = dna_leader, no church_id)
 *   4. disciple_checkpoint_completions  (8 checkpoints — weeks 1–6)
 *   5. disciple_journal_entries         (5 entries, Head/Heart/Hands)
 *   6. disciple_prayer_cards            (4 active + 1 answered)
 *   7. Demo leader auth user + records  (demo-leader@dna.demo / "Sarah Mitchell")
 *   8. dna_leaders record               (for group FK)
 *   9. dna_groups                       (Life Group Alpha, foundation phase)
 *  10. group_disciples                  (demo-global + leader as members)
 *  11. group_messages                   (8 realistic chat messages)
 *  12. group_message_reads              (partial unread for demo user)
 *  13. dna_calendar_events              (4 upcoming group meetings)
 *
 * Church branding in the iframe comes from the Daily DNA URL subdomain
 * (e.g. grace-church.dailydna.app), not from this account.
 */
export async function POST() {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const supabase = getSupabaseAdmin();

    const demoEmail = process.env.DEMO_GLOBAL_EMAIL ?? 'demo-global@dna.demo';
    const demoPassword = process.env.DEMO_GLOBAL_PASSWORD ?? 'dna-demo-global-session';

    // ── 1. Get or create the global Auth user ──────────────────────────────
    let authUserId: string | null = null;

    // Try creating — if already exists, find via listUsers
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        is_demo: true,
        demo_scope: 'global',
        display_name: 'Demo Disciple',
      },
    });

    if (authData?.user) {
      authUserId = authData.user.id;
      console.log('[GLOBAL-SEED] Created global auth user:', authUserId);
    } else if (
      authError?.message?.toLowerCase().includes('already been registered') ||
      authError?.message?.toLowerCase().includes('already registered') ||
      authError?.code === 'email_exists' ||
      authError?.status === 422
    ) {
      // Already exists — find it
      const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const existing = listData?.users?.find((u) => u.email === demoEmail);
      if (existing) {
        authUserId = existing.id;
        console.log('[GLOBAL-SEED] Found existing global auth user:', authUserId);
      } else {
        console.error('[GLOBAL-SEED] Could not find existing global auth user after conflict');
        return NextResponse.json({ error: 'Auth user conflict, could not resolve' }, { status: 500 });
      }
    } else if (authError) {
      console.error('[GLOBAL-SEED] Auth user creation error:', authError);
      return NextResponse.json({ error: 'Failed to create global demo auth user' }, { status: 500 });
    }

    if (!authUserId) {
      return NextResponse.json({ error: 'Could not obtain global auth user ID' }, { status: 500 });
    }

    // Always ensure the password is current (covers re-seeds)
    await supabase.auth.admin.updateUserById(authUserId, { password: demoPassword });

    // ── 2. Upsert disciples record ─────────────────────────────────────────
    const { data: disciple, error: discipleError } = await supabase
      .from('disciples')
      .upsert(
        { email: demoEmail, name: 'Demo Disciple' },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    if (discipleError || !disciple) {
      console.error('[GLOBAL-SEED] disciples upsert error:', discipleError);
      return NextResponse.json({ error: 'Failed to upsert disciple record' }, { status: 500 });
    }

    const discipleId = disciple.id as string;

    // ── 3. Upsert disciple_app_accounts ────────────────────────────────────
    // No church_id — this account is shared across all churches.
    // Role = dna_leader: bypasses the group gate, shows full pathway.
    const { error: accountError } = await supabase
      .from('disciple_app_accounts')
      .upsert(
        {
          id: authUserId,
          disciple_id: discipleId,
          email: demoEmail,
          display_name: 'Demo Disciple',
          church_id: null,
          church_subdomain: null,
          email_verified: true,
          is_active: true,
          auth_provider: 'email',
          role: 'dna_leader', // unlocks all pathway months + bypasses group gate
        },
        { onConflict: 'id' }
      );

    if (accountError) {
      console.error('[GLOBAL-SEED] disciple_app_accounts upsert error:', accountError);
      return NextResponse.json({ error: 'Failed to upsert app account' }, { status: 500 });
    }

    // ── 4. Seed checkpoint completions ─────────────────────────────────────
    // Delete then re-insert for idempotency
    await supabase
      .from('disciple_checkpoint_completions')
      .delete()
      .eq('account_id', authUserId);

    const checkpoints = [
      { checkpoint_key: 'w1-life-assessment',  week_number: 1 },
      { checkpoint_key: 'w2-journal-entry',    week_number: 2 },
      { checkpoint_key: 'w2-challenge-started',week_number: 2 },
      { checkpoint_key: 'w3-prayer-card',      week_number: 3 },
      { checkpoint_key: 'w3-prayer-session',   week_number: 3 },
      { checkpoint_key: 'w4-creed-reviewed',   week_number: 4 },
      { checkpoint_key: 'w5-qa-deep-dive',     week_number: 5 },
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
      console.error('[GLOBAL-SEED] Checkpoint seed error:', checkpointError);
      // Non-fatal — continue
    }

    // ── 5. Seed journal entries ────────────────────────────────────────────
    await supabase
      .from('disciple_journal_entries')
      .delete()
      .eq('account_id', authUserId);

    const journalEntries = [
      {
        account_id: authUserId,
        local_id: `demo-j1-global`,
        scripture: 'John 15:5',
        scripture_passage: 'I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing.',
        head: 'Jesus describes himself as the vine and his followers as branches. Apart from him, we have no source of life or fruitfulness. This is a call to abide — not strive.',
        heart: 'I realize I often try to produce fruit through effort rather than connection. This verse convicts me of my self-reliance and draws me back to dependence.',
        hands: 'I will spend 10 minutes in stillness before starting my day — not asking, just abiding. I want to practice presence before activity.',
      },
      {
        account_id: authUserId,
        local_id: `demo-j2-global`,
        scripture: 'Romans 12:2',
        scripture_passage: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God\'s will is—his good, pleasing and perfect will.',
        head: 'Transformation starts in the mind, not behavior. The world shapes our thinking through culture, media, and repetition. God reshapes it through His Word and Spirit.',
        heart: 'I feel the tension between fitting in and being transformed. This verse gives me permission to think differently — and calls me to it.',
        hands: 'I\'ll replace 30 minutes of social media this week with Scripture reading. I want my mind to be more shaped by truth than by noise.',
      },
      {
        account_id: authUserId,
        local_id: `demo-j3-global`,
        scripture: 'Psalm 23:1',
        scripture_passage: 'The Lord is my shepherd, I lack nothing.',
        head: 'David\'s declaration of trust. The shepherd metaphor implies total care — provision, direction, protection. Lack nothing — not just physical needs but deep contentment.',
        heart: 'I worry more than I trust. This verse reminds me that scarcity is often a mindset, not a reality, when I\'m walking with the Shepherd.',
        hands: 'I\'ll write down 3 ways God has provided for me this week and thank Him specifically for each one before bed tonight.',
      },
      {
        account_id: authUserId,
        local_id: `demo-j4-global`,
        scripture: 'Matthew 28:19',
        scripture_passage: 'Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.',
        head: 'The Great Commission is active — go, make, baptize, teach. Discipleship is not an optional ministry program; it is the mission of the church.',
        heart: 'Being in this DNA group has shown me that discipleship is relational, not just informational. I want to be someone who multiplies, not just grows.',
        hands: 'I\'ll pray for one person in my life who needs discipleship and take a step toward intentional relationship with them this week.',
      },
      {
        account_id: authUserId,
        local_id: `demo-j5-global`,
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
      console.error('[GLOBAL-SEED] Journal seed error:', journalError);
      // Non-fatal
    }

    // ── 6. Seed prayer cards ───────────────────────────────────────────────
    await supabase
      .from('disciple_prayer_cards')
      .delete()
      .eq('account_id', authUserId);

    const prayerCards = [
      {
        account_id: authUserId,
        local_id: `demo-p1-global`,
        title: 'Wisdom for a big decision',
        details: "I'm facing a major crossroads with my job. I need clarity and peace about which path honors God and serves my family well.",
        scripture: 'James 1:5',
        status: 'active',
        prayer_count: 12,
      },
      {
        account_id: authUserId,
        local_id: `demo-p2-global`,
        title: 'My neighbor Marcus',
        details: "Marcus lost his father this year and has drifted from faith. Praying for an opportunity to be present and share hope with him.",
        scripture: '2 Corinthians 1:3-4',
        status: 'active',
        prayer_count: 8,
      },
      {
        account_id: authUserId,
        local_id: `demo-p3-global`,
        title: "Our church's new season",
        details: 'Praying for our leadership team as we step into DNA Discipleship. That God would multiply us and that every group would bear real fruit.',
        scripture: 'John 15:8',
        status: 'active',
        prayer_count: 15,
      },
      {
        account_id: authUserId,
        local_id: `demo-p4-global`,
        title: 'My consistency in the Word',
        details: "I struggle to be in Scripture daily. Asking God to build a genuine hunger in me — not just discipline, but delight.",
        status: 'active',
        prayer_count: 6,
      },
      {
        account_id: authUserId,
        local_id: `demo-p5-global`,
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
      console.error('[GLOBAL-SEED] Prayer card seed error:', prayerError);
      // Non-fatal
    }

    // ── 7. Create demo leader auth user (demo-leader@dna.demo) ─────────────
    const leaderEmail = 'demo-leader@dna.demo';
    const leaderPassword = 'dna-demo-leader-session';
    let leaderAuthUserId: string | null = null;

    const { data: leaderAuthData, error: leaderAuthError } = await supabase.auth.admin.createUser({
      email: leaderEmail,
      password: leaderPassword,
      email_confirm: true,
      user_metadata: {
        is_demo: true,
        demo_scope: 'global-leader',
        display_name: 'Sarah Mitchell',
      },
    });

    if (leaderAuthData?.user) {
      leaderAuthUserId = leaderAuthData.user.id;
      console.log('[GLOBAL-SEED] Created leader auth user:', leaderAuthUserId);
    } else if (
      leaderAuthError?.message?.toLowerCase().includes('already been registered') ||
      leaderAuthError?.message?.toLowerCase().includes('already registered') ||
      leaderAuthError?.code === 'email_exists' ||
      leaderAuthError?.status === 422
    ) {
      const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const existing = listData?.users?.find((u) => u.email === leaderEmail);
      if (existing) {
        leaderAuthUserId = existing.id;
        console.log('[GLOBAL-SEED] Found existing leader auth user:', leaderAuthUserId);
      }
    }

    if (!leaderAuthUserId) {
      console.error('[GLOBAL-SEED] Could not obtain leader auth user ID');
      return NextResponse.json({ error: 'Failed to create leader auth user' }, { status: 500 });
    }

    await supabase.auth.admin.updateUserById(leaderAuthUserId, { password: leaderPassword });

    // ── 8. Upsert leader's disciples + disciple_app_accounts ─────────────
    const { data: leaderDisciple } = await supabase
      .from('disciples')
      .upsert(
        { email: leaderEmail, name: 'Sarah Mitchell' },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    const leaderDiscipleId = leaderDisciple?.id as string;

    await supabase
      .from('disciple_app_accounts')
      .upsert(
        {
          id: leaderAuthUserId,
          disciple_id: leaderDiscipleId,
          email: leaderEmail,
          display_name: 'Sarah Mitchell',
          church_id: null,
          church_subdomain: null,
          email_verified: true,
          is_active: true,
          auth_provider: 'email',
          role: 'dna_leader',
        },
        { onConflict: 'id' }
      );

    // ── 9. Upsert dna_leaders record ─────────────────────────────────────
    const { data: dnaLeader } = await supabase
      .from('dna_leaders')
      .upsert(
        {
          email: leaderEmail,
          name: 'Sarah Mitchell',
          church_id: null,
          is_active: true,
        },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    if (!dnaLeader) {
      console.error('[GLOBAL-SEED] Could not upsert dna_leaders record');
      return NextResponse.json({ error: 'Failed to upsert dna_leaders' }, { status: 500 });
    }

    const dnaLeaderId = dnaLeader.id as string;

    // ── 10. Upsert dna_groups (Life Group Alpha) ─────────────────────────
    const groupStartDate = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
    const groupStartStr = groupStartDate.toISOString().split('T')[0];

    // Query first — no unique constraint on (leader_id, group_name)
    let demoGroupId: string;
    const { data: existingGroup } = await supabase
      .from('dna_groups')
      .select('id')
      .eq('leader_id', dnaLeaderId)
      .eq('group_name', 'Life Group Alpha')
      .maybeSingle();

    if (existingGroup) {
      demoGroupId = existingGroup.id as string;
      // Update to ensure current values
      await supabase
        .from('dna_groups')
        .update({ current_phase: 'foundation', start_date: groupStartStr, is_active: true })
        .eq('id', demoGroupId);
      console.log('[GLOBAL-SEED] Updated existing group:', demoGroupId);
    } else {
      const { data: newGroup, error: groupError } = await supabase
        .from('dna_groups')
        .insert({
          group_name: 'Life Group Alpha',
          leader_id: dnaLeaderId,
          church_id: null,
          current_phase: 'foundation',
          start_date: groupStartStr,
          is_active: true,
        })
        .select('id')
        .single();

      if (groupError || !newGroup) {
        console.error('[GLOBAL-SEED] Group creation error:', groupError);
        return NextResponse.json({ error: 'Failed to create demo group' }, { status: 500 });
      }
      demoGroupId = newGroup.id as string;
      console.log('[GLOBAL-SEED] Created new group:', demoGroupId);
    }

    // ── 11. Upsert group_disciples (demo user + leader) ──────────────────
    const memberJoinDate = new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await supabase.from('group_disciples').upsert(
      [
        { group_id: demoGroupId, disciple_id: discipleId, joined_date: memberJoinDate, current_status: 'active' },
        { group_id: demoGroupId, disciple_id: leaderDiscipleId, joined_date: groupStartStr, current_status: 'active' },
      ],
      { onConflict: 'group_id,disciple_id', ignoreDuplicates: false }
    );

    // ── 12. Seed group_messages (delete + re-insert) ─────────────────────
    await supabase.from('group_messages').delete().eq('group_id', demoGroupId);

    const msgBase = now.getTime();
    const DAY = 24 * 60 * 60 * 1000;

    const demoMessages = [
      {
        group_id: demoGroupId,
        sender_account_id: leaderAuthUserId,
        sender_name: 'Sarah Mitchell',
        content: 'Welcome to Life Group Alpha! Excited to walk through the Foundation phase together. Let me know if you have any questions as we get started.',
        message_type: 'text',
        created_at: new Date(msgBase - 10 * DAY).toISOString(),
      },
      {
        group_id: demoGroupId,
        sender_account_id: authUserId,
        sender_name: 'Demo Disciple',
        content: 'Thank you, Sarah! I just finished the Week 1 life assessment. Really eye-opening.',
        message_type: 'text',
        created_at: new Date(msgBase - 9 * DAY).toISOString(),
      },
      {
        group_id: demoGroupId,
        sender_account_id: leaderAuthUserId,
        sender_name: 'Sarah Mitchell',
        content: "That's great to hear! What stood out to you most?",
        message_type: 'text',
        created_at: new Date(msgBase - 9 * DAY + 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        group_id: demoGroupId,
        sender_account_id: authUserId,
        sender_name: 'Demo Disciple',
        content: "Honestly, how low I scored on Scripture engagement. I want to grow there.",
        message_type: 'text',
        created_at: new Date(msgBase - 8 * DAY).toISOString(),
      },
      {
        group_id: demoGroupId,
        sender_account_id: leaderAuthUserId,
        sender_name: 'Sarah Mitchell',
        content: "That's actually where the 3D Journal comes in. Try journaling through John 15 this week — Head, Heart, and Hands.",
        message_type: 'text',
        created_at: new Date(msgBase - 8 * DAY + 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        group_id: demoGroupId,
        sender_account_id: authUserId,
        sender_name: 'Demo Disciple',
        content: null,
        message_type: 'shared_journal',
        shared_content: {
          type: 'journal',
          title: 'John 15:5',
          preview: 'Jesus describes himself as the vine and his followers as branches. Apart from him, we have no source of life or fruitfulness.',
        },
        created_at: new Date(msgBase - 6 * DAY).toISOString(),
      },
      {
        group_id: demoGroupId,
        sender_account_id: leaderAuthUserId,
        sender_name: 'Sarah Mitchell',
        content: "Love that reflection! The 'abide' insight is powerful. Let's talk more at our next meeting.",
        message_type: 'text',
        created_at: new Date(msgBase - 5 * DAY).toISOString(),
      },
      {
        group_id: demoGroupId,
        sender_account_id: authUserId,
        sender_name: 'Demo Disciple',
        content: 'Looking forward to it! This group has been really encouraging.',
        message_type: 'text',
        created_at: new Date(msgBase - 3 * DAY).toISOString(),
      },
    ];

    const { error: msgError } = await supabase.from('group_messages').insert(demoMessages);
    if (msgError) {
      console.error('[GLOBAL-SEED] Message seed error:', msgError);
      // Non-fatal
    }

    // ── 13. Seed group_message_reads (partial unread) ────────────────────
    await supabase.from('group_message_reads').upsert(
      {
        account_id: authUserId,
        group_id: demoGroupId,
        last_read_at: new Date(msgBase - 5.5 * DAY).toISOString(),
      },
      { onConflict: 'account_id,group_id' }
    );

    // ── 14. Seed dna_calendar_events (upcoming group meetings) ───────────
    await supabase.from('dna_calendar_events').delete().eq('group_id', demoGroupId);

    // Calculate next Wednesday from today
    const nextWed = new Date(now);
    nextWed.setDate(nextWed.getDate() + ((3 - nextWed.getDay() + 7) % 7 || 7));
    nextWed.setHours(19, 0, 0, 0);

    const calendarEvents = [
      {
        title: 'Group Meeting — Foundation Week 4',
        description: 'Continue through the Foundation phase together. Bring your journals.',
        location: 'Main Campus Room 204',
        start_time: new Date(nextWed).toISOString(),
        end_time: new Date(nextWed.getTime() + 90 * 60 * 1000).toISOString(),
        event_type: 'group_meeting',
        group_id: demoGroupId,
        created_by: dnaLeaderId,
      },
      {
        title: 'Group Meeting — Foundation Week 5',
        description: 'Q&A deep-dive and checkpoint review.',
        location: 'Main Campus Room 204',
        start_time: new Date(nextWed.getTime() + 7 * DAY).toISOString(),
        end_time: new Date(nextWed.getTime() + 7 * DAY + 90 * 60 * 1000).toISOString(),
        event_type: 'group_meeting',
        group_id: demoGroupId,
        created_by: dnaLeaderId,
      },
      {
        title: 'Group Meeting — Foundation Week 6',
        description: 'Listening prayer practice and phase reflection.',
        location: 'Main Campus Room 204',
        start_time: new Date(nextWed.getTime() + 14 * DAY).toISOString(),
        end_time: new Date(nextWed.getTime() + 14 * DAY + 90 * 60 * 1000).toISOString(),
        event_type: 'group_meeting',
        group_id: demoGroupId,
        created_by: dnaLeaderId,
      },
      {
        title: 'Scripture Deep-Dive',
        description: 'Casual coffee and extended time in the Word together.',
        location: 'Coffee House',
        start_time: (() => {
          const sat = new Date(now);
          sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7 || 7));
          sat.setHours(9, 0, 0, 0);
          return sat.toISOString();
        })(),
        end_time: (() => {
          const sat = new Date(now);
          sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7 || 7));
          sat.setHours(10, 0, 0, 0);
          return sat.toISOString();
        })(),
        event_type: 'group_meeting',
        group_id: demoGroupId,
        created_by: dnaLeaderId,
      },
    ];

    const { error: calError } = await supabase.from('dna_calendar_events').insert(calendarEvents);
    if (calError) {
      console.error('[GLOBAL-SEED] Calendar seed error:', calError);
      // Non-fatal
    }

    // ── 15. Verify sign-in works ─────────────────────────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let signInOk = false;

    if (supabaseUrl && supabaseAnonKey) {
      const anonClient = createClient(supabaseUrl, supabaseAnonKey);
      const { data: testSession } = await anonClient.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });
      signInOk = !!testSession?.session;
    }

    return NextResponse.json({
      success: true,
      seeded: {
        auth_user_id: authUserId,
        demo_email: demoEmail,
        disciple_id: discipleId,
        leader_auth_user_id: leaderAuthUserId,
        leader_email: leaderEmail,
        dna_leader_id: dnaLeaderId,
        group_id: demoGroupId,
        checkpoints: checkpointRows.length,
        journal_entries: journalEntries.length,
        prayer_cards: prayerCards.length,
        group_messages: demoMessages.length,
        calendar_events: calendarEvents.length,
        sign_in_verified: signInOk,
      },
    });
  } catch (error) {
    console.error('[GLOBAL-SEED] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
