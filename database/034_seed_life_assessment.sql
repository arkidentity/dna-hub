-- =============================================
-- SEED: Life Assessment Questions
-- Part of Migration 034: Daily DNA App Integration
-- =============================================
-- 42 questions across 7 categories (6 questions each)
-- Each question uses a likert scale (1-5)
-- Categories help disciples identify areas for growth

INSERT INTO life_assessment_questions (category, question_text, question_type, options, max_score, sort_order) VALUES

-- =============================================
-- CATEGORY 1: RELATIONSHIP WITH GOD (Questions 1-6)
-- =============================================
('relationship_with_god', 'I consistently spend time reading and studying the Bible.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 1),
('relationship_with_god', 'I have a regular prayer life where I talk to and listen to God.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 2),
('relationship_with_god', 'I am growing in my understanding of who God is and His character.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 3),
('relationship_with_god', 'I am regularly experiencing the presence and work of the Holy Spirit.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 4),
('relationship_with_god', 'I am actively applying what I learn from Scripture to my daily life.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 5),
('relationship_with_god', 'I am growing in spiritual maturity and becoming more like Christ.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 6),

-- =============================================
-- CATEGORY 2: SPIRITUAL FREEDOM (Questions 7-12)
-- =============================================
('spiritual_freedom', 'I am free from bitterness, resentment, or unresolved hurt.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 7),
('spiritual_freedom', 'I am free from addictions or unhealthy habits that control me.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 8),
('spiritual_freedom', 'I am quick to forgive others and don''t hold grudges.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 9),
('spiritual_freedom', 'I experience freedom from shame and guilt through Christ.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 10),
('spiritual_freedom', 'I am able to resist temptation and walk in obedience.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 11),
('spiritual_freedom', 'I am no longer bound by fear, anxiety, or worry.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 12),

-- =============================================
-- CATEGORY 3: IDENTITY & EMOTIONS (Questions 13-18)
-- =============================================
('identity_emotions', 'I have a healthy self-image based on my identity in Christ.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 13),
('identity_emotions', 'I am aware of my emotions and can process them in healthy ways.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 14),
('identity_emotions', 'I am content with my life and not constantly striving for more.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 15),
('identity_emotions', 'I manage stress well and have healthy coping mechanisms.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 16),
('identity_emotions', 'I experience peace and joy regularly, even in difficult circumstances.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 17),
('identity_emotions', 'I know who I am in Christ and live from that identity.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 18),

-- =============================================
-- CATEGORY 4: RELATIONSHIPS (Questions 19-24)
-- =============================================
('relationships', 'I have healthy, life-giving relationships with family members.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 19),
('relationships', 'I have close friends who encourage my faith and hold me accountable.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 20),
('relationships', 'I communicate honestly and lovingly, even in difficult conversations.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 21),
('relationships', 'I prioritize quality time with people who matter most to me.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 22),
('relationships', 'I am connected to a Christian community where I belong and contribute.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 23),
('relationships', 'I serve others in my relationships without expecting anything in return.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 24),

-- =============================================
-- CATEGORY 5: CALLING & PURPOSE (Questions 25-30)
-- =============================================
('calling_purpose', 'I have a clear sense of God''s purpose for my life.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 25),
('calling_purpose', 'I am using my gifts and talents to serve God and others.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 26),
('calling_purpose', 'I am pursuing meaningful work that aligns with my calling.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 27),
('calling_purpose', 'I am making a positive impact in my sphere of influence.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 28),
('calling_purpose', 'I am actively seeking to grow in my skills and abilities.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 29),
('calling_purpose', 'I see my everyday work as an opportunity to glorify God.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 30),

-- =============================================
-- CATEGORY 6: LIFESTYLE & STEWARDSHIP (Questions 31-36)
-- =============================================
('lifestyle_stewardship', 'I tithe and give generously to God''s work.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 31),
('lifestyle_stewardship', 'I live within my means and avoid unnecessary debt.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 32),
('lifestyle_stewardship', 'I take care of my body through exercise, nutrition, and rest.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 33),
('lifestyle_stewardship', 'I manage my time well and prioritize what matters most.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 34),
('lifestyle_stewardship', 'I am content with what I have and not driven by materialism.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 35),
('lifestyle_stewardship', 'I view my resources as belonging to God and steward them wisely.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 36),

-- =============================================
-- CATEGORY 7: SPIRITUAL FRUIT (Questions 37-45)
-- Using the 9 fruit of the Spirit from Galatians 5:22-23
-- =============================================
('spiritual_fruit', 'I consistently demonstrate love toward others, even those difficult to love.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 37),
('spiritual_fruit', 'I experience joy that isn''t dependent on my circumstances.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 38),
('spiritual_fruit', 'I have a deep sense of peace, even in stressful situations.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 39),
('spiritual_fruit', 'I am patient with others and with God''s timing.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 40),
('spiritual_fruit', 'I show kindness and compassion to those around me.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 41),
('spiritual_fruit', 'I am generous and good to others without expecting anything in return.', 'likert', '["Never", "Rarely", "Sometimes", "Often", "Always"]', 5, 42),

-- =============================================
-- CATEGORY 8: REFLECTION (Open-ended questions)
-- =============================================
('reflection', 'What is one area of your life where you most want to see growth?', 'open_ended', NULL, NULL, 43),
('reflection', 'What obstacles or challenges are hindering your spiritual growth?', 'open_ended', NULL, NULL, 44),
('reflection', 'What is one step you could take this week to grow closer to God?', 'open_ended', NULL, NULL, 45);

-- Category descriptions for UI display
COMMENT ON TABLE life_assessment_questions IS 'Life Assessment categories:
- relationship_with_god: Relationship with God, prayer, Bible, spiritual growth
- spiritual_freedom: Freedom from sin, addictions, bitterness, fear
- identity_emotions: Self-image in Christ, emotional health, contentment
- relationships: Family, friendships, community, communication
- calling_purpose: Vocation, gifts, meaning, impact
- lifestyle_stewardship: Finances, time, health, resources
- spiritual_fruit: Love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control
- reflection: Open-ended questions for personal reflection';
