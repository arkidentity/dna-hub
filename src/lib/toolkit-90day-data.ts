/**
 * 90-Day Toolkit Leader Training Data
 *
 * 12 weeks of structured leader session guides, organized into 3 months.
 * Content sourced from the 90-Day Toolkit Leader Version documents.
 */

import type { ContentBlockType } from './dna-manual-data';

// === Types ===

export type ToolkitBlockType =
  | ContentBlockType
  | 'meetingStep'
  | 'coachingTip'
  | 'redFlag'
  | 'prayerScript'
  | 'scenario';

export interface ToolkitContentBlock {
  type: ToolkitBlockType;
  text?: string;
  ref?: string;
  questions?: string[];
  items?: string[];
  title?: string;
  label?: string;
  // meetingStep-specific
  stepNumber?: number;
  duration?: string;
  content?: ToolkitContentBlock[];
  // scenario-specific
  response?: string;
}

export interface ToolkitWeek {
  week: number;
  month: 1 | 2 | 3;
  title: string;
  subtitle: string;
  purpose: string;
  whyThisMatters: string;
  totalDuration: string;
  // Tab 1: Meeting Guide
  meetingSteps: ToolkitContentBlock[];
  // Tab 2: Coaching
  coachingTips: ToolkitContentBlock[];
  redFlags: ToolkitContentBlock[];
  scenarios: ToolkitContentBlock[];
  // Tab 3: Prep
  leaderPrep: string[];
  disciplePrep: string[];
  afterMeeting: string[];
  completionChecklist: string[];
}

export interface ToolkitMonth {
  month: 1 | 2 | 3;
  title: string;
  focus: string;
  intro: string;
  weeks: { week: number; title: string; tool: string; purpose: string; timeCommitment: string }[];
  successFactors: { title: string; description: string }[];
  evaluation: {
    greenLights: string[];
    yellowLights?: string[];
    redLights: string[];
  };
}

export interface ToolkitData {
  title: string;
  subtitle: string;
  overview: {
    intro: string;
    keyPrinciples: { title: string; description: string }[];
    leaderExpectations: {
      beforeStart: string[];
      during: string[];
      afterWeek12: string[];
    };
    commonMistakes: { title: string; description: string }[];
    faq: { question: string; answer: string }[];
    bigPicture: { phase: string; timeline: string; focus: string; leaderRole: string }[];
  };
  months: ToolkitMonth[];
  weeks: ToolkitWeek[];
}

// === Data ===

