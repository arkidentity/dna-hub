-- =============================================
-- SEED: 90-Day Toolkit Checkpoints
-- Part of Migration 034: Daily DNA App Integration
-- =============================================
-- Checkpoints are milestones within each week
-- tracking_type: 'auto' = system detected, 'self_marked' = disciple marks, 'leader_controlled' = leader marks

-- First, we need to get the module IDs dynamically
-- Using a DO block to handle the foreign key relationships

DO $$
DECLARE
    week1_id INTEGER;
    week2_id INTEGER;
    week3_id INTEGER;
    week4_id INTEGER;
    week5_id INTEGER;
    week6_id INTEGER;
    week7_id INTEGER;
    week8_id INTEGER;
    week9_id INTEGER;
    week10_id INTEGER;
    week11_id INTEGER;
    week12_id INTEGER;
BEGIN
    -- Get module IDs
    SELECT id INTO week1_id FROM toolkit_modules WHERE week = 1;
    SELECT id INTO week2_id FROM toolkit_modules WHERE week = 2;
    SELECT id INTO week3_id FROM toolkit_modules WHERE week = 3;
    SELECT id INTO week4_id FROM toolkit_modules WHERE week = 4;
    SELECT id INTO week5_id FROM toolkit_modules WHERE week = 5;
    SELECT id INTO week6_id FROM toolkit_modules WHERE week = 6;
    SELECT id INTO week7_id FROM toolkit_modules WHERE week = 7;
    SELECT id INTO week8_id FROM toolkit_modules WHERE week = 8;
    SELECT id INTO week9_id FROM toolkit_modules WHERE week = 9;
    SELECT id INTO week10_id FROM toolkit_modules WHERE week = 10;
    SELECT id INTO week11_id FROM toolkit_modules WHERE week = 11;
    SELECT id INTO week12_id FROM toolkit_modules WHERE week = 12;

    -- =============================================
    -- WEEK 1: Your New Identity
    -- =============================================
    INSERT INTO toolkit_checkpoints (module_id, checkpoint_key, label, description, tracking_type, auto_trigger, sort_order) VALUES
    (week1_id, 'watch_video', 'Watch Week 1 Video', 'Watch the introductory video on your new identity in Christ', 'self_marked', NULL, 1),
    (week1_id, 'attend_meeting', 'Attend DNA Meeting', 'Attend your DNA group meeting this week', 'self_marked', NULL, 2),
    (week1_id, 'first_journal', 'Create First Journal Entry', 'Write your first 3D Journal entry reflecting on your identity', 'auto', 'journal_entry_created', 3),
    (week1_id, 'scripture_reading', 'Complete Identity Scripture Reading', 'Read the key scriptures about who you are in Christ', 'self_marked', NULL, 4),
    (week1_id, 'use_prayer', 'Pray Using 4D Prayer', 'Use the 4D Prayer tool to spend time with God', 'auto', 'prayer_card_created', 5);

    -- =============================================
    -- WEEK 2: The Word of God
    -- =============================================
    INSERT INTO toolkit_checkpoints (module_id, checkpoint_key, label, description, tracking_type, auto_trigger, sort_order) VALUES
    (week2_id, 'watch_video', 'Watch Week 2 Video', 'Watch the video on the importance of Scripture', 'self_marked', NULL, 1),
    (week2_id, 'attend_meeting', 'Attend DNA Meeting', 'Attend your DNA group meeting this week', 'self_marked', NULL, 2),
    (week2_id, 'read_chapter', 'Read a Full Chapter', 'Read one full chapter from the Gospel of John', 'self_marked', NULL, 3),
    (week2_id, 'journal_learning', 'Journal What You Learned', 'Use 3D Journal to write what God showed you in His Word', 'auto', 'journal_entry_created', 4),
    (week2_id, 'memorize_verse', 'Memorize a Verse', 'Memorize 2 Timothy 3:16-17', 'self_marked', NULL, 5);

    -- =============================================
    -- WEEK 3: Prayer as Conversation
    -- =============================================
    INSERT INTO toolkit_checkpoints (module_id, checkpoint_key, label, description, tracking_type, auto_trigger, sort_order) VALUES
    (week3_id, 'watch_video', 'Watch Week 3 Video', 'Watch the video on prayer as conversation with God', 'self_marked', NULL, 1),
    (week3_id, 'attend_meeting', 'Attend DNA Meeting', 'Attend your DNA group meeting this week', 'self_marked', NULL, 2),
    (week3_id, 'create_cards', 'Create 3 Prayer Cards', 'Use 4D Prayer to create cards in Revere, Reflect, and Rest', 'auto', 'prayer_cards_3', 3),
    (week3_id, 'pray_15_min', 'Pray for 15 Minutes', 'Spend 15 uninterrupted minutes talking with God', 'self_marked', NULL, 4),
    (week3_id, 'journal_prayer', 'Journal Your Prayer Experience', 'Write about what you heard from God in prayer', 'auto', 'journal_entry_created', 5);

    -- =============================================
    -- WEEK 4: Community Matters
    -- =============================================
    INSERT INTO toolkit_checkpoints (module_id, checkpoint_key, label, description, tracking_type, auto_trigger, sort_order) VALUES
    (week4_id, 'watch_video', 'Watch Week 4 Video', 'Watch the video on Christian community', 'self_marked', NULL, 1),
    (week4_id, 'attend_meeting', 'Attend DNA Meeting', 'Attend your DNA group meeting this week', 'self_marked', NULL, 2),
    (week4_id, 'share_group', 'Share in Your Group', 'Share something personal with your DNA group', 'self_marked', NULL, 3),
    (week4_id, 'encourage_member', 'Encourage a Group Member', 'Send an encouraging message to someone in your group', 'self_marked', NULL, 4),
    (week4_id, 'attend_church', 'Attend Church Service', 'Worship with your local church community', 'self_marked', NULL, 5);

    -- =============================================
    -- WEEK 5: The Holy Spirit
    -- =============================================
    INSERT INTO toolkit_checkpoints (module_id, checkpoint_key, label, description, tracking_type, auto_trigger, sort_order) VALUES
    (week5_id, 'watch_video', 'Watch Week 5 Video', 'Watch the video on the Holy Spirit', 'self_marked', NULL, 1),
    (week5_id, 'attend_meeting', 'Attend DNA Meeting', 'Attend your DNA group meeting this week', 'self_marked', NULL, 2),
    (week5_id, 'learn_creeds', 'Learn 5 Creed Cards', 'Study 5 new Creed Cards about core doctrine', 'auto', 'creed_cards_5', 3),
    (week5_id, 'journal_spirit', 'Journal About the Spirit', 'Write about how you''ve experienced the Holy Spirit', 'auto', 'journal_entry_created', 4),
    (week5_id, 'listening_prayer', 'Practice Listening Prayer', 'Spend time in silence listening for the Spirit''s guidance', 'self_marked', NULL, 5);

    -- =============================================
    -- WEEK 6: Overcoming Temptation
    -- =============================================
    INSERT INTO toolkit_checkpoints (module_id, checkpoint_key, label, description, tracking_type, auto_trigger, sort_order) VALUES
    (week6_id, 'watch_video', 'Watch Week 6 Video', 'Watch the video on spiritual warfare', 'self_marked', NULL, 1),
    (week6_id, 'attend_meeting', 'Attend DNA Meeting', 'Attend your DNA group meeting this week', 'self_marked', NULL, 2),
    (week6_id, 'identify_temptations', 'Identify Your Temptations', 'Journal about areas where you face temptation', 'auto', 'journal_entry_created', 3),
    (week6_id, 'memorize_armor', 'Memorize Armor of God', 'Memorize Ephesians 6:10-18', 'self_marked', NULL, 4),
    (week6_id, 'share_accountability', 'Share with Accountability', 'Be vulnerable with your DNA group about struggles', 'self_marked', NULL, 5);

    -- =============================================
    -- WEEK 7: Forgiveness
    -- =============================================
    INSERT INTO toolkit_checkpoints (module_id, checkpoint_key, label, description, tracking_type, auto_trigger, sort_order) VALUES
    (week7_id, 'watch_video', 'Watch Week 7 Video', 'Watch the video on forgiveness', 'self_marked', NULL, 1),
    (week7_id, 'attend_meeting', 'Attend DNA Meeting', 'Attend your DNA group meeting this week', 'self_marked', NULL, 2),
    (week7_id, 'journal_unforgiveness', 'Journal About Unforgiveness', 'Honestly write about anyone you need to forgive', 'auto', 'journal_entry_created', 3),
    (week7_id, 'pray_for_hurters', 'Pray for Those Who Hurt You', 'Use 4D Prayer to pray for people you''re forgiving', 'auto', 'prayer_card_created', 4),
    (week7_id, 'step_reconciliation', 'Take a Step Toward Reconciliation', 'If possible, reach out to someone for reconciliation', 'self_marked', NULL, 5);

    -- =============================================
    -- WEEK 8: Spiritual Disciplines
    -- =============================================
    INSERT INTO toolkit_checkpoints (module_id, checkpoint_key, label, description, tracking_type, auto_trigger, sort_order) VALUES
    (week8_id, 'watch_video', 'Watch Week 8 Video', 'Watch the video on spiritual disciplines', 'self_marked', NULL, 1),
    (week8_id, 'attend_meeting', 'Attend DNA Meeting', 'Attend your DNA group meeting this week', 'self_marked', NULL, 2),
    (week8_id, 'practice_fast', 'Practice a Fast', 'Fast from something for 24 hours, seeking God', 'self_marked', NULL, 3),
    (week8_id, 'solitude_time', 'Solitude Time', 'Spend 30 minutes alone with God, no phone', 'self_marked', NULL, 4),
    (week8_id, 'sabbath_rest', 'Sabbath Rest', 'Take intentional sabbath time this week', 'self_marked', NULL, 5);

    -- =============================================
    -- WEEK 9: Your Story Matters
    -- =============================================
    INSERT INTO toolkit_checkpoints (module_id, checkpoint_key, label, description, tracking_type, auto_trigger, sort_order) VALUES
    (week9_id, 'watch_video', 'Watch Week 9 Video', 'Watch the video on sharing your testimony', 'self_marked', NULL, 1),
    (week9_id, 'attend_meeting', 'Attend DNA Meeting', 'Attend your DNA group meeting this week', 'self_marked', NULL, 2),
    (week9_id, 'complete_story', 'Complete STORY Framework', 'Use Testimony Builder to craft your story', 'auto', 'testimony_created', 3),
    (week9_id, 'practice_testimony', 'Practice with Your Group', 'Share your 3-minute testimony with your DNA group', 'self_marked', NULL, 4),
    (week9_id, 'refine_testimony', 'Refine Your Testimony', 'Update your testimony based on feedback', 'auto', 'testimony_updated', 5);

    -- =============================================
    -- WEEK 10: Everyday Evangelism
    -- =============================================
    INSERT INTO toolkit_checkpoints (module_id, checkpoint_key, label, description, tracking_type, auto_trigger, sort_order) VALUES
    (week10_id, 'watch_video', 'Watch Week 10 Video', 'Watch the video on sharing the gospel', 'self_marked', NULL, 1),
    (week10_id, 'attend_meeting', 'Attend DNA Meeting', 'Attend your DNA group meeting this week', 'self_marked', NULL, 2),
    (week10_id, 'identify_5', 'Identify 5 People', 'Write down 5 people you want to share Jesus with', 'self_marked', NULL, 3),
    (week10_id, 'pray_for_5', 'Pray for Your 5', 'Use 4D Prayer to pray for each person by name', 'auto', 'prayer_card_created', 4),
    (week10_id, 'spiritual_convo', 'Have a Spiritual Conversation', 'Have one conversation about faith this week', 'self_marked', NULL, 5);

    -- =============================================
    -- WEEK 11: Serving Others
    -- =============================================
    INSERT INTO toolkit_checkpoints (module_id, checkpoint_key, label, description, tracking_type, auto_trigger, sort_order) VALUES
    (week11_id, 'watch_video', 'Watch Week 11 Video', 'Watch the video on serving with your gifts', 'self_marked', NULL, 1),
    (week11_id, 'attend_meeting', 'Attend DNA Meeting', 'Attend your DNA group meeting this week', 'self_marked', NULL, 2),
    (week11_id, 'gifts_assessment', 'Complete Spiritual Gifts Assessment', 'Take the assessment to identify your gifts', 'auto', 'assessment_submitted', 3),
    (week11_id, 'serve_someone', 'Serve Someone This Week', 'Do an act of service without expecting anything back', 'self_marked', NULL, 4),
    (week11_id, 'find_opportunity', 'Find a Serving Opportunity', 'Identify a way to serve regularly at your church', 'self_marked', NULL, 5);

    -- =============================================
    -- WEEK 12: The Disciple-Making Life
    -- =============================================
    INSERT INTO toolkit_checkpoints (module_id, checkpoint_key, label, description, tracking_type, auto_trigger, sort_order) VALUES
    (week12_id, 'watch_video', 'Watch Week 12 Video', 'Watch the video on making disciples', 'self_marked', NULL, 1),
    (week12_id, 'attend_meeting', 'Attend DNA Meeting', 'Attend your DNA group meeting this week', 'self_marked', NULL, 2),
    (week12_id, 'action_plan', 'Create Your Action Plan', 'Journal your plan for continuing to grow and make disciples', 'auto', 'journal_entry_created', 3),
    (week12_id, 'identify_disciple', 'Identify Someone to Disciple', 'Pray about someone you could invest in spiritually', 'self_marked', NULL, 4),
    (week12_id, 'celebrate_commit', 'Celebrate and Commit', 'Celebrate completing the 90-day journey with your group', 'leader_controlled', NULL, 5);

END $$;
