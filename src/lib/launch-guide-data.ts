/**
 * DNA Launch Guide Data
 *
 * A step-by-step blueprint for new disciple-makers
 * 5 Phases from Pre-Launch to Multiplication
 */

export interface ChecklistItem {
  id: string;
  label: string;
}

export interface Subsection {
  title: string;
  subtitle?: string;
  type?: 'warning' | 'success' | 'responses';
  content?: string;
  items?: string[] | ResponseItem[];
  numbered?: boolean;
  note?: string;
}

export interface ResponseItem {
  response: string;
  action: string;
}

export interface InteractiveField {
  id: string;
  type: 'text' | 'textarea' | 'date' | 'names_list';
  label: string;
  placeholder?: string;
  maxItems?: number; // for names_list type
}

export interface SectionCheck {
  id: string;
  label: string;
}

export interface Section {
  id: string;
  title: string;
  intro?: string;
  content?: string;
  subsections?: Subsection[];
  sampleConversation?: string;
  whyList?: string[];
  additionalNotes?: { title: string; content: string }[];
  note?: string;
  callout?: { title: string; content: string; note?: string };
  items?: string[];
  // New interactive properties
  sectionCheck?: SectionCheck; // Inline completion check for this section
  interactiveFields?: InteractiveField[]; // User input fields
  resourceLink?: { label: string; description: string }; // Link to resources
}

export interface Phase {
  id: number;
  title: string;
  subtitle: string;
  tagline: string;
  duration: string;
  intro?: string;
  sections: Section[];
  checklist: ChecklistItem[];
  nextPhasePrompt: string;
}

export interface TimelineItem {
  phase: number;
  name: string;
  duration: string;
  focus: string;
  milestone: string;
}

export interface KeyReminder {
  title: string;
  desc: string;
}

export interface WeeklyMeetingSegment {
  name: string;
  time: string;
  description: string;
}

export interface LaunchGuideData {
  title: string;
  subtitle: string;
  introduction: string;
  timeline: TimelineItem[];
  weeklyMeetingFlow: {
    title: string;
    segments: WeeklyMeetingSegment[];
  };
  keyReminders: KeyReminder[];
  phases: Phase[];
  finalThoughts: {
    title: string;
    items: { title: string; content: string }[];
    closing: string;
  };
}

