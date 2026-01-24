# DNA Church Onboarding Hub - Implementation Plan

**Last Updated:** January 7, 2026  
**Project:** DNA Church Onboarding System  
**Developer:** Claude Code  
**Timeline:** 3-week build

---

## Overview

Build a simple, uncluttered onboarding hub for churches that have committed to implementing DNA discipleship. This is NOT a public marketing site—it's a private resource center accessible only via direct link.

**Core Purpose:**
- Guide churches through assessment → strategy call → launch
- Provide essential resources for DNA implementation
- Track church data for Travis's follow-up and support

---

## Technical Stack

**Frontend:** Next.js (or current DNA website framework)  
**Database:** Supabase (NEW separate project for churches)  
**Hosting:** Same server as dna.arkidentity.com  
**File Storage:** Same server (PDFs, videos already hosted)  
**Email:** None yet (manual follow-up for now)  
**Scheduling:** Embedded Google Calendar

---

## Database Architecture

### New Supabase Project: `dna-churches`

**Why separate?**
- Clean separation from ARK app user database
- Different access patterns (church partners vs individual disciples)
- Easier to add church authentication later
- Independent scaling

### Tables

#### `churches`
```sql
CREATE TABLE churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_name TEXT NOT NULL,
  lead_pastor TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  city TEXT,
  state TEXT,
  status TEXT CHECK (status IN ('pending_assessment', 'assessment_complete', 'strategy_scheduled', 'active', 'launched')) DEFAULT 'pending_assessment',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assessment_completed_at TIMESTAMP WITH TIME ZONE,
  strategy_call_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  CONSTRAINT email_format CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);
```

