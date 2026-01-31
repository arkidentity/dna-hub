# Spiritual Gifts Assessment - Implementation Plan

## Overview

Build a comprehensive spiritual gifts assessment tool that serves both **DNA Group disciples** (private, integrated with dashboard) and **public users** (lead generation tool). Same assessment, different entry points and results pages.

---

## Product Requirements

### Core Features

**Assessment Structure:**
- 90 questions total (30 per tier)
- Mix of Likert scale (1-5) and behavioral scenario questions
- Three tiers with different question approaches:
  - **Tier 1 (Serving Gifts)**: Behavioral/experience questions only
  - **Tier 2 (Supernatural Gifts)**: Desire + Experience questions (both dimensions)
  - **Tier 3 (Leadership Calling)**: Confirmation/calling questions

**Results Format:**
- 6 total gifts highlighted (Primary + Secondary for each tier)
- Customized synopsis per tier based on top 2 gifts
- Interactive results page
- PDF generation and download
- Email delivery with results summary

**Two User Flows:**

1. **DNA Group Disciples** (Private)
   - Leader sends unique assessment link (auto-tagged)
   - Simple results page with brief explanations
   - "Your leader will guide you through activation" message
   - Results auto-saved to dashboard
   - PDF emailed to disciple
   - Leader can view results before Week 11

2. **Public Users** (Lead Generation)
   - Standalone landing page at `/gifts` or `dnahub.com/gifts`
   - Same assessment, enhanced results page with CTAs
   - Lead capture at multiple levels (email → full contact info)
   - "Discipleship Starter Bundle" offer
   - SEO-optimized for organic discovery

---

## Technical Architecture

### Database Schema

**New Tables:**

```sql
-- Stores assessment questions
CREATE TABLE spiritual_gifts_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3)),
  gift_category TEXT NOT NULL, -- e.g., 'mercy', 'prophecy', 'apostle'
  question_type TEXT NOT NULL CHECK (question_type IN ('likert', 'behavioral', 'desire', 'experience', 'confirmation')),
  question_text TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores assessment sessions
CREATE TABLE spiritual_gifts_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL CHECK (source IN ('dna_group', 'public')),

  -- DNA Group context (nullable for public users)
  dna_leader_id UUID REFERENCES dna_leaders(id),
  disciple_id UUID REFERENCES disciples(id),
  group_id UUID REFERENCES dna_groups(id),

  -- Public user context (nullable for DNA disciples)
  email TEXT,
  full_name TEXT,
  phone TEXT,
  location TEXT,

  -- Assessment data
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress INTEGER DEFAULT 0, -- percentage complete

  -- Results
  tier1_primary TEXT, -- gift name
  tier1_secondary TEXT,
  tier1_synopsis TEXT,
  tier2_primary TEXT,
  tier2_secondary TEXT,
  tier2_synopsis TEXT,
  tier3_primary TEXT,
  tier3_secondary TEXT,
  tier3_synopsis TEXT,

  -- Metadata
  pdf_url TEXT, -- S3 or storage location
  unique_token TEXT UNIQUE NOT NULL, -- for resuming/viewing results

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores individual responses
CREATE TABLE spiritual_gifts_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES spiritual_gifts_assessments(id) ON DELETE CASCADE,
  question_id UUID REFERENCES spiritual_gifts_questions(id),
  response_value INTEGER NOT NULL CHECK (response_value >= 1 AND response_value <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_assessments_disciple ON spiritual_gifts_assessments(disciple_id);
CREATE INDEX idx_assessments_group ON spiritual_gifts_assessments(group_id);
CREATE INDEX idx_assessments_email ON spiritual_gifts_assessments(email);
CREATE INDEX idx_assessments_token ON spiritual_gifts_assessments(unique_token);
CREATE INDEX idx_responses_assessment ON spiritual_gifts_responses(assessment_id);
```

### API Endpoints

**Assessment Management:**