export const launchGuideData: LaunchGuideData = {
  title: 'DNA Launch Guide',
  subtitle: 'A Step-by-Step Blueprint for New Disciple-Makers',

  introduction: `You've completed the Multiplication Manual. You understand the heart behind making disciples. Now what?

This guide is your practical roadmap from "I want to make disciples" to "I'm actively discipling someone." Think of this as your flight checklist—each phase has specific actions, conversations, and checkpoints to help you launch well.

Remember: Discipleship is both flow and structure. This guide provides the structure, but the Holy Spirit provides the life. Stay flexible, stay prayerful, stay dependent on God.`,

  timeline: [
    {
      phase: 0,
      name: 'Pre-Launch',
      duration: 'Weeks -6 to 0',
      focus: 'Leader training & group formation',
      milestone: 'Co-leader secured, disciples invited, first meeting scheduled',
    },
    {
      phase: 1,
      name: 'Foundation',
      duration: 'Months 1-3',
      focus: 'Learning tools, building trust',
      milestone:
        'Disciples master DNA tools, show vulnerability and teachability',
    },
    {
      phase: 2,
      name: 'Growth',
      duration: 'Months 4-6',
      focus: 'Practicing tools, co-facilitating',
      milestone: 'Disciples leading regularly, taking ownership',
    },
    {
      phase: 3,
      name: 'Multiplication',
      duration: 'Months 7-12',
      focus: 'Preparing to multiply',
      milestone: 'New DNA groups launched',
    },
  ],

  weeklyMeetingFlow: {
    title: 'Weekly Meeting Flow (90 minutes)',
    segments: [
      {
        name: 'Check-In',
        time: '15 min',
        description: 'Highs and lows from the week',
      },
      {
        name: 'Teaching/Tool',
        time: '30 min',
        description: '3D Journal, Listening Prayer, or Creed Cards',
      },
      {
        name: 'Application',
        time: '30 min',
        description: 'Discussion and processing',
      },
      { name: 'Prayer', time: '15 min', description: 'Pray for specific needs' },
    ],
  },

  keyReminders: [
    {
      title: 'Connection before correction',
      desc: 'Build trust before addressing hard things.',
    },
    {
      title: "Don't rush multiplication",
      desc: "Extend phases if disciples aren't ready.",
    },
    {
      title: 'Stay prayerful',
      desc: 'Discipleship begins in prayer, not in planning.',
    },
    {
      title: 'Expect mess',
      desc: "People will disappoint you. That's okay. Keep going.",
    },
  ],

  phases: [
    // ==========================================
    // PHASE 0: PRE-LAUNCH
    // ==========================================
    {
      id: 0,
      title: 'Pre-Launch',
      subtitle: 'Before You Start',
      tagline: 'Getting Yourself Ready',
      duration: 'Weeks -6 to 0',
      sections: [
        {
          id: 'self-assessment',
          title: 'Checkpoint 1: Self-Assessment',
          intro:
            'Before you invite anyone into discipleship, you need to honestly assess your own readiness. Answer these questions:',
          subsections: [
            {
              title: 'Spiritual Readiness',
              items: [
                'Am I consistently spending time with God personally? (Not perfect, but consistent)',
                'Am I walking in freedom from lifestyle sin? (Not sinless, but not in bondage)',
                'Do I have mature believers speaking into my life?',
                'Can I articulate the gospel clearly and confidently?',
                'Am I teachable and correctable?',
              ],
            },
            {
              title: 'Relational Capacity',
              items: [
                'How many close relationships can I handle well right now?',
                'Is my marriage/family life healthy and stable? (If applicable)',
                'Do I have margin in my weekly schedule for 3-5 hours of DNA commitment?',
                'Am I currently overcommitted? What needs to change?',
              ],
            },
            {
              title: 'Emotional Health',
              items: [
                'Can I handle conflict without shutting down or exploding?',
                'Am I able to receive feedback without becoming defensive?',
                'Do I live "unoffendable" or do I easily take offense?',
                'Am I willing to be vulnerable about my own struggles?',
              ],
            },
          ],
          note: 'If you answered "no" to multiple questions in any category, that\'s not disqualifying—it just means you need to address those areas first. Talk to a leader. Get help. Don\'t rush this.',
          sectionCheck: {
            id: 'p0_check_self_assessment',
            label: 'Ready to find your Co-Leader?',
          },
        },
        {
          id: 'co-leader',
          title: 'Checkpoint 2: Finding Your Co-Leader',
          intro: 'Why you need a co-leader:',
          whyList: [
            'Shared workload prevents burnout',
            'Different perspectives strengthen the group',
            'Overlapping relationships create safety and accountability',
            'Models healthy partnership to disciples',
          ],
          subsections: [
            {
              title: 'Who makes a good co-leader?',
              subtitle: 'They should be:',
              items: [
                'Spiritually mature (not perfect, but growing)',
                'Faithful and reliable (proven track record)',
                'Complementary to your gifting (different strengths)',
                'In agreement with DNA vision and values',
                'Someone you respect and trust their wisdom',
              ],
            },
            {
              title: 'They should NOT be:',
              items: [
                'Someone you\'re romantically interested in (avoid confusion)',
                'Someone you\'re currently in conflict with (resolve first)',
                'Someone who is newer in their faith than your potential disciples',
                'Someone who is unwilling to commit to the full process',
              ],
            },
            {
              title: 'How to ask someone to co-lead:',
              numbered: true,
              items: [
                'Pray specifically for God to highlight someone',
                'Have a casual conversation about discipleship',
                'Ask directly: "I\'m looking to start a DNA group. Would you pray about co-leading with me?"',
                'Give them time to pray and decide (don\'t pressure)',
                'If yes, meet to align on expectations, schedule, and approach',
              ],
            },
          ],
          sampleConversation: `"Hey, I've been thinking a lot about discipleship lately and I sense God is calling me to start a DNA group. I really value your walk with God and the way you invest in people. Would you be open to praying about co-leading with me? I think we could make a great team, and I'd love to have your partnership in this."`,
          additionalNotes: [
            {
              title: 'What if they say no?',
              content:
                "Don't take it personally. They may have legitimate reasons (capacity, calling, season of life). Thank them, ask them to pray about who might be a good fit, and keep seeking.",
            },
            {
              title: "What if you can't find a co-leader?",
              content:
                "In rare cases, you may start without one—but actively keep looking. Pray for God to send someone who can step into that role within the first 3 months. Solo leadership is not sustainable long-term.",
            },
          ],
          interactiveFields: [
            {
              id: 'potential_co_leaders',
              type: 'names_list',
              label: 'Potential Co-Leader Names',
              placeholder: 'Enter a name...',
              maxItems: 5,
            },
          ],
          sectionCheck: {
            id: 'p0_check_co_leader',
            label: 'Found your Co-Leader?',
          },
        },
        {
          id: 'rhythms',
          title: 'Checkpoint 3: Setting Up Your Rhythms',
          intro:
            'Before you invite disciples, establish your structure. Clarity prevents confusion later.',
          subsections: [
            {
              title: 'Weekly Meeting Time',
              items: [
                'What day/time works for you AND your co-leader consistently?',
                'Where will you meet? (Home, coffee shop, church building, online?)',
                'How long will meetings last? (We recommend 90 minutes)',
              ],
            },
            {
              title: 'Communication Plan',
              items: [
                'What platform will you use for group chat? (Text, GroupMe, WhatsApp, etc.)',
                'How often will you check in between meetings?',
                'What\'s your response time expectation? (24 hours? Same day?)',
              ],
            },
            {
              title: 'Additional Gatherings',
              items: [
                'When will you do meals, outreach, or social hangouts?',
                'How often? (We recommend at least once a month outside of formal meetings)',
              ],
            },
            {
              title: 'Duration & Multiplication Commitment',
              items: [
                'How long is this DNA group committed to meeting? (12 months recommended)',
                'When will you multiply? (Set a tentative date so everyone expects it)',
              ],
            },
          ],
          note: 'Note: The multiplication date will likely change once you get into the process. Setting a tentative date now creates shared expectation.',
          interactiveFields: [
            {
              id: 'tentative_multiplication_date',
              type: 'date',
              label: 'Tentative Multiplication Date',
              placeholder: 'Select a date...',
            },
          ],
          sectionCheck: {
            id: 'p0_check_rhythms',
            label: 'All rhythms established?',
          },
        },
        {
          id: 'agreement',
          title: 'Checkpoint 4: DNA Group Agreement',
          callout: {
            title: 'Create a DNA Group Agreement',
            content:
              'Meeting time and location, communication expectations, commitment length, multiplication goal, how to handle absences or conflicts. Everyone signs it. This isn\'t legalistic—it\'s honoring. It says "we\'re serious about this."',
          },
          resourceLink: {
            label: 'Download Agreement Templates',
            description: '3 sample agreements available in the resources section',
          },
          sectionCheck: {
            id: 'p0_check_agreement',
            label: 'DNA Group Agreement created?',
          },
        },
        {
          id: 'prayer',
          title: 'Checkpoint 5: Prayer Strategy',
          intro: 'Discipleship begins in prayer, not in planning.',
          content: `Spend intentional time asking God:
• "Who do you want me to invest in?"
• "Who is hungry and ready?"
• "What do you want to accomplish in this group?"

Jesus prayed all night before choosing His disciples (Luke 6:12-13). You don't need all night, but don't skip this step.`,
          subsections: [
            {
              title: 'Create a prayer list:',
              items: [
                'Write down 5-10 names of people who come to mind',
                'Pray over that list daily for 1-2 weeks',
                'Ask God to confirm or redirect',
                'Pay attention to who keeps coming to mind',
              ],
            },
            {
              title: 'Ask God specific questions:',
              items: [
                'Is this person ready?',
                'What do they need from me?',
                'What will be challenging about discipling them?',
                'How will this relationship grow me?',
              ],
            },
          ],
          note: 'Pray with your co-leader: Set aside 30-60 minutes to pray together specifically about potential disciples. Listen to what the Holy Spirit highlights to each of you.',
          interactiveFields: [
            {
              id: 'prayer_list_names',
              type: 'names_list',
              label: 'Your Prayer List',
              placeholder: 'Enter a name...',
              maxItems: 10,
            },
          ],
          sectionCheck: {
            id: 'p0_check_prayer',
            label: 'Narrowed it down to 1 or 2 disciples? You\'re ready to start the invitation process.',
          },
        },
        {
          id: 'invitation',
          title: 'Checkpoint 6: The Invitation Process',
          intro:
            "This phase is about observation and initiation. You're not formally asking them to be discipled yet—you're testing receptivity and building connection.",
          subsections: [
            {
              title: 'Week 1-2: The Coffee Conversation',
              content:
                'Goal: Get to know them and gauge their hunger for spiritual growth.',
              items: [
                '"How\'s your walk with God been lately?"',
                '"What\'s God been teaching you?"',
                '"Do you feel like you\'re growing spiritually?"',
                '"What\'s something you wish you understood better about God?"',
              ],
            },
            {
              title: 'What you\'re listening for:',
              items: [
                'Are they hungry? (Do they light up when talking about God?)',
                'Are they honest? (Admit struggles or give "church answers"?)',
                'Are they curious? (Do they ask questions?)',
                'Are they available? (Do they have margin in their life?)',
              ],
            },
            {
              title: 'Red Flags (click to expand):',
              type: 'warning',
              items: [
                "They don't engage spiritual topics at all",
                'They blame others for their spiritual state',
                "They're drowning in chaos with no desire to change",
                "They're defensive or dismissive",
              ],
            },
            {
              title: 'Green Lights (click to expand):',
              type: 'success',
              items: [
                'They express frustration with spiritual stagnation',
                'They ask YOU questions about your walk',
                "They're open about struggles",
                'They mention wanting to grow or be challenged',
              ],
            },
          ],
          interactiveFields: [
            {
              id: 'invitation_feedback',
              type: 'textarea',
              label: 'How did it go?',
              placeholder: 'Reflect on your coffee conversation(s)...',
            },
          ],
          sectionCheck: {
            id: 'p0_check_invitation',
            label: 'Ready to have the direct conversation?',
          },
        },
        {
          id: 'direct-ask',
          title: 'Checkpoint 7: The Direct Conversation',
          intro:
            'Goal: Clearly present the opportunity for discipleship and gauge their response.',
          sampleConversation: `"I've been thinking and praying a lot about discipleship lately. God has been stirring in me a desire to invest deeply in a few people—to help them grow in their faith, understand the Bible better, and step into everything God has for them.

I've noticed that you seem hungry for more. You ask good questions, you're honest about where you're at, and I sense that God might be calling us to do this together.

[Co-leader's name] and I are starting a DNA group—it's basically intentional discipleship. We'd meet weekly for about 90 minutes, do life together, dig into Scripture, pray for each other, and challenge each other to grow. It's not just a Bible study—it's life-on-life.

I don't know if this is something you're interested in, but I wanted to ask: Would you be open to being part of this? No pressure—I just want you to know the door is open if you're hungry for it."`,
          subsections: [
            {
              title: 'Possible Responses:',
              type: 'responses',
              items: [
                {
                  response: '"Yes! I\'ve been wanting something like this."',
                  action: 'Great! Move forward with expectations conversation.',
                },
                {
                  response: '"I\'m interested, but can I think about it?"',
                  action:
                    'Absolutely. Give them a timeline: "Take a week to pray about it. Let\'s reconnect next [day]."',
                },
                {
                  response: '"I don\'t think I have the time right now."',
                  action:
                    'Honor that. "I totally understand. If the season changes, let me know. I\'ll keep praying for you."',
                },
                {
                  response: '"What exactly does that look like?"',
                  action:
                    'Good question. Walk them through the DNA structure, time commitment, and expectations.',
                },
                {
                  response: 'Hesitation or uncertainty',
                  action:
                    '"I sense you\'re not sure. That\'s okay—this is a big commitment. What questions do you have?" Address concerns honestly.',
                },
              ] as ResponseItem[],
            },
          ],
          sectionCheck: {
            id: 'p0_check_direct_conversation',
            label: 'Ready to set expectations?',
          },
        },
        {
          id: 'expectations',
          title: 'Checkpoint 8: Setting Expectations Together',
          intro:
            'If they say yes or want more details, have THIS conversation:',
          subsections: [
            {
              title: 'Daily Commitment: PB&J',
              content:
                'Prayer, Bible, and Journal: 20-30 minutes daily. This is the foundation. If they won\'t commit to daily time with God, they\'re not ready for DNA.',
              items: [
                '4D Prayer - 10 minutes',
                'Daily Scripture reading',
                '3D Journal - Head, Heart and Hands (10 minutes)',
              ],
            },
            {
              title: 'Time Commitment:',
              items: [
                '"We meet weekly for 90 minutes. We also have a group chat for encouragement and prayer throughout the week."',
                '"We\'ll do meals or hangouts at least once a month—it\'s not just formal meetings."',
                '"We\'re committing to 12 months. At the end, we multiply—meaning you\'ll be ready to start your own group."',
              ],
            },
            {
              title: 'What We\'ll Do:',
              items: [
                '"We\'ll study Scripture together, pray for each other, work through life issues, and learn to hear God\'s voice."',
                '"We\'ll use tools like listening prayer, devotional times, and outreach activities."',
                '"This is a safe place to be real—no performance, no judgment."',
              ],
            },
            {
              title: 'What We Expect:',
              items: [
                '"We expect you to show up consistently. Life happens, but this needs to be a priority."',
                '"We expect you to be honest—even when it\'s uncomfortable."',
                '"We expect you to be teachable and open to correction."',
                '"We expect you to pursue us too—don\'t just wait for us to reach out."',
              ],
            },
            {
              title: 'What You Can Expect From Us:',
              items: [
                '"We\'ll be consistent and committed to your growth."',
                '"We\'ll create a safe place for you to process and grow."',
                '"We\'ll challenge you, but we\'ll also be patient with you."',
                '"We\'ll celebrate your wins and walk with you through struggles."',
              ],
            },
          ],
          note: 'Ask directly: "Does this sound like something you\'re ready to commit to?"\n\nIf yes: Set the first meeting date and share the DNA Group Agreement.\nIf hesitation: "What\'s holding you back?" Address concerns.',
          interactiveFields: [
            {
              id: 'first_meeting_date',
              type: 'date',
              label: 'First Meeting Date',
              placeholder: 'Select the date of your first meeting...',
            },
          ],
          sectionCheck: {
            id: 'p0_check_expectations',
            label: 'First meeting scheduled?',
          },
        },
      ],
      checklist: [
        // The main checklist items are now tracked via sectionCheck in each section
        // First meeting date is now tracked in the Expectations section
        // DNA Group Agreement sharing is now tracked in Phase 1
      ],
      nextPhasePrompt:
        'Ready to start your first DNA Group? Complete Phase and continue.',
    },

    // ==========================================
    // PHASE 1: FOUNDATION BUILDING
    // ==========================================
    {
      id: 1,
      title: 'Foundation Building',
      subtitle: 'Months 1-3',
      tagline: 'Establishing Rhythms and Trust',
      duration: 'Months 1-3 (Weeks 1-12)',
      intro:
        "The first 3 months are critical. You're laying foundation, building trust, and establishing patterns that will carry the group for the next 6-9 months. Work through each month below — the 90-Day Toolkit in the app gives disciples their week-by-week content.",
      sections: [
        {
          id: 'agreement-shared',
          title: 'Checkpoint 1: Share DNA Group Agreement',
          intro: 'Before your first meeting, share the DNA Group Agreement with your disciples.',
          content: `The agreement you created in Phase 0 sets the foundation for your group. Share it with each disciple before the first meeting so everyone knows what to expect.

When you share the agreement:
• Send it via email or group chat
• Give them time to read through it
• Let them know you'll review it together at the first meeting
• Answer any initial questions they have

This step ensures everyone comes to the first meeting with aligned expectations.`,
          sectionCheck: {
            id: 'p1_check_agreement_shared',
            label: 'DNA Group Agreement shared with disciples?',
          },
        },
        {
          id: 'month1',
          title: 'Month 1: Building Habits (Weeks 1-4)',
          intro: 'Focus: Establish the foundation — trust, tools, and daily rhythms.',
          subsections: [
            {
              title: 'Week 1: First Official Meeting (90 mins)',
              items: [
                'Welcome & Vision Casting (15 mins) — Share your heart, review DNA Group Agreement together, answer questions, pray',
                'Life Assessment (45 mins) — Send disciples the link, give 25 min to complete, share 2-3 answers each, listen more than you talk',
                'Set Group Rhythms (20 mins) — Confirm meeting time/location, set up group chat, schedule next 4 meetings',
                'Closing Prayer (10 mins) — Pray over each person by name',
              ],
              note: 'After the meeting: Send a follow-up text thanking them for coming. Confirm next meeting time.',
            },
            {
              title: 'Week 2: 3D Journal',
              content: 'Goal: Teach disciples how to hear God through Scripture daily.',
              items: [
                'Introduce the HEAD · HEART · HANDS framework',
                'Walk through a passage together using the 3D Journal',
                'Assign them a Scripture to journal before next meeting',
                'Share your own journal entry as a model',
              ],
            },
            {
              title: 'Week 3: 4D Prayer',
              content: 'Goal: Build a sustainable daily prayer rhythm.',
              items: [
                'Introduce the REVERE · REFLECT · REQUEST · REST framework',
                'Practice a 4D prayer session together (10-15 mins)',
                'Help them create their first prayer card',
                'Encourage daily use before next meeting',
              ],
            },
            {
              title: 'Week 4: Creed Cards',
              content: 'Goal: Build theological foundation through key doctrines.',
              items: [
                'Pick 2-3 Creed Cards to work through together',
                'Discuss: "What do you believe about this? What has shaped that belief?"',
                'Address any doubts or questions that come up naturally',
                'Encourage continued review between meetings',
              ],
            },
          ],
          note: 'Meeting flow every week: Check-In (15 min) → Teaching/Tool (30 min) → Application/Discussion (30 min) → Prayer (15 min). Between meetings: Text the group at least once. Pray for them daily by name.',
          sectionCheck: {
            id: 'p1_check_month1',
            label: 'Month 1 complete — disciples practicing 3D Journal, 4D Prayer, and Creed Cards?',
          },
        },
        {
          id: 'month2',
          title: 'Month 2: Deepening Trust (Weeks 5-8)',
          intro: 'Focus: Move from surface-level to personal-level vulnerability.',
          subsections: [
            {
              title: 'Week 5: Testimony Time',
              content: "Goal: Build faith by sharing God's faithfulness.",
              items: [
                'Each person shares a testimony of God in their life (10 mins each)',
                'Ask follow-up questions',
                "Celebrate God's goodness together",
                'Close in worship or thanksgiving prayer',
              ],
            },
            {
              title: 'Week 6: Q&A Deep Dive',
              content: 'Goal: Address doubts, questions, and theological confusion.',
              items: [
                '"What questions about God or the Bible have you been afraid to ask?"',
                'Open floor — no question is off-limits',
                'Don\'t rush to answer — sometimes ask, "What do you think?"',
                'If you don\'t know: "Great question. Let me research that and we\'ll talk next week."',
              ],
            },
            {
              title: 'Week 7: Listening Prayer',
              content: 'Goal: Help disciples hear God\'s voice for others, not just themselves.',
              items: [
                'Teach the difference between our thoughts and God\'s voice',
                'Practice: each person quietly listens for a word/image/impression for the person next to them',
                'Share what you sensed — gently and without pressure',
                'Debrief: "What was that experience like for you?"',
              ],
            },
            {
              title: 'Week 8: Outreach/Mission Activity',
              content: 'Goal: Apply faith in a real-world, outward-focused context.',
              items: [
                'Street evangelism, serve at a shelter, prayer walk, or hospital visit',
                'Debrief afterward: "What did you learn about God? About yourself?"',
                'Celebrate what God did — look for stories to share',
              ],
            },
          ],
          sectionCheck: {
            id: 'p1_check_month2',
            label: 'Month 2 complete — disciples showing vulnerability, sharing testimonies, and engaging outreach?',
          },
        },
        {
          id: 'month3',
          title: 'Month 3: Empowerment Begins (Weeks 9-12)',
          intro: 'Focus: Start giving disciples opportunities to lead and practice.',
          subsections: [
            {
              title: 'Week 9: Breaking Strongholds',
              content: 'Goal: Address patterns, lies, and areas of spiritual bondage.',
              items: [
                "Name what you've observed: \"I've noticed that when [situation] happens, you [response]. Can we talk about that?\"",
                'Use Scripture to expose the lie and present truth (Reveal · Renounce · Replace)',
                'Pray for breakthrough together',
              ],
              note: "Connection before correction — if trust has been built, they'll receive it. If not, they'll shut down.",
            },
            {
              title: 'Week 10: Identity Shift',
              content: 'Goal: Root disciples in who God says they are.',
              items: [
                'Work through Identity in Christ statements together',
                'Ask: "Which of these is hardest for you to believe about yourself? Why?"',
                'Pray Scripture-based identity declarations over each person',
              ],
            },
            {
              title: 'Week 11: Ministry Gifts',
              content: 'Goal: Help disciples discover how God has wired them to serve.',
              items: [
                'Complete the Ministry Gifts Test in the app',
                'Discuss results: "Does this resonate with you? Where have you seen this in your life?"',
                'Connect gifts to opportunities to serve in and outside the group',
              ],
            },
            {
              title: 'Week 12: Life Assessment Revisited',
              content: 'Goal: Measure growth and cast vision for what\'s next.',
              items: [
                'Retake the Life Assessment from Week 1',
                'Compare answers: "What\'s changed? What has God done in you?"',
                'Celebrate growth — make it a real moment',
                'Ask: "Do you feel ready to help someone else grow like this?"',
                'Set goals and expectations heading into Phase 2',
              ],
              note: 'Let them lead the devotional this week. Watch: Can they prepare? Do they show up ready? How do they handle leading?',
            },
          ],
          sectionCheck: {
            id: 'p1_check_month3',
            label: 'Month 3 complete — disciples addressing strongholds, discovering gifts, and ready for Phase 2?',
          },
        },
      ],
      checklist: [
        {
          id: 'p1_attendance',
          label: 'Disciples showing up consistently (80%+ attendance)',
        },
        {
          id: 'p1_communication',
          label: 'Engaging in group chat and communication',
        },
        { id: 'p1_vulnerability', label: 'Demonstrating vulnerability and trust' },
        { id: 'p1_teachable', label: 'Teachable and receiving correction well' },
        {
          id: 'p1_disciplines',
          label: 'Practicing PB&J independently (3D Journal, 4D Prayer)',
        },
        {
          id: 'p1_stronghold',
          label: 'Addressed at least one major stronghold or lie',
        },
        {
          id: 'p1_tools',
          label:
            'Experienced DNA tools (3D Journal, 4D Prayer, Creed Cards, Listening Prayer, Outreach)',
        },
        {
          id: 'p1_ready_to_lead',
          label: 'Expressing readiness to lead or facilitate',
        },
      ],
      nextPhasePrompt:
        'If 6+ are true: Move to Phase 2: Growth & Empowerment.\n\nIf fewer than 6: Extend Phase 1 for another 4-6 weeks. Identify gaps and address them. Don\'t rush.',
    },

    // ==========================================
    // PHASE 2: GROWTH & EMPOWERMENT
    // ==========================================
    {
      id: 2,
      title: 'Growth & Empowerment',
      subtitle: 'Months 4-6',
      tagline: 'From Students to Practitioners',
      duration: 'Months 4-6',
      intro:
        'This phase is about transitioning from "I\'m learning" to "I\'m doing."',
      sections: [
        {
          id: 'shift',
          title: 'The Shift: From Teaching to Empowering',
          content:
            'Phase 1 (Months 1-3): You did most of the teaching and leading using the 90-Day Toolkit.\nPhase 2 (Months 4-6): They do more of the teaching and leading using Supplemental Lessons.',
          subsections: [
            {
              title: 'Your role changes:',
              items: [
                'Less instructor, more coach',
                'Less talking, more listening',
                'Less answers, more questions',
              ],
            },
            {
              title: 'Their role changes:',
              items: ['More responsibility', 'More initiative', 'More ownership'],
            },
          ],
        },
        {
          id: 'reps',
          title: 'Giving Them "Reps"',
          intro:
            "While watching game film helps athletes—they really get better by playing. Same with disciples.",
          content: 'Ways to give them reps:',
          subsections: [
            {
              title: '1. Let them lead devotionals regularly',
              items: [
                'Rotate who prepares and teaches each week',
                'Give feedback after: "What did you do well? What would you change?"',
              ],
            },
            {
              title: '2. Let them lead listening prayer',
              items: [
                'They facilitate',
                'They create the environment',
                'You observe and coach',
              ],
            },
            {
              title: '3. Let them lead prayer',
              items: [
                "Don't always open or close in prayer yourself",
                "Let them steward the group's prayer time",
              ],
            },
            {
              title: '4. Let them invite others into spiritual conversations',
              items: [
                "When you're doing outreach, let them take the lead",
                'Step back and observe',
                'Debrief afterward',
              ],
            },
            {
              title: '5. Give them pastoral responsibility',
              items: [
                'Ask them to check in on each other during the week',
                'Let them pray for each other outside of group time',
              ],
            },
          ],
        },
        {
          id: 'failures',
          title: 'Processing Failures and Setbacks',
          intro: 'This phase WILL include failures.',
          content: `They'll lead a devotional and it'll flop.
They'll try to pray for someone and feel like nothing happened.
They'll miss a meeting or drop the ball on communication.

Your job: Help them process failure as growth, not disqualification.`,
          subsections: [
            {
              title: 'When they fail, ask:',
              items: [
                '"What did you learn?"',
                '"What would you do differently next time?"',
                '"How did this expose an area you need to grow in?"',
              ],
            },
            {
              title: 'Normalize failure:',
              items: [
                'Share YOUR failures from when you were learning',
                'Remind them: "You\'re not expected to be perfect—you\'re expected to be faithful."',
              ],
            },
            {
              title: "Don't rescue them from discomfort:",
              items: [
                'Let them sit in the awkwardness of a failed teaching',
                'Let them feel the sting of dropping the ball',
                'Then help them learn from it',
              ],
            },
          ],
        },
        {
          id: 'ownership',
          title: 'Increasing Ownership',
          intro: 'By Month 6, they should be:',
          items: [
            'Leading devotionals 50% of the time',
            'Initiating spiritual conversations with each other',
            'Praying for each other without prompting',
            'Asking YOU for feedback (not waiting for you to give it)',
            'Showing up prepared',
          ],
          subsections: [
            {
              title: "If they're not doing these things by Month 6:",
              items: [
                'Have a direct conversation: "I care about you, and I want you to grow so you can experience everything God has for you. But I\'ve noticed you\'re not taking as much ownership as I expected. What\'s going on?"',
                'Address passivity or fear',
                'Reset expectations if needed',
              ],
            },
          ],
        },
        {
          id: 'month6eval',
          title: 'Month 6 Evaluation',
          intro: 'Have a formal check-in at the 6-month mark.',
          subsections: [
            {
              title: 'Ask each disciple:',
              items: [
                '"How do you feel about your growth over the last 6 months?"',
                '"What\'s been most transformative?"',
                '"What\'s still challenging for you?"',
                '"Do you feel ready to start thinking about discipling someone else?"',
              ],
            },
            {
              title: 'You and co-leader evaluate:',
              items: [
                'Are they ready to multiply in 3-6 months?',
                'What still needs to happen before multiplication?',
                'Do we need to extend this DNA group, or are we on track?',
              ],
            },
          ],
        },
      ],
      checklist: [
        { id: 'p2_lead_devotionals', label: 'Leading devotionals confidently' },
        {
          id: 'p2_initiate_convos',
          label: 'Initiating spiritual conversations',
        },
        {
          id: 'p2_hearing_god',
          label: "Hearing from God and sharing what He's saying",
        },
        {
          id: 'p2_maturity',
          label: 'Showing emotional and spiritual maturity',
        },
        { id: 'p2_correction', label: 'Handling correction well' },
        { id: 'p2_fruit', label: 'Demonstrating fruit of the Spirit' },
        { id: 'p2_desire', label: 'Expressing desire to disciple others' },
        { id: 'p2_disciplines', label: 'Consistent in spiritual disciplines' },
      ],
      nextPhasePrompt:
        'If most of these are true, move to Phase 3: Multiplication.\n\nIf not, extend Phase 2 another 3 months.',
    },

    // ==========================================
    // PHASE 3: MULTIPLICATION
    // ==========================================
    {
      id: 3,
      title: 'Multiplication',
      subtitle: 'Months 7-12',
      tagline: 'Releasing Them for Success',
      duration: 'Months 7-12',
      intro:
        "Multiplication is the goal. Don't let the group run indefinitely without a clear plan to release and multiply.",
      sections: [
        {
          id: 'readiness',
          title: 'Recognizing Readiness',
          intro: 'Use the DNA Multiplication Readiness Checklist:',
          content: 'A disciple is ready to multiply when they can:',
          items: [
            'Articulate the gospel clearly',
            'Lead themselves spiritually (consistent devotion)',
            'Handle correction with humility',
            'Initiate spiritual conversations',
            'Demonstrate fruit of the Spirit',
            'Express desire to disciple others',
            'Complete a full cycle (12 months recommended)',
            'Show faithfulness in small things',
          ],
          note: "If they check most of these boxes, they're ready.",
        },
        {
          id: 'conversation',
          title: 'The Multiplication Conversation',
          intro: 'When to have it: Month 9-10',
          sampleConversation:
            '"Hey, can we talk about next steps? You\'ve grown so much over the last 9 months. I think you\'re ready to start thinking about who YOU might disciple. How do you feel about that?"',
          subsections: [
            {
              title: 'Possible responses:',
              type: 'responses',
              items: [
                {
                  response: '"I\'m excited but nervous."',
                  action:
                    'Normal. Affirm their growth and coach them through the fear.',
                },
                {
                  response: '"I don\'t feel ready."',
                  action:
                    "Ask why. Address specific concerns. Sometimes it's humility; sometimes it's legitimate gaps.",
                },
                {
                  response: '"Who would I even disciple?"',
                  action:
                    'Help them start praying. Give them the same process you went through in Phase 0.',
                },
                {
                  response: '"I\'m ready. What do I do?"',
                  action:
                    'Walk them through the DNA Launch Guide (this document).',
                },
              ] as ResponseItem[],
            },
          ],
        },
        {
          id: 'helping',
          title: 'Helping Them Find Their First Disciples',
          intro: 'Coach them through the process:',
          items: [
            'Pray with them about who to invite',
            'Help them identify 2-3 potential people',
            'Role-play the invitation conversation',
            'Give feedback',
          ],
          subsections: [
            {
              title: 'Let them make mistakes:',
              items: [
                "They might pick someone who isn't ready—that's okay",
                "They'll learn from it",
                "Be available to coach, but don't do it for them",
              ],
            },
          ],
        },
        {
          id: 'month12',
          title: 'Month 12: Official Multiplication',
          intro: 'By Month 12, the DNA group should multiply.',
          subsections: [
            {
              title: 'What multiplication looks like:',
              items: [
                'You and your disciple each start a new DNA group',
                'Co-leader and their disciple each start a new DNA group',
                'Original group disbands (or meets occasionally for fellowship)',
              ],
            },
            {
              title: 'Multiplication Meeting:',
              items: [
                'Celebrate what God has done',
                'Share testimonies of growth',
                'Commission them into their new groups',
                'Pray over them',
                'Set a date to check in 1 month later',
              ],
            },
            {
              title: 'After multiplication:',
              items: [
                'Stay in touch',
                'Meet for coffee occasionally',
                'Be available when they need coaching',
                'Celebrate their wins',
              ],
            },
          ],
        },
        {
          id: 'mistakes',
          title: 'Common Multiplication Mistakes',
          subsections: [
            {
              title: '1. Holding on too long',
              content:
                "Some leaders don't want to let go. Release them. Trust God.",
            },
            {
              title: '2. Multiplying too early',
              content:
                "Some leaders rush multiplication before disciples are ready. Be patient.",
            },
            {
              title: '3. Ghosting after multiplication',
              content:
                'Stay in touch. They still need you—just in a different capacity.',
            },
            {
              title: '4. Expecting perfection',
              content:
                "They'll make mistakes as new leaders. That's okay. Mistakes are part of growth.",
            },
          ],
        },
        {
          id: 'ongoing',
          title: 'Ongoing Support After Multiplication',
          intro: 'Your role shifts again:',
          items: [
            'From leader to mentor',
            'From teacher to advisor',
            'From constant presence to occasional guide',
          ],
          subsections: [
            {
              title: 'How to stay connected:',
              items: [
                'Monthly check-in coffee',
                'Respond when they text with questions',
                'Pray for them regularly',
                'Celebrate their multiplication when it happens',
              ],
            },
          ],
          note: 'The goal: They become confident, independent disciple-makers who multiply again.',
        },
      ],
      checklist: [
        { id: 'p3_gospel', label: 'Can articulate the gospel clearly' },
        {
          id: 'p3_lead_self',
          label: 'Lead themselves spiritually (consistent devotion)',
        },
        { id: 'p3_correction', label: 'Handle correction with humility' },
        { id: 'p3_initiate', label: 'Initiate spiritual conversations' },
        { id: 'p3_fruit', label: 'Demonstrate fruit of the Spirit' },
        { id: 'p3_desire', label: 'Express desire to disciple others' },
        { id: 'p3_cycle', label: 'Complete a full cycle (12 months)' },
        { id: 'p3_faithful', label: 'Show faithfulness in small things' },
      ],
      nextPhasePrompt:
        "When they check most of these boxes, they're ready to launch their own DNA group!",
    },
  ],

  finalThoughts: {
    title: 'Final Thoughts',
    items: [
      {
        title: 'Discipleship is messy.',
        content:
          "People will disappoint you. You'll disappoint yourself. That's okay.",
      },
      {
        title: 'Discipleship is slow.',
        content: 'It takes longer than you think. Be patient.',
      },
      {
        title: 'Discipleship is worth it.',
        content:
          "There's no greater joy than seeing someone step into their calling because you invested in them.",
      },
      {
        title: "You're not doing this alone.",
        content:
          "God is the one who causes growth. You're just a gardener's assistant.",
      },
      {
        title: 'Trust the process.',
        content: 'Follow this guide, stay prayerful, and adjust as needed.',
      },
    ],
    closing: 'Now go make disciples.',
  },
};

// Helper functions
export function getPhase(phaseId: number): Phase | undefined {
  return launchGuideData.phases.find((p) => p.id === phaseId);
}

export function getPhaseCount(): number {
  return launchGuideData.phases.length;
}

export function getTotalChecklistItems(): number {
  return launchGuideData.phases.reduce(
    (acc, phase) => acc + phase.checklist.length,
    0
  );
}

export function getPhaseChecklistCount(phaseId: number): number {
  const phase = getPhase(phaseId);
  return phase?.checklist.length || 0;
}
