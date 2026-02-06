-- =============================================
-- SEED: Life Assessment Questions
-- Part of Migration 034: Daily DNA App Integration
-- =============================================
-- 42 questions across 8 categories (from DNA Life Assessment PDF):
--   Part 1: Relationship with God (6 questions)
--   Part 2: Spiritual Freedom (6 questions)
--   Part 3: Identity & Emotions (5 questions)
--   Part 4: Relationships (5 questions)
--   Part 5: Calling & Purpose (4 questions)
--   Part 6: Lifestyle & Stewardship (4 questions)
--   Part 7: Spiritual Fruit (9 questions — all 9 fruit of the Spirit)
--   Part 8: Reflection (3 open-ended questions)
--
-- Question types: likert, multiple_choice, checkbox, open_ended
-- Rating scale (likert): 1 = Not true of me, 5 = Very true of me
-- Source: docs/resources/dna-life-assessment.pdf

-- Clear existing questions for idempotent re-run
DELETE FROM life_assessment_questions;

INSERT INTO life_assessment_questions (category, question_text, question_type, options, fruit_name, max_score, sort_order) VALUES

-- =============================================
-- PART 1: RELATIONSHIP WITH GOD (Questions 1-6)
-- =============================================
('relationship_with_god',
 'How would you describe your current relationship with God?',
 'multiple_choice',
 '{"choices": ["Distant and struggling", "Inconsistent—hot and cold", "Growing but still immature", "Steady and deepening", "Intimate and thriving"]}',
 NULL, 5, 1),

('relationship_with_god',
 'Rate your devotional consistency (prayer, Bible, journal)',
 'likert',
 '{"scale_labels": {"1": "Not true of me", "5": "Very true of me"}}',
 NULL, 5, 2),

('relationship_with_god',
 'When you pray, do you sense God''s presence and hear His voice?',
 'likert',
 '{"scale_labels": {"1": "Not true of me", "5": "Very true of me"}, "follow_up": "Explain:"}',
 NULL, 5, 3),

('relationship_with_god',
 'Can you clearly articulate the gospel (good news of Jesus)?',
 'multiple_choice',
 '{"choices": ["Yes", "Somewhat", "No"], "follow_up": "If yes, write it in 2-3 sentences:"}',
 NULL, NULL, 4),

('relationship_with_god',
 'Do you believe God likes you, or just loves you out of obligation?',
 'multiple_choice',
 '{"choices": ["Likes me", "Just loves me", "Not sure"], "follow_up": "Why?"}',
 NULL, NULL, 5),

('relationship_with_god',
 'Rate your confidence in God''s goodness when life is hard',
 'likert',
 '{"scale_labels": {"1": "Not true of me", "5": "Very true of me"}}',
 NULL, 5, 6),

-- =============================================
-- PART 2: SPIRITUAL FREEDOM (Questions 7-12)
-- =============================================
('spiritual_freedom',
 'Are you currently walking in freedom from lifestyle sin?',
 'multiple_choice',
 '{"choices": ["Yes", "Mostly", "Struggling", "No"]}',
 NULL, NULL, 7),

('spiritual_freedom',
 'Is there any area of ongoing sin you''re aware of but haven''t addressed?',
 'multiple_choice',
 '{"choices": ["Yes", "No"], "follow_up": "If yes, what:"}',
 NULL, NULL, 8),

('spiritual_freedom',
 'Do you struggle with any of the following? (Check all that apply)',
 'checkbox',
 '{"choices": ["Pornography or sexual sin", "Substance abuse (alcohol, drugs, etc.)", "Anger or rage", "Fear or anxiety", "Pride or control", "Gossip or slander", "Lying or deception", "Bitterness or unforgiveness", "Other"]}',
 NULL, NULL, 9),

('spiritual_freedom',
 'Do you feel free in Christ, or trapped by guilt and shame?',
 'multiple_choice',
 '{"choices": ["Free", "Mostly free", "Trapped", "Somewhere in between"]}',
 NULL, NULL, 10),