#### `church_assessments`
```sql
CREATE TABLE church_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  attendance_size TEXT,
  discipleship_culture TEXT,
  existing_structures JSONB,
  primary_champion TEXT,
  potential_leaders_count TEXT,
  leaders_experienced TEXT,
  biggest_concern TEXT,
  launch_timeline TEXT,
  initial_group_count TEXT,
  driving_interest TEXT,
  success_vision TEXT,
  primary_goal TEXT,
  measurement_methods JSONB,
  potential_barriers JSONB,
  leadership_buy_in TEXT,
  support_needed JSONB,
  leader_availability TEXT,
  training_preference TEXT,
  annual_budget TEXT,
  additional_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Supabase Configuration

**Email Notifications (for Travis):**
- Enable Supabase email notifications on new row insert in `church_assessments`
- Or use database webhook to trigger notification
- Travis receives: "New church assessment from [Church Name]"

**Row Level Security (RLS):**
- For now: Disable RLS (only Travis has access)
- Future: Enable when adding church login feature

---

## URL Structure

### Pages to Build

1. **Main Hub:** `dna.arkidentity.com/onboarding`
2. **Assessment Form:** `dna.arkidentity.com/onboarding/church-assessment`
3. **Thank You Page:** `dna.arkidentity.com/onboarding/thank-you`

### Access Control
- No authentication required (link-only access)
- URLs not indexed by search engines (add `noindex` meta tag)
- Not linked from public DNA website navigation

---

## Page Specifications

## 1. Main Onboarding Hub (`/onboarding`)

### Hero Section
```
Headline (H1): Welcome to DNA Implementation
Subheadline (H2): You've committed to multiplying disciple-makers. Here's how we'll partner with you.
```

### Section 1: Your Next Steps

**Visual: Numbered list (large, clear numbers)**

**1. Complete Your Church Assessment (10 minutes)**  
Help us understand your context so we can support you well.

- If assessment not completed: [Button: Start Assessment]
- If completed: [✓ Completed on MM/DD/YYYY]

**2. Schedule Your Strategy Call (60 minutes)**  
We'll create a custom launch plan for your church.

[Embedded Google Calendar iframe - 60 min booking option]

**3. Order Physical DNA Manuals**  
Leaders need the manual. Order on Amazon for fastest delivery.

[Button: View on Amazon] → Link to: [INSERT AMAZON URL]

**4. Download Leader Identification Worksheet**  
Who should lead your first DNA groups? Use this tool to decide.

[Button: Download Worksheet (PDF)]

---

### Section 2: Essential Resources

**Organized in 3 columns (or accordion on mobile):**

**Column 1: For Church Leadership**
- 📄 DNA Launch Timeline Template (PDF)
- 📄 Vision Casting Guide (PDF)
- 📄 Leader Recruitment Email Templates (PDF)

**Column 2: For DNA Leaders**
- 🎥 Leader Orientation Video (Available after strategy call)
- 📄 DNA Group Agreement Templates (PDF - 3 versions)
- 📄 Weekly Meeting Facilitation Guide (PDF)

**Column 3: Graphics & Promotion**
- 🎨 Social Media Graphics (ZIP)
- 🎨 Church Slide Templates (PowerPoint)
- 🎥 Promotional Video (MP4)

**Design Note:** Clean, grid layout. Icons for visual interest. Download buttons for each resource.

---

### Section 3: Ongoing Support

**Monthly DNA Leaders Call**  
Join Travis and other DNA leaders for live Q&A, troubleshooting, and encouragement.

[Button: Join Next Call] → Google Meet link  
*Next call: [Date & Time] - Add this dynamically or manually update*

**Need Help?**  
[Button: Schedule Office Hours with Travis]  
*Embedded Google Calendar iframe - 30 min booking option*

---

### Footer
Simple text: Questions? Email travis@arkidentity.com

---

## 2. Church Assessment Form (`/onboarding/church-assessment`)

### Form Structure

**Header:**
```
Headline (H1): DNA Church Onboarding Assessment
Subheadline: Help us understand your context (10-15 minutes)
```

**Form Fields:**

#### Section 1: Church Context

1. **Church Name*** (text input, required)
2. **Lead Pastor Name** (text input)
3. **Your Name & Role*** (text input, required)  
   Placeholder: "e.g., John Smith, Executive Pastor"
4. **Church Location*** (2 fields: City, State - both required)
5. **Average Weekend Attendance*** (select dropdown)
   - Under 50
   - 50-100
   - 100-250
   - 250-500
   - 500-1,000
   - 1,000+

6. **How would you describe your church's current discipleship culture?*** (select dropdown)
   - We don't really have one—people attend but don't go deeper
   - We have programs but limited life-on-life discipleship
   - We have some people discipling others but it's inconsistent
   - We have an active discipleship culture but want to multiply it
   - Other: [text field appears if selected]

7. **What existing small group or discipleship structures do you currently have?** (checkboxes, multiple select)
   - Sunday School classes
   - Small groups (Bible studies, life groups, etc.)
   - One-on-one mentoring
   - Formal discipleship programs
   - Classes/seminars (Alpha, membership class, etc.)
   - None currently
   - Other: [text field]

---

#### Section 2: Leadership Readiness

8. **Who will be the primary DNA champion/coordinator at your church?*** (select dropdown)
   - Lead Pastor
   - Associate/Executive Pastor
   - Discipleship Pastor/Director
   - Small Groups Director
   - Lay leader/volunteer
   - Not decided yet

9. **How many potential DNA leaders (people ready to lead groups) do you currently have?*** (select dropdown)
   - 0-2
   - 3-5
   - 6-10
   - 10+
   - Not sure yet

10. **Have any of your leaders personally experienced life-on-life discipleship before?*** (select dropdown)
    - Yes, many have
    - A few have
    - No, this will be new for most
    - Not sure

11. **How often are your potential DNA leaders available for training/equipping?*** (select dropdown)
    - Weekly (ongoing support/coaching)
    - Bi-weekly
    - Monthly
    - Quarterly
    - Intensive weekend(s) upfront, then occasional check-ins
    - Self-paced online with optional Q&A calls
    - Not sure yet—need to assess availability

12. **How would you prefer to train/equip your DNA leaders?*** (select dropdown)
    - In-person at our church (you come to us)
    - In-person intensive (we come to you for training weekend)
    - Live video meetings (Zoom/Google Meet group training)
    - Self-paced online course with videos/resources
    - Hybrid (initial in-person kickoff + ongoing video support)
    - Not sure yet—open to recommendations

13. **What's your annual budget for leadership development/training?** (select dropdown, optional)
    - Under $500
    - $500-$1,500
    - $1,500-$5,000
    - $5,000+
    - No dedicated budget currently
    - Not sure/Need to check

14. **What's your biggest concern about launching DNA?*** (select dropdown)
    - Finding leaders who are ready
    - Getting people to commit long-term (6-12 months)
    - Competing with existing programs
    - Leaders feeling unqualified or fearful
    - Lack of buy-in from church leadership
    - Sustainability—keeping it going after initial launch
    - Other: [text field appears if selected]

---

#### Section 3: Implementation Timeline

15. **When would you ideally like to launch your first DNA groups?*** (select dropdown)
    - Within 1 month
    - 1-3 months
    - 3-6 months
    - 6-12 months
    - Just exploring right now, no timeline yet

16. **How many DNA groups do you hope to launch initially?*** (select dropdown)
    - 1-2 groups (pilot test)
    - 3-5 groups
    - 6-10 groups
    - 10+ groups
    - Not sure yet

17. **What's driving your interest in DNA discipleship right now?*** (textarea, required)  
    Placeholder: "Tell us what prompted you to pursue DNA..."

---

#### Section 4: Expectations & Vision

18. **What does success look like for DNA at your church in 12 months?*** (textarea, required)  
    Placeholder: "Be specific..."

19. **What's the #1 thing you hope DNA will accomplish in your church?*** (select dropdown)
    - Develop mature believers who can lead
    - Create a culture of multiplication
    - Deepen relationships and community
    - Raise up new leaders for ministry
    - Move people from attendance to discipleship
    - Other: [text field]

20. **How will you measure whether DNA is working?** (checkboxes, multiple select, optional)
    - Number of groups launched
    - Number of leaders developed
    - Stories of spiritual growth/transformation
    - Groups multiplying into new groups
    - Increased engagement in church life
    - Not sure yet
    - Other: [text field]

---

#### Section 5: Potential Barriers

21. **What obstacles might prevent DNA from succeeding at your church?** (checkboxes, multiple select, optional)
    - Busy schedules—people struggle to commit
    - Existing programs competing for time/energy
    - Lack of leadership buy-in
    - Cultural resistance to change
    - Leaders feeling unqualified
    - No clear communication/launch strategy
    - Financial constraints
    - Other: [text field]

22. **Is your church leadership (elders/board/lead pastor) fully on board with launching DNA?*** (select dropdown)
    - Yes, fully supportive
    - Mostly supportive, a few questions remain
    - Leadership is exploring but not committed yet
    - Not sure yet

23. **What support do you need most from ARK Identity to make this successful?** (checkboxes, multiple select, optional)
    - Leader training (how to facilitate DNA groups)
    - Help communicating DNA vision to the church
    - Ongoing coaching for DNA leaders
    - Troubleshooting common challenges
    - Resources (printed materials, digital tools, etc.)
    - Strategy session for customizing DNA to our context
    - Other: [text field]

---

#### Section 6: Follow-Up

24. **Best email to reach you:*** (email input, required, validate format)
25. **Best phone number:** (tel input, optional)
26. **Anything else we should know about your church or context?** (textarea, optional)  
    Placeholder: "Share anything else that would help us serve you well..."

---

### Form Actions

**Submit Button:** [Large button] Submit Assessment

**On Submit:**
1. Validate all required fields
2. Create new record in `churches` table
3. Create new record in `church_assessments` table (linked by church_id)
4. Send Supabase notification to Travis
5. Redirect to `/onboarding/thank-you`

**Error Handling:**
- Highlight missing required fields in red
- Show validation errors inline
- Don't lose form data on error (preserve inputs)

---

## 3. Thank You Page (`/onboarding/thank-you`)

### Content

**Headline (H1):** Assessment Received ✓

**Body Text:**
```
Thanks for completing your DNA Church Assessment!

