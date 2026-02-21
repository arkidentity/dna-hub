'use client';

import { useState } from 'react';

// Image slot type: 'app' = app screenshot, 'group' = group/people photo, 'none' = stat block
type ImageSlot = 'app' | 'group' | 'none';

interface AccordionItem {
  label: string;
  content: string;
}

interface Tool {
  week: string;
  weekNum: number;
  month: string;
  monthColor: string;
  title: string;
  subtitle: string;
  imageSlot: ImageSlot;
  imageLabel: string; // describes what image goes here
  bullets: string[];
  accordion: AccordionItem[];
}

const tools: Tool[] = [
  {
    week: 'Week 01',
    weekNum: 1,
    month: 'Month 1 — Foundation',
    monthColor: 'var(--lp-gold)',
    title: 'Life Assessment',
    subtitle: 'Understanding Where We Are',
    imageSlot: 'app',
    imageLabel: 'App screenshot — Life Assessment results view',
    bullets: [
      '42 questions across 7 areas of discipleship health',
      'Disciples self-assess on a 1–5 scale with open-ended reflections',
      'Results go directly to the leader\'s dashboard in real time',
      'Repeated in Week 12 to measure growth side by side',
    ],
    accordion: [
      {
        label: 'What It Is',
        content: 'A 42-question self-assessment covering 7 areas of discipleship health — Relationship with God, Spiritual Freedom, Identity & Emotions, Relationships, Calling & Purpose, Lifestyle & Stewardship, and Spiritual Fruit. Disciples rate themselves on a 1–5 scale and answer open-ended reflection questions. Results go directly to the leader\'s dashboard.',
      },
      {
        label: 'Why It Matters',
        content: 'You can\'t grow what you don\'t measure. Most disciples have never honestly evaluated their spiritual life. The Life Assessment surfaces hidden struggles, false beliefs, and blind spots that would otherwise stay buried for years. It also gives leaders a specific, data-informed picture of every person in the group before the first week is over.',
      },
      {
        label: 'What Changes',
        content: 'A disciple who completes Week 1 honestly begins the journey with self-awareness. They know where they\'re starting. That clarity is the first act of courage — and it sets the tone for everything that follows.',
      },
    ],
  },
  {
    week: 'Week 02',
    weekNum: 2,
    month: 'Month 1 — Foundation',
    monthColor: 'var(--lp-gold)',
    title: 'The 3D Journal',
    subtitle: 'Learning to Hear God Through Scripture',
    imageSlot: 'app',
    imageLabel: 'App screenshot — 3D Journal entry view',
    bullets: [
      'Head → Heart → Hands: understand, apply, obey',
      '10–15 minutes daily — accessed in the Daily DNA app or on paper',
      'Disciples commit to a 7, 21, or 50-day Bible challenge',
      'Daily posts in the group chat create natural accountability',
    ],
    accordion: [
      {
        label: 'What It Is',
        content: 'A daily Bible engagement method built around three dimensions: Head (What does this passage reveal about God?), Heart (What is God saying to me personally right now?), and Hands (What does God want me to do with this?). Takes 10–15 minutes. Accessed through the Daily DNA app or paper journal.',
      },
      {
        label: 'Why It Matters',
        content: 'Most Christians read their Bible occasionally. The 3D Journal changes reading into encounter. It forces a disciple to move from information to application to obedience — every single day. A disciple who journals daily for one year has 365 documented conversations with God. They learn to recognize His voice, build a record of His faithfulness, and develop the spiritual muscle memory that sustains them through anything.',
      },
      {
        label: 'What Changes',
        content: 'A disciple who journals daily becomes someone who hears from God before they hear from anyone else. Decision-making changes. Confidence grows. The Bible stops being a book they read and starts being a voice they listen to.',
      },
    ],
  },
  {
    week: 'Week 03',
    weekNum: 3,
    month: 'Month 1 — Foundation',
    monthColor: 'var(--lp-gold)',
    title: '4D Prayer',
    subtitle: 'Establishing a Daily Prayer Rhythm',
    imageSlot: 'app',
    imageLabel: 'App screenshot — 4D Prayer session / prayer cards view',
    bullets: [
      'Revere → Reflect → Request → Rest: four movements of daily prayer',
      'Prayer cards built for each person disciples are standing in the gap for',
      '10–15 minutes daily — runs alongside the 3D Journal',
      'Answered prayers are marked and saved as testimonies in the app',
    ],
    accordion: [
      {
        label: 'What It Is',
        content: 'A structured daily prayer framework built around four movements: Revere (worship God for who He is), Reflect (thank God for what He\'s done), Request (intercede for others through prayer cards), and Rest (be still and listen). Takes 10–15 minutes. Accessed through the Prayer tab in the Daily DNA app.',
      },
      {
        label: 'Why It Matters',
        content: 'Most Christians pray reactively — when things go wrong. The 4D rhythm trains disciples to pray proactively, consistently, and intercessorily. Rooted in Ezekiel 22:30 and Hebrews 7:25, it connects disciples to their identity as intercessors — people who stand in the gap for others the way Jesus always intercedes for us. Answered prayers become testimonies that fuel ongoing faith.',
      },
      {
        label: 'What Changes',
        content: 'A disciple who prays daily through the 4D rhythm develops a prayer life that is relational, not transactional. They begin expecting God to answer. They see fruit — answered prayers, changed people, divine appointments — and their faith grows forward.',
      },
    ],
  },
  {
    week: 'Week 04',
    weekNum: 4,
    month: 'Month 1 — Foundation',
    monthColor: 'var(--lp-gold)',
    title: 'Creed Cards',
    subtitle: 'Building on Historic Christian Truth',
    imageSlot: 'app',
    imageLabel: 'App screenshot — Creed Cards view',
    bullets: [
      'Each card covers one essential doctrine rooted in Scripture and church history',
      'Greek/Hebrew word, definition, key Scripture, and a reflection question per card',
      'Four-step method: Discuss → Define → Deepen → Discuss again',
      'Starts with Faith, Gospel, and Grace — the non-negotiables first',
    ],
    accordion: [
      {
        label: 'What It Is',
        content: 'A set of doctrinal cards — each focused on one essential Christian belief rooted in Scripture and 2,000 years of church history. Every card presents the original Greek or Hebrew word, a concise definition, a key Scripture, and a reflection question. Used through a 4-step method: Discuss before flipping, Define the card, Deepen into Scripture, and Discuss again personally.',
      },
      {
        label: 'Why It Matters',
        content: 'Disciples who don\'t know what they believe can\'t defend it, can\'t live it, and can\'t teach it. Creed Cards give every disciple a theological foundation in bite-sized, conversation-ready form. They protect against false teaching, unite the group around shared truth, and give disciples language for their faith that holds up under pressure.',
      },
      {
        label: 'What Changes',
        content: 'A disciple who works through Creed Cards stops borrowing their theology from culture or feelings and starts rooting it in Scripture and church history. They can explain what they believe and why — to a skeptic, a seeker, or their own doubting heart.',
      },
    ],
  },
  {
    week: 'Week 05',
    weekNum: 5,
    month: 'Month 2 — Building',
    monthColor: 'var(--lp-green)',
    title: 'Q&A Deep Dive',
    subtitle: 'Addressing Doubts, Questions, and Confusion',
    imageSlot: 'group',
    imageLabel: 'Group photo — disciples in discussion around a table',
    bullets: [
      'A full meeting dedicated to the questions disciples have been afraid to ask',
      'No question is off-limits — theological, practical, or personal',
      'Questions collected first, then worked through with Scripture as authority',
      'Leader doesn\'t need all the answers — "Let\'s find out together" is enough',
    ],
    accordion: [
      {
        label: 'What It Is',
        content: 'A full meeting dedicated to the questions disciples have been afraid to ask — theological, practical, and personal. No question is off-limits. The leader does not need all the answers. Questions are collected first, then worked through together with Scripture as the final authority.',
      },
      {
        label: 'Why It Matters',
        content: 'Unanswered questions become unspoken doubts. Doubts become strongholds. By Week 5, disciples have enough trust in the group to voice what they\'ve been sitting on. This week creates a culture of honesty that prevents intellectual barriers from quietly undermining everything else being built. It also teaches disciples to think biblically about hard things rather than avoiding them.',
      },
      {
        label: 'What Changes',
        content: 'A disciple who has been given permission to ask hard questions without judgment stops hiding their doubts and starts bringing them into the light. Faith becomes more honest — and more durable. Questions are no longer the enemy of faith; they become the path through it.',
      },
    ],
  },
  {
    week: 'Week 06',
    weekNum: 6,
    month: 'Month 2 — Building',
    monthColor: 'var(--lp-green)',
    title: 'Listening Prayer Circle',
    subtitle: 'Hearing God for Others',
    imageSlot: 'group',
    imageLabel: 'Group photo — disciples praying together in a circle',
    bullets: [
      'Each disciple listens to God for the person to their right',
      'Shares what they receive — impressions, pictures, Scripture, words',
      'Based on 1 Corinthians 14:1–3: prophecy for edification and encouragement',
      'Leaders coach in real time — creates a safe, practice-based environment',
    ],
    accordion: [
      {
        label: 'What It Is',
        content: 'A structured group activity in which each disciple prays quietly for the person to their right, waits in silence to hear from God for that person, and then shares what they received — an impression, a picture, a Scripture, or a word. The receiver responds. Leaders coach in real time. Based on 1 Corinthians 14:1–3.',
      },
      {
        label: 'Why It Matters',
        content: 'Most disciples have never been taught that they can hear God for someone else. This week demystifies the prophetic and makes it accessible, practice-based, and safe. It is often the week where disciples realize for the first time that God actually speaks through them — and that shifts everything about how they see prayer, community, and their own gifting.',
      },
      {
        label: 'What Changes',
        content: 'A disciple who practices Listening Prayer stops thinking of the supernatural as someone else\'s territory. They begin looking for what God wants to say in every conversation. The group becomes a place where people genuinely encounter God through each other.',
      },
    ],
  },
  {
    week: 'Week 07',
    weekNum: 7,
    month: 'Month 2 — Building',
    monthColor: 'var(--lp-green)',
    title: 'Outreach & Mission',
    subtitle: 'Applying Faith in the Real World',
    imageSlot: 'group',
    imageLabel: 'Photo — disciples serving in the community / outreach activity',
    bullets: [
      'The meeting is replaced by action — group goes out together on mission',
      'Options: street evangelism, homeless ministry, prayer walk, hospital visit, cookout',
      'Leaders model first, then release disciples to lead',
      'Every disciple comes back with a story — a real, specific moment God showed up',
    ],
    accordion: [
      {
        label: 'What It Is',
        content: 'The group goes out together on a mission activity — street evangelism, homeless ministry, prayer walk, hospital visit, neighborhood cookout, or campus outreach. The meeting is replaced by action. Leaders model first, then release disciples to lead. Pairs go together for safety and accountability.',
      },
      {
        label: 'Why It Matters',
        content: 'Discipleship that never leaves the room produces disciples who are informed but not transformed. Jesus didn\'t just teach His disciples — He sent them. Week 7 does the same. It pushes every person past their comfort zone into dependence on the Holy Spirit. Faith exercised only in safe environments is fragile. Faith risked in the real world is resilient.',
      },
      {
        label: 'What Changes',
        content: 'A disciple who has gone on mission stops seeing evangelism as someone else\'s calling. They carry a boldness they did not have before. They have a specific moment where God used them — and that story becomes fuel for everything that follows.',
      },
    ],
  },
  {
    week: 'Week 08',
    weekNum: 8,
    month: 'Month 2 — Building',
    monthColor: 'var(--lp-green)',
    title: 'Testimony Building',
    subtitle: 'Capturing and Sharing God\'s Faithfulness',
    imageSlot: 'group',
    imageLabel: 'Photo — disciple sharing their story with the group',
    bullets: [
      'Debrief of Week 7 outreach followed by structured testimony workshop',
      'The STORY Framework: Struggle → Turning Point → Outcome → Reflection → Invitation',
      'Every disciple develops two testimonies — a transformation story and a recent God moment',
      'Revelation 12:11 — testimony is a weapon, not just a nice story',
    ],
    accordion: [
      {
        label: 'What It Is',
        content: 'A debrief of the Week 7 outreach followed by a structured testimony workshop using the STORY Framework: Struggle (before), Turning Point (the moment), Outcome (after), Reflection (what you learned), and Your Invitation (the call to others). Disciples develop two testimonies — a transformation story and a recent "God moment."',
      },
      {
        label: 'Why It Matters',
        content: 'Disciples who cannot articulate what God has done in their lives are disarmed as witnesses. Revelation 12:11 says we overcome by the blood of the Lamb and the word of our testimony. Testimony is a weapon. The STORY Framework gives every disciple — no matter how ordinary their story feels — a structure for telling it clearly, specifically, and compellingly.',
      },
      {
        label: 'What Changes',
        content: 'A disciple with a developed testimony stops underestimating what God has done in their life. They become witnesses — not because they were assigned to, but because they have something real and specific to say.',
      },
    ],
  },
  {
    week: 'Week 09',
    weekNum: 9,
    month: 'Month 3 — Breakthrough',
    monthColor: 'var(--lp-gold)',
    title: 'Breaking Strongholds',
    subtitle: 'Reveal, Renounce, Replace',
    imageSlot: 'group',
    imageLabel: 'Photo — intimate group moment, hands raised or heads bowed in prayer',
    bullets: [
      'Reveal: ask God to surface lies believed about Him, self, or others',
      'Renounce: verbally break agreement with the lie in Jesus\' name',
      'Replace: receive and declare the truth God gives in return',
      'Based on 2 Corinthians 10:3–5 — divine power to demolish strongholds',
    ],
    accordion: [
      {
        label: 'What It Is',
        content: 'A Spirit-led deliverance session structured around three movements. Reveal — disciples ask God to surface lies they are believing about Him, themselves, or others. Renounce — they verbally break agreement with the lie in Jesus\' name, confess, and forgive where needed. Replace — they ask God what truth He gives them in return, receive it, and declare it aloud. Based on 2 Corinthians 10:3–5.',
      },
      {
        label: 'Why It Matters',
        content: 'Eight weeks of tools, trust, and community have created the conditions for this moment. No amount of Bible knowledge or prayer habit can fully overcome a lie that has never been named and renounced. A stronghold is a fortified lie — a belief entrenched in the mind that distorts how a person sees God, themselves, and their future. This week does the deep work that every previous week has been building toward.',
      },
      {
        label: 'What Changes',
        content: 'A disciple who has gone through Reveal, Renounce, Replace often describes a weight lifting. Shame, fear, and self-rejection lose their grip. They have a new truth — declared aloud in front of witnesses. That declaration becomes their weapon when the lie tries to return.',
      },
    ],
  },
  {
    week: 'Week 10',
    weekNum: 10,
    month: 'Month 3 — Breakthrough',
    monthColor: 'var(--lp-gold)',
    title: 'Identity Shift',
    subtitle: 'Who You Are in Christ',
    imageSlot: 'none',
    imageLabel: '',
    bullets: [
      'Mirror test: how do I see myself vs. how does God see me?',
      'Listening prayer: "God, when you look at me, what do you see?"',
      'Identity Battle Plan: Scripture-backed "Who I am" statements as a daily weapon',
      'The Gideon Principle — God calls you what He made you, not what fear says you are',
    ],
    accordion: [
      {
        label: 'What It Is',
        content: 'A teaching and activation session that helps disciples close the gap between how they see themselves and how God sees them. Disciples do a mirror test (honest self-assessment), a listening prayer exercise (asking God what He sees), and compare the two. Each disciple builds an Identity Battle Plan — a personal document of "Who I am" statements backed by Scripture, used as a weapon against the enemy\'s accusations.',
      },
      {
        label: 'Why It Matters',
        content: 'Identity is the battlefield. The enemy does not attack behavior first — he attacks identity, because behavior follows belief. Week 10 builds on the freedom of Week 9 by replacing demolished lies with Scripture-anchored identity. The Identity Battle Plan turns truth into a tool disciples use every day. False humility is exalting your opinion of yourself over God\'s — and this week breaks that pattern.',
      },
      {
        label: 'What Changes',
        content: 'A disciple with a clear, Scripture-rooted identity stops agreeing with the enemy\'s accusations. They stop performing for acceptance and hiding from failure. They know who they are. And they can prove it from the Word.',
      },
    ],
  },
  {
    week: 'Week 11',
    weekNum: 11,
    month: 'Month 3 — Breakthrough',
    monthColor: 'var(--lp-gold)',
    title: 'Spiritual Gifts',
    subtitle: 'Discover Your Design to Serve',
    imageSlot: 'app',
    imageLabel: 'App screenshot — Spiritual Gifts assessment results view',
    bullets: [
      'Three-tier assessment: How You Serve (Rom 12) · Supernatural Gifts (1 Cor 12) · Leadership Calling (Eph 4)',
      'Results reviewed together — disciples affirm what they\'ve already seen in each other',
      'Impartation through laying on of hands, then immediate in-room activation',
      'Beloved first, gifted second — identity stays rooted in Christ, not function',
    ],
    accordion: [
      {
        label: 'What It Is',
        content: 'Disciples complete the Spiritual Gifts Assessment before the meeting, covering three tiers: Tier 1 — How You Serve (Romans 12 gifts), Tier 2 — Supernatural Empowerment (1 Corinthians 12 gifts), and Tier 3 — Leadership Calling (Ephesians 4 five-fold). The meeting reviews results, teaches on the Body of Christ, and closes with impartation through laying on of hands and immediate activation — each disciple uses their gift in the room before the meeting ends.',
      },
      {
        label: 'Why It Matters',
        content: 'A disciple who doesn\'t know how God wired them will serve in ways that exhaust them or disengage entirely. Spiritual gifts are not a personality curiosity — they are the Father\'s design for how His love gets expressed through each person for the common good of the Body (1 Corinthians 12:7). Activation on the spot — not later, not theoretically — is what makes this week decisive rather than informational.',
      },
      {
        label: 'What Changes',
        content: 'A disciple who knows and has activated their gifts moves from spectator to participant in the Body of Christ. They stop waiting for the professionals. They show up knowing they have something to give — and that the Body is incomplete without it.',
      },
    ],
  },
  {
    week: 'Week 12',
    weekNum: 12,
    month: 'Month 3 — Breakthrough',
    monthColor: 'var(--lp-green)',
    title: 'Life Assessment Revisited',
    subtitle: 'Measuring Growth and Setting New Goals',
    imageSlot: 'app',
    imageLabel: 'App screenshot — Week 1 vs Week 12 comparison report',
    bullets: [
      'Same 42 questions from Week 1 — retaken live during the meeting',
      'Dashboard auto-generates a side-by-side comparison report per disciple',
      'Score changes across all 7 categories made visible and undeniable',
      'Closes Phase 1 and opens the door to Phase 2 co-facilitation',
    ],
    accordion: [
      {
        label: 'What It Is',
        content: 'Disciples retake the same 42-question Life Assessment from Week 1. The dashboard auto-generates a side-by-side comparison report for each person — showing score changes across all 7 categories, the questions with the most growth, and open-ended responses from both weeks placed side by side. Leaders celebrate measurable wins, address gaps honestly, and cast vision for Phase 2.',
      },
      {
        label: 'Why It Matters',
        content: 'Growth that is not measured is invisible. By Week 12, transformation has been happening — but disciples often can\'t see it because they\'re inside it. The comparison report makes growth concrete and undeniable. It also surfaces areas still needing work, giving leaders and disciples a clear-eyed basis for Phase 2 planning. This week answers the question every disciple is quietly asking: Did any of this actually work?',
      },
      {
        label: 'What Changes',
        content: 'A disciple who sees their Week 1 and Week 12 scores side by side sees the evidence of what God has done. That evidence builds faith for what comes next. They stop doubting the process. They begin to believe that multiplication — leading their own group — is not just possible for someone else. It is possible for them.',
      },
    ],
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: 'transform 0.25s ease',
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        flexShrink: 0,
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ImagePlaceholder({ label, slot }: { label: string; slot: ImageSlot }) {
  const bgColor = slot === 'app' ? 'var(--lp-accent)' : 'var(--lp-ink)';
  const icon = slot === 'app' ? '📱' : '📸';

  return (
    <div
      style={{
        background: bgColor,
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        gap: '0.75rem',
        minHeight: '220px',
        border: '1.5px dashed rgba(212,168,83,0.3)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '2rem', opacity: 0.5 }}>{icon}</div>
      <div
        style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--lp-gold)',
          opacity: 0.7,
        }}
      >
        Image Placeholder
      </div>
      <div
        style={{
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.35)',
          lineHeight: 1.5,
          maxWidth: '180px',
        }}
      >
        {label}
      </div>
    </div>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const hasImage = tool.imageSlot !== 'none';

  function toggle(i: number) {
    setOpenIndex(openIndex === i ? null : i);
  }

  return (
    <div
      className="fade-in"
      style={{
        background: '#fff',
        borderBottom: '1px solid var(--lp-rule)',
      }}
    >
      {/* Card header */}
      <div
        style={{
          padding: '2.25rem 2.75rem 0',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: tool.monthColor,
              }}
            >
              {tool.week}
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--lp-mid)',
                opacity: 0.6,
              }}
            >
              {tool.month}
            </span>
          </div>
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.35rem, 2.5vw, 1.75rem)',
              fontWeight: 900,
              color: 'var(--lp-ink)',
              marginBottom: '0.2rem',
              lineHeight: 1.2,
            }}
          >
            {tool.title}
          </h3>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--lp-mid)',
              fontStyle: 'italic',
              margin: 0,
            }}
          >
            {tool.subtitle}
          </p>
        </div>

        {/* Faded week number */}
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '4rem',
            fontWeight: 900,
            color: tool.monthColor,
            opacity: 0.1,
            lineHeight: 1,
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          {String(tool.weekNum).padStart(2, '0')}
        </div>
      </div>

      {/* Body: image + bullets */}
      <div
        style={{
          padding: '0 2.75rem',
          display: 'grid',
          gridTemplateColumns: hasImage ? '240px 1fr' : '1fr',
          gap: '2rem',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
        }}
      >
        {hasImage && (
          <ImagePlaceholder label={tool.imageLabel} slot={tool.imageSlot} />
        )}

        {/* Bullet points */}
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
          }}
        >
          {tool.bullets.map((bullet, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                fontSize: '0.88rem',
                color: 'var(--lp-ink)',
                lineHeight: 1.6,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: tool.monthColor,
                  flexShrink: 0,
                  marginTop: '0.5rem',
                }}
              />
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      {/* Accordion rows */}
      <div
        style={{
          borderTop: '1px solid var(--lp-rule)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {tool.accordion.map((item, i) => (
          <div
            key={item.label}
            style={{
              borderBottom: i < tool.accordion.length - 1 ? '1px solid var(--lp-rule)' : 'none',
            }}
          >
            {/* Accordion trigger */}
            <button
              onClick={() => toggle(i)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 2.75rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                gap: '1rem',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background = 'var(--lp-paper)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = 'none')
              }
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: openIndex === i ? tool.monthColor : 'var(--lp-mid)',
                  transition: 'color 0.2s',
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  color: openIndex === i ? tool.monthColor : 'var(--lp-mid)',
                  transition: 'color 0.2s',
                }}
              >
                <ChevronIcon open={openIndex === i} />
              </span>
            </button>

            {/* Accordion content */}
            {openIndex === i && (
              <div
                style={{
                  padding: '0 2.75rem 1.5rem',
                  fontSize: '0.875rem',
                  color: 'var(--lp-mid)',
                  lineHeight: 1.75,
                  borderTop: '1px solid var(--lp-rule)',
                  paddingTop: '1.25rem',
                  fontStyle: item.label === 'What Changes' ? 'italic' : 'normal',
                  color: item.label === 'What Changes' ? 'var(--lp-ink)' : 'var(--lp-mid)',
                } as React.CSSProperties}
              >
                {item.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ToolkitTools() {
  return (
    <section
      style={{
        background: 'var(--lp-paper)',
        padding: '7rem 5rem',
      }}
      className="tk-tools"
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Section header */}
        <div className="fade-in" style={{ marginBottom: '4rem' }}>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--lp-gold)',
              marginBottom: '1.25rem',
            }}
          >
            The 12 Tools
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
              fontWeight: 900,
              color: 'var(--lp-ink)',
              marginBottom: '0.75rem',
              lineHeight: 1.25,
            }}
          >
            One tool per week.{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--lp-gold)' }}>Each one matters.</em>
          </h2>
          <p
            style={{
              fontSize: '1rem',
              color: 'var(--lp-mid)',
              maxWidth: '560px',
              lineHeight: 1.7,
            }}
          >
            Every tool below is a practice disciples carry for the rest of their lives. The 90 days are just where they learn to pick it up. Open any tool to go deeper.
          </p>
        </div>

        {/* Tool cards */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1.5px solid var(--lp-rule)',
            overflow: 'hidden',
          }}
        >
          {tools.map((tool) => (
            <ToolCard key={tool.week} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
}