```
POST   /api/spiritual-gifts/start
  - Body: { source: 'dna_group' | 'public', disciple_id?, email? }
  - Returns: { assessment_id, unique_token, questions }

POST   /api/spiritual-gifts/submit-response
  - Body: { assessment_id, question_id, response_value }
  - Returns: { success, progress_percentage }

POST   /api/spiritual-gifts/complete
  - Body: { assessment_id }
  - Triggers scoring algorithm
  - Returns: { results, pdf_url }

GET    /api/spiritual-gifts/results/:token
  - Returns: { assessment, results, source }
```

**DNA Leader Integration:**

```
POST   /api/dna-leaders/send-assessment
  - Body: { group_id, disciple_ids[] }
  - Generates unique links for each disciple
  - Sends email/SMS notifications
  - Returns: { sent_count, links[] }

GET    /api/dna-leaders/assessment-results/:group_id
  - Returns all disciple assessment results for a group
  - For leader review before Week 11

GET    /api/disciples/my-assessment
  - Returns disciple's own assessment results
```

**Public Lead Capture:**

```
POST   /api/spiritual-gifts/claim-bundle
  - Body: { assessment_id, full_name, email, phone, location }
  - Updates assessment record
  - Triggers email sequence
  - Creates ARK Identity app account
  - Returns: { success, app_access_link }
```

### Scoring Algorithm

**Approach:**

1. **Calculate score per gift category** (e.g., all "mercy" questions averaged)
2. **Rank gifts within each tier**
3. **Select Primary (highest score) and Secondary (second highest) per tier**
4. **Generate customized synopsis** based on gift combination

**Tier-Specific Logic:**

- **Tier 1**: Average all behavioral/experience responses per gift
- **Tier 2**: Weight desire (40%) + experience (60%) per gift
- **Tier 3**: Average confirmation/calling responses per gift

**Synopsis Generation:**

- Pre-written templates for each gift combination
- Example: "Mercy + Encouragement" has a unique synopsis
- Fallback to individual gift descriptions if combo not pre-defined

---

## UI/UX Design

### Assessment Page

**Layout:**
- Single scrolling page (mobile-first)
- Progress bar at top showing % complete
- Questions grouped by tier (visual separation)
- Clear tier headers explaining what's being measured

**Question Display:**
- One question visible at a time (or small groups of 3-5)
- Likert scale: Radio buttons with labels (Strongly Disagree → Strongly Agree)
- Behavioral scenarios: Multiple choice with clear options
- "Previous" and "Next" buttons
- Auto-save on each response (stores in session/local storage)

**Progress Indicators:**
- "Question 15 of 90"
- "Tier 1: Serving Gifts (60% complete)"
- Visual progress bar

### Results Page - DNA Group Version

**Header:**
- "Your Spiritual Gifts Assessment Results"
- Disciple name
- Date completed

**Results Display:**

**Tier 1: How You Serve**
- Primary Gift: **[Gift Name]** (with icon)
- Secondary Gift: **[Gift Name]** (with icon)
- Synopsis: [Customized paragraph explaining this combination]

**Tier 2: Supernatural Empowerment**
- Primary Gift: **[Gift Name]**
- Secondary Gift: **[Gift Name]**
- Synopsis: [Customized paragraph]

**Tier 3: Leadership Calling**
- Primary Gift: **[Gift Name]**
- Secondary Gift: **[Gift Name]**
- Synopsis: [Customized paragraph]

**Footer Message:**
- "Your DNA Leader will guide you through activating these gifts in your next group session (Week 11)"
- Download PDF button
- Simple, clean, no distractions

### Results Page - Public Version

**Same results display as above, PLUS:**

**CTA Section 1: Immediate Value (Email Capture)**
- Headline: "Want your full results?"
- Subhead: "Download a detailed PDF with explanations of all your gifts"
- Email input field
- "Download PDF" button
- Also triggers email with link to results

**CTA Section 2: Free Teaching (Email Only)**
- Headline: "Learn How to Use Your Gifts"
- Subhead: "Get the 'Father of Lights' teaching + activation exercises for your specific gifts"
- "Get Free Teaching" button (uses email from CTA 1)
- If no email yet, shows email input