What happens next:
1. We'll review your responses within 24-48 hours
2. You'll receive an email to schedule your strategy call
3. We'll customize a launch plan based on your context

While you wait:
```

**Action Buttons:**
- [Button: Return to Onboarding Hub] → Link to `/onboarding`
- [Button: Download Leader Identification Worksheet] → PDF download
- [Button: Review DNA Materials] → Link to main DNA resources (Manual, Launch Guide, Toolkit PDFs)

**Footer:** Questions? Email travis@arkidentity.com

---

## Resources to Create/Upload

### PDFs to Create (Travis or Claude to design)

1. **Leader Identification Worksheet**
   - See detailed content spec below
   - 2-3 page PDF
   - Fillable or printable

2. **DNA Launch Timeline Template**
   - Sample 8-12 week timeline
   - Customizable for different church sizes
   - Milestones and checkpoints

3. **Vision Casting Guide**
   - Sample sermon/talk outline for DNA launch
   - Key talking points
   - Answers to common objections

4. **Leader Recruitment Email Templates**
   - 3-4 email templates for inviting leaders
   - Subject lines and body copy
   - Copy/paste ready

5. **Weekly Meeting Facilitation Guide**
   - Quick reference for DNA leaders
   - Meeting structure reminders
   - Troubleshooting tips

### Files Already Available
- DNA Discipleship Manual (PDF)
- DNA Launch Guide (PDF)
- DNA 8-Week Toolkit (PDF)

### Graphics & Media (to be provided by Travis)
- Social media graphics (PNG, ZIP file)
- Church slide templates (PowerPoint)
- Promotional video (MP4)
- Leader orientation video (hosted on YouTube/Vimeo, embed link)

---

## Leader Identification Worksheet - Full Content Spec

### PDF Title: "Who Should Lead DNA Groups?"

**Page 1: Instructions**

**Header:** Leader Identification Worksheet

**Purpose:**
Help you identify which leaders in your church are ready to lead DNA groups.

**Instructions:**
1. List 10-15 potential leaders from your church
2. Rate each person on the criteria below (1-5 scale, where 1 = weak, 5 = strong)
3. Total their score (out of 100 possible points)
4. Invite your top scorers to DNA leader training

**Scoring Guide:**
- **80-100 points:** Ready now - Invite to first wave of DNA leaders
- **60-79 points:** Almost ready - Could co-lead or join second wave
- **40-59 points:** Needs development - Consider discipling them first
- **Below 40:** Not ready yet - Continue investing, reassess in 6 months

---

**Page 2: Evaluation Criteria**

**Rate each potential leader on these 20 criteria (1-5 scale):**

**SPIRITUAL MATURITY (20 points possible)**
- [ ] Walks closely with God (consistent devotional life)
- [ ] Demonstrates fruit of the Spirit regularly
- [ ] Free from lifestyle sin or bondage
- [ ] Can articulate the gospel clearly

**LEADERSHIP CAPACITY (20 points possible)**
- [ ] Currently serving or leading in some capacity
- [ ] People naturally follow them
- [ ] Reliable and follows through on commitments
- [ ] Can handle correction without defensiveness

**RELATIONAL HEALTH (20 points possible)**
- [ ] Has healthy relationships (marriage, family, friends)
- [ ] Others trust them and open up to them
- [ ] Not isolated or constantly in conflict
- [ ] Creates safe space for vulnerability

**AVAILABILITY (20 points possible)**
- [ ] Has 5-7 hours/week margin for DNA (meeting + prep + follow-up)
- [ ] Life is stable enough to commit for 6-12 months
- [ ] Not overcommitted or drowning in chaos
- [ ] Can prioritize DNA as a top commitment

**HEART FOR DISCIPLESHIP (20 points possible)**
- [ ] Expresses desire to see others grow
- [ ] Already invests in people informally
- [ ] Asks questions and seeks to understand
- [ ] Patient with people's process

---

**Page 3: Evaluation Grid**

**Top 10 Potential DNA Leaders:**

| # | Name | Spiritual Maturity (20) | Leadership (20) | Relational (20) | Availability (20) | Heart (20) | **TOTAL** | Notes |
|---|------|------------------------|----------------|----------------|------------------|-----------|-----------|-------|
| 1 |      |                        |                |                |                  |           |           |       |
| 2 |      |                        |                |                |                  |           |           |       |
| 3 |      |                        |                |                |                  |           |           |       |
| 4 |      |                        |                |                |                  |           |           |       |
| 5 |      |                        |                |                |                  |           |           |       |
| 6 |      |                        |                |                |                  |           |           |       |
| 7 |      |                        |                |                |                  |           |           |       |
| 8 |      |                        |                |                |                  |           |           |       |
| 9 |      |                        |                |                |                  |           |           |       |
| 10|      |                        |                |                |                  |           |           |       |

---

**Bottom of Page 3:**

**PRAYER:**
Spend time praying over this list. Ask God:
- Who should I invite first?
- Am I missing anyone?
- Is there someone unexpected You're highlighting?

The Holy Spirit often confirms names or surprises us with someone we didn't consider.

**NEXT STEPS:**
1. Circle your top 5-7 scorers
2. Begin praying for them by name this week
3. Schedule informal coffee conversations to gauge interest
4. Invite them to DNA leader training after your strategy call

---

## Google Calendar Embed Code

**Travis will provide:**
- 30-minute booking link (for office hours)
- 60-minute booking link (for strategy call)

**Implementation:**
```html
<!-- 60-minute Strategy Call -->
<div class="calendar-embed">
  <h3>Schedule Your 60-Minute Strategy Call</h3>
  <iframe 
    src="[TRAVIS'S GOOGLE CALENDAR EMBED URL]" 
    style="border: 0" 
    width="100%" 
    height="600" 
    frameborder="0"
    title="Schedule DNA Strategy Call">
  </iframe>