('spiritual_freedom',
 'When you sin, how do you typically respond?',
 'multiple_choice',
 '{"choices": ["Hide and avoid dealing with it", "Feel shame and beat myself up", "Minimize it—\"not that bad\"", "Confess to God but not people", "Confess quickly to God and trusted people"]}',
 NULL, 5, 11),

('spiritual_freedom',
 'Rate your ability to receive correction without becoming defensive',
 'likert',
 '{"scale_labels": {"1": "Not true of me", "5": "Very true of me"}}',
 NULL, 5, 12),

-- =============================================
-- PART 3: IDENTITY & EMOTIONS (Questions 13-17)
-- =============================================
('identity_emotions',
 'When you think about yourself, what''s the first word that comes to mind?',
 'open_ended',
 NULL,
 NULL, NULL, 13),

('identity_emotions',
 'Do you see yourself the way God sees you?',
 'likert',
 '{"scale_labels": {"1": "Not true of me", "5": "Very true of me"}}',
 NULL, 5, 14),

('identity_emotions',
 'What''s your biggest insecurity?',
 'open_ended',
 NULL,
 NULL, NULL, 15),

('identity_emotions',
 'How do you respond to failure or mistakes?',
 'multiple_choice',
 '{"choices": ["Catastrophize—\"I''m a failure\"", "Get defensive or blame others", "Feel bad but move on", "Process with trusted people", "Learn from it and grow"]}',
 NULL, 5, 16),

('identity_emotions',
 'Rate your ability to manage strong emotions (anger, fear, sadness)',
 'likert',
 '{"scale_labels": {"1": "Overwhelmed by emotions", "5": "Handle them well"}}',
 NULL, 5, 17),

-- =============================================
-- PART 4: RELATIONSHIPS (Questions 18-22)
-- =============================================
('relationships',
 'Do you have 2-3 close, healthy, life-giving friendships?',
 'multiple_choice',
 '{"choices": ["Yes", "1-2", "No"]}',
 NULL, NULL, 18),

('relationships',
 'Are there any broken or unresolved relationships you need to address?',
 'multiple_choice',
 '{"choices": ["Yes", "No"], "follow_up": "If yes, with whom:"}',
 NULL, NULL, 19),

('relationships',
 'How do you typically handle conflict?',
 'multiple_choice',
 '{"choices": ["Avoid it at all costs", "Get defensive or aggressive", "Shut down emotionally", "Address it but struggle", "Address it well with grace and truth"]}',
 NULL, 5, 20),

('relationships',
 'Have you ever discipled someone or led someone to Christ?',
 'multiple_choice',
 '{"choices": ["Yes", "No"]}',
 NULL, NULL, 21),

('relationships',
 'Who knows the real you—struggles and all?',
 'open_ended',
 NULL,
 NULL, NULL, 22),

-- =============================================
-- PART 5: CALLING & PURPOSE (Questions 23-26)
-- =============================================
('calling_purpose',
 'Do you have a sense of what God has called you to?',
 'multiple_choice',
 '{"choices": ["Yes, clear", "Somewhat", "No idea"], "follow_up": "If yes, what:"}',
 NULL, NULL, 23),

('calling_purpose',
 'What breaks your heart or makes you angry in the world?',
 'open_ended',
 NULL,
 NULL, NULL, 24),

('calling_purpose',
 'If you could do anything for God''s Kingdom without limitation, what would it be?',
 'open_ended',
 NULL,
 NULL, NULL, 25),

('calling_purpose',
 'Rate your current sense of purpose and direction in life',
 'likert',
 '{"scale_labels": {"1": "Not true of me", "5": "Very true of me"}}',
 NULL, 5, 26),

-- =============================================
-- PART 6: LIFESTYLE & STEWARDSHIP (Questions 27-30)
-- =============================================
('lifestyle_stewardship',
 'Rate the stability of your financial situation',
 'likert',
 '{"scale_labels": {"1": "Crisis", "5": "Healthy margin"}}',
 NULL, 5, 27),

('lifestyle_stewardship',
 'Do you have healthy boundaries with your time and energy?',
 'likert',
 '{"scale_labels": {"1": "Not true of me", "5": "Very true of me"}}',
 NULL, 5, 28),