**CTA Section 3: Complete Bundle (Full Contact Info)**
- Headline: "Unlock Your Complete Discipleship Toolkit"
- Subhead: "Get everything you need to grow in your faith and activate your spiritual gifts"
- What's Included:
  - ✅ Full Spiritual Gifts Training (Father of Lights teaching)
  - ✅ Personalized Activation Exercises for Your 6 Gifts
  - ✅ ARK Identity App Access (3D Journal, 4D Prayer, Creed Cards)
  - ✅ DNA Training Dashboard (12-week discipleship roadmap)
  - ✅ Bonus: Introduction to DNA Groups in Your Area
- Form fields: Full Name, Email (pre-filled), Phone, Location (Zip Code)
- "Get My Toolkit" button

**Design Notes:**
- Progressive disclosure (CTAs unlock as user engages)
- Mobile-optimized
- Clear visual hierarchy
- Social proof (testimonials, stats)

### DNA Leader Dashboard Integration

**New Section: "Spiritual Gifts Assessments"**

**Features:**
- "Send Assessment to Disciples" button
  - Select disciples (checkboxes)
  - Choose delivery method (email/SMS)
  - Preview message
  - Send
- View all assessment results in a table
  - Disciple name
  - Date completed
  - Top 2 gifts preview
  - "View Full Results" link
- Export all results as CSV
- Filter by completion status (pending, completed)

**Pre-Week 11 Prep View:**
- Dashboard shows which disciples have/haven't completed assessment
- Leader can see summary of group's gift distribution
- "The group has strong gifts in Mercy (3), Teaching (2), Prophecy (4)..."

---

## Question Set Development

### Tier 1: Serving Gifts (Romans 12:6-8)
**30 questions total, ~4 per gift**

**Gift Categories:**
1. Prophecy (forthtelling truth)
2. Serving (practical helps)
3. Teaching (explaining Scripture)
4. Encouraging (speaking life)
5. Giving (generosity)
6. Leadership (organizing)
7. Mercy (compassion)

**Question Format:**
- Behavioral/experience only
- Mix of Likert scale and scenarios

**Examples:**

*Prophecy:*
- Likert: "I feel compelled to speak truth even when it's uncomfortable"
- Behavioral: "When I see someone living contrary to Scripture, I: a) Feel burdened to address it lovingly, b) Pray for them privately, c) Wait for them to ask, d) Assume it's not my place"

*Serving:*
- Likert: "I notice practical needs before others do"
- Behavioral: "At a group gathering, I am most likely to: a) Help set up/clean up, b) Lead discussion, c) Encourage attendees, d) Pray for people"

*Teaching:*
- Likert: "I enjoy breaking down complex biblical concepts into simple terms"
- Behavioral: "When someone asks a theological question, I: a) Explain it thoroughly with Scripture, b) Share my personal experience, c) Direct them to a resource, d) Pray with them about it"

### Tier 2: Supernatural Gifts (1 Corinthians 12:7-11)
**30 questions total, ~3 per gift**

**Gift Categories:**
1. Word of Wisdom
2. Word of Knowledge
3. Faith
4. Gifts of Healing
5. Miracles
6. Prophecy (rhema word)
7. Discerning of Spirits
8. Tongues
9. Interpretation of Tongues

**Question Format:**
- BOTH desire and experience questions
- Each gift gets ~1-2 desire questions + 1-2 experience questions

**Examples:**

*Gifts of Healing:*
- Desire: "I want to pray for the sick and see them healed"
- Experience: "I have prayed for someone with physical pain and they experienced relief"
- Behavioral: "When I hear someone is sick, I: a) Immediately want to pray for healing, b) Offer to help practically, c) Encourage them with Scripture, d) Trust God is in control"

*Prophecy (rhema):*
- Desire: "I want to hear God's 'now word' for specific people and situations"
- Experience: "I have spoken a prophetic word over someone that later proved accurate"
- Likert: "I often receive pictures, words, or impressions during prayer that are meant for others"