</div>

<!-- 30-minute Office Hours -->
<div class="calendar-embed">
  <h3>Quick Questions? Book 30-Minute Office Hours</h3>
  <iframe 
    src="[TRAVIS'S GOOGLE CALENDAR EMBED URL]" 
    style="border: 0" 
    width="100%" 
    height="600" 
    frameborder="0"
    title="Schedule Office Hours">
  </iframe>
</div>
```

**Mobile Optimization:**
- Calendars should stack vertically on mobile
- Consider "Open in new tab" button for small screens

---

## Design Guidelines

### Visual Style: DNA Brand

**Color Palette:**
- Primary: Warm cream/gold (#F4E7D7 or similar)
- Secondary: Warm brown/earth tones
- Accent: Deep teal or muted blue
- Text: Dark charcoal (not pure black)

**Typography:**
- Headings: Clean sans-serif (Inter, Open Sans, or similar)
- Body: Readable serif or sans-serif
- Line height: 1.6-1.8 for body text
- Font size: Minimum 16px for body text

**Layout Principles:**
- **Ample white space** - Don't cram
- **Single column on mobile** - Stack everything vertically
- **Clear visual hierarchy** - Size and weight differentiate importance
- **Scannable sections** - Use headings, lists, and visual breaks

**Tone:**
- Warm and approachable (not corporate)
- "Trusted mentor walking beside you"
- Clear and action-oriented (not fluffy)
- Encouraging but realistic

### Component Patterns

**Buttons:**
- Primary action: Solid color with white text
- Secondary action: Outline style
- Min height: 48px (mobile-friendly tap target)
- Border radius: 8px (rounded but not pill-shaped)

**Cards/Sections:**
- Light background with subtle border or shadow
- Padding: 24-32px
- Border radius: 12px
- Don't over-design—keep clean

**Icons:**
- Simple line icons (Feather, Heroicons, or similar)
- Consistent stroke width
- Use sparingly for visual interest

**Forms:**
- Clear labels above inputs
- Placeholder text for examples
- Required fields marked with *
- Inline validation (show errors immediately)
- Large, easy-to-tap inputs on mobile

---

## SEO & Accessibility

### Meta Tags (All Pages)

```html
<meta name="robots" content="noindex, nofollow">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