export const toolkit90DayData: ToolkitData = {
  title: 'The 90-Day Toolkit',
  subtitle: 'Your First 12 Weeks as a DNA Group',
  overview: {
    intro:
      'The 90-Day Toolkit is a structured guide for leading your DNA group through their first 12 weeks together. It provides week-by-week lesson plans, activities, and tools that build on each other to create a foundation for lifelong discipleship.',
    keyPrinciples: [
      {
        title: 'Connection Before Correction',
        description:
          "Build trust first. Don't correct theology or behavior until you've earned relational equity.",
      },
      {
        title: 'Trust Before Transformation',
        description:
          "Disciples won't be vulnerable if they don't feel safe. Create a culture of grace, not judgment.",
      },
      {
        title: 'Relationship Before Revelation',
        description:
          'God speaks most clearly in the context of relationships. Prioritize connection with Him and with one another.',
      },
      {
        title: 'Model First, Then Release',
        description:
          'Leaders demonstrate vulnerability, obedience, and faith before asking disciples to do the same.',
      },
      {
        title: 'Daily Habits = Transformation',
        description:
          'The tools work when they\'re practiced daily. 3D Journal + 4D Prayer = the foundation of a disciple\'s life.',
      },
    ],
    leaderExpectations: {
      beforeStart: [
        'Complete the DNA Discipleship Manual (6 sessions)',
        'Work through DNA Launch Guide Phases 0',
        'Have DNA Groups Dashboard access',
        'Add your disciples to the dashboard',
        'Send Week 1 Life Assessment links',
      ],
      during: [
        'Prepare for each week 2-3 days in advance',
        'Model vulnerability\u2014go first in sharing',
        'Practice daily habits yourself (3D Journal, 4D Prayer)',
        'Follow up with disciples individually between meetings',
        'Track progress using your DNA Groups Dashboard',
        'Debrief with your co-leader after each meeting',
      ],
      afterWeek12: [
        'Review Week 1 vs. Week 12 comparison reports for each disciple',
        'Evaluate readiness for Phase 2 using the checklist',
        'Celebrate growth and address any stagnation',
        'Vision cast for Phase 2 (co-facilitation and continued growth)',
      ],
    },
    commonMistakes: [
      {
        title: 'Skipping Weeks or Changing the Order',
        description:
          "Each week builds on the previous one. Don't skip ahead or rearrange.",
      },
      {
        title: 'Not Modeling First',
        description:
          "If you're not journaling daily, don't expect your disciples to. Leaders set the pace.",
      },
      {
        title: 'Rushing Through Meetings',
        description:
          "Give space for the Holy Spirit. Don't cram everything into 90 minutes if it needs 120.",
      },
      {
        title: 'Ignoring Red Flags',
        description:
          "If someone isn't engaging, address it privately. Don't wait until Week 12.",
      },
      {
        title: 'Making It About Information, Not Transformation',
        description:
          "The goal isn't to complete lessons\u2014it's to make disciples. Prioritize heart change over curriculum.",
      },
    ],
    faq: [
      {
        question: 'What if someone misses a week?',
        answer:
          "Catch them up individually before the next meeting. Don't repeat a week for one person.",
      },
      {
        question: "What if someone isn't doing the daily habits?",
        answer:
          "Address it privately. Ask why. Remove barriers. Create accountability. They may not be ready for DNA.",
      },
      {
        question: 'What if we finish early or need more time in a session?',
        answer:
          'Adjust as needed. The times are guidelines, not laws. Follow the Holy Spirit.',
      },
      {
        question: 'What if someone needs deeper ministry (trauma, abuse, etc.)?',
        answer:
          "Offer to connect them with a counselor or pastor. Don't try to be their therapist\u2014be their discipler.",
      },
      {
        question: 'Can I add my own content or lessons?',
        answer:
          'Not during the first 90 days. Follow the toolkit exactly. After Week 12, you have freedom to customize in Phase 2.',
      },
    ],
    bigPicture: [
      {
        phase: 'Phase 0: Pre-Launch',
        timeline: 'Weeks -6 to 0',
        focus: 'DNA Manual, Launch Guide, Dashboard, with Co-Leader',
        leaderRole: 'Solo prep & team building',
      },
      {
        phase: 'Phase 1: Foundation Building',
        timeline: 'Months 1-3 (90 Days)',
        focus: 'Use 90-Day Toolkit (Weeks 1-12)',
        leaderRole: 'Teaching & modeling',
      },
      {
        phase: 'Phase 2: Growth & Empowerment',
        timeline: 'Months 4-6',
        focus: 'Disciples co-facilitate, use Supplemental Lessons',
        leaderRole: 'Coaching',
      },
      {
        phase: 'Phase 3: Multiplication Prep',
        timeline: 'Months 7-12',
        focus: 'Disciples facilitate 75%+, prepare to launch own groups',
        leaderRole: 'Releasing',
      },
    ],
  },

  // === Months ===
  months: [
    {
      month: 1,
      title: 'Building Habits',
      focus:
        'Learning the core DNA tools and begin practicing them. The emphasis is on connection and trust\u2014creating a safe environment where vulnerability can flourish.',
      intro:
        "You're about to begin the most transformational 4 weeks of your disciples' lives. This month lays the foundation for everything that follows\u2014not just in the next 12 weeks, but for a lifetime of discipleship. By the end of Week 4, your disciples should know where they're starting from, be practicing Prayer, Bible and Journal daily, understand core theological foundations, and feel safe to be real and vulnerable.",
      weeks: [
        { week: 1, title: 'Life Assessment', tool: 'Life Assessment', purpose: 'Understanding where we are', timeCommitment: '90 min meeting' },
        { week: 2, title: 'The 3D Journal', tool: '3D Journal', purpose: 'Learning to hear God through Scripture', timeCommitment: '90 min + 10 min daily' },
        { week: 3, title: '4D Prayer Rhythm', tool: '4D Prayer', purpose: 'Establishing daily prayer rhythm', timeCommitment: '90 min + 10 min daily' },
        { week: 4, title: 'Foundation Doctrines', tool: 'Creed Cards', purpose: 'Building theological foundation', timeCommitment: '90 min + review' },
      ],
      successFactors: [
        { title: 'Consistency', description: 'Disciples must attend all 4 weeks. If someone misses Week 2 or 3, they\'ll miss the daily habit training and fall behind.' },
        { title: 'Modeling', description: "Leaders must go first in vulnerability and daily habits. If you're not journaling daily, don't expect your disciples to." },
        { title: 'Safety', description: 'Create a judgment-free zone. Disciples will only be vulnerable if they feel safe.' },
        { title: 'Follow-Up', description: 'Check in between meetings. Encourage daily habits. Celebrate small wins.' },
      ],
      evaluation: {
        greenLights: [
          'Attended all 4 weeks consistently',
          'Posting 3D Journal and 4D Prayer in group chat daily (or most days)',
          'Engaged in discussions (not just observing)',
          'Showing increasing vulnerability',
          'Asking thoughtful questions',
          'Teachable spirit (receives feedback well)',
        ],
        redLights: [
          'Missed 2+ meetings',
          'Not practicing daily habits (no posts in group chat)',
          'Still surface-level in sharing',
          'Defensive when challenged',
          'Passive participation',
        ],
      },
    },
    {
      month: 2,
      title: 'Going Deeper',
      focus:
        'Experiencing the tools in community. The emphasis is on vulnerability and ownership\u2014disciples take more responsibility for their growth and begin to minister to one another.',
      intro:
        "Month 1 was about LEARNING the tools. Month 2 is about EXPERIENCING the tools in community. The shift moves from individual practice to corporate experience, from knowledge to application, from safe conversations to vulnerable sharing, and from the classroom to the mission field. Month 2 is where discipleship gets messy, beautiful, and supernatural.",
      weeks: [
        { week: 5, title: 'Q&A Deep Dive', tool: 'Discussion', purpose: 'Addressing doubts and questions', timeCommitment: '90 min' },
        { week: 6, title: 'Listening Prayer Circle', tool: 'Listening Prayer', purpose: 'Hearing God for others', timeCommitment: '90 min' },
        { week: 7, title: 'Outreach / Mission', tool: 'Outreach', purpose: 'Applying faith in the real world', timeCommitment: '2-3 hours' },
        { week: 8, title: 'Testimony Time', tool: 'STORY Framework', purpose: 'Celebrating God\'s faithfulness', timeCommitment: '90 min' },
      ],
      successFactors: [
        { title: 'Vulnerability', description: 'Disciples should be sharing at a deeper level. Expect tears, breakthroughs, and honest moments.' },
        { title: 'Supernatural Encounters', description: 'The Listening Prayer Circle often produces powerful prophetic words. Disciples will see God speak through them for the first time.' },
        { title: 'Outreach Courage', description: "Week 7 will push everyone outside their comfort zones. That's the point. Faith grows through risk." },
        { title: 'Fresh Testimonies', description: "By Week 8, disciples will have fresh stories of God's activity from the outreach." },
      ],
      evaluation: {
        greenLights: [
          'Consistent attendance (80%+ of meetings)',
          'Engaging in group chat and communication',
          'Demonstrating vulnerability and trust',
          'Practicing daily habits (3D Journal, 4D Prayer)',
          'Stepping out in faith (prayer, evangelism, prophecy)',
          'Showing spiritual curiosity (asking questions, seeking growth)',
        ],
        yellowLights: [
          'Spotty attendance (60-80% of meetings)',
          'Surface-level vulnerability (still guarded)',
          'Inconsistent daily habits (journaling/praying 3-4 days/week)',
          'Passive engagement (not initiating, only responding)',
        ],
        redLights: [
          'Regular absences (<60% attendance)',
          'No vulnerability (still wearing masks)',
          'Not doing daily habits (0-2 days/week)',
          'Apathy or disengagement',
          "Unwilling to step out in faith (refused outreach, won't pray for others)",
        ],
      },
    },
    {
      month: 3,
      title: 'Breakthrough',
      focus:
        "Disciples are ready to go deeper. The emphasis is on confidence and competence\u2014addressing root issues, breaking strongholds, and preparing for Phase 2.",
      intro:
        "Month 3 is where breakthroughs happen. Expect tears. Expect freedom. Expect revelation. Expect spiritual warfare. Your disciples have built a foundation of daily habits, experienced God in community, and stepped out in faith. Now it's time to address root issues, establish identity in Christ, discover spiritual gifts, and measure growth. This is where disciples step into their true identity and calling.",
      weeks: [
        { week: 9, title: 'Breaking Strongholds', tool: 'Reveal, Renounce, Replace', purpose: 'Breaking down lies and strongholds', timeCommitment: '90 min' },
        { week: 10, title: 'Identity Shift', tool: 'Identity Battle Plan', purpose: 'Building up identity in Christ', timeCommitment: '90 min' },
        { week: 11, title: 'Spiritual Gifts', tool: 'Gifts Assessment + Activation', purpose: 'Activating calling and gifting', timeCommitment: '90 min' },
        { week: 12, title: 'Life Assessment Revisited', tool: 'Comparison Report', purpose: 'Measuring growth and setting new goals', timeCommitment: '90 min' },
      ],
      successFactors: [
        { title: 'Spiritual Preparation', description: 'Pray for breakthrough over each disciple by name. Fast if led. Expect spiritual warfare.' },
        { title: 'Safe Environment', description: 'Create space for deep vulnerability. Have tissues ready. Some breakthroughs can\'t be rushed.' },
        { title: 'Identity Focus', description: 'Weeks 9-10 tear down lies and build up truth. The sequence matters\u2014don\'t skip ahead.' },
        { title: 'Activation', description: 'Week 11 isn\'t just information\u2014it\'s activation. Disciples should use their gifts immediately.' },
      ],
      evaluation: {
        greenLights: [
          'Significant breakthroughs (tears, freedom, revelation)',
          'Disciples facilitating parts of meetings',
          'Excitement about multiplying/leading others',
          'Mastery of DNA tools (3D, 4D, Listening Prayer, Creed Cards)',
          'Clear, measurable growth from Week 1 to Week 12',
        ],
        yellowLights: [
          'Growth in some areas but stagnation in others',
          'Still hesitant to lead or facilitate',
          'Inconsistent in daily habits despite 12 weeks',
        ],
        redLights: [
          'No measurable growth from Week 1 to Week 12',
          'Unwilling to address deep issues',
          'Fear of leading or facilitating',
          'Still dependent on leader for everything',
        ],
      },
    },
  ],

  // === Weeks ===
  weeks: [
    // ==========================================
    // WEEK 1: Life Assessment
    // ==========================================
    {
      week: 1,
      month: 1,
      title: 'Life Assessment',
      subtitle: 'Understanding Where We Are',
      purpose:
        "To establish a baseline understanding of each person's spiritual, emotional, and relational health. This creates a roadmap for growth and helps leaders discern where to focus their discipleship efforts.",
      whyThisMatters:
        "You can't grow what you don't measure. Life Assessment helps disciples become self-aware and gives leaders insight into hidden struggles, false beliefs, and areas needing attention.",
      totalDuration: '90 min',
      meetingSteps: [
        {
          type: 'meetingStep',
          stepNumber: 1,
          title: 'Welcome & Opening',
          duration: '10 min',
          content: [
            { type: 'paragraph', text: 'Open with prayer, inviting the Holy Spirit into the space.' },
            { type: 'paragraph', text: 'Cast vision: "Tonight is about getting real. No performance, no pretending. We\'re creating a safe place to grow."' },
            { type: 'paragraph', text: 'Share group agreements (if first meeting).' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 2,
          title: 'Assessment Completion',
          duration: '20-30 min',
          content: [
            { type: 'header', text: 'Send the Link' },
            { type: 'numbered', items: [
              'If you haven\'t already, send the Week 1 Life Assessment link from your DNA Groups Dashboard now',
              'Have disciples check their email/text and click the link',
              'They\'ll be prompted to confirm their name and start the assessment',
            ] },
            { type: 'header', text: 'While They Complete' },
            { type: 'checklist', items: [
              'Sit quietly and pray for each disciple',
              'Avoid monitoring their answers\u2014this creates trust',
              'Be available if someone has a technical question',
              'Monitor your dashboard to see when everyone has submitted',
            ] },
            { type: 'header', text: 'Troubleshooting' },
            { type: 'checklist', items: [
              "If someone didn't receive the link, resend from dashboard",
              'If wifi is weak, consider mobile hotspot or rescheduling',
              'If someone finishes early, encourage them to review their answers prayerfully',
            ] },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 3,
          title: 'Sharing & Discussion',
          duration: '40 min',
          content: [
            { type: 'paragraph', text: 'Go around the circle\u2014each person shares 3-5 answers.' },
            { type: 'paragraph', text: 'Leaders go first to model vulnerability.' },
            { type: 'discussion', label: 'Follow-up Questions', questions: [
              'Why did you answer that way?',
              'Where do you think that belief came from?',
              'What would you like to see change?',
            ] },
            { type: 'header', text: 'What to Listen For' },
            { type: 'checklist', items: [
              'Lies they believe about God, themselves, or others',
              'Patterns of fear, shame, or insecurity',
              'Areas where they lack biblical foundation',
              'Evidence of spiritual hunger or apathy',
            ] },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 4,
          title: 'Closing Prayer',
          duration: '10 min',
          content: [
            { type: 'checklist', items: [
              'Pray over each person by name',
              'Ask God to begin revealing truth and healing wounds',
              'Thank God for the courage to be honest',
            ] },
          ],
        },
      ],
      coachingTips: [
        {
          type: 'coachingTip',
          title: 'Dashboard Access',
          text: 'CRITICAL: You must have DNA Group setup before Week 1. Log in to the DNA Groups Dashboard, verify you can see your group and disciples. If you cannot log in, contact your church leader or DNA admin immediately.',
        },
        {
          type: 'coachingTip',
          title: 'Assessment Categories',
          text: 'The Life Assessment covers 7 key areas: Relationship with God, Spiritual Freedom, Identity & Emotions, Relationships, Calling & Purpose, Lifestyle & Stewardship, and Spiritual Fruit. Familiarize yourself with these before the meeting.',
        },
      ],
      redFlags: [
        {
          type: 'redFlag',
          title: 'Crisis-Level Responses',
          text: 'If someone\'s assessment revealed crisis-level issues (suicidal thoughts, abuse, severe depression), reach out within 24 hours. Offer to pray with them, connect them to a counselor, or involve a pastor. Keep it confidential.',
        },
      ],
      scenarios: [],
      leaderPrep: [
        'Create DNA Group and add disciples (they should get an email with the dna app info)',
        'Make sure disciples are logged in on the app (syncs their data to the dashboard)',
        'Week 1 Life Assessment is in the pathway tab on the app',
        'Review this entire Month 1 guide with your Co-Leader',
        'Pray for each disciple by name daily',
      ],
      disciplePrep: [
        'Have the DNA app installed and logged in',
        'Come with an open heart and honesty',
      ],
      afterMeeting: [
        'Review each disciple\'s assessment summary in Dashboard',
        'Note any red flags (severe struggles, crisis language)',
        'Do NOT share individual results with others without permission',
        'Debrief with co-leader: What stood out? What lies or patterns? Where to focus energy? What strongholds need addressing?',
        'Text each disciple a word of encouragement within 24 hours',
        'Begin praying specifically for what was revealed',
      ],
      completionChecklist: [
        'Read this guide 2-3 days before the meeting',
        'Set up DNA Group and added all disciples',
        'Prayed for each disciple by name',
        'Led the Life Assessment meeting',
      ],
    },

    // ==========================================
    // WEEK 2: The 3D Journal
    // ==========================================
    {
      week: 2,
      month: 1,
      title: 'The 3D Journal',
      subtitle: 'Learning to Hear God Through Scripture',
      purpose:
        "To establish a daily habit of encountering God through Scripture using the 3D Journal method. This isn't just teaching a tool\u2014it's launching a lifestyle of hearing God's voice daily.",
      whyThisMatters:
        "Most Christians struggle with Bible reading because they don't know how to move from information to transformation. The 3D Journal bridges that gap. A disciple who journals daily for a year will be unrecognizable from who they are today.",
      totalDuration: '90 min',
      meetingSteps: [
        {
          type: 'meetingStep',
          stepNumber: 1,
          title: 'Opening & Check-In',
          duration: '15 min',
          content: [
            { type: 'paragraph', text: 'How was your week? Brief prayer.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 2,
          title: 'Teach the 3D Journal Method',
          duration: '20 min',
          content: [
            { type: 'paragraph', text: 'Scripture: Write out the verse(s) that stood out to you. What jumped off the page?' },
            { type: 'keyDefinition', title: '1D: HEAD', text: "What do you notice about this passage? What's the context? Who's speaking? What's happening? What does this reveal about God's character?" },
            { type: 'keyDefinition', title: '2D: HEART', text: 'What is God saying to YOU right now in this moment through this scripture? How does this apply to your life right now?' },
            { type: 'keyDefinition', title: '3D: HANDS', text: 'God, what do you want me to do with this? What action do you want me to take after receiving this from you?' },
            { type: 'header', text: 'Example: Using Hebrews 4:14-16' },
            { type: 'scripture', text: 'Therefore, since we have a great high priest who has ascended into heaven, Jesus the Son of God, let us hold firmly to the faith we profess. For we do not have a high priest who is unable to empathize with our weaknesses, but we have one who has been tempted in every way, just as we are\u2014yet he did not sin. Let us then approach God\'s throne of grace with confidence, so that we may receive mercy and find grace to help us in our time of need.', ref: 'Hebrews 4:14-16' },
            { type: 'paragraph', text: '1D (HEAD): How could we be ashamed to approach the Father after knowing we have Jesus as our representative. He has made a way for us to be reconciled back to the Father.' },
            { type: 'paragraph', text: '2D (HEART): God is saying "Do you trust that my blood was more than enough to cover your sin? You must believe this to receive the right of throne room access."' },
            { type: 'paragraph', text: '3D (HANDS): I will not apologize for asking God for help in all situations. It is my right as an adopted son of God. I will be bolder in my prayers. Ask Big!' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 3,
          title: 'Share 3D Journal Insights',
          duration: '20 min',
          content: [
            { type: 'paragraph', text: 'Each person shares their 3D Journal entry (3-5 minutes each). Leaders go first to model.' },
            { type: 'discussion', label: 'After Each Person Shares', questions: [
              'What stood out to you about what they shared?',
              'What did you hear God saying to them?',
            ] },
            { type: 'header', text: 'What to Listen For' },
            { type: 'checklist', items: [
              'Are they actually hearing from God or just regurgitating theology?',
              'Are they applying it personally (2D) or keeping it abstract?',
              'Are they praying with specificity (3D) or staying generic?',
              'Did they engage all three dimensions or skip straight to application?',
            ] },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 4,
          title: 'The Daily Habit Challenge',
          duration: '10 min',
          content: [
            { type: 'paragraph', text: '"We just showed you HOW to do a 3D Journal. But here\'s the real question: What would change in your life if you did this every single day for the next year?"' },
            { type: 'paragraph', text: 'Let them respond. Don\'t rush this. Let it sink in.' },
            { type: 'paragraph', text: '"Will you commit to 3D journaling every day for the next 30 days?"' },
            { type: 'paragraph', text: 'Pause. Let them verbally commit or voice hesitation.' },
            { type: 'paragraph', text: '"When will you do it? Morning? Night? Lunch break? Pick a specific time right now and write it down."' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 5,
          title: 'Prayer Activation',
          duration: '15 min',
          content: [
            { type: 'checklist', items: [
              'Pray for one another based on what each of you shared',
              'Pray for discipline and consistency to continue studying His word in this way',
            ] },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 6,
          title: '3D Bible Challenge',
          duration: '10 min',
          content: [
            { type: 'paragraph', text: 'Show them how to sign up for a 3D Bible Challenge on the app (7, 21, or 50 Days).' },
            { type: 'numbered', items: [
              'Use Daily Group Chat Check-In \u2014 Every day, drop a screenshot of your 3D Journal in the group chat',
              'Weekly Progress Check \u2014 At each DNA meeting, go around: "How has journaling helped you connect with God this week?"',
              'Leaders Model First \u2014 Post your 3D Journals in the group chat to show what it looks like',
            ] },
            { type: 'header', text: 'Remove Barriers' },
            { type: 'paragraph', text: '"What\'s going to make this hard for you?" Let them voice obstacles.' },
          ],
        },
      ],
      coachingTips: [
        {
          type: 'coachingTip',
          title: '1D (HEAD) is just a restatement of the verse',
          text: '"Go deeper. What\'s the context? What does this reveal about God? Why did the author write this?"',
        },
        {
          type: 'coachingTip',
          title: '2D (HEART) is generic',
          text: '"Get specific. What does this look like TODAY in your life? What actual step will you take?"',
        },
        {
          type: 'coachingTip',
          title: '3D (HANDS) is one sentence',
          text: '"Talk to God like He\'s in the room with you. Be honest. Ask for help. Commit to action."',
        },
        {
          type: 'coachingTip',
          title: 'They skip 1D and jump straight to application',
          text: '"Let\'s slow down. Before we apply it, we need to understand what it actually says. What\'s God revealing about Himself here?"',
        },
        {
          type: 'coachingTip',
          title: '2D doesn\'t connect to the passage',
          text: '"I love your honesty, but how does THIS passage speak to that? Let\'s make sure we\'re letting Scripture guide our application, not just our current feelings."',
        },
      ],
      redFlags: [
        {
          type: 'redFlag',
          title: 'Resistance to Daily Commitment',
          text: 'If someone says "I don\'t know if I can do that every day," respond: "How much time do you spend on your phone daily? This is 10-15 minutes. If you can scroll Instagram for 20 minutes, you can journal for 10."',
        },
      ],
      scenarios: [
        {
          type: 'scenario',
          title: '"I forget to journal"',
          text: 'A disciple says they keep forgetting to do their daily journal.',
          response: 'Set a daily phone reminder. Link it to an existing habit (right after coffee, right before bed).',
        },
        {
          type: 'scenario',
          title: '"I don\'t know what to read"',
          text: 'A disciple doesn\'t know what Scripture passage to use.',
          response: 'Use "Today\'s Scripture" in the DNA app. It provides a fresh passage daily.',
        },
        {
          type: 'scenario',
          title: '"I\'m too busy"',
          text: 'A disciple says they don\'t have time.',
          response: 'What can you cut? What\'s less important than hearing from God? This is 10 minutes.',
        },
        {
          type: 'scenario',
          title: '"I don\'t understand the Bible well enough"',
          text: 'A disciple feels inadequate to journal through Scripture.',
          response: 'That\'s exactly WHY you journal\u2014understanding grows with practice. Start simple.',
        },
      ],
      leaderPrep: [
        'Use Today\'s Scripture in the DNA app or pick a passage for disciples to use',
        'Complete your own 3D Journal beforehand so you can model it',
        'Use the DNA app or bring paper for disciples to use',
      ],
      disciplePrep: [
        'Make sure you are logged in to the DNA app using your church subdomain',
        'Have the DNA app open and ready',
      ],
      afterMeeting: [
        'Who grasped the method quickly?',
        'Who struggled? What part was hardest\u2014HEAD, HEART, or HANDS?',
        'Did anyone share something theologically off? How do we address it?',
        'Are they excited about this tool or overwhelmed?',
        'Did anyone skip a dimension (especially 1D or 3D)?',
        'Text disciples mid-week: "How\'s your 3D journaling going?"',
        'Share your own 3D Journal entry in the group chat as encouragement',
      ],
      completionChecklist: [
        'Read this guide 2-3 days before the meeting',
        'Completed your own 3D Journal entry before the meeting',
        'Prayed for each disciple by name',
        'Led the 3D Journal session with your group',
      ],
    },

    // ==========================================
    // WEEK 3: 4D Prayer
    // ==========================================
    {
      week: 3,
      month: 1,
      title: '4D Prayer',
      subtitle: 'Revere, Reflect, Request, Rest',
      purpose:
        'Establish a daily prayer rhythm using the 4D framework (Revere, Reflect, Request, Rest) and activate disciples as intercessors who stand in the gap for others.',
      whyThisMatters:
        "Prayer isn't just asking God for things\u2014it's partnering with Him in what He's already doing. Jesus stands in the gap for us; because we're in Him, we do the same for others. The 4D Prayer Rhythm makes this a sustainable daily practice.",
      totalDuration: '90 min',
      meetingSteps: [
        {
          type: 'meetingStep',
          stepNumber: 1,
          title: 'Opening: The Theology of 4D Prayer',
          duration: '20 min',
          content: [
            { type: 'scripture', text: 'I searched for a man among them who would build up the wall and stand in the gap before Me for the land, so that I would not destroy it; but I found no one.', ref: 'Ezekiel 22:30 NASB' },
            { type: 'discussion', questions: ['What does it mean to "stand in the gap"?'] },
            { type: 'paragraph', text: 'Standing in the gap = Intercessory prayer. It\'s standing between God and people, pleading on behalf of those who can\'t (or won\'t) pray for themselves.' },
            { type: 'scripture', text: 'Therefore He is able also to save forever those who draw near to God through Him, since He always lives to make intercession for them.', ref: 'Hebrews 7:25 NASB' },
            { type: 'paragraph', text: 'Jesus is ALWAYS interceding for us. Right now. This moment. He never stops. Because we\'re IN CHRIST, we participate in His intercessory work.' },
            { type: 'scripture', text: 'But you are a chosen race, a royal priesthood, a holy nation, a people for God\'s own possession...', ref: '1 Peter 2:9 NASB' },
            { type: 'keyDefinition', title: 'The 4 Dimensions of Prayer', text: '1. REVERE \u2014 Worship God for who He is. 2. REFLECT \u2014 Thank God for what He\'s done. 3. REQUEST \u2014 Intercede for others. 4. REST \u2014 Listen to what God is saying.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 2,
          title: 'Create Prayer Cards Together',
          duration: '20 min',
          content: [
            { type: 'paragraph', text: 'In The Gap isn\'t just a prayer session\u2014it\'s a prayer room. Open the DNA app and go to the Prayer tab to enter "In The Gap."' },
            { type: 'header', text: 'Live Demo' },
            { type: 'numbered', items: [
              'Open DNA app \u2192 Click Prayer tab',
              'Enter into the prayer lobby',
              'Click "Add your first prayer card"',
              'Fill in: Name, Specific request (be detailed), Optional Scripture to pray over them',
            ] },
            { type: 'header', text: 'Create 5-10 Cards' },
            { type: 'checklist', items: [
              'DNA Group: One card per person in your group',
              'Family: Parents, spouse, kids, siblings',
              'Lost Friends/Coworkers: 2-3 people who need Jesus',
              'City/Nation: Your city + one nation on your heart',
            ] },
            { type: 'paragraph', text: 'Give them 15 minutes to create cards. Leaders walk around and help. Play soft instrumental music in the background.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 3,
          title: 'Shared Prayer Session',
          duration: '25 min',
          content: [
            { type: 'paragraph', text: 'Everyone has their prayer cards ready. Leaders connect device to Bluetooth speaker for shared music. Everyone else mutes music on their own device.' },
            { type: 'paragraph', text: '"When you start a prayer session, the app will guide you through the 4D rhythm with text prompts on the screen. We\'re going to do this together for 20 minutes."' },
            { type: 'keyDefinition', title: 'REVERE', text: 'The screen shows prompts: "Who is God to you today?" Leaders pray out loud first. Disciples join in.' },
            { type: 'keyDefinition', title: 'REFLECT', text: 'Screen prompts: "What has God done for you recently?" Leaders share gratitude out loud.' },
            { type: 'keyDefinition', title: 'REQUEST', text: 'Screen shows prayer cards one at a time. Leaders pray their cards out loud. Disciples see their own cards and pray.' },
            { type: 'keyDefinition', title: 'REST', text: 'Screen prompts: "Be still. Listen. What is God saying?" Music plays softly\u2014no one speaks. Let God speak.' },
            { type: 'discussion', label: 'Debrief', questions: [
              'How was that experience?',
              'What did you notice during REST?',
              'Did praying out loud feel awkward or helpful?',
              'Can you see yourself doing this daily?',
            ] },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 4,
          title: 'Daily Habit Challenge',
          duration: '15 min',
          content: [
            { type: 'paragraph', text: '"You\'ve now learned two core habits: 3D Journal (hearing God through Scripture) and 4D Prayer (hearing God through prayer). Do both daily for the next 7 days."' },
            { type: 'keyDefinition', title: 'The Two-Habit Rhythm', text: 'Morning: 3D Journal (10 minutes). Anytime: 4D prayer session (10 minutes). Total: 20 minutes a day with God.' },
            { type: 'paragraph', text: '"Every day this week, drop a checkmark in the group chat: \u2713 Journaled + Prayed today. Leaders will post first every day to model."' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 5,
          title: 'Closing Prayer',
          duration: '10 min',
          content: [
            { type: 'prayerScript', text: 'Father, thank You for calling us to stand in the gap. Thank You that Jesus is ALWAYS interceding for us, and because we\'re in Him, we get to participate. Help us be faithful in these two daily habits\u2014journaling and praying. Let this become as natural as breathing. Train our ears to hear Your voice. In Jesus\' name, Amen.' },
          ],
        },
      ],
      coachingTips: [
        {
          type: 'coachingTip',
          title: '"I don\'t have a smartphone"',
          text: 'The app works on any computer at dailydna.app. Or you can use a notepad\u2014write out the 4 movements and your prayer list.',
        },
        {
          type: 'coachingTip',
          title: '"I forgot to pray some days"',
          text: '"That\'s okay\u2014just restart tomorrow. We\'re building a habit, not earning God\'s love."',
        },
        {
          type: 'coachingTip',
          title: '"I felt awkward praying out loud"',
          text: '"It gets easier. Start by praying silently, then whisper, then speak. You\'ll grow into it."',
        },
        {
          type: 'coachingTip',
          title: '"I don\'t know what to pray for some people"',
          text: '"Ask God. Say, \'God, what do YOU want for this person?\' He\'ll give you words."',
        },
      ],
      redFlags: [
        {
          type: 'redFlag',
          title: 'Vague, Generic Prayer Cards',
          text: 'If disciples write "bless them" instead of specific requests, coach them to be detailed: "breakthrough in marriage" not just "bless my friend."',
        },
        {
          type: 'redFlag',
          title: 'Silent During Entire REQUEST Time',
          text: 'Fear or disengagement. Check in privately\u2014what\'s the barrier?',
        },
        {
          type: 'redFlag',
          title: 'Skipping the Daily Habit',
          text: 'Check in privately. What\'s the barrier? Remove obstacles and create accountability.',
        },
      ],
      scenarios: [],
      leaderPrep: [
        'Set up your own prayer cards in the DNA app',
        'Test the prayer session flow so you can guide confidently',
        'Prepare to teach Ezekiel 22:30 and Hebrews 7:25',
        'Have your device ready to screen share (if using projector/TV)',
        'Bring Bluetooth speaker if available (for shared music)',
      ],
      disciplePrep: [
        'Have DNA app open on phone or computer',
        'No other preparation needed',
      ],
      afterMeeting: [
        'Post daily in group chat: "\u2713 Journaled + Prayed today"',
        'Text individual disciples mid-week: "How\'s the daily rhythm going?"',
        'Celebrate when someone posts a testimony of answered prayer',
      ],
      completionChecklist: [
        'Read this guide 2-3 days before the meeting',
        'Set up your own prayer cards in the DNA app first',
        'Prayed for each disciple by name',
        'Led the 4D Prayer session with your group',
      ],
    },

    // ==========================================
    // WEEK 4: Foundation Doctrines (Creed Cards)
    // ==========================================
    {
      week: 4,
      month: 1,
      title: 'Foundation Doctrines',
      subtitle: 'Building on Historic Christian Truth',
      purpose:
        'Introduce disciples to the Creed Card tool as a way to build theological foundation through interactive discovery and discussion.',
      whyThisMatters:
        "You can't build a house without a foundation. Creed Cards give us bite-sized, biblical truths rooted in 2,000 years of Christian history. These aren't optional beliefs\u2014they're essentials that define what it means to follow Jesus.",
      totalDuration: '90 min',
      meetingSteps: [
        {
          type: 'meetingStep',
          stepNumber: 1,
          title: 'Opening: What Is a Creed?',
          duration: '10 min',
          content: [
            { type: 'discussion', questions: ['When you hear the word "creed," what comes to mind?'] },
            { type: 'paragraph', text: 'A creed is a statement of belief. The word comes from the Latin "credo," which means "I believe." Throughout Christian history, the church has used creeds to say, "These are the non-negotiables."' },
            { type: 'numbered', items: [
              'They protect us from false teaching',
              'They unite us across time and space',
              'They give us language to articulate our faith',
            ] },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 2,
          title: 'How to Use Creed Cards',
          duration: '10 min',
          content: [
            { type: 'keyDefinition', title: 'Step 1: DISCUSS (Before Flipping)', text: 'Look at the front: the topic, Greek/Hebrew word. Ask: "What does this word mean to you?" Let everyone share BEFORE seeing the definition.' },
            { type: 'keyDefinition', title: 'Step 2: DEFINE', text: 'Flip the card and read the definition together. Read the key Scripture and historical context.' },
            { type: 'keyDefinition', title: 'Step 3: DEEPEN', text: 'Compare what you thought vs. what Scripture says. "Does this align with what you believed? What surprises you?"' },
            { type: 'keyDefinition', title: 'Step 4: DISCUSS', text: 'Answer the reflection question on the card. "How does this truth change the way you live?"' },
            { type: 'keyDefinition', title: 'Step 5: DO IT AGAIN', text: 'Creed Cards aren\'t one-and-done. Come back to them regularly. Memorize the key Scripture.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 3,
          title: 'Work Through 2-3 Creed Cards',
          duration: '60 min',
          content: [
            { type: 'paragraph', text: 'Suggested Starter Cards: Faith (pistis), Gospel (euangelion), Grace (charis) if time allows.' },
            { type: 'header', text: 'Card 1: Faith (pistis) \u2014 20-25 min' },
            { type: 'discussion', label: 'Before Flipping', questions: ['What does faith mean to you?', 'The subtitle says "trusting in Christ alone." What does that phrase mean?'] },
            { type: 'scripture', text: 'Therefore, having been justified by faith, we have peace with God through our Lord Jesus Christ.', ref: 'Romans 5:1 NASB' },
            { type: 'discussion', label: 'Deepen', questions: [
              'How does this definition compare to what you said earlier?',
              'Why is it important that faith is more than just intellectual agreement?',
              'What\'s the difference between believing Jesus EXISTS vs. trusting Him with your life?',
            ] },
            { type: 'reflection', text: 'What does it look like for you to trust Christ completely rather than relying on your own efforts?' },
            { type: 'header', text: 'Card 2: Gospel (euangelion) \u2014 20-25 min' },
            { type: 'discussion', label: 'Before Flipping', questions: ['What is the gospel? How would you explain it to someone?'] },
            { type: 'discussion', label: 'Deepen', questions: ['Why is the resurrection essential to the gospel?'] },
            { type: 'reflection', text: 'How would you explain the gospel to a 10-year-old? To a skeptic?' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 4,
          title: 'Set Up Ongoing Practice',
          duration: '5 min',
          content: [
            { type: 'paragraph', text: '"We\'ll work through one Creed Card every 2-3 weeks. Between now and next meeting, review tonight\'s cards in the app."' },
            { type: 'paragraph', text: 'Challenge: "This week, explain the gospel to someone outside this group using what we learned tonight."' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 5,
          title: 'Closing Prayer',
          duration: '5 min',
          content: [
            { type: 'paragraph', text: 'Have one of your disciples pray out. They need to begin to practice this.' },
          ],
        },
      ],
      coachingTips: [
        {
          type: 'coachingTip',
          title: '"I was taught differently in my church"',
          text: '"That\'s okay. Let\'s look at Scripture together and see what it says. We\'re not here to bash other beliefs\u2014we\'re here to discover truth."',
        },
        {
          type: 'coachingTip',
          title: '"This seems too complicated"',
          text: '"It\'s okay if you don\'t understand everything tonight. That\'s why we return to these cards multiple times. Let it sink in slowly."',
        },
        {
          type: 'coachingTip',
          title: '"Why do we need to know Greek/Hebrew words?"',
          text: '"Because English translations can sometimes miss nuances. Knowing the original word helps us understand what the authors meant."',
        },
        {
          type: 'coachingTip',
          title: 'Someone shares a false belief',
          text: 'Don\'t shame them. Say: "I appreciate your honesty. Let\'s see what Scripture says and compare."',
        },
      ],
      redFlags: [],
      scenarios: [],
      leaderPrep: [
        'Access Creed Cards in the DNA Identity app',
        'Select 2-3 cards for tonight',
        'Have devices ready to display cards OR print front/back for each person',
        'Review the "flip methodology" so you can model it',
        'Prepare to explain what a creed is',
      ],
      disciplePrep: [
        'No preparation needed',
      ],
      afterMeeting: [
        'Text the group: "Which Creed Card challenged you most tonight?"',
        'Send a screenshot or link to the 2-3 cards you covered',
        'Remind them to review in the app this week',
      ],
      completionChecklist: [
        'Read this guide 2-3 days before the meeting',
        'Reviewed Creed Cards yourself before teaching',
        'Prayed for each disciple by name',
        'Led the Creed Cards session with your group',
      ],
    },

    // ==========================================
    // WEEK 5: Q&A Deep Dive
    // ==========================================
    {
      week: 5,
      month: 2,
      title: 'Q&A Deep Dive',
      subtitle: 'Addressing Doubts, Questions & Confusion',
      purpose:
        'To create a safe space for disciples to ask hard questions, voice doubts, and wrestle with theological confusion without fear of judgment.',
      whyThisMatters:
        'Unanswered questions become unspoken doubts. Doubts turn into strongholds. This week prevents that by bringing everything into the light.',
      totalDuration: '90 min',
      meetingSteps: [
        {
          type: 'meetingStep',
          stepNumber: 1,
          title: 'Opening',
          duration: '5 min',
          content: [
            { type: 'paragraph', text: 'Set the tone: "This is a safe space. Ask anything. We won\'t judge you. We\'re here to pursue truth together."' },
            { type: 'paragraph', text: 'Brief prayer for wisdom and Holy Spirit guidance.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 2,
          title: 'Ground Rules',
          duration: '5 min',
          content: [
            { type: 'checklist', items: [
              'No question is stupid or off-limits',
              'We pursue truth, not just winning arguments',
              'It\'s okay to say "I don\'t know"',
              'We point to Scripture as our ultimate authority',
              'We can disagree and still love each other',
              'Doubt is not the opposite of faith\u2014certainty is. Questions are part of growth.',
            ] },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 3,
          title: 'Question Gathering',
          duration: '5 min',
          content: [
            { type: 'paragraph', text: 'Go around the circle\u2014each person shares their question. Write them all down. Don\'t answer yet\u2014just collect them.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 4,
          title: 'Q&A Discussion',
          duration: '70 min',
          content: [
            { type: 'header', text: 'Process for Each Question' },
            { type: 'numbered', items: [
              'Read the question out loud',
              'Ask: "What do you think? What does Scripture say?"',
              'Let the GROUP wrestle with it first (don\'t jump in as the expert)',
              'Leaders provide biblical clarity and direction',
              'Point to Scripture as much as possible',
              'If you don\'t know, say so: "Great question. Let me research that and we\'ll revisit it."',
            ] },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 5,
          title: 'Closing',
          duration: '5 min',
          content: [
            { type: 'paragraph', text: 'Thank them for their honesty. Pray for continued revelation and understanding.' },
            { type: 'paragraph', text: '"Faith isn\'t the absence of questions\u2014it\'s trusting God even when we don\'t have all the answers."' },
          ],
        },
      ],
      coachingTips: [
        { type: 'coachingTip', title: 'Start with Scripture', text: '"Let\'s see what the Bible says." Always anchor answers in God\'s Word, not opinion.' },
        { type: 'coachingTip', title: 'Ask before you answer', text: '"What do you think?" Sometimes they know the answer\u2014they need permission to believe it.' },
        { type: 'coachingTip', title: 'Admit when you don\'t know', text: '"That\'s a great question. I don\'t know the answer, but let\'s find out together."' },
        { type: 'coachingTip', title: 'Address the heart behind the question', text: 'Sometimes the question isn\'t really about theology\u2014it\'s about pain, fear, or unbelief. Go there.' },
        { type: 'coachingTip', title: 'Don\'t be defensive', text: 'If they\'re questioning something you believe strongly, stay curious. "Tell me more about why you think that."' },
        { type: 'coachingTip', title: 'Point to mystery when appropriate', text: '"I don\'t fully understand why God allows that, but I do know His character\u2014He\'s good, He\'s loving, and He\'s trustworthy."' },
      ],
      redFlags: [
        { type: 'redFlag', title: 'Signs of Spiritual Crisis', text: 'Anger toward God, deep doubt about core doctrines, questioning salvation repeatedly, bitterness or resentment. These need pastoral care, not just theological answers.' },
        { type: 'redFlag', title: 'Signs of False Teaching Influence', text: 'Questions that sound like talking points from false teachers, resistance to clear biblical teaching, attraction to "secret knowledge." Address directly: "Where did you hear that? Let\'s compare it to Scripture."' },
      ],
      scenarios: [],
      leaderPrep: [
        'Text disciples mid-week: "What questions about God, the Bible, or faith have you been afraid to ask? Bring them this week."',
        'Pray for wisdom and discernment',
        'Prepare a few of your own questions to model vulnerability',
        'Don\'t feel pressure to have all the answers',
      ],
      disciplePrep: [
        'Come with 1-2 questions written down',
        'Be honest about what you\'re really wondering',
      ],
      afterMeeting: [
        'What questions revealed deeper issues?',
        'Did anyone ask something we need to follow up on privately?',
        'What questions do we need to research more?',
        'Research any unanswered questions and share findings in group chat',
        'Check in individually with anyone whose questions revealed spiritual crisis',
      ],
      completionChecklist: [
        'Read this guide 2-3 days before the meeting',
        'Prepared your own vulnerable questions to model',
        'Prayed for each disciple by name',
        'Led the Q&A Deep Dive session',
      ],
    },

    // ==========================================
    // WEEK 6: Listening Prayer
    // ==========================================
    {
      week: 6,
      month: 2,
      title: 'Listening Prayer',
      subtitle: 'Activating the Gift of Hearing God for Others',
      purpose:
        "To create a culture where disciples learn to hear God's voice for one another, give and receive encouragement, and grow in confidence in the supernatural relationship with the Holy Spirit.",
      whyThisMatters:
        'Many Christians have never been taught to hear God for others. The Listening Prayer Circle demystifies this gift and gives everyone practice in a safe environment.',
      totalDuration: '90 min',
      meetingSteps: [
        {
          type: 'meetingStep',
          stepNumber: 1,
          title: 'Opening & Worship',
          duration: '10 min',
          content: [
            { type: 'paragraph', text: 'Worship invites God\'s presence. Play a few worship songs if this fits your group. Brief prayer inviting the Holy Spirit to speak.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 2,
          title: 'Teaching on Hearing God for Others',
          duration: '15 min',
          content: [
            { type: 'paragraph', text: "God loves us and loves to be in communication with us. It's edification, encouragement, and comfort (1 Cor 14:3)." },
            { type: 'scripture', text: 'Pursue love, yet desire earnestly spiritual gifts, but especially that you may prophesy.', ref: '1 Corinthians 14:1' },
            { type: 'paragraph', text: "This isn't just for super-spiritual people. It's for every believer. God wants to speak through you to encourage others." },
            { type: 'header', text: 'Using Your Sanctified Mind' },
            { type: 'checklist', items: [
              'Impressions (a sense or feeling)',
              'Smell (an aroma that brings up a memory)',
              'Pictures (mental images)',
              'Scripture (a verse comes to mind)',
              'Words (a stream of thought from Holy Spirit)',
            ] },
            { type: 'header', text: 'How to Test It' },
            { type: 'checklist', items: [
              'Does it align with Scripture?',
              'Does it edify and encourage?',
              'Does it produce life or fear?',
              'Do others confirm it?',
            ] },
            { type: 'header', text: 'How to Deliver' },
            { type: 'checklist', items: [
              'Start with "I sense..." or "I heard\u2026"',
              'Speak humbly, not dogmatically',
              'Give the person freedom to test it',
              'Don\'t use prophecy to control or manipulate',
            ] },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 3,
          title: 'Listening Prayer Activity',
          duration: '50 min',
          content: [
            { type: 'paragraph', text: 'Sit in a circle. Each person prays for the person to their right (clockwise). Take 3-5 minutes of silence to listen. Take notes on everything you receive, even if it doesn\'t make sense.' },
            { type: 'header', text: 'Round 1: Practice Round (20 min, optional)' },
            { type: 'paragraph', text: '"God, when you look at ______, what do you see?" Share what you sense (2-3 minutes each). Receiver responds: "What resonated? What didn\'t?"' },
            { type: 'header', text: 'Round 2: Real Round (30 min)' },
            { type: 'paragraph', text: 'Repeat deeper. Longer listening time (5 minutes). Longer sharing time (3-4 minutes each). More vulnerability.' },
            { type: 'paragraph', text: 'Leader\'s Role: Go first to model. Give real-time coaching. If someone is way off, gently redirect. If someone nails it, celebrate.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 4,
          title: 'Debrief & Feedback',
          duration: '10 min',
          content: [
            { type: 'discussion', questions: [
              'How did that feel?',
              'What was hard? What was surprising?',
              'Did you hear God more clearly than you expected?',
              'What do you need to grow in?',
            ] },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 5,
          title: 'Closing Prayer',
          duration: '5 min',
          content: [
            { type: 'paragraph', text: 'Thank God for speaking. Pray for continued growth in hearing God for others.' },
            { type: 'keyDefinition', title: 'CRITICAL: Prepare for Week 8', text: 'IMMEDIATELY after this meeting, send all disciples the Testimony Development Worksheet. They need to complete it before Week 8.' },
          ],
        },
      ],
      coachingTips: [
        { type: 'coachingTip', title: '"I didn\'t hear anything"', text: "That's okay. Ask: 'What was the first thing that came to mind?' 'Did you see any pictures or impressions?' Start with encouragement\u2014they can speak life even without a specific word." },
        { type: 'coachingTip', title: '"I think I heard something, but I\'m not sure it\'s God"', text: 'Say it anyway. We learn by doing. "I sense..." gives them an out if it\'s off.' },
        { type: 'coachingTip', title: '"What if I\'m wrong?"', text: "You will be. And that's okay. We're learning. Grace covers the process. Just stay humble." },
        { type: 'coachingTip', title: 'Someone gives a word from their own thoughts', text: 'Gently redirect: "I appreciate you trying, but I\'m not sensing that\'s from the Lord. Let\'s try again."' },
        { type: 'coachingTip', title: 'Someone gives a corrective or heavy word', text: 'Be cautious. Most words from God will be encouragement. If it\'s heavy, leaders should test it before releasing it.' },
      ],
      redFlags: [
        { type: 'redFlag', title: 'Control or Manipulation', text: 'Someone is trying to control or manipulate through the activity. Address immediately.' },
        { type: 'redFlag', title: 'Consistently Off', text: 'Words are consistently off or weird. May need more coaching on testing words against Scripture.' },
        { type: 'redFlag', title: 'Self-Promotion', text: 'Someone is using the activity to make themselves look spiritual. Redirect to humility.' },
      ],
      scenarios: [],
      leaderPrep: [
        'Pray for increased sensitivity to the Holy Spirit',
        'Prepare a brief teaching on the prophetic (5-10 minutes)',
        'Be ready to model sharing what God says',
        'Create a safe, encouraging atmosphere',
      ],
      disciplePrep: [
        'Come with an open heart',
        'Pray for sensitivity to the Holy Spirit',
      ],
      afterMeeting: [
        'Who is naturally gifted in hearing God for others?',
        'Who struggled? How do we help them?',
        'Were there any breakthrough moments?',
        'Any concerning moments that need follow-up?',
        'Text disciples something encouraging God showed you about them',
        'CRITICAL: Send Testimony Development Worksheet to all disciples for Week 8',
      ],
      completionChecklist: [
        'Read this guide 2-3 days before the meeting',
        'Practiced listening prayer yourself',
        'Prayed for each disciple by name',
        'Led the Listening Prayer Circle session',
      ],
    },

    // ==========================================
    // WEEK 7: Outreach / Mission
    // ==========================================
    {
      week: 7,
      month: 2,
      title: 'Outreach / Mission',
      subtitle: 'Applying Faith in the Real World',
      purpose:
        'To get disciples out of the classroom and into the mission field. Faith grows through action, risk, and seeing God show up in real-time.',
      whyThisMatters:
        "Discipleship isn't just about knowledge\u2014it's about obedience. Jesus didn't just teach His disciples; He sent them out. This week does the same.",
      totalDuration: '2-3 hours',
      meetingSteps: [
        {
          type: 'meetingStep',
          stepNumber: 1,
          title: 'Pre-Outreach Huddle',
          duration: '20 min',
          content: [
            { type: 'paragraph', text: 'Gather everyone together. Cast vision: "We\'re not just doing good deeds\u2014we\'re representing Jesus."' },
            { type: 'header', text: 'Pray Together' },
            { type: 'checklist', items: [
              'For boldness and courage',
              'For divine appointments',
              'For the gospel to go forth with power',
              'Against fear and spiritual opposition',
            ] },
            { type: 'header', text: 'Assign Roles' },
            { type: 'checklist', items: [
              'Pair people up (experienced with less experienced)',
              'Designate team leads if splitting into groups',
              'Establish a check-in time/location',
            ] },
            { type: 'header', text: 'Quick Training' },
            { type: 'checklist', items: [
              '"How to approach people": Be friendly, not weird. Ask before praying.',
              '"How to share the gospel": Keep it simple\u2014your story and Jesus\' story.',
              '"How to handle rejection": Don\'t take it personally. Shake it off and move on.',
            ] },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 2,
          title: 'The Outreach',
          duration: '90 min',
          content: [
            { type: 'paragraph', text: 'Leaders model first, then release disciples to lead. Stay in pairs for safety and accountability.' },
            { type: 'header', text: 'What to Do' },
            { type: 'numbered', items: [
              'Approach someone: "Hey, we\'re from [church/group] and we\'re out praying for people. Is there anything we can pray for you about?"',
              'Listen to their response',
              'Pray for them right there (keep it short and specific)',
              'Ask if they\'d like to know more about Jesus',
              'If yes: share your testimony and the gospel',
              'If no: thank them, leave them with encouragement',
            ] },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 3,
          title: 'Debrief Immediately After',
          duration: '30 min',
          content: [
            { type: 'discussion', questions: [
              'What happened out there?',
              'Who prayed for someone for the first time?',
              'What was hard? What scared you?',
            ] },
            { type: 'paragraph', text: 'Pray thanksgiving for opportunities.' },
            { type: 'paragraph', text: 'Remind disciples: Next week is Testimony Time. Fill out the Testimony Development Worksheet and bring it!' },
          ],
        },
      ],
      coachingTips: [
        { type: 'coachingTip', title: 'Before the outreach', text: 'Normalize nerves: "It\'s okay to be scared. Do it scared." Give them a simple script. Role-play the conversation beforehand.' },
        { type: 'coachingTip', title: 'During the outreach', text: 'Model first: "Watch me, then you\'ll try." Start easy: Let them hand out water bottles before asking them to pray for someone.' },
        { type: 'coachingTip', title: 'After the outreach', text: 'Celebrate every step of obedience, even if nothing "happened." Don\'t measure success by conversions\u2014measure it by obedience.' },
      ],
      redFlags: [
        { type: 'redFlag', title: 'Pushy or Forceful', text: 'Someone is pushy or forceful with people. Correction needed\u2014we represent Jesus with love, not pressure.' },
        { type: 'redFlag', title: 'Performance-Driven', text: 'Someone measures success by results rather than obedience. Redirect their focus.' },
        { type: 'redFlag', title: 'Paralyzed by Fear', text: "Someone is fearful to the point of paralysis. Don't shame them. Let them observe first. Pray with them after to break off fear." },
      ],
      scenarios: [
        { type: 'scenario', title: 'Someone says "No thanks"', text: 'A person immediately declines prayer or conversation.', response: 'Don\'t take it personally. Smile and say, "No problem! Have a great day!" Move on.' },
        { type: 'scenario', title: 'Someone opens up with deep pain', text: 'A person shares significant struggles or trauma.', response: 'Listen well. Don\'t rush to "fix" them. Pray specifically. Offer to follow up if appropriate.' },
        { type: 'scenario', title: 'Someone wants to argue', text: 'A person wants to debate theology or challenge your beliefs.', response: 'Stay kind: "I respect your perspective. I\'m not here to debate\u2014just to love people and offer prayer." Graciously disengage if they persist.' },
        { type: 'scenario', title: 'Someone wants to accept Jesus', text: 'A person is ready to give their life to Christ right there.', response: 'CELEBRATE! Lead them in a simple prayer of surrender. Get their contact info. Connect them to your church. Follow up within 24 hours.' },
        { type: 'scenario', title: 'A disciple freezes', text: 'One of your group members can\'t bring themselves to approach anyone.', response: 'Don\'t shame them. Let them observe first. Encourage: "You don\'t have to do it today. Just watch. Next time you\'ll be ready." Pray with them after.' },
      ],
      leaderPrep: [
        'Plan a specific outreach activity (street evangelism, homeless ministry, prayer walk, hospital visit, serving together, campus outreach, or neighborhood cookout)',
        'Communicate details clearly: what, when, where, what to bring',
        'Pray for divine appointments and Holy Spirit boldness',
        'Prepare for spiritual warfare\u2014this will be uncomfortable',
      ],
      disciplePrep: [
        'Show up ready to step outside comfort zones',
        'Pray for courage and sensitivity to the Holy Spirit',
        'Bring whatever is needed for the activity',
      ],
      afterMeeting: [
        'Text everyone that night: "I\'m so proud of you for stepping out today."',
        'Share testimonies in the group chat',
        'Pray for the people you encountered',
        'Follow up: "Make sure to add any testimonies from the outreach to your Testimony Development Worksheet for Week 8."',
      ],
      completionChecklist: [
        'Read this guide 2-3 days before the meeting',
        'Planned and organized the outreach activity',
        'Prayed for each disciple by name',
        'Led the outreach with your group',
      ],
    },

    // ==========================================
    // WEEK 8: Testimony Time
    // ==========================================
    {
      week: 8,
      month: 2,
      title: 'Testimony Time',
      subtitle: "Building & Sharing Your Story of God's Faithfulness",
      purpose:
        "To debrief the outreach experience from Week 7, help disciples develop powerful testimonies that glorify God, and train them to recognize God's activity in everyday life.",
      whyThisMatters:
        "A well-told testimony can change someone's life\u2014it builds faith (Romans 10:17), overcomes darkness (Revelation 12:11), and gives God glory. This week, we teach disciples HOW to craft and share testimonies that connect with others and point them to Jesus.",
      totalDuration: '90 min',
      meetingSteps: [
        {
          type: 'meetingStep',
          stepNumber: 1,
          title: 'Opening Worship',
          duration: '5 min',
          content: [
            { type: 'paragraph', text: 'Sing 1-2 songs of thanksgiving and celebration. Worship prepares hearts to see and share God\'s goodness.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 2,
          title: 'Outreach Debrief',
          duration: '15 min',
          content: [
            { type: 'discussion', label: 'Process the Week 7 Experience', questions: [
              'What did you experience during the outreach? What stood out?',
              'Where did you see God show up? Any specific moments?',
              'What challenged you? What encouraged you?',
              'Did anyone have a conversation or moment that felt significant?',
              'How did this experience grow your faith?',
            ] },
            { type: 'paragraph', text: 'Celebrate every story\u2014big or small. Help disciples see God\'s activity in moments they might overlook.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 3,
          title: 'Leader Testimony Modeling',
          duration: '10 min',
          content: [
            { type: 'paragraph', text: 'Leader 1 shares their prepared testimony (Salvation/Transformation story). After sharing, PAUSE and debrief.' },
            { type: 'discussion', questions: [
              'What made that testimony easy to follow?',
              'What details stood out to you?',
              'What did you learn about God\'s character from that story?',
            ] },
            { type: 'paragraph', text: 'Leader 2 shares second testimony (Recent "God moment"). Debrief what made it effective: Specific details, God as the hero, honest about the struggle, clear outcome.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 4,
          title: 'Teaching: The STORY Framework',
          duration: '15 min',
          content: [
            { type: 'keyDefinition', title: 'S \u2014 STRUGGLE (Before)', text: 'Where were you before God intervened? What was the problem, need, or pain?' },
            { type: 'keyDefinition', title: 'T \u2014 TURNING POINT (The Moment)', text: 'When/how did God show up? What specific event or realization happened?' },
            { type: 'keyDefinition', title: 'O \u2014 OUTCOME (After)', text: 'What changed as a result? How is your life different now?' },
            { type: 'keyDefinition', title: 'R \u2014 REFLECTION (What You Learned)', text: 'What did this experience teach you about God? About yourself?' },
            { type: 'keyDefinition', title: 'Y \u2014 YOUR INVITATION (The Call)', text: 'What do you want others to take away? What hope can you offer?' },
            { type: 'header', text: 'What Makes a Testimony Powerful' },
            { type: 'checklist', items: [
              'Specific \u2014 "God provided $500 for rent" not "God is just so good"',
              'Concise \u2014 3-5 minutes max',
              'God-centered \u2014 He\'s the hero, not you',
              'Honest \u2014 Include the struggle, not just the victory',
              'Relatable \u2014 Others can see themselves in your story',
              'Hope-filled \u2014 Points people to Jesus as the answer',
            ] },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 5,
          title: 'Testimony Workshop',
          duration: '35 min',
          content: [
            { type: 'header', text: 'Step 1: Pair Up (5 min)' },
            { type: 'paragraph', text: 'Break into pairs. Each person shares which testimony they want to focus on tonight.' },
            { type: 'header', text: 'Step 2: Workshop in Pairs (20 min)' },
            { type: 'paragraph', text: 'Person 1 shares their testimony draft. Person 2 listens and gives feedback: "What was most compelling?" "Where could you add more detail?" "Is God the hero?" Switch roles.' },
            { type: 'header', text: 'Step 3: Volunteer Shares (10 min)' },
            { type: 'paragraph', text: 'Ask volunteers to share their refined testimony with the whole group. Group gives feedback.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 6,
          title: 'Challenge & Commission',
          duration: '10 min',
          content: [
            { type: 'numbered', items: [
              'Refine your testimony \u2014 Use the feedback and polish your story',
              'Practice out loud \u2014 Share your testimony with someone outside this group',
              'Add to your worksheet \u2014 Write down any new "God moments" this week',
              'Pray for opportunities \u2014 Ask God to open doors to share your testimony',
            ] },
            { type: 'paragraph', text: '"Next week, we\'ll dive into Breaking Strongholds\u2014identifying and overcoming lies that hold us back."' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 7,
          title: 'Closing Prayer & Declaration',
          duration: '5 min',
          content: [
            { type: 'prayerScript', text: 'Father, thank You for Your faithfulness in each of our lives. Thank You that every person in this room has a story to tell\u2014a story of Your goodness, Your power, Your presence. Give us boldness to share our testimonies this week. Let our stories build faith in others and give You all the glory. In Jesus\' name, Amen.' },
            { type: 'paragraph', text: 'Declare together: "God is faithful. He is good. He is with us. And we will testify."' },
          ],
        },
      ],
      coachingTips: [
        { type: 'coachingTip', title: '"I don\'t have any big testimonies"', text: 'You don\'t need a dramatic story. Even "small" testimonies reveal God\'s character. Did He answer a prayer? Provide for a need? Give you peace? That\'s a testimony.' },
        { type: 'coachingTip', title: '"I\'m not a good storyteller"', text: 'That\'s why we gave you the STORY Framework. Just follow the structure: Struggle, Turning Point, Outcome, Reflection, Your Invitation.' },
        { type: 'coachingTip', title: '"I don\'t want to sound preachy"', text: 'Great instinct. The best testimonies are conversational and relatable. Tell your story like you\'re talking to a friend over coffee.' },
        { type: 'coachingTip', title: 'Someone\'s testimony is vague', text: 'Ask follow-up questions: "Can you give a specific example?" "When did this happen?" "What did it look like?"' },
        { type: 'coachingTip', title: 'Someone rambles 15+ minutes', text: '"I love this story. Let\'s pause so everyone gets a chance. Can you give us the main point in one sentence?"' },
      ],
      redFlags: [
        { type: 'redFlag', title: 'Can\'t Identify Any Testimony', text: 'Possible spiritual dryness. Help them see God in everyday moments by asking specific questions about their week.' },
        { type: 'redFlag', title: 'Testimonies Are All About Them', text: 'Redirect focus: "Where was God in this story? What did He do? What did it teach you about Him?"' },
        { type: 'redFlag', title: 'No Recent Testimonies', text: 'They may not be walking closely with God currently. Check in privately about their daily habits.' },
      ],
      scenarios: [],
      leaderPrep: [
        'Send Testimony Development Worksheet after Week 6 meeting',
        'Prepare 2 of your own testimonies using the STORY Framework',
        'Review the STORY Framework teaching',
        'Be ready to explain WHY your testimonies are effective',
      ],
      disciplePrep: [
        'Complete the Testimony Development Worksheet before the meeting',
        'Bring at least 1 testimony using the worksheet structure',
      ],
      afterMeeting: [
        'Text individual disciples: "Have you had a chance to share your testimony with anyone yet?"',
        'Celebrate when someone shares their testimony\u2014ask how it went',
        'Continue adding your own answered prayers and "God moments" to model',
      ],
      completionChecklist: [
        'Read this guide 2-3 days before the meeting',
        'Prepared your own testimonies using the STORY Framework',
        'Prayed for each disciple by name',
        'Led the Testimony Time session with your group',
      ],
    },

    // ==========================================
    // WEEK 9: Breaking Strongholds
    // ==========================================
    {
      week: 9,
      month: 3,
      title: 'Breaking Strongholds',
      subtitle: 'Reveal, Renounce, Replace',
      purpose:
        'To help disciples identify and break free from lies, strongholds, and agreements with the enemy through Spirit-led deliverance.',
      whyThisMatters:
        "You've spent 8 weeks building trust, learning tools, and experiencing God's faithfulness. Now it's time to go deeper. The Holy Spirit wants to expose what's been holding you back and replace it with His truth.",
      totalDuration: '90 min',
      meetingSteps: [
        {
          type: 'meetingStep',
          stepNumber: 1,
          title: 'Opening & Worship',
          duration: '10 min',
          content: [
            { type: 'paragraph', text: 'Create a safe, holy atmosphere. Invite the Holy Spirit to lead.' },
            { type: 'paragraph', text: '"Tonight, we\'re not just learning\u2014we\'re experiencing freedom."' },
            { type: 'prayerScript', text: 'Holy Spirit, we invite You to lead this time. Reveal what needs to be exposed. Break what needs to be broken. Replace lies with Your truth. We surrender to You.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 2,
          title: 'What Is a Stronghold?',
          duration: '15 min',
          content: [
            { type: 'scripture', text: 'For though we live in the world, we do not wage war as the world does. The weapons we fight with are not the weapons of the world. On the contrary, they have divine power to demolish strongholds. We demolish arguments and every pretension that sets itself up against the knowledge of God, and we take captive every thought to make it obedient to Christ.', ref: '2 Corinthians 10:3-5' },
            { type: 'paragraph', text: 'A stronghold is a fortified place\u2014a lie, belief, or pattern that has become entrenched in your mind and heart.' },
            { type: 'header', text: 'Examples of Strongholds' },
            { type: 'checklist', items: [
              '"God doesn\'t really love me."',
              '"I\'m not enough."',
              '"I\'ll always struggle with this sin."',
              '"I have to perform to be accepted."',
              '"No one can be trusted."',
              'Unforgiveness, bitterness, fear, shame, control, pride',
            ] },
            { type: 'paragraph', text: "The goal tonight: We're not going to pick an area for you. The Holy Spirit knows exactly what needs to be addressed. We're going to ask Him to reveal it." },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 3,
          title: 'Introduce Reveal, Renounce, Replace',
          duration: '10 min',
          content: [
            { type: 'keyDefinition', title: 'STEP 1: REVEAL', text: 'Ask God to show you the lie or stronghold. "God, is there a lie I\'m believing about You? About myself? About others?" Wait and listen. Don\'t filter it.' },
            { type: 'keyDefinition', title: 'STEP 2: RENOUNCE', text: 'Verbally break agreement with the lie. Confess, renounce, break covenants, forgive. This must be verbal\u2014your voice has authority.' },
            { type: 'keyDefinition', title: 'STEP 3: REPLACE', text: 'Ask God what He wants to give you instead. "God, I give You this lie. What do You give me in return?" Receive His truth. Declare it out loud. Write it down.' },
            { type: 'paragraph', text: 'Critical: We are never meant to be empty\u2014we are meant to be FULL of the right things. If you only renounce but don\'t replace, the enemy will try to fill that space again (Matthew 12:43-45).' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 4,
          title: 'Guided Reveal, Renounce, Replace Session',
          duration: '35 min',
          content: [
            { type: 'paragraph', text: 'Dim the lights slightly. Play soft instrumental worship music. Everyone has space to spread out.' },
            { type: 'header', text: 'REVEAL (10 min)' },
            { type: 'paragraph', text: '"Close your eyes. Ask: \'God, is there a lie I\'m believing? Is there a stronghold You want to break tonight?\' Don\'t force it. Don\'t pick something because it sounds good. Just wait. Listen."' },
            { type: 'paragraph', text: 'Give them 10-15 minutes of silence. Leaders pray silently over the room.' },
            { type: 'header', text: 'RENOUNCE (10 min)' },
            { type: 'prayerScript', text: 'God, You\'ve shown me that I\'ve been believing the lie that __________. I confess this / I renounce this lie. I break agreement with this lie right now in Jesus\' name. I break any covenant I\'ve made with __________. I forgive __________ for contributing to this lie. I release them from my judgment. I choose forgiveness. I command this stronghold to leave me NOW in the name of Jesus. I am covered by the blood of Christ. I belong to God. I am free.' },
            { type: 'header', text: 'REPLACE (10 min)' },
            { type: 'paragraph', text: '"Ask God: \'What do You want to give me instead? What is the TRUTH?\' Write it down. This is your new identity."' },
            { type: 'paragraph', text: '"Now declare the truth out loud. Share the lie you renounced and the truth God is giving you."' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 5,
          title: 'Unpack and Closing Prayer',
          duration: '15 min',
          content: [
            { type: 'prayerScript', text: 'Father, thank You for what You\'ve done tonight. You\'ve exposed lies, broken strongholds, and replaced them with truth. We seal this work by the blood of Jesus. We declare that what You\'ve broken tonight stays broken. What You\'ve spoken tonight stays spoken. Fill every empty place with Your Spirit. Guard these hearts. Protect this freedom. In Jesus\' mighty name, Amen.' },
            { type: 'header', text: 'Commission' },
            { type: 'numbered', items: [
              'Recognize it: "That\'s the lie again."',
              'Renounce it: "I already broke agreement with that. It has no power over me."',
              'Replace it: "The truth is __________."',
            ] },
            { type: 'paragraph', text: "This isn't a one-time event. It's a lifestyle. You now have a tool you can use anytime the enemy tries to deceive you." },
          ],
        },
      ],
      coachingTips: [
        { type: 'coachingTip', title: 'Someone can\'t hear during REVEAL', text: "Don't force it. Ask gently: 'What's been the hardest struggle for you lately? Let's ask God about that.' Reassure them: 'God is kind. He's not going to shame you.'" },
        { type: 'coachingTip', title: 'Someone breaks down emotionally', text: "This is normal and healthy. Let them cry. Sit with them. Don't rush them. Pray quietly over them." },
        { type: 'coachingTip', title: 'Deeper ministry needed (trauma, abuse)', text: "Don't try to fix it all tonight. Pray for peace. Afterward, offer to connect them with a counselor or pastor. Follow up within 24 hours." },
        { type: 'coachingTip', title: 'Lie connected to unforgiveness', text: 'Stop and address forgiveness first. Walk them through: "God, I forgive [name] for [what they did]. I release them from my judgment."' },
        { type: 'coachingTip', title: 'Group is hesitant or fearful', text: 'Leaders go first. Model vulnerability. Share your own Reveal, Renounce, Replace moment.' },
      ],
      redFlags: [
        { type: 'redFlag', title: 'Complete Resistance', text: 'May indicate deeper spiritual bondage or unwillingness to surrender. Don\'t force it\u2014pray and follow up privately.' },
        { type: 'redFlag', title: 'Can\'t Receive Truth After Renouncing', text: 'May need more time, more ministry, or deliverance. Don\'t rush the process.' },
        { type: 'redFlag', title: 'Shame After Sharing', text: 'Address immediately: "There is no condemnation in Christ. You are loved. You are safe here."' },
      ],
      scenarios: [],
      leaderPrep: [
        'Pray for Holy Spirit sensitivity and discernment',
        'Create a safe, private environment',
        'Prepare soft instrumental worship music',
        'Have notebooks/paper ready for disciples to write',
        'Be ready to provide individual ministry if needed',
      ],
      disciplePrep: [
        'Come with an open heart',
        'Be ready for the Holy Spirit to reveal hidden things',
        'Trust the process\u2014freedom is coming',
      ],
      afterMeeting: [
        'Text each disciple within 24 hours: "How are you feeling after last night?"',
        'If someone had a significant breakthrough, follow up with a call or coffee',
        'Warn about spiritual warfare: "If that lie tries to come back, renounce it again and declare the truth."',
        'Encourage: "Journal the truth God gave you in your 3D Journal this week."',
      ],
      completionChecklist: [
        'Read this guide 2-3 days before the meeting',
        'Completed your own Reveal, Renounce, Replace exercise',
        'Prayed for each disciple by name',
        'Led the Breaking Strongholds session',
      ],
    },

    // ==========================================
    // WEEK 10: Identity Shift
    // ==========================================
    {
      week: 10,
      month: 3,
      title: 'Identity Shift',
      subtitle: 'Who You Are in Christ',
      purpose:
        "To help disciples shift from their own limited perception of themselves to embrace who God says they are, and to equip them with an Identity Battle Plan for ongoing spiritual warfare.",
      whyThisMatters:
        "You've broken strongholds in Week 9. Now it's time to build up the truth. The enemy attacks your identity. When you know who you are in Christ and have Scripture to back it up, you can stand firm. This isn't just a nice teaching\u2014this is warfare training.",
      totalDuration: '90 min',
      meetingSteps: [
        {
          type: 'meetingStep',
          stepNumber: 1,
          title: 'Opening: The Identity Transfer',
          duration: '8 min',
          content: [
            { type: 'paragraph', text: '"Christ has already transferred His identity to you. The moment you became a Christian, you received a new identity. But just because Christ has given us this new identity doesn\'t mean we automatically experience it. We have to come into agreement with it."' },
            { type: 'prayerScript', text: 'God, open our eyes to see ourselves the way You see us. Expose the lies we\'ve believed about ourselves. Reveal the truth. Give us the courage to deny our own opinions and come into agreement with Yours. In Jesus\' name.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 2,
          title: 'The Mirror Test',
          duration: '7 min',
          content: [
            { type: 'paragraph', text: '"Answer honestly\u2014not the \'Christian\' answer, but the real answer: When you look at yourself in the mirror, what do you see? What kind of person are you?"' },
            { type: 'paragraph', text: 'Take 4-5 minutes to write it down. Be honest. This is between you and God.' },
            { type: 'paragraph', text: 'Don\'t say a word. Move on to the next section.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 3,
          title: 'Listening Prayer: How Does God See You?',
          duration: '10 min',
          content: [
            { type: 'paragraph', text: '"Close your eyes. Ask God: \'God, when You look at me, what do You see?\' Don\'t force it. Just wait. Listen."' },
            { type: 'checklist', items: [
              'A word or phrase (\'beloved,\' \'strong,\' \'chosen,\' \'warrior\')',
              'A picture or image',
              'A Scripture that comes to mind',
              'A feeling of His affection or pride over you',
            ] },
            { type: 'paragraph', text: 'Give them 7 minutes of silence. Play soft music. Leaders pray silently.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 4,
          title: 'The Identity Gap',
          duration: '10 min',
          content: [
            { type: 'paragraph', text: '"Now look at what you wrote. What do you notice about the difference? One of you must be wrong. And we all know that God is not incorrect."' },
            { type: 'keyDefinition', title: 'The Truth', text: 'Who He says I am is who I truly am. Not how you feel. Not your track record. Not your failures. His word over you is the truth.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 5,
          title: 'Teaching: The Gideon Encounter',
          duration: '15 min',
          content: [
            { type: 'scripture', text: 'Read Judges 6:11-16', ref: 'Judges 6:11-16' },
            { type: 'paragraph', text: 'God meets Gideon hiding in a winepress and says: "The Lord is with you, mighty man of valor!" But Gideon doesn\'t receive it. He reminds God that he\'s the least in his father\'s house.' },
            { type: 'paragraph', text: 'God calls him a "mighty man of valor" while he\'s hiding in fear. And God doesn\'t argue. He just says, "I will be with you."' },
            { type: 'keyDefinition', title: 'False Humility', text: 'False humility is exalting your opinion of you over what God says about you. True humility is agreeing with God\u2014even when it feels too good to be true.' },
            { type: 'paragraph', text: 'Everyone say this out loud: "I am who Jesus says I am."' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 6,
          title: 'Teaching: Do You Agree?',
          duration: '15 min',
          content: [
            { type: 'scripture', text: 'For no matter how many promises God has made, they are "Yes" in Christ. And so through him the "Amen" is spoken by us to the glory of God.', ref: '2 Corinthians 1:20' },
            { type: 'paragraph', text: 'God\'s promises are "Yes" in Christ. Our job is to say "Amen"\u2014to agree with what He says.' },
            { type: 'keyDefinition', title: 'Two Agreements', text: '1. Who God says He is (God Dependent). 2. Who God says I am (God Confident). If I come into agreement with these two statements, I will function in the likeness of Christ.' },
            { type: 'discussion', questions: [
              'Where do you tend to fall: insecure, arrogant, independent, or codependent?',
              'Jesus is calling you to the center\u2014true humility and God dependence.',
            ] },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 7,
          title: 'Identity Battle Plan',
          duration: '15 min',
          content: [
            { type: 'paragraph', text: 'When the enemy attacks your identity, you need to be ready. The Identity Battle Plan has two columns: "Who I Am" (with Scripture) and "Who He Is" (corresponding attribute of God).' },
            { type: 'paragraph', text: 'Example: "Who I am: More than conquerors \u2014 Romans 8:37" / "Who He is: Gracious giver \u2014 Romans 8:32"' },
            { type: 'paragraph', text: 'Goal: Fill in at least 3-5 lines tonight. This is a lifelong tool\u2014keep adding to it.' },
            { type: 'paragraph', text: 'Give them 15 minutes to work. Play soft music. Leaders circulate and help.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 8,
          title: 'Declarations & Closing',
          duration: '10 min',
          content: [
            { type: 'paragraph', text: '"One by one, share one \'Who I am\' statement from your Battle Plan and the Scripture that backs it up. Declare it out loud."' },
            { type: 'prayerScript', text: 'Father, thank You for what You\'ve done tonight. You\'ve opened our eyes to see ourselves the way You see us. You\'ve given us weapons to fight back when the enemy attacks. We seal this truth by the blood of Jesus. We declare that we are who You say we are. We are Yours. We are loved. We are chosen. We are strong in You. In Jesus\' mighty name, Amen.' },
          ],
        },
      ],
      coachingTips: [
        { type: 'coachingTip', title: 'Someone can\'t hear God', text: "Ask gently: 'What's something you've always wished God would say about you? Ask Him if that's true.' Reassure: 'God is kind.'" },
        { type: 'coachingTip', title: 'Struggles finding Scripture', text: 'Help them search. Suggest Romans 8, Ephesians 1-2, 1 Peter 2, or Colossians 3. Start with: "You are loved\u20141 John 3:1."' },
        { type: 'coachingTip', title: 'Identity doesn\'t align with Scripture', text: "Gently correct: 'Let's make sure it lines up with Scripture. Can we find a verse that confirms that?'" },
        { type: 'coachingTip', title: 'Group is hesitant', text: 'Leaders go first. Model vulnerability. Share your own identity struggle and what God has spoken over you.' },
      ],
      redFlags: [
        { type: 'redFlag', title: 'Complete Resistance', text: 'May indicate deeper wounds or lies. Don\'t force\u2014pray and follow up privately.' },
        { type: 'redFlag', title: 'Shame After Hearing God', text: 'Address immediately: "There is no condemnation in Christ. You are loved. You are safe here."' },
        { type: 'redFlag', title: 'Joking Through the Process', text: 'May be a defense mechanism. Gently call it out: "I notice you\'re deflecting. What\'s really going on?"' },
      ],
      scenarios: [],
      leaderPrep: [
        'Pray for Holy Spirit to reveal true identity over each disciple',
        'Print Identity Battle Plan worksheets (one per disciple)',
        'Have Bibles ready for Scripture searching',
        'Prepare to share your own identity journey',
      ],
      disciplePrep: [
        'Come ready to see yourself the way God sees you',
        'Bring your Bible and a pen',
      ],
      afterMeeting: [
        'Text each disciple within 24 hours: "What\'s one truth God spoke over you that\'s sticking?"',
        'Encourage daily reinforcement: read Identity Battle Plan every morning this week',
        'Warn about spiritual warfare: "If lies come back, renounce them and declare the truth from your Battle Plan."',
      ],
      completionChecklist: [
        'Read this guide 2-3 days before the meeting',
        'Completed your own Identity Battle Plan',
        'Prayed for each disciple by name',
        'Led the Identity Shift session',
      ],
    },

    // ==========================================
    // WEEK 11: Spiritual Gifts
    // ==========================================
    {
      week: 11,
      month: 3,
      title: 'Spiritual Gifts',
      subtitle: 'Discover Your Design to Serve',
      purpose:
        "To help disciples discover how God has uniquely designed them to serve the Body of Christ through spiritual gifts, while ensuring their identity remains rooted in Christ\u2014not in their function.",
      whyThisMatters:
        "You've broken strongholds and established identity in Christ. Now it's time to discover HOW God wants to express His love through you. Spiritual gifts aren't about what makes you special\u2014they're about how the Father equips you to serve others for the common good.",
      totalDuration: '90 min',
      meetingSteps: [
        {
          type: 'meetingStep',
          stepNumber: 1,
          title: 'Opening: The Father of Lights',
          duration: '10 min',
          content: [
            { type: 'paragraph', text: '"Before we dive into what gifts you have, we need to establish something critical: These gifts don\'t define you. You are beloved FIRST. Gifted SECOND."' },
            { type: 'scripture', text: 'Every good thing given and every perfect gift is from above, coming down from the Father of lights, with whom there is no variation or shifting shadow.', ref: 'James 1:17' },
            { type: 'prayerScript', text: 'Father, thank You for being the Father of lights who gives good gifts. Tonight, help us receive what You\'ve designed us to carry\u2014not as orphans begging for validation, but as beloved children. Show us how You\'ve wired us. Unlock the gifts You\'ve placed inside us. In Jesus\' name.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 2,
          title: 'Identity First: Gifts Don\'t Define You',
          duration: '10 min',
          content: [
            { type: 'paragraph', text: 'Your spiritual gifts are NOT your identity. You are a beloved child of God who happens to serve others through specific gifts.' },
            { type: 'scripture', text: 'Now there are varieties of gifts, but the same Spirit; and there are varieties of service, but the same Lord; and there are varieties of activities, but it is the same God who empowers them all in everyone. To each is given the manifestation of the Spirit for the common good.', ref: '1 Corinthians 12:4-7' },
            { type: 'discussion', questions: ['Before taking the assessment, what did you think "spiritual gifts" meant?', 'Did you think some gifts were more valuable than others?'] },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 3,
          title: 'Review Assessment Results',
          duration: '15 min',
          content: [
            { type: 'keyDefinition', title: 'Tier 1: How You Serve (Romans 12)', text: 'Teaching, serving, encouraging, giving, leading, mercy, prophecy. Your natural wiring\u2014how God designed you to love people.' },
            { type: 'keyDefinition', title: 'Tier 2: Supernatural Empowerment (1 Cor 12)', text: 'Wisdom, knowledge, faith, healing, miracles, prophecy, discernment, tongues, interpretation. Accessed through the Holy Spirit and activated through practice.' },
            { type: 'keyDefinition', title: 'Tier 3: Leadership Calling (Eph 4)', text: 'Apostle, prophet, evangelist, shepherd, teacher. Not everyone scores high here\u2014and that\'s God\'s perfect design.' },
            { type: 'paragraph', text: 'Share your top 2-3 gifts from Tier 1. Share 1-2 desired gifts from Tier 2. Partner affirms: "I can totally see that in you because..."' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 4,
          title: 'One Body, Many Parts',
          duration: '10 min',
          content: [
            { type: 'scripture', text: 'Just as a body, though one, has many parts, but all its many parts form one body, so it is with Christ...', ref: '1 Corinthians 12:12-20' },
            { type: 'paragraph', text: 'You are necessary. Without you, the Body is incomplete. The gift of serving is just as valuable as prophecy. The gift of mercy is just as needed as teaching.' },
            { type: 'keyDefinition', title: 'Three Words', text: 'Play your part. When one person operates in their gift, we all benefit. When one person withholds their gift, we all suffer.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 5,
          title: 'Impartation & Activation',
          duration: '20 min',
          content: [
            { type: 'scripture', text: 'For this reason I remind you to fan into flame the gift of God, which is in you through the laying on of my hands. For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.', ref: '2 Timothy 1:6-7' },
            { type: 'paragraph', text: '"The gift is already in you. It just needs to be unlocked. Tonight, we\'re going to lay hands on you and pray for the gifts God has placed inside you. Then you\'re going to activate them IMMEDIATELY."' },
            { type: 'keyDefinition', title: 'The Process', text: '1. ACCESS \u2014 Submit to the Holy Spirit. 2. ASK \u2014 Ask boldly as beloved children. 3. ACTIVATE \u2014 Use the gift immediately.' },
            { type: 'paragraph', text: 'As the group lays hands on each person, the leader prays specifically for their top 2 gifts. Immediately after, that person uses the gift through an activation exercise.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 6,
          title: 'Debrief & Closing',
          duration: '15 min',
          content: [
            { type: 'discussion', questions: [
              'What did you experience when you activated your gift?',
              'What felt natural? What felt stretching?',
              'Did anyone see or experience breakthrough?',
            ] },
            { type: 'paragraph', text: '"This week, use your top gift to serve someone outside this group. Pay attention to where you see fruit\u2014that\'s confirmation."' },
            { type: 'prayerScript', text: 'Father, thank You for what You\'ve done tonight. You\'ve revealed how You\'ve designed each of us to serve. We seal this by the blood of Jesus. We declare that we are vessels of Your power\u2014not for our glory, but for the common good. Remind us: We are beloved first, gifted second. In Jesus\' name, Amen.' },
          ],
        },
      ],
      coachingTips: [
        { type: 'coachingTip', title: 'Don\'t let gifts become identity', text: 'Constantly redirect to Christ. "Your gift is HOW you serve. Your identity is WHO you are\u2014beloved."' },
        { type: 'coachingTip', title: 'Don\'t compare gifts', text: 'All are equally valuable. The gift of serving is just as important as prophecy.' },
        { type: 'coachingTip', title: 'Don\'t force activation', text: 'Create space, but don\'t pressure. Affirm every attempt, even if it feels "small."' },
        { type: 'coachingTip', title: 'Character > Gifts', text: 'The fruit of the Spirit matters more than spiritual gifts. Gifts without character is dangerous.' },
      ],
      redFlags: [
        { type: 'redFlag', title: 'Claims ALL the Gifts', text: 'Pride or misunderstanding. Gently redirect to how gifts serve the Body, not elevate the individual.' },
        { type: 'redFlag', title: 'Dismisses Their Gifts', text: 'Insecurity or false humility. Affirm: "God designed you this way on purpose. Your gift matters."' },
        { type: 'redFlag', title: 'Uses Gift to Control', text: 'Spiritual abuse red flag. Address immediately and privately.' },
      ],
      scenarios: [],
      leaderPrep: [
        'SEND the Spiritual Gifts Assessment 3-4 days before the meeting',
        'Review each disciple\'s assessment results before the meeting',
        'Pray over each person\'s top gifts and ask God how to activate them',
        'Be prepared to lay hands on disciples for impartation',
      ],
      disciplePrep: [
        'COMPLETE the Spiritual Gifts Assessment before the meeting',
        'Bring your assessment results',
        'Come with an open heart to receive from the Father',
      ],
      afterMeeting: [
        'Encourage disciples to use their top gift to serve someone this week',
        'Ask in group chat: "How did you use your gift this week?"',
        'Celebrate activation stories at the start of Week 12',
      ],
      completionChecklist: [
        'Read this guide 2-3 days before the meeting',
        'Sent Spiritual Gifts Assessment to all disciples',
        'Reviewed assessment results before the meeting',
        'Led the Spiritual Gifts session with activation',
      ],
    },

    // ==========================================
    // WEEK 12: Life Assessment Revisited
    // ==========================================
    {
      week: 12,
      month: 3,
      title: 'Life Assessment Revisited',
      subtitle: 'Measuring Growth & Setting New Goals',
      purpose:
        'To measure growth over the last 12 weeks, celebrate progress, identify areas still needing work, and set goals for continued growth.',
      whyThisMatters:
        "Growth is gradual, and we often don't notice it unless we pause to look back. This week creates space to see how far they've come and vision for where they're going.",
      totalDuration: '90 min',
      meetingSteps: [
        {
          type: 'meetingStep',
          stepNumber: 1,
          title: 'Opening Worship & Reflection',
          duration: '10 min',
          content: [
            { type: 'paragraph', text: 'Worship and thank God for the last 12 weeks. Invite Holy Spirit to reveal growth and areas for continued work.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 2,
          title: 'Retake Life Assessment',
          duration: '20-30 min',
          content: [
            { type: 'paragraph', text: 'Send the Week 12 Life Assessment link from your DNA Groups Dashboard. They\'ll complete the same 42 questions they answered in Week 1.' },
            { type: 'paragraph', text: 'While they complete: Pray for each disciple. Monitor your dashboard to see when everyone has submitted.' },
            { type: 'paragraph', text: 'Once submitted, the dashboard will auto-generate comparison PDFs showing Week 1 vs Week 12 results.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 3,
          title: 'Comparison & Discussion',
          duration: '40 min',
          content: [
            { type: 'paragraph', text: 'For each person (10 minutes each): Review their comparison report showing scores in all 7 categories, percentage changes, biggest growth areas, and open-ended responses side by side.' },
            { type: 'paragraph', text: 'Give 5 minutes of silent reflection, then discuss.' },
            { type: 'discussion', questions: [
              'What growth surprised you the most?',
              'What area still needs the most work?',
              'What was the turning point for your biggest area of growth?',
            ] },
            { type: 'header', text: 'How to Celebrate Growth' },
            { type: 'paragraph', text: 'Be specific: "Week 1 you said you couldn\'t hear God\'s voice. Last week you gave a prophetic word that brought someone to tears. That\'s growth."' },
            { type: 'header', text: 'How to Address Stagnation' },
            { type: 'paragraph', text: 'Be honest but kind: "I notice you\'re still struggling with the same fear. Can we talk about that?" Don\'t shame. Create a plan.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 4,
          title: 'Group Celebration & Vision Casting',
          duration: '10 min',
          content: [
            { type: 'discussion', questions: ['What growth have you seen in each other?'] },
            { type: 'paragraph', text: 'Go around and affirm one another. Leaders share what they\'ve seen in each disciple.' },
            { type: 'paragraph', text: '"These 12 weeks were just the beginning. You\'ve laid a foundation. Now we build on it. Our goal is for you to multiply\u2014to do this with someone else."' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 5,
          title: 'Setting Goals for the Next Season',
          duration: '10 min',
          content: [
            { type: 'discussion', label: 'Ask Each Person', questions: [
              'What\'s one area you want to focus on in the next 3 months?',
              'What does success look like in that area?',
              'What\'s one action step you\'ll take this week?',
              'How can we support you?',
            ] },
            { type: 'paragraph', text: 'Write them down and revisit in 3 months.' },
          ],
        },
        {
          type: 'meetingStep',
          stepNumber: 6,
          title: 'Closing Prayer & Commissioning',
          duration: '10 min',
          content: [
            { type: 'paragraph', text: 'Pray over each person by name. Thank God for their growth. Speak vision over them: "You\'re becoming a disciple-maker."' },
            { type: 'paragraph', text: '"You\'ve completed the 90-Day Toolkit. Now the real work begins. This isn\'t the end\u2014it\'s the beginning of a lifestyle. We\'re not done with you. We\'re just getting started."' },
          ],
        },
      ],
      coachingTips: [
        { type: 'coachingTip', title: 'Celebrating Growth', text: 'Be specific. Don\'t just say "You\'ve grown." Point to concrete changes: "You used to be terrified of evangelism\u2014now you\'re asking when we can go out again."' },
        { type: 'coachingTip', title: 'Addressing Stagnation', text: 'Be honest but kind. Ask: "What\'s holding you back? What do you need from us?" Don\'t shame. Growth isn\'t linear.' },
        { type: 'coachingTip', title: 'Comparison Report Walk-Through', text: 'Let disciples read silently first, then discuss. Watch for reactions\u2014some will smile, some will tear up, some will look surprised.' },
      ],
      redFlags: [
        { type: 'redFlag', title: 'No Growth At All', text: 'They may not be truly engaged. Have a direct conversation about commitment and next steps.' },
        { type: 'redFlag', title: 'Growth Only in Knowledge', text: 'Head knowledge without heart/behavior change. May need deeper ministry or accountability.' },
        { type: 'redFlag', title: 'Apathy or Disengagement', text: 'Something deeper may be going on. Check in privately and compassionately.' },
      ],
      scenarios: [],
      leaderPrep: [
        'Send Week 12 Life Assessment link to all disciples',
        'Download Week 1/Week 12 Comparison PDFs from dashboard',
        'Review comparison data before the meeting',
        'Prepare specific encouragement for each disciple based on their growth',
      ],
      disciplePrep: [
        'Come ready to retake the Life Assessment honestly',
        'Reflect on your journey over the last 12 weeks',
      ],
      afterMeeting: [
        'Save Comparison PDFs for each disciple',
        'Follow up individually if Week 12 assessment revealed ongoing struggles',
        'Plan the next 12 weeks or continued DNA material',
        'Begin praying about multiplication timeline',
        'Identify who might be ready to co-lead a future group',
      ],
      completionChecklist: [
        'Read this guide 2-3 days before the meeting',
        'Sent Week 12 Life Assessment links to all disciples',
        'Prayed for each disciple by name',
        'Led the Life Assessment Revisited session',
      ],
    },
  ],
};

// === Helper Functions ===

export function getWeekData(weekNumber: number): ToolkitWeek | undefined {
  return toolkit90DayData.weeks.find((w) => w.week === weekNumber);
}

export function getMonthData(monthNumber: number): ToolkitMonth | undefined {
  return toolkit90DayData.months.find((m) => m.month === monthNumber);
}

export function getWeeksForMonth(monthNumber: number): ToolkitWeek[] {
  return toolkit90DayData.weeks.filter((w) => w.month === monthNumber);
}

export function getMonthForWeek(weekNumber: number): number {
  if (weekNumber <= 4) return 1;
  if (weekNumber <= 8) return 2;
  return 3;
}