*Word of Knowledge:*
- Desire: "I want to receive supernatural insight about people or situations"
- Experience: "I have known something about a person or situation I couldn't have known naturally"
- Behavioral: "During prayer for someone, I: a) Wait for God to show me something, b) Pray Scripture over them, c) Ask them what they need, d) Speak encouragement"

### Tier 3: Leadership Calling (Ephesians 4:11)
**30 questions total, 6 per gift**

**Gift Categories:**
1. Apostle
2. Prophet
3. Evangelist
4. Shepherd/Pastor
5. Teacher

**Question Format:**
- Confirmation/calling questions (what others see + what you sense)
- Mix of Likert scale and scenarios

**Examples:**

*Apostle:*
- Confirmation: "Others have told me I have a gift for starting new things or building systems"
- Calling: "I feel called to establish kingdom culture in new environments"
- Likert: "I am energized by pioneering and building from scratch"
- Behavioral: "When I see a broken system, I: a) Envision how to rebuild it, b) Pray for those affected, c) Help within the current structure, d) Look for a better opportunity"

*Prophet:*
- Confirmation: "People have told me I see and hear from God in unique ways"
- Calling: "I feel a burden to speak what God is saying even if it's corrective"
- Likert: "I often see things in the spiritual realm that others miss"
- Behavioral: "When I sense God showing me something about the future, I: a) Share it with leadership, b) Pray about it privately, c) Wait for confirmation, d) Write it down for later"

*Evangelist:*
- Confirmation: "Others have noticed I'm naturally good at sharing my faith"
- Calling: "I feel most alive when reaching the lost"
- Likert: "I am burdened for people who don't know Jesus"
- Behavioral: "When I meet someone who doesn't know Christ, I: a) Look for opportunities to share the gospel, b) Build relationship first, c) Pray for them, d) Invite them to church"

*Shepherd/Pastor:*
- Confirmation: "People naturally come to me when they're hurting"
- Calling: "I feel called to care for and nurture God's people"
- Likert: "I am energized by one-on-one time with people"
- Behavioral: "When someone shares a struggle, I: a) Listen deeply and care for them, b) Give them advice, c) Pray for breakthrough, d) Direct them to resources"

*Teacher:*
- Confirmation: "Others have told me I explain Scripture clearly"
- Calling: "I feel called to equip the saints with sound doctrine"
- Likert: "I love studying the Bible and helping others understand it"
- Behavioral: "When I read Scripture, I: a) Think about how to teach it to others, b) Apply it personally, c) Look for prophetic insights, d) Pray it over people"

---

## PDF Generation

### Technology
- Use library like `puppeteer` (Node.js) or `react-pdf`
- Generate on server-side
- Store in S3 or similar (secure, private URLs)

### PDF Contents

**Page 1: Cover**
- "Your Spiritual Gifts Assessment Results"
- Name (if available)
- Date completed
- DNA Hub logo

**Page 2-3: Your Results**
- Same tier-by-tier breakdown as results page
- Primary + Secondary per tier
- Synopsis paragraphs
- Icons/graphics for each gift

**Page 4-6: Understanding Your Gifts**
- Detailed description of each of your 6 gifts
- Biblical foundation (Scripture references)
- Practical examples
- Common pitfalls to avoid

**Page 7: Identity Reminder**
- Brief "Father of Lights" excerpt
- "Your gifts don't define you - you are beloved first, gifted second"
- Identity safeguards

**Page 8: Next Steps**
- For DNA disciples: "Attend Week 11 with your DNA Group"
- For public users: CTAs for bundles/teaching

**Page 9: Activation Ideas**
- Brief activation exercise for each of your 6 gifts
- "Practice your gifts this week..."

**Footer on every page:**
- DNA Hub branding
- "Learn more at dnahub.com/gifts"

---

## Email Sequences

### DNA Group Disciple Email

**Subject:** "Your Spiritual Gifts Assessment Results"

