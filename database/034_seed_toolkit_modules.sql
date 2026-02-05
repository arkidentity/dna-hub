-- =============================================
-- SEED: 90-Day Toolkit Modules
-- Part of Migration 034: Daily DNA App Integration
-- =============================================
-- 12 weeks of discipleship content organized in 3 months
-- Month 1 (Weeks 1-4): Foundation - Building basics of faith
-- Month 2 (Weeks 5-8): Growth - Deepening relationship with God
-- Month 3 (Weeks 9-12): Mission - Living out faith in the world

INSERT INTO toolkit_modules (
    week,
    month,
    title,
    subtitle,
    description,
    primary_tool,
    is_active
) VALUES

-- =============================================
-- MONTH 1: FOUNDATION (Weeks 1-4)
-- =============================================
(1, 1,
 'Your New Identity',
 'Who You Are in Christ',
 'Discover what it means to be a new creation in Christ. Explore your identity as a beloved child of God and understand the foundation of your faith journey.',
 '3d_journal',
 true),

(2, 1,
 'The Word of God',
 'Building Your Foundation on Scripture',
 'Learn why the Bible is essential to your spiritual growth. Develop habits for reading, understanding, and applying God''s Word in your daily life.',
 '3d_bible_challenge',
 true),

(3, 1,
 'Prayer as Conversation',
 'Talking and Listening to God',
 'Move beyond ritual prayer to genuine conversation with your Heavenly Father. Learn the ACTS model (Adoration, Confession, Thanksgiving, Supplication) and the 4D Prayer method.',
 '4d_prayer',
 true),

(4, 1,
 'Community Matters',
 'The Importance of Christian Fellowship',
 'Understand why God designed us for community. Explore how your DNA group and local church are essential for spiritual growth and accountability.',
 '3d_journal',
 true),

-- =============================================
-- MONTH 2: GROWTH (Weeks 5-8)
-- =============================================
(5, 2,
 'The Holy Spirit',
 'Your Helper and Guide',
 'Learn about the person and work of the Holy Spirit. Discover how to be led by the Spirit and experience His fruit and gifts in your life.',
 'creed_cards',
 true),

(6, 2,
 'Overcoming Temptation',
 'Victory in Spiritual Warfare',
 'Identify common temptations and learn biblical strategies for victory. Understand the armor of God and how to stand firm against the enemy.',
 '4d_prayer',
 true),

(7, 2,
 'Forgiveness',
 'Receiving and Extending Grace',
 'Experience the freedom of living forgiven. Learn how to release bitterness and extend forgiveness to others as Christ has forgiven you.',
 '3d_journal',
 true),

(8, 2,
 'Spiritual Disciplines',
 'Practices That Fuel Growth',
 'Explore disciplines like fasting, solitude, and sabbath. Learn how these practices create space for God to work deeply in your life.',
 '3d_journal',
 true),

-- =============================================
-- MONTH 3: MISSION (Weeks 9-12)
-- =============================================
(9, 3,
 'Your Story Matters',
 'Crafting Your Testimony',
 'Learn to share your faith story using the STORY framework. Your testimony is a powerful tool for connecting others to Jesus.',
 'testimony_builder',
 true),

(10, 3,
 'Everyday Evangelism',
 'Sharing Jesus Naturally',
 'Move beyond fear to share the gospel with confidence. Learn conversational approaches to introducing others to Jesus in everyday life.',
 '4d_prayer',
 true),

(11, 3,
 'Serving Others',
 'Using Your Gifts for God''s Kingdom',
 'Discover your spiritual gifts and how to use them. Learn that true greatness in God''s kingdom comes through serving others.',
 'life_assessment',
 true),

(12, 3,
 'The Disciple-Making Life',
 'Continuing the Mission',
 'Embrace the lifelong call to make disciples. Learn how to pour into others and multiply your faith through intentional relationships.',
 '3d_journal',
 true);
