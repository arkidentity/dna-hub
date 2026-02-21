'use client';

const tools = [
  {
    week: 'Week 01',
    month: 'Month 1 — Foundation',
    title: 'Life Assessment',
    subtitle: 'Understanding Where We Are',
    what: 'A 42-question self-assessment covering 7 areas of discipleship health — Relationship with God, Spiritual Freedom, Identity & Emotions, Relationships, Calling & Purpose, Lifestyle & Stewardship, and Spiritual Fruit. Disciples rate themselves on a 1–5 scale and answer open-ended reflection questions. Results go directly to the leader\'s dashboard.',
    why: 'You can\'t grow what you don\'t measure. Most disciples have never honestly evaluated their spiritual life. The Life Assessment surfaces hidden struggles, false beliefs, and blind spots that would otherwise stay buried for years. It also gives leaders a specific, data-informed picture of every person in the group before the first week is over.',
    transformation: 'A disciple who completes Week 1 honestly begins the journey with self-awareness. They know where they\'re starting. That clarity is the first act of courage — and it sets the tone for everything that follows.',
    accent: 'var(--lp-gold)',
  },
  {
    week: 'Week 02',
    month: 'Month 1 — Foundation',
    title: 'The 3D Journal',
    subtitle: 'Learning to Hear God Through Scripture',
    what: 'A daily Bible engagement method built around three dimensions: Head (What does this passage reveal about God?), Heart (What is God saying to me personally right now?), and Hands (What does God want me to do with this?). Takes 10–15 minutes. Accessed through the Daily DNA app or paper journal.',
    why: 'Most Christians read their Bible occasionally. The 3D Journal changes reading into encounter. It forces a disciple to move from information to application to obedience — every single day. A disciple who journals daily for one year has 365 documented conversations with God. They learn to recognize His voice, build a record of His faithfulness, and develop the spiritual muscle memory that sustains them through anything.',
    transformation: 'A disciple who journals daily becomes someone who hears from God before they hear from anyone else. Decision-making changes. Confidence grows. The Bible stops being a book they read and starts being a voice they listen to.',
    accent: 'var(--lp-gold)',
  },
  {
    week: 'Week 03',
    month: 'Month 1 — Foundation',
    title: '4D Prayer',
    subtitle: 'Establishing a Daily Prayer Rhythm',
    what: 'A structured daily prayer framework built around four movements: Revere (worship God for who He is), Reflect (thank God for what He\'s done), Request (intercede for others through prayer cards), and Rest (be still and listen). Takes 10–15 minutes. Accessed through the Prayer tab in the Daily DNA app.',
    why: 'Most Christians pray reactively — when things go wrong. The 4D rhythm trains disciples to pray proactively, consistently, and intercessorily. Rooted in Ezekiel 22:30 and Hebrews 7:25, it connects disciples to their identity as intercessors — people who stand in the gap for others the way Jesus always intercedes for us. Answered prayers become testimonies that fuel ongoing faith.',
    transformation: 'A disciple who prays daily through the 4D rhythm develops a prayer life that is relational, not transactional. They begin expecting God to answer. They see fruit — answered prayers, changed people, divine appointments — and their faith grows forward.',
    accent: 'var(--lp-gold)',
  },
  {
    week: 'Week 04',
    month: 'Month 1 — Foundation',
    title: 'Creed Cards',
    subtitle: 'Building on Historic Christian Truth',
    what: 'A set of doctrinal cards — each focused on one essential Christian belief rooted in Scripture and 2,000 years of church history. Every card presents the original Greek or Hebrew word, a concise definition, a key Scripture, and a reflection question. Used through a 4-step method: Discuss before flipping, Define the card, Deepen into Scripture, and Discuss again personally.',
    why: 'Disciples who don\'t know what they believe can\'t defend it, can\'t live it, and can\'t teach it. Creed Cards give every disciple a theological foundation in bite-sized, conversation-ready form. They protect against false teaching, unite the group around shared truth, and give disciples language for their faith that holds up under pressure.',
    transformation: 'A disciple who works through Creed Cards stops borrowing their theology from culture or feelings and starts rooting it in Scripture and church history. They can explain what they believe and why — to a skeptic, a seeker, or their own doubting heart.',
    accent: 'var(--lp-gold)',
  },
  {
    week: 'Week 05',
    month: 'Month 2 — Deepening',
    title: 'Q&A Deep Dive',
    subtitle: 'Addressing Doubts, Questions, and Confusion',
    what: 'A full meeting dedicated to the questions disciples have been afraid to ask — theological, practical, and personal. No question is off-limits. The leader does not need all the answers. Questions are collected first, then worked through together with Scripture as the final authority.',
    why: 'Unanswered questions become unspoken doubts. Doubts become strongholds. By Week 5, disciples have enough trust in the group to voice what they\'ve been sitting on. This week creates a culture of honesty that prevents intellectual barriers from quietly undermining everything else being built. It also teaches disciples to think biblically about hard things rather than avoiding them.',
    transformation: 'A disciple who has been given permission to ask hard questions without judgment stops hiding their doubts and starts bringing them into the light. Faith becomes more honest — and more durable. Questions are no longer the enemy of faith; they become the path through it.',
    accent: 'var(--lp-green)',
  },
  {
    week: 'Week 06',
    month: 'Month 2 — Deepening',
    title: 'Listening Prayer Circle',
    subtitle: 'Hearing God for Others',
    what: 'A structured group activity in which each disciple prays quietly for the person to their right, waits in silence to hear from God for that person, and then shares what they received — an impression, a picture, a Scripture, or a word. The receiver responds. Leaders coach in real time. Based on 1 Corinthians 14:1–3.',
    why: 'Most disciples have never been taught that they can hear God for someone else. This week demystifies the prophetic and makes it accessible, practice-based, and safe. It is often the week where disciples realize for the first time that God actually speaks through them — and that shifts everything about how they see prayer, community, and their own gifting.',
    transformation: 'A disciple who practices Listening Prayer stops thinking of the supernatural as someone else\'s territory. They begin looking for what God wants to say in every conversation. The group becomes a place where people genuinely encounter God through each other.',
    accent: 'var(--lp-green)',
  },
  {
    week: 'Week 07',
    month: 'Month 2 — Deepening',
    title: 'Outreach & Mission',
    subtitle: 'Applying Faith in the Real World',
    what: 'The group goes out together on a mission activity — street evangelism, homeless ministry, prayer walk, hospital visit, neighborhood cookout, or campus outreach. The meeting is replaced by action. Leaders model first, then release disciples to lead. Pairs go together for safety and accountability.',
    why: 'Discipleship that never leaves the room produces disciples who are informed but not transformed. Jesus didn\'t just teach His disciples — He sent them. Week 7 does the same. It pushes every person past their comfort zone into dependence on the Holy Spirit. Faith exercised only in safe environments is fragile. Faith risked in the real world is resilient.',
    transformation: 'A disciple who has gone on mission stops seeing evangelism as someone else\'s calling. They carry a boldness they did not have before. They have a specific moment where God used them — and that story becomes fuel for everything that follows.',
    accent: 'var(--lp-green)',
  },
  {
    week: 'Week 08',
    month: 'Month 2 — Deepening',
    title: 'Testimony Building',
    subtitle: 'Capturing and Sharing God\'s Faithfulness',
    what: 'A debrief of the Week 7 outreach followed by a structured testimony workshop using the STORY Framework: Struggle (before), Turning Point (the moment), Outcome (after), Reflection (what you learned), and Your Invitation (the call to others). Disciples develop two testimonies — a transformation story and a recent "God moment."',
    why: 'Disciples who cannot articulate what God has done in their lives are disarmed as witnesses. Revelation 12:11 says we overcome by the blood of the Lamb and the word of our testimony. Testimony is a weapon. The STORY Framework gives every disciple — no matter how ordinary their story feels — a structure for telling it clearly, specifically, and compellingly.',
    transformation: 'A disciple with a developed testimony stops underestimating what God has done in their life. They become witnesses — not because they were assigned to, but because they have something real and specific to say.',
    accent: 'var(--lp-green)',
  },
  {
    week: 'Week 09',
    month: 'Month 3 — Breakthrough',
    title: 'Breaking Strongholds',
    subtitle: 'Reveal, Renounce, Replace',
    what: 'A Spirit-led deliverance session structured around three movements. Reveal — disciples ask God to surface lies they are believing about Him, themselves, or others. Renounce — they verbally break agreement with the lie in Jesus\' name, confess, and forgive where needed. Replace — they ask God what truth He gives them in return, receive it, and declare it aloud. Based on 2 Corinthians 10:3–5.',
    why: 'Eight weeks of tools, trust, and community have created the conditions for this moment. No amount of Bible knowledge or prayer habit can fully overcome a lie that has never been named and renounced. A stronghold is a fortified lie — a belief entrenched in the mind that distorts how a person sees God, themselves, and their future. This week does the deep work that every previous week has been building toward.',
    transformation: 'A disciple who has gone through Reveal, Renounce, Replace often describes a weight lifting. Shame, fear, and self-rejection lose their grip. They have a new truth — declared aloud in front of witnesses. That declaration becomes their weapon when the lie tries to return.',
    accent: 'var(--lp-gold)',
  },
  {
    week: 'Week 10',
    month: 'Month 3 — Breakthrough',
    title: 'Identity Shift',
    subtitle: 'Who You Are in Christ',
    what: 'A teaching and activation session that helps disciples close the gap between how they see themselves and how God sees them. Disciples do a mirror test (honest self-assessment), a listening prayer exercise (asking God what He sees), and compare the two. Each disciple builds an Identity Battle Plan — a personal document of "Who I am" statements backed by Scripture, used as a weapon against the enemy\'s accusations.',
    why: 'Identity is the battlefield. The enemy does not attack behavior first — he attacks identity, because behavior follows belief. Week 10 builds on the freedom of Week 9 by replacing demolished lies with Scripture-anchored identity. The Identity Battle Plan turns truth into a tool disciples use every day. False humility is exalting your opinion of yourself over God\'s — and this week breaks that pattern.',
    transformation: 'A disciple with a clear, Scripture-rooted identity stops agreeing with the enemy\'s accusations. They stop performing for acceptance and hiding from failure. They know who they are. And they can prove it from the Word.',
    accent: 'var(--lp-gold)',
  },
  {
    week: 'Week 11',
    month: 'Month 3 — Breakthrough',
    title: 'Spiritual Gifts',
    subtitle: 'Discover Your Design to Serve',
    what: 'Disciples complete the Spiritual Gifts Assessment before the meeting, covering three tiers: Tier 1 — How You Serve (Romans 12 gifts), Tier 2 — Supernatural Empowerment (1 Corinthians 12 gifts), and Tier 3 — Leadership Calling (Ephesians 4 five-fold). The meeting reviews results, teaches on the Body of Christ, and closes with impartation through laying on of hands and immediate activation — each disciple uses their gift in the room before the meeting ends.',
    why: 'A disciple who doesn\'t know how God wired them will serve in ways that exhaust them or disengage entirely. Spiritual gifts are not a personality curiosity — they are the Father\'s design for how His love gets expressed through each person for the common good of the Body (1 Corinthians 12:7). Activation on the spot — not later, not theoretically — is what makes this week decisive rather than informational.',
    transformation: 'A disciple who knows and has activated their gifts moves from spectator to participant in the Body of Christ. They stop waiting for the professionals. They show up knowing they have something to give — and that the Body is incomplete without it.',
    accent: 'var(--lp-gold)',
  },
  {
    week: 'Week 12',
    month: 'Month 3 — Breakthrough',
    title: 'Life Assessment Revisited',
    subtitle: 'Measuring Growth and Setting New Goals',
    what: 'Disciples retake the same 42-question Life Assessment from Week 1. The dashboard auto-generates a side-by-side comparison report for each person — showing score changes across all 7 categories, the questions with the most growth, and open-ended responses from both weeks placed side by side. Leaders celebrate measurable wins, address gaps honestly, and cast vision for Phase 2.',
    why: 'Growth that is not measured is invisible. By Week 12, transformation has been happening — but disciples often can\'t see it because they\'re inside it. The comparison report makes growth concrete and undeniable. It also surfaces areas still needing work, giving leaders and disciples a clear-eyed basis for Phase 2 planning. This week answers the question every disciple is quietly asking: Did any of this actually work?',
    transformation: 'A disciple who sees their Week 1 and Week 12 scores side by side sees the evidence of what God has done. That evidence builds faith for what comes next. They stop doubting the process. They begin to believe that multiplication — leading their own group — is not just possible for someone else. It is possible for them.',
    accent: 'var(--lp-green)',
  },
];

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
        <div className="fade-in" style={{ marginBottom: '5rem' }}>
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
            One tool per week. Each one matters.
          </h2>
          <p
            style={{
              fontSize: '1rem',
              color: 'var(--lp-mid)',
              maxWidth: '560px',
              lineHeight: 1.7,
            }}
          >
            Every tool below is a practice disciples carry for the rest of their lives. The 90 days are just where they learn to pick it up.
          </p>
        </div>

        {/* Tool cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'var(--lp-rule)' }}>
          {tools.map((tool, index) => (
            <div
              key={tool.week}
              className="fade-in"
              style={{
                background: index % 2 === 0 ? 'var(--lp-warm-white)' : '#fff',
                padding: '2.75rem 3rem',
              }}
            >
              {/* Card header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'flex-start',
                  marginBottom: '2rem',
                  gap: '1rem',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
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
                        color: tool.accent,
                      }}
                    >
                      {tool.week}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 500,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--lp-mid)',
                        opacity: 0.7,
                      }}
                    >
                      {tool.month}
                    </span>
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)',
                      fontWeight: 900,
                      color: 'var(--lp-ink)',
                      marginBottom: '0.25rem',
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

                {/* Week number badge */}
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '3rem',
                    fontWeight: 900,
                    color: tool.accent,
                    opacity: 0.15,
                    lineHeight: 1,
                    userSelect: 'none',
                    flexShrink: 0,
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </div>
              </div>

              {/* Three info columns */}
              <div
                className="tk-tool-card"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '0',
                  borderTop: '1px solid var(--lp-rule)',
                  paddingTop: '1.75rem',
                  marginTop: '0.25rem',
                }}
              >
                {/* What it is */}
                <div
                  style={{
                    paddingRight: '2rem',
                    borderRight: '1px solid var(--lp-rule)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: tool.accent,
                      marginBottom: '0.6rem',
                    }}
                  >
                    What It Is
                  </div>
                  <p
                    style={{
                      fontSize: '0.83rem',
                      color: 'var(--lp-mid)',
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {tool.what}
                  </p>
                </div>

                {/* Why it matters */}
                <div
                  style={{
                    padding: '0 2rem',
                    borderRight: '1px solid var(--lp-rule)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: tool.accent,
                      marginBottom: '0.6rem',
                    }}
                  >
                    Why It Matters
                  </div>
                  <p
                    style={{
                      fontSize: '0.83rem',
                      color: 'var(--lp-mid)',
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {tool.why}
                  </p>
                </div>

                {/* What transformation looks like */}
                <div
                  style={{
                    paddingLeft: '2rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: tool.accent,
                      marginBottom: '0.6rem',
                    }}
                  >
                    What Changes
                  </div>
                  <p
                    style={{
                      fontSize: '0.83rem',
                      color: 'var(--lp-ink)',
                      lineHeight: 1.7,
                      margin: 0,
                      fontStyle: 'italic',
                    }}
                  >
                    {tool.transformation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