**Body:**
```
Hi [Name],

You've completed your Spiritual Gifts Assessment!

Your results are ready and have been shared with your DNA Leader, [Leader Name],
who will guide you through activating these gifts in your upcoming Week 11 session.

VIEW YOUR RESULTS: [Link to results page]

DOWNLOAD PDF: [Attached or link]

Your Top Gifts:
- Tier 1: [Primary], [Secondary]
- Tier 2: [Primary], [Secondary]
- Tier 3: [Primary], [Secondary]

We're excited to see how God uses these gifts in you!

Blessings,
The DNA Hub Team
```

### Public User Email Sequence

**Email 1: Results Delivery (Immediate)**

**Subject:** "Your Spiritual Gifts Assessment Results 🎁"

**Body:**
```
Hi [Name],

Thanks for taking the Spiritual Gifts Assessment!

Your top gifts are:
- [Primary gift from Tier 1]
- [Primary gift from Tier 2]
- [Primary gift from Tier 3]

VIEW FULL RESULTS: [Link]
DOWNLOAD PDF: [Attached]

Want to learn how to activate these gifts?

GET FREE TEACHING: [Link to Father of Lights + activation exercises]

This includes:
- Father of Lights teaching on spiritual gifts
- Personalized activation exercises for your gifts
- Practical next steps

[CTA Button: Get Free Teaching]

Blessings,
The ARK Identity Team
```

**Email 2: Father of Lights Teaching (Day 2)**

**Subject:** "How to Use Your Spiritual Gifts (Without Losing Your Identity)"

**Body:**
```
Hi [Name],

You discovered your spiritual gifts - that's exciting!

But here's the question: How do you use your gifts without making them your identity?

That's what today's teaching is about.

GET THE FATHER OF LIGHTS TEACHING: [Link]

This free resource will help you:
- Understand that you're beloved FIRST, gifted SECOND
- Avoid the trap of identity-based ministry
- Activate your gifts from a place of rest, not performance

[CTA: Download Teaching]

Still want more? Check out our Complete Discipleship Toolkit...
[Link to bundle]

Blessings,
Travis
```

**Email 3: Complete Toolkit Offer (Day 5)**

**Subject:** "Everything You Need to Grow in Your Faith"

**Body:**
```
Hi [Name],

Over the past few days, you've:
- Discovered your spiritual gifts
- Learned how to use them without losing your identity

Now imagine having a complete toolkit to grow in your faith:

THE DISCIPLESHIP STARTER BUNDLE includes:
✅ 3D Journal (hear God through Scripture)
✅ 4D Prayer Rhythm (daily prayer guide)
✅ Creed Cards (theological foundation)
✅ DNA Training Dashboard (12-week roadmap)
✅ Personalized activation exercises for your gifts

This is everything we use in our DNA Groups - and you can access it for FREE.

[CTA: Claim Your Toolkit]

We just need a bit more info to set up your account:
- Full Name
- Phone
- Location (so we can connect you with local resources)

Ready to go deeper?

[CTA Button: Get My Toolkit]

Blessings,
Travis
```

**Email 4: Invitation to DNA Groups (Day 10)**

**Subject:** "You don't have to do this alone"

**Body:**
```
Hi [Name],

Spiritual gifts are meant to be used in community.

That's why we created DNA Groups - small discipleship communities where you can:
- Activate your gifts with others
- Grow in your faith through intentional discipleship
- Experience the Body of Christ functioning together

Interested in learning more about DNA Groups?

[Link to DNA Groups overview]

Or ready to find a group near you?

[Link to group finder or contact form]

You were made for community.

Blessings,
Travis
```

---

## Phase 1A: Core Assessment (Week 1)

### Tasks

**Database Setup:**
- [x] Create migration file for 3 new tables (`021_spiritual-gifts-assessment.sql`)
- [ ] Seed questions table with 90 questions (questions drafted, pending review)
- [ ] Test database schema locally

**API Development:**
- [ ] `/api/spiritual-gifts/start` endpoint
- [ ] `/api/spiritual-gifts/submit-response` endpoint
- [ ] `/api/spiritual-gifts/complete` endpoint
- [ ] `/api/spiritual-gifts/results/:token` endpoint
- [ ] Build scoring algorithm
- [ ] Build synopsis generation logic