('lifestyle_stewardship',
 'Rate the health of your physical body (sleep, exercise, diet)',
 'likert',
 '{"scale_labels": {"1": "Not true of me", "5": "Very true of me"}}',
 NULL, 5, 29),

('lifestyle_stewardship',
 'Rate your work/life balance',
 'likert',
 '{"scale_labels": {"1": "Drowning", "5": "Healthy margin"}}',
 NULL, 5, 30),

-- =============================================
-- PART 7: SPIRITUAL FRUIT (Questions 31-39)
-- All 9 fruit of the Spirit — Galatians 5:22-23
-- =============================================
('spiritual_fruit',
 'LOVE — Sacrificial care for others',
 'likert',
 '{"scale_labels": {"1": "Not true of me", "5": "Very true of me"}}',
 'Love', 5, 31),

('spiritual_fruit',
 'JOY — Deep contentment regardless of circumstances',
 'likert',
 '{"scale_labels": {"1": "Not true of me", "5": "Very true of me"}}',
 'Joy', 5, 32),

('spiritual_fruit',
 'PEACE — Inner rest and trust in God',
 'likert',
 '{"scale_labels": {"1": "Not true of me", "5": "Very true of me"}}',
 'Peace', 5, 33),

('spiritual_fruit',
 'PATIENCE — Slow to anger, extending grace',
 'likert',
 '{"scale_labels": {"1": "Not true of me", "5": "Very true of me"}}',
 'Patience', 5, 34),

('spiritual_fruit',
 'KINDNESS — Actively seeking others'' good',
 'likert',
 '{"scale_labels": {"1": "Not true of me", "5": "Very true of me"}}',
 'Kindness', 5, 35),

('spiritual_fruit',
 'GOODNESS — Moral integrity and generosity',
 'likert',
 '{"scale_labels": {"1": "Not true of me", "5": "Very true of me"}}',
 'Goodness', 5, 36),

('spiritual_fruit',
 'FAITHFULNESS — Reliable and consistent follow-through',
 'likert',
 '{"scale_labels": {"1": "Not true of me", "5": "Very true of me"}}',
 'Faithfulness', 5, 37),

('spiritual_fruit',
 'GENTLENESS — Strength under control',
 'likert',
 '{"scale_labels": {"1": "Not true of me", "5": "Very true of me"}}',
 'Gentleness', 5, 38),

('spiritual_fruit',
 'SELF-CONTROL — Mastery over impulses and appetites',
 'likert',
 '{"scale_labels": {"1": "Not true of me", "5": "Very true of me"}}',
 'Self-Control', 5, 39),

-- =============================================
-- REFLECTION (Questions 40-42) — open-ended
-- =============================================
('reflection',
 'What''s the biggest area of growth you need in the next 3 months?',
 'open_ended',
 NULL,
 NULL, NULL, 40),

('reflection',
 'If you''re honest, what are you afraid of?',
 'open_ended',
 NULL,
 NULL, NULL, 41),

('reflection',
 'Why did you say yes to DNA discipleship?',
 'open_ended',
 NULL,
 NULL, NULL, 42);

-- Category descriptions for UI display
COMMENT ON TABLE life_assessment_questions IS 'Life Assessment categories (from DNA Life Assessment PDF):
- relationship_with_god: Relationship with God (6 questions: mixed likert/multiple_choice)
- spiritual_freedom: Spiritual Freedom (6 questions: mixed types including checkbox)
- identity_emotions: Identity & Emotions (5 questions: mixed likert/multiple_choice/open_ended)
- relationships: Relationships (5 questions: mixed multiple_choice/open_ended)
- calling_purpose: Calling & Purpose (4 questions: mixed multiple_choice/open_ended/likert)
- lifestyle_stewardship: Lifestyle & Stewardship (4 questions: all likert)
- spiritual_fruit: 9 Fruit of the Spirit — Galatians 5:22-23 (all likert, uses fruit_name column)
- reflection: 3 open-ended reflection questions
Rating scale: 1 = Not true of me / Strongly disagree / Never, 5 = Very true of me / Strongly agree / Consistently
Source: docs/resources/dna-life-assessment.pdf';