**Why noindex?**
- This is a private onboarding hub, not public content
- Should not appear in search results
- Only accessible via direct link

### Accessibility Requirements

- Semantic HTML (proper heading hierarchy)
- Alt text for all images
- Form labels properly associated with inputs
- Color contrast meets WCAG AA standards
- Keyboard navigation works throughout
- Focus states visible on interactive elements

---

## 3-Week Build Timeline

### Week 1: Foundation

**Tasks:**
- [ ] Set up new Supabase project: `dna-churches`
- [ ] Create database tables (`churches`, `church_assessments`)
- [ ] Configure Supabase email notifications to Travis
- [ ] Build `/onboarding` main hub page (HTML structure)
- [ ] Build `/onboarding/church-assessment` form (all fields)
- [ ] Build `/onboarding/thank-you` page
- [ ] Test form submission → Supabase → notification

**Deliverable:** All 3 pages functional, form saves to database

---

### Week 2: Content & Resources

**Tasks:**
- [ ] Apply DNA brand styling to all pages
- [ ] Mobile responsive optimization
- [ ] Create "Leader Identification Worksheet" PDF
- [ ] Upload all resource PDFs to server
- [ ] Build file download functionality (secure links)
- [ ] Embed Google Calendar iframes (Travis provides URLs)
- [ ] Add Amazon link for DNA Manual
- [ ] Test all download links and calendar embeds