**Frontend - Assessment UI:**
- [ ] Create `/spiritual-gifts/assessment` page
- [ ] Build question display component (Likert + behavioral)
- [ ] Progress bar component
- [ ] Auto-save responses (local storage + API)
- [ ] Submit and calculate results flow

**Frontend - Results Page:**
- [ ] Create base results page component
- [ ] Tier display components (primary + secondary gifts)
- [ ] Synopsis rendering
- [ ] Responsive design (mobile-first)

**PDF Generation:**
- [ ] Set up PDF generation library
- [ ] Create PDF template
- [ ] Generate PDF on completion
- [ ] Store PDF (S3 or local storage for MVP)

**Email:**
- [ ] Set up email templates (Resend)
- [ ] Trigger email on assessment completion
- [ ] Attach or link PDF

**Testing:**
- [ ] Test full assessment flow end-to-end
- [ ] Test scoring algorithm accuracy
- [ ] Test PDF generation
- [ ] Test email delivery

---

## Phase 1B: DNA Groups Integration (Week 1-2)

### Tasks

**Database:**
- [ ] Add foreign keys linking assessments to disciples/groups
- [ ] Test data relationships

**API Development:**
- [ ] `/api/dna-leaders/send-assessment` endpoint
- [ ] Generate unique tokens per disciple
- [ ] `/api/dna-leaders/assessment-results/:group_id` endpoint
- [ ] `/api/disciples/my-assessment` endpoint

**DNA Leader Dashboard:**
- [ ] Add "Spiritual Gifts" section to group dashboard
- [ ] "Send Assessment" button + UI
- [ ] Select disciples (checkboxes)
- [ ] Email/SMS notification system
- [ ] View all results table
- [ ] "View Full Results" modal/page per disciple
- [ ] Track completion status (pending/completed)

**Disciple Experience:**
- [ ] Disciple receives email/SMS with unique link
- [ ] Link auto-tags assessment as `source=dna_group`
- [ ] Assessment saves disciple_id, group_id, leader_id
- [ ] On completion, shows DNA Group version of results page
- [ ] Results auto-saved to dashboard
- [ ] PDF emailed to disciple

**DNA Group Results Page:**
- [ ] Simple, clean version of results
- [ ] "Your leader will guide you through activation" message
- [ ] Download PDF button
- [ ] No lead gen CTAs

**Leader Prep for Week 11:**
- [ ] Leader can view all disciple results before session
- [ ] Dashboard shows group gift distribution summary
- [ ] Export results as CSV (optional)

**Testing:**
- [ ] Test leader sending assessment to multiple disciples
- [ ] Test disciple receiving and completing assessment
- [ ] Test results appearing in leader dashboard
- [ ] Test email notifications
- [ ] Test unique link tracking

---

## Phase 2: Public Tool (Week 2-3)

### Tasks

**Landing Page:**
- [ ] Create `/gifts` or `dnahub.com/gifts` landing page
- [ ] SEO optimization (meta tags, schema markup)
- [ ] Clear value proposition
- [ ] "Take the Assessment" CTA
- [ ] Social proof (testimonials, stats)
- [ ] Mobile-responsive design

**Public Results Page:**
- [ ] Enhanced version of results page with CTAs
- [ ] CTA 1: Download PDF (email capture)
- [ ] CTA 2: Free teaching (email only)
- [ ] CTA 3: Complete bundle (full contact info)
- [ ] Form validation and submission
- [ ] Progressive disclosure (unlock CTAs as user engages)

**Lead Capture API:**
- [ ] `/api/spiritual-gifts/claim-bundle` endpoint
- [ ] Update assessment record with contact info
- [ ] Trigger email sequence
- [ ] Create ARK Identity app account (or guest access)
- [ ] Return app access link

**Email Sequences:**
- [ ] Email 1: Results delivery (immediate)
- [ ] Email 2: Father of Lights teaching (Day 2)
- [ ] Email 3: Complete toolkit offer (Day 5)
- [ ] Email 4: DNA Groups invitation (Day 10)
- [ ] Set up email automation (Resend or similar)

**Father of Lights Teaching Delivery:**
- [ ] Create downloadable PDF or web page
- [ ] Host activation exercises (PDF or interactive page)
- [ ] Link from email

**Discipleship Bundle Access:**
- [ ] Create ARK Identity app onboarding flow
- [ ] Grant access to 3D Journal, 4D Prayer, Creed Cards
- [ ] Grant access to DNA Training Dashboard
- [ ] Send welcome email with instructions

**Analytics:**
- [ ] Track assessment starts
- [ ] Track completions
- [ ] Track email captures (CTA 1)
- [ ] Track bundle claims (CTA 3)
- [ ] Track conversion funnel
- [ ] Google Analytics / Plausible integration

**SEO & Marketing:**
- [ ] Optimize landing page for "spiritual gifts assessment" keywords
- [ ] Add schema markup for better search results
- [ ] Create social share cards (Open Graph)
- [ ] Add social share buttons to results page
- [ ] Plan organic content strategy (blog posts, social media)

**Testing:**
- [ ] Test public user flow end-to-end
- [ ] Test lead capture forms
- [ ] Test email sequence delivery
- [ ] Test bundle access provisioning
- [ ] Test SEO elements (meta tags, structured data)
- [ ] Cross-browser testing
- [ ] Mobile testing

---

## Content Creation

### Required Content Assets

**Assessment Questions:**
- [x] Write 30 Tier 1 questions (serving gifts) - DRAFT COMPLETE (see `/docs/planning/Spiritual-Gifts-Questions-DRAFT.md`)
- [x] Write 30 Tier 2 questions (supernatural gifts) - DRAFT COMPLETE
- [x] Write 30 Tier 3 questions (leadership calling) - DRAFT COMPLETE
- [ ] Review for clarity, bias, theological accuracy (IN PROGRESS - awaiting your review)
- [ ] Get feedback from test users

**Synopsis Templates:**
- [ ] Write synopses for all Tier 1 gift combinations (7 primary x 6 secondary = 42 combinations)
- [ ] Write synopses for all Tier 2 gift combinations (9 x 8 = 72 combinations)
- [ ] Write synopses for all Tier 3 gift combinations (5 x 4 = 20 combinations)
- [ ] Total: ~134 unique synopses (or use fallback to individual gift descriptions)

**Gift Descriptions:**
- [ ] Write detailed description for each of 21 gifts
- [ ] Include biblical foundation, practical examples, common pitfalls
- [ ] Use in PDF and results pages

**Activation Exercises:**
- [ ] Write activation exercise for each of 21 gifts
- [ ] Keep practical, actionable, specific
- [ ] Use in PDF and post-assessment content

**Father of Lights Teaching:**
- [ ] Format existing content as downloadable PDF
- [ ] Optional: Create video version
- [ ] Include identity safeguards

**Landing Page Copy:**
- [ ] Headline, subhead, value prop
- [ ] Social proof (testimonials)
- [ ] FAQ section
- [ ] CTA copy

**Email Copy:**
- [ ] Write 4 emails in sequence
- [ ] Subject lines, body copy, CTAs
- [ ] A/B test subject lines

---

## Success Metrics

### DNA Groups (Private)

**Engagement Metrics:**
- % of disciples completing assessment before Week 11
- Average time to complete assessment
- Leader satisfaction (qualitative feedback)

**Quality Metrics:**
- Do results align with leader's observations?
- Do disciples feel results are accurate?
- Does Week 11 activation session go smoothly?

### Public Tool (Lead Gen)

**Funnel Metrics:**
- Landing page visitors
- Assessment starts
- Assessment completions (completion rate)
- Email captures (CTA 1)
- Bundle claims (CTA 3)
- Conversion rate (visitor → bundle claim)

**Engagement Metrics:**
- Email open rates
- Email click-through rates
- Time spent on results page
- PDF downloads

**Lead Quality:**
- % of leads that engage with ARK Identity app
- % of leads that inquire about DNA Groups
- Long-term discipleship engagement

**SEO Metrics:**
- Organic search traffic
- Keyword rankings ("spiritual gifts assessment")
- Backlinks
- Social shares