**Deliverable:** Fully styled, all resources accessible

---

### Week 3: Polish & Testing

**Tasks:**
- [ ] Form validation refinement (error messages, UX)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile device testing (iOS, Android)
- [ ] Page load speed optimization
- [ ] Fix any bugs or UX issues
- [ ] Final design polish
- [ ] Create documentation for Travis (how to update content)
- [ ] Deploy to production

**Deliverable:** Production-ready onboarding hub

---

## Testing Checklist

### Form Testing
- [ ] All required fields trigger validation
- [ ] Email field validates proper format
- [ ] Checkboxes and dropdowns work correctly
- [ ] "Other" text fields appear when triggered
- [ ] Long text inputs don't break layout
- [ ] Form submission successfully creates database records
- [ ] Redirect to thank-you page works
- [ ] Travis receives notification email

### Resource Downloads
- [ ] All PDF links download correctly
- [ ] Files have proper names (not generic "download.pdf")
- [ ] Downloads work on mobile devices
- [ ] ZIP files extract properly

### Calendar Embeds
- [ ] Calendars load without errors
- [ ] Booking flow works end-to-end
- [ ] Confirmation emails send (if configured)
- [ ] Mobile calendar view is usable

### Cross-Device
- [ ] Desktop (1920px, 1440px, 1024px)
- [ ] Tablet (768px)
- [ ] Mobile (375px, 414px)
- [ ] All interactive elements work on touch devices

### Browsers
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)

---

## Maintenance & Updates

### Travis Can Update:
- Monthly DNA Leaders Call date/time (manual text edit)
- Google Calendar embed URLs (if booking links change)
- Resource files (upload new PDFs to server)
- Amazon link (if DNA Manual listing changes)

### Requires Developer:
- Form field changes (add/remove questions)
- Database schema changes
- Page layout/structure changes
- New pages or features

---

## Future Enhancements (Not Now)

**Phase 2 (When 10+ churches):**
- Add email service (ConvertKit/Loops)
- Automated email sequences
- Admin dashboard for Travis (view all assessments in web UI)
- Export assessment data to CSV

**Phase 3 (When 20+ churches):**
- Church login/authentication
- Personalized dashboard per church
- Progress tracking system
- Private coaching notes

**Phase 4 (When 50+ churches):**
- Community forum (Discord/Circle)
- Video content library
- Advanced analytics
- Multi-user roles (lead pastor, discipleship director, etc.)

---

## Questions for Travis Before Building

1. **Google Calendar URLs:** Send 30-min and 60-min booking embed codes
2. **Amazon Link:** Confirm DNA Manual product URL
3. **Leader Orientation Video:** Will this be YouTube/Vimeo? Send link when ready
4. **Resource Files:** Confirm which PDFs are ready to upload now vs. later
5. **Monthly DNA Call:** What's the standing Google Meet link?
6. **Branding:** Any specific hex codes for DNA colors, or should Claude Code match existing dna.arkidentity.com?

---

## Success Metrics

**Onboarding hub is successful when:**
- Churches complete assessment in under 15 minutes
- 90%+ of churches schedule strategy call within 1 week
- Travis can quickly review assessment responses in Supabase
- Churches can easily find and download resources
- Zero confusion about next steps

**Travis knows it's working when:**
- He's not answering "what do I do next?" questions
- Churches show up to strategy calls prepared
- Leaders are using the worksheet to identify potential DNA leaders

---

## Contact

**Questions during build?**  
Travis Gluckler - travis@arkidentity.com

**Claude Code Developer:**  
Reference this document for all specs and implementation details.