---

## Timeline Summary

### Week 1: Core Assessment + DNA Integration
- Days 1-3: Database, API, scoring algorithm
- Days 4-5: Assessment UI, results page (DNA version)
- Days 6-7: PDF generation, email delivery, testing

### Week 2: DNA Dashboard Integration + Public Foundation
- Days 1-3: Leader dashboard features (send assessment, view results)
- Days 4-5: Public results page with CTAs
- Days 6-7: Landing page, lead capture API

### Week 3: Public Launch + Email Sequences
- Days 1-2: Email sequence setup
- Days 3-4: Bundle access provisioning (ARK Identity app integration)
- Days 5-6: Testing, SEO optimization
- Day 7: Soft launch to small audience

### Week 4+: Iterate & Optimize
- Monitor analytics
- Gather user feedback
- Refine questions, synopses, CTAs
- A/B test landing page and emails
- Scale marketing efforts

---

## Technical Stack

**Frontend:**
- Next.js 16 (existing stack)
- React 19
- Tailwind CSS 4
- Form validation: React Hook Form or similar

**Backend:**
- Next.js API routes
- Supabase (PostgreSQL database)
- Supabase Auth (existing user sessions)

**Email:**
- Resend (existing integration)
- Email templates (React Email or similar)

**PDF Generation:**
- `puppeteer` or `react-pdf`
- Store PDFs in Supabase Storage or S3

**Analytics:**
- Plausible or Google Analytics
- Track custom events (assessment started, completed, email captured, etc.)

**Hosting:**
- Vercel (existing deployment)

---

## ✅ Decisions Made

1. **ARK Identity App Integration:** ✅ RESOLVED
   - App is free at `app.arkidentity.com` - no special provisioning needed
   - Frame as part of "bundle" for perceived value
   - Simple link in email delivery

2. **DNA Training Dashboard Access:** ✅ RESOLVED
   - Inside ARK app (just a link)
   - Build "DNA Introduction Landing Page" for public users to explain DNA before linking to training
   - Gives context to first-time users

3. **Synopsis Generation:** ✅ RESOLVED
   - Pre-write all 134 combinations for quality
   - Travis will review for theological accuracy

4. **Question Review:** ✅ RESOLVED
   - Travis will validate all 90 questions for theological accuracy
   - Questions drafted and ready for review (see `/docs/planning/Spiritual-Gifts-Questions-DRAFT.md`)

5. **Public Launch Strategy:** ✅ RESOLVED
   - Soft launch first (no paid ads initially)
   - Marketing strategy discussion postponed
   - Focus on building it right first

6. **Pricing (Future):** ✅ RESOLVED
   - Free for now
   - Church licensing TBD for future discussion

---

## ✅ Completed So Far

1. ✅ **Week 11 Session Content** - Complete and ready (see `/docs/planning/Week-11-Spiritual-Gifts.md`)
2. ✅ **Implementation Plan** - Comprehensive plan created and approved
3. ✅ **Database Migration** - Created `/database/021_spiritual-gifts-assessment.sql` (3 tables, RLS policies, indexes)
4. ✅ **90 Questions Drafted** - All questions written, awaiting theological review (see `/docs/planning/Spiritual-Gifts-Questions-DRAFT.md`)
5. ✅ **All Decisions Made** - All open questions resolved

## 🚧 Next Steps (For Next Session)

1. **Review Questions** - Travis to review all 90 questions for theological accuracy and clarity
2. **Build API Endpoints** - Start Phase 1A API development
3. **Build Assessment UI** - Frontend components for assessment flow
4. **Scoring Algorithm** - Implement tier-specific scoring logic
5. **Synopsis Writing** - Begin drafting 134 gift combination synopses

---

## Notes

- This is an ambitious but achievable plan
- Phased approach allows us to launch DNA Groups integration first (highest priority)
- Public tool can launch incrementally (Phase 2)
- Content creation (questions, synopses) is the biggest lift
- Consider involving beta testers from existing DNA Groups to validate questions and results

**Let's build this!** 🚀
