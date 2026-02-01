/**
 * DNA Discipleship Manual Data
 *
 * 6 Sessions on discipleship multiplication
 * Based on the updated DNA Discipleship content
 */

export type ContentBlockType =
  | 'paragraph'
  | 'scripture'
  | 'keyDefinition'
  | 'discussion'
  | 'checklist'
  | 'numbered'
  | 'header';

export interface ContentBlock {
  type: ContentBlockType;
  text?: string;
  ref?: string;
  questions?: string[];
  items?: string[];
  title?: string;
}

export interface Lesson {
  id: number;
  title: string;
  duration: string;
  content: ContentBlock[];
}

export interface Session {
  id: number;
  title: string;
  verse: string;
  verseRef: string;
  warmUp: string[];
  lessons: Lesson[];
}

export interface DNAManualData {
  title: string;
  subtitle: string;
  description: string;
  epigraph: {
    text: string;
    reference: string;
  };
  teleiosDefinition: {
    term: string;
    language: string;
    definitions: string[];
  };
  sessions: Session[];
}

export const dnaManualData: DNAManualData = {
  title: 'DNA: Discipleship Naturally Activated',
  subtitle: '6 Session Multiplication Manual',
  description:
    'A practical guide to making disciples who make disciples through intentional apprenticeship and Spirit-led multiplication.',
  epigraph: {
    text: 'And He gave some as apostles, some as prophets, some as evangelists, some as pastors and teachers, for the equipping of the saints for the work of ministry, for the building up of the body of Christ; until we all attain to the unity of the faith, and of the knowledge of the Son of God, to a mature man, to the measure of the stature which belongs to the fullness of Christ.',
    reference: 'Ephesians 4:11-13 NASB',
  },
  teleiosDefinition: {
    term: 'Teleios',
    language: 'Greek Adjective',
    definitions: [
      'Brought to its end, finished',
      'Wanting nothing necessary to completeness',
      'Perfect',
      'That which is perfect: consummate human integrity and virtue',
      'Of men: full grown, adult, of full age, mature',
    ],
  },
  sessions: [
    // ==========================================
    // SESSION 1: What is Discipleship?
    // ==========================================
    {
      id: 1,
      title: 'What is Discipleship?',
      verse:
        "So Jesus was saying to those Jews who had believed Him, 'If you continue in My word, then you are truly My disciples.'",
      verseRef: 'John 8:31 NASB',
      warmUp: [
        'What is discipleship?',
        'Would you say that you have been discipled?',
      ],
      lessons: [
        {
          id: 1,
          title: 'Living Copies of the Master',
          duration: '5 min read',
          content: [
            {
              type: 'paragraph',
              text: 'Many have defined discipleship in various ways. With that definition comes expectations and strategies to execute the mission. Here\'s a simple definition that should clarify this word moving forward.',
            },
            {
              type: 'keyDefinition',
              text: 'Discipleship is a deliberate apprenticeship which results in, fully formed, living copies of the master.',
            },
            {
              type: 'paragraph',
              text: 'Ultimately, we are apprentices of Jesus. However, Jesus chooses to disciple us through other people just like us. The apprentice being discipled should be committed to soaking up everything they can from the teacher (coach, leader, mentor). A heart posture to receive and a desire to imitate Christ is necessary and should be expected in both the student and mentor.',
            },
            {
              type: 'scripture',
              text: 'Be imitators of me, just as I also am of Christ.',
              ref: '1 Corinthians 11:1 NASB',
            },
            {
              type: 'paragraph',
              text: "Discipleship can be misused to micro manage people's lives which can quickly become cultic in nature. As believers, we should seek wise counsel from several mature voices but a disciple should never need your permission to make a decision in their own life. In the same way teachers should never tell a student who to marry or what kind of career path to take. These kinds of decisions should involve wisdom, prayer and ultimately confirmation from God.",
            },
            {
              type: 'paragraph',
              text: "I believe that entering into a discipleship relationship means we give someone we trust permission to question our lives. What are you afraid of? What gets you fired up? What makes you angry? What drives your spending habits? You can tell a lot about someone by the way they answer such questions. Yes, this is personal but this is what Jesus wants. Vulnerability. True discipleship requires a safe place for dirt to be exposed, removed and healed. This is surgery \"by the body to the body\".",
            },
            {
              type: 'scripture',
              text: 'A person who is blind cannot guide another who is blind, can he? Will they not both fall into a pit? A student is not above the teacher; but everyone, when he has been fully trained, will be like his teacher.',
              ref: 'Luke 6:39-40 NASB',
            },
            {
              type: 'discussion',
              text: 'How do you feel about people imitating your life as you follow Christ? Does this make you uncomfortable or confident? Why?',
            },
          ],
        },
        {
          id: 2,
          title: 'The DNA of Christ',
          duration: '6 min read',
          content: [
            {
              type: 'scripture',
              text: 'The earth produced vegetation, plants yielding seed according to their kind, and trees bearing fruit with seed in them, according to their kind; and God saw that it was good.',
              ref: 'Genesis 1:12 NASB',
            },
            {
              type: 'paragraph',
              text: 'If you have the seed of Christ living in you then that means you have the DNA of Christ in you. You are no longer just human. You now have the Spirit of Christ living in you. You are now a holy human. If this is true, you will naturally produce the fruit of the Holy Spirit. And in that fruit is more seed that will multiply the DNA of Christ in others. This is not a maybe; this is the nature of Christ in us and through us. Discipleship and multiplication is a mandate for all Christians to participate in.',
            },
            {
              type: 'scripture',
              text: 'Truly, truly I say to you, unless a grain of wheat falls into the earth and dies, it remains alone; but if it dies, it bears much fruit.',
              ref: 'John 12:24',
            },
            {
              type: 'scripture',
              text: 'I am the vine, you are the branches; the one who remains in Me, and I in him bears much fruit, for apart from Me you can do nothing... My Father is glorified by this, that you bear much fruit, and so prove to be My disciples.',
              ref: 'John 15:5, 8 NASB',
            },
            {
              type: 'keyDefinition',
              text: "What's the proof? Bear much fruit.",
            },
            {
              type: 'paragraph',
              text: "Is it the right kind of fruit? We must be mindful of the seeds we sow into the lives of those we disciple. If you are a born again believer, you now have the seed of Christ growing in you. But we also have seeds of the enemy that need to be uprooted and removed from our hearts. As a leader, you must be aware of the condition of the soil in your heart and the seeds that are actively growing in your life. You may have a root of bitterness that is undealt with. And you may be unaware that some of the seed you're planting in a disciple's life is having an effect on their growth.",
            },
            {
              type: 'scripture',
              text: 'You will know them by their fruits. Grapes are not gathered from thorn bushes, nor figs from thistles, are they? So every good tree bears good fruit, but the bad tree bears bad fruit. A good tree cannot bear bad fruit, nor can a bad tree bear good fruit.',
              ref: 'Matthew 7:16-18 NASB',
            },
          ],
        },
        {
          id: 3,
          title: 'Introspective',
          duration: '3 min read',
          content: [
            {
              type: 'scripture',
              text: "I planted, Apollos watered, but God was causing the growth. So then neither the one who plants nor the one who waters is anything, but God who causes the growth. Now the one who plants and the one who waters are one; but each will receive his own reward according to his own labor. For we are God's fellow workers; you are God's field, God's building.",
              ref: '1 Corinthians 3:6-9 NASB',
            },
            {
              type: 'paragraph',
              text: "We should all have people we trust, who can call us higher in our identity. This is why we don't believe in maverick (solo mission) discipleship. We encourage community discipleship where leaders overlap their efforts to produce Spirit-filled believers who are full of the DNA of Jesus. After all, we should be able to test the fruit of one another's lives. It comes down to these questions:",
            },
            {
              type: 'discussion',
              questions: [
                'Who do you trust to test the soil and seed of your life?',
                'Who trusts you to test the soil and seed of their life?',
              ],
            },
          ],
        },
      ],
    },

    // ==========================================
    // SESSION 2: Mission to Multiply
    // ==========================================
    {
      id: 2,
      title: 'Mission to Multiply',
      verse:
        'As for you, be fruitful and multiply; Populate the earth abundantly and multiply in it.',
      verseRef: 'Genesis 9:7 NASB',
      warmUp: ['How do you know if someone is ready to make disciples?'],
      lessons: [
        {
          id: 1,
          title: 'Two by Two',
          duration: '6 min read',
          content: [
            {
              type: 'paragraph',
              text: 'Discipleship can be seen as a church small group program but they are different. DNA groups are not seasonal where small groups tend to break for summers and holidays. DNA groups are more intentional and effective at producing deep relationships that are forged by life on life experiences. This may involve breaking false mindsets, correcting unseen wounds and calling each other higher into God-given identity.',
            },
            {
              type: 'scripture',
              text: 'And the things you have heard me say in the presence of many witnesses entrust to reliable people who will also be qualified to teach others.',
              ref: '2 Timothy 2:2 NIV',
            },
            {
              type: 'keyDefinition',
              text: '1 Leader + 1 Co-leader + 2 Disciples = DNA Group',
            },
            {
              type: 'paragraph',
              text: "Discipleship is not a solo mission. I have found that they work best in groups of 4. Two leaders; One an experienced leader and the other, an up and coming co-leader. Each of these leaders should have one disciple each that they both raise up together as a team. Now there is an overlap of relationships and the workload of discipleship is shared. No one gets burned out. Now there is encouragement when one leader is feeling weary.",
            },
            {
              type: 'scripture',
              text: 'And let us consider how we may spur one another on toward love and good deeds, not giving up meeting together, as some are in the habit of doing, but encouraging one another—and all the more as you see the Day approaching.',
              ref: 'Hebrews 10:24-25 NASB',
            },
            {
              type: 'paragraph',
              text: "In this model, you will spend 12 months (minimum 6 months in some situations) with the same group. The leader will raise up the co-leader to be a confident disciple maker and the apprentices will become future co-leads. We must communicate this so people aren't surprised when it's time to multiply. They expect it and look forward to it.",
            },
            {
              type: 'paragraph',
              text: 'Yes, we multiply in groups but the relationship is not over. It just looks a little different as we step into the call of exponential growth. I have discipled many people and I still keep in contact with many of them. They still ask for help in their journey of discipling others. The goal is not to abandon people but to release them for success. Someone who has effectively been discipled should be able to repeat the process. This does not mean every disciple relationship looks the same but they are united by "the mission of multiplication".',
            },
          ],
        },
        {
          id: 2,
          title: 'Too Much Too Fast',
          duration: '5 min read',
          content: [
            {
              type: 'paragraph',
              text: 'You may be eager to add people to your group but it is vital that you grow as a leader in your ability to cultivate more than one or two people at once. Keep in mind you may also be cultivating a marriage, children, career relationships and friendships that still require care.',
            },
            {
              type: 'discussion',
              text: 'How many relationships can you effectively grow without living unbalanced in certain areas?',
            },
            {
              type: 'paragraph',
              text: 'There is no clear answer for this but we can look at the life of Jesus and see 12 inner circle disciples as a model. Taking on 12 or more is something we need to grow into over time.',
            },
            {
              type: 'scripture',
              text: 'For which of you, desiring to build a tower, does not first sit down and count the cost, whether he has enough to complete it?',
              ref: 'Luke 14:28',
            },
            {
              type: 'paragraph',
              text: "I look at each of my kids as one of those inner circle spots, my wife as another and my closest friends in the other spots. I'm already up to 8. How many more relationships can I do well? This is an honest conversation we must have to avoid burnout and hurting those I love. As we make disciples we will grow in our capacity to pour into more people at one time. You may only be able to handle 1-3 additional people at this point in your life. This number will increase as God increases your maturity and capacity to love others well.",
            },
            {
              type: 'scripture',
              text: 'I am giving you a new commandment, that you love one another; just as I have loved you, that you also love one another. By this all people will know that you are My disciples: if you have love for one another.',
              ref: 'John 13:34-35 NASB',
            },
            {
              type: 'paragraph',
              text: 'Your ability to love others is limited by your ability to be loved by God. As you receive the love of God you will naturally overflow and be able to manage more relationships. The first relationship you are responsible for is you and God (Father, Son and Spirit). Followed by your covenant relationships. By covenant we mean relationships that have signed agreements attached to them. This includes your spouse, kids, employer, and business partners. We believe that discipleship relationships are covenant agreements as well but they must be in proper order of responsibility.',
            },
            {
              type: 'discussion',
              questions: [
                'Is your house in order?',
                'Is your relationship with God thriving?',
                'Are you overflowing with love?',
                'What is your current capacity for discipleship?',
              ],
            },
          ],
        },
        {
          id: 3,
          title: 'Reasonable Expectations',
          duration: '5 min read',
          content: [
            {
              type: 'paragraph',
              text: 'Your mission as a leader is to reproduce Christ in those you are raising up. With Christ, naturally comes the mission of discipleship. This can take 6 months to 1 year depending on the maturity level of the apprentice when starting. As a leader, you should be proficient in the following areas. We believe these are reasonable expectations that every mature believer can rise up and be successful at.',
            },
            {
              type: 'header',
              title: 'Healthy expectations are...',
            },
            {
              type: 'numbered',
              items: [
                "Communicated, because you can't expect something from someone if they are not aware and in agreement.",
                "Attainable, because you can't expect something from someone they are not able to reach.",
                'Flexible, because the seasons of life can change which means our expectations of people should be an open conversation.',
              ],
            },
            {
              type: 'header',
              title: 'Expectations of Leaders and Co-Leaders',
            },
            {
              type: 'paragraph',
              text: '1. Fully equipped in New Covenant Doctrine. You do not need to be an ARK Trainer but you should have experience with our core classes. ID3, Freedom, Sabbath and The Bridge. You should be able to break down the core beliefs of Christianity and the reality of the New Covenant.',
            },
            {
              type: 'scripture',
              text: 'Be diligent to present yourself approved to God as a worker who does not need to be ashamed, accurately handling the word of truth. But avoid worldly and empty chatter, for it will lead to further ungodliness.',
              ref: '2 Timothy 2:15-16 NASB',
            },
            {
              type: 'paragraph',
              text: '2. Intentional and consistent communication. You should care about those you are discipling and helping them reach their full potential in Christ. This requires consistent communication through various methods. You should also be consistent in communication with other DNA leaders in your community.',
            },
            {
              type: 'paragraph',
              text: '3. Stewarding your personal walk with Christ. You should be able to lead yourself in devotion, worship, and discerning God\'s word (Logos and Rhema). If you are not able to manage yourself according to the Holy Spirit, how can you help someone else in their spiritual formation?',
            },
            {
              type: 'scripture',
              text: 'Hold on to the example of sound words which you have heard from me, in the faith and love which are in Christ Jesus. Protect, through the Holy Spirit who dwells in us, the treasure which has been entrusted to you.',
              ref: '2 Timothy 1:13-14 NASB',
            },
            {
              type: 'paragraph',
              text: '4. Living with godliness and integrity. As a leader or co-leader, you are expected to be walking in freedom, without any lifestyle of ongoing sin. We all make mistakes at times, but when we do, we experience conviction, confess to people we trust and keep it moving towards the high calling.',
            },
          ],
        },
        {
          id: 4,
          title: 'Who and Why Matters',
          duration: '5 min read',
          content: [
            {
              type: 'paragraph',
              text: "Paul had partnerships. We should have partnerships; people we have come into agreement with to make disciples together. This person should be faithful and able to meet the reasonable expectations we listed in the previous lesson. This is someone you should be able to count on and they should be able to count on you to live with integrity and follow through.",
            },
            {
              type: 'scripture',
              text: "After some days Paul said to Barnabas, \"Let's return and visit the brothers and sisters in every city in which we proclaimed the word of the Lord, and see how they are.\" Barnabas wanted to take John, called Mark, along with them also. But Paul was of the opinion that they should not take along with them this man who had deserted them in Pamphylia and had not gone with them to the work. Now it turned into such a sharp disagreement that they separated from one another...",
              ref: 'Acts 15:36-41 NASB',
            },
            {
              type: 'paragraph',
              text: "Division in the Body? Let it never be. We see here that our opinions will not always reveal someone's true character. Paul was holding a past experience with Mark against him. So we see division between two ministers because they did not see the same thing in a disciple. The good news is that Paul trusted John Mark again as he proved to be a faithful worker of the gospel.",
            },
            {
              type: 'scripture',
              text: 'Make every effort to come to me soon; for Demas, having loved this present world, has deserted me and gone to Thessalonica... Only Luke is with me. Take along Mark and bring him with you, for he is useful to me for service.',
              ref: '2 Timothy 4:9-11 NASB',
            },
            {
              type: 'paragraph',
              text: "Maybe you have been identified as a leader in your community, who is ready to start leading a DNA group. Before you ask God to send some disciples you should be asking for a co-leader; someone who is mature but still growing in their ability to lead a group on their own. This decision should be made with the Holy Spirit. Who is He leading you to partner with?",
            },
          ],
        },
        {
          id: 5,
          title: 'Who Should You Disciple?',
          duration: '4 min read',
          content: [
            {
              type: 'paragraph',
              text: 'Pray! I know it sounds cliche, but pray. Jesus spent time with The Father before He went out and selected the men that would follow Him the next 3.5 years. This is such an important part of the process. Many people say they want discipleship but when it comes down to it they much rather just have some friends to hang out with.',
            },
            {
              type: 'scripture',
              text: 'Now it was at this time that He went off to the mountain to pray, and He spent the whole night in prayer with God. And when day came, He called His disciples to Him and chose twelve of them, whom He also named as apostles.',
              ref: 'Luke 6:12-13 NASB',
            },
            {
              type: 'paragraph',
              text: 'We love and receive people right where they are at but they must be teachable, correctable and willing to be transformed by the power of Holy Spirit. When Jesus said "put down your way of living and follow me", they could have said no. The point is this: Let the Father lead you to the right person who is ready to receive what you have to offer.',
            },
            {
              type: 'paragraph',
              text: 'Jesus had large crowds that would follow him but not always for the right reasons. Big difference between fans and followers.',
            },
            {
              type: 'scripture',
              text: 'Now large crowds were going along with Him, and He turned and said to them, "If anyone comes to Me and does not hate his own father, mother, wife, children, brothers, sisters, yes, and even his own life, he cannot be My disciple. Whoever does not carry his own cross and come after Me cannot be My disciple."',
              ref: 'Luke 14:25-27 NASB',
            },
            {
              type: 'keyDefinition',
              text: 'Every time I ask God to send more disciples He does.',
            },
            {
              type: 'scripture',
              text: 'The fruit of the righteous is a tree of life, And one who is wise gains souls.',
              ref: 'Proverbs 11:30 NASB',
            },
            {
              type: 'discussion',
              questions: [
                'Lord, am I ready to disciple someone?',
                'Is there anyone you would like me to disciple?',
                'Who can I learn from as I grow into this?',
              ],
            },
          ],
        },
      ],
    },

    // ==========================================
    // SESSION 3: Smarter. Not Harder.
    // ==========================================
    {
      id: 3,
      title: 'Smarter. Not Harder.',
      verse: 'I, wisdom, dwell with prudence, And I find knowledge and discretion.',
      verseRef: 'Proverbs 8:12 NASB',
      warmUp: ['How do you know if someone is ready to be discipled?'],
      lessons: [
        {
          id: 1,
          title: 'Ready or Not?',
          duration: '5 min read',
          content: [
            {
              type: 'paragraph',
              text: 'People come into church and hear us using words like fellowship, discipleship and evangelism. The average person has no idea what we are talking about. They are probably more familiar with words like coach, mentor, apprenticeship and promoting. When inviting someone into a discipleship relationship, take notice of their current understanding. Are they ready or not?',
            },
            {
              type: 'paragraph',
              text: "Not everyone is ready for what we are presenting here. Most people will not be able to reciprocate your commitment until they fully grasp what is being offered. They may not be good at calling you, checking in and following through. Not only are we helping people grow in relation to Jesus but also in the healthy function of life. Your job is to communicate well and be patient with them as they learn to follow your example.",
            },
            {
              type: 'scripture',
              text: 'Like newborn babies, you must crave pure spiritual milk so that you will grow into a full experience of salvation. Cry out for this nourishment.',
              ref: '1 Peter 2:2 NLT',
            },
            {
              type: 'keyDefinition',
              text: "We can't offer someone spiritual milk when all they want to drink is sugar water.",
            },
            {
              type: 'paragraph',
              text: 'Personally, I don\'t ever ask someone to disciple them. I ask them to grab coffee and I begin to pour into them. I develop relationships and If they are receptive, I continue. Do they attend our weekly gatherings? Do they respond when I invite them to something? At the end of the day, are they crying out for nourishment?',
            },
            {
              type: 'paragraph',
              text: 'There is a time to define the discipleship relationship. This is usually a few months into gathering that they realize what is happening. "Am I being discipled?" Yes you are. Now, they appreciate the commitment. They value it. Don\'t rush into discipleship relationships. Allow them to prove that they are hungry for this the same way that you are.',
            },
            {
              type: 'header',
              title: 'New Disciple Checklist - Are they...',
            },
            {
              type: 'checklist',
              items: [
                'Hungry for spiritual growth? Do they ask questions?',
                'Receptive to coaching and correction? Are they easily offended?',
                'Available for discipleship schedule? Are they devoted to giving God their time?',
                'Responsive to communication? How long does it take them to get back to you?',
              ],
            },
          ],
        },
        {
          id: 2,
          title: 'Levels of Relationship',
          duration: '4 min read',
          content: [
            {
              type: 'paragraph',
              text: 'Pay attention to the level of relationship people can handle. You may even find that you need to grow in your ability to manage relationships that increase in intimacy. Discipleship will challenge you to step past the surface level, leap past the vulnerability phase of confession and dive into the mysterious world of change. This is where demolition and reconstruction happen by grace of God.',
            },
            {
              type: 'paragraph',
              text: "Surface Level: Basic life details; things we do or don't like. Small talk is important. It's the common ground of society.",
            },
            {
              type: 'paragraph',
              text: 'Personal Level: Vulnerability. The willingness to expose pain. This shows that we are done hiding and aware of the change needed.',
            },
            {
              type: 'paragraph',
              text: 'Transformative Level: Trust and surrender. Help me be renewed. The desire for change exceeds the risk of staying the same. How do we walk with people here?',
            },
            {
              type: 'discussion',
              questions: [
                "How would you assess the soil of someone's heart?",
                'Do you have the tools to cultivate their heart into good soil?',
              ],
            },
            {
              type: 'paragraph',
              text: "When working with a new disciple, start with our 4 session course, 100X. It's about the parable of the four soils and how to protect what God is planting in your heart. This course will help lay a foundation for new disciples to understand where they are at and where they want to be.",
            },
          ],
        },
        {
          id: 3,
          title: 'The 7 C\'s',
          duration: '6 min read',
          content: [
            {
              type: 'paragraph',
              text: 'Read Mark 2:1-12. There are 7 categories of people in this passage. Each one starts with a C.',
            },
            {
              type: 'paragraph',
              text: 'Christ - The Healer. Jesus is the Anointed One and we are anointed ones by the same Spirit.',
            },
            {
              type: 'paragraph',
              text: 'Committed - The disciples. Those who follow you are following Jesus as long as you point to Him.',
            },
            {
              type: 'paragraph',
              text: 'Crowd - The mob of people. "Many were gathered" to hear and see the healer.',
            },
            {
              type: 'paragraph',
              text: "Curious - Those attracted to crowd. They don't know about the healer. They are just nosey.",
            },
            {
              type: 'paragraph',
              text: "Cripple - The paralyzed. They can't get to Jesus without help. They need someone to make a way.",
            },
            {
              type: 'paragraph',
              text: 'Carriers - The workers. Those who are willing to do dangerous things to make a way for the cripple.',
            },
            {
              type: 'paragraph',
              text: 'Critical - The pharisees. Those who ridicule the ways of Christ. Cynical towards the faith.',
            },
            {
              type: 'discussion',
              questions: [
                'Who do you identify with most out of these 7 categories? Why?',
                'Think about a potential disciple. What category would you put them in? Why?',
              ],
            },
          ],
        },
      ],
    },

    // ==========================================
    // SESSION 4: Keep it Simple Saint
    // ==========================================
    {
      id: 4,
      title: 'Keep it Simple Saint',
      verse:
        'Be very careful, then, how you live—not as unwise but as wise, making the most of every opportunity, because the days are evil.',
      verseRef: 'Ephesians 5:15-16 NIV',
      warmUp: [
        'How many hours per week do you think the common Christian spends doing Christian activities?',
      ],
      lessons: [
        {
          id: 1,
          title: "Let's Get Practical",
          duration: '5 min read',
          content: [
            {
              type: 'scripture',
              text: 'Be devoted to one another in brotherly love; give preference to one another in honor; not lagging behind in diligence, fervent in spirit, serving the Lord; rejoicing in hope, persevering in tribulation, devoted to prayer, contributing to the needs of the saints, practicing hospitality.',
              ref: 'Romans 12:10-13 NASB',
            },
            {
              type: 'paragraph',
              text: 'The common "committed" Christian in America will spend up to 4 hours a week doing Christian activities. 2 hours on Sundays and 2 hours on Wednesdays. Then you have devoted Christians who want to serve in some way. That\'s another 2-4 hours a week? Then you have radical followers of Jesus who have become living sacrifices.',
            },
            {
              type: 'keyDefinition',
              text: 'We are not looking for common American Christians. We are looking for followers of Christ; living sacrificial lives as a witness to the world around them.',
            },
            {
              type: 'paragraph',
              text: 'Even so, we need to be mindful that there are only so many hours in a week; 168 to be exact. And we must be honest with ourselves. How many hours a week can you realistically devote to the multiplication of disciples? Is this a healthy weekly commitment that you can make for an extended period of time?',
            },
            {
              type: 'header',
              title: "Here's an example of healthy weekly commitments:",
            },
            {
              type: 'checklist',
              items: [
                'Corporate Edification Gathering (Fellowship of the Saints) - 1.5 hours',
                'Weekly ARK Trainings (Theology and Experience) - 1.5 hours',
                'DNA Group (Life on Life Discipleship) - 1-2 hours',
                'Prayer Call (Via Conference Call) - 30 mins (Once a week)',
                'Prayer, Bible, Journal (20-30 mins daily)',
                'Serving People (Charity of time) - 1-2 hours',
              ],
            },
            {
              type: 'discussion',
              text: 'Does this seem doable for a devoted follower of Christ? Or is this asking too much in our culture? Why do you feel this way?',
            },
          ],
        },
        {
          id: 2,
          title: "PB&J: It's That Simple",
          duration: '6 min read',
          content: [
            {
              type: 'paragraph',
              text: "Before we talk about weekly DNA meetings, we need to establish something critical: DNA discipleship only works if disciples commit to a daily rhythm with God. We call it PB&J: Prayer, Bible, and Journal. It's a simple 20-30 minute daily practice: 10 minutes of prayer using the 4D Prayer rhythm and 10 minutes Bible and Journaling using the 3D Journal method.",
            },
            {
              type: 'keyDefinition',
              text: "If disciples won't commit to 20-30 minutes with God daily, they're not ready for a DNA group.",
            },
            {
              type: 'paragraph',
              text: "This isn't harsh—it's honest. Without daily PBJ, weekly meetings become information transfer, not transformation. Disciples remain consumers, not contributors. But with daily PB&J, disciples hear God's voice consistently, growth happens between meetings, and multiplication becomes natural.",
            },
            {
              type: 'header',
              title: 'Your Job as a DNA Leader',
            },
            {
              type: 'paragraph',
              text: "Model it first. You can't lead disciples into a rhythm you don't practice yourself. Before you invite anyone to join a DNA group, make sure you're doing daily PBJ for at least 30 days.",
            },
            {
              type: 'paragraph',
              text: 'When you invite someone, be crystal clear: "DNA requires a daily commitment of 20-30 minutes: Prayer, Bible, and Journal. If you can\'t commit to that, this isn\'t the right season for you."',
            },
            {
              type: 'header',
              title: 'Check on it weekly:',
            },
            {
              type: 'checklist',
              items: [
                '"How many days this week did you do PBJ?"',
                '"What\'s blocking you on the days you don\'t?"',
                '"What did God say to you this week through Scripture?"',
              ],
            },
            {
              type: 'paragraph',
              text: "When disciples struggle with consistency, don't shame them—help them problem-solve. Is it a time issue? A \"don't know what to do\" issue? Or a motivation issue that signals they may not be ready yet?",
            },
          ],
        },
        {
          id: 3,
          title: 'Your Discipleship Toolkit',
          duration: '7 min read',
          content: [
            {
              type: 'paragraph',
              text: 'There are many different tools we can use to create a well-rounded discipleship experience. As leaders you should be using a variety of tools to fully equip your disciples.',
            },
            {
              type: 'paragraph',
              text: "Life Assessment - These assessments consist of heart provoking questions that help pinpoint areas of a disciple's life that need to be worked on. As leaders we can tell a lot about a person by the way they answer certain questions about God and life. We can also measure someone's growth by the way their answers change over the course of a year.",
            },
            {
              type: 'paragraph',
              text: '3D Journal - Pick a chapter of the Bible and meditate on the scripture. We encourage people to use the 3D Journal method of processing scripture and revelation: HEAD (understanding), HEART (application), and HANDS (action). Everyone then gets the opportunity to deliver the revelation they received to the group and give each other feedback.',
            },
            {
              type: 'paragraph',
              text: "4D Prayer - A four-dimensional prayer rhythm designed to deepen your relationship with God, moving you from distraction to intimacy. It begins by Revering God through worship, then moves to Reflect on His goodness with specific gratitude. Next, you Request by bringing your needs and intercessions. Finally, you Rest in His presence, practicing stillness to listen.",
            },
            {
              type: 'paragraph',
              text: 'Creed Cards - An interactive collection of foundational pieces of truth that will help your students understand and wrestle with the core beliefs of the Christian Faith. These truths are rooted in the essential creeds that are non-negotiables for our faith.',
            },
            {
              type: 'paragraph',
              text: "Listening Prayer - This activity involves everyone circling up and praying for the person clockwise to them. Everyone takes a few minutes to listen to what God might be saying for their assigned person. Then each of you takes time to share what you sensed and receive feedback.",
            },
            {
              type: 'paragraph',
              text: 'Testimony Time - This should be done often. Disciples need to bring back good news to the group. The stories of Jesus in and through our lives are the life force to our ministry.',
            },
            {
              type: 'paragraph',
              text: 'Q and A Discussions - Question and answer sessions can be a great way to open up theological discussions on many topics. Your disciples have burning questions about God that they never felt safe to ask.',
            },
            {
              type: 'paragraph',
              text: 'Simple Fellowship - Sometimes we simply need time to get to know each other. Hanging out on a friendship level can be a major breakthrough in the Supernatural growth in your group.',
            },
            {
              type: 'paragraph',
              text: "Outing - Outreach or Mission - No permission slips needed! A well placed field trip works well to shake up the group and get them out of routine. Think of something exciting and maybe a little dangerous.",
            },
          ],
        },
      ],
    },

    // ==========================================
    // SESSION 5: God's Way
    // ==========================================
    {
      id: 5,
      title: "God's Way",
      verse:
        'Whoever loves discipline loves knowledge, But he who hates reproof is stupid.',
      verseRef: 'Proverbs 12:1 NASB',
      warmUp: [
        'How do you feel about being corrected by a person of authority?',
      ],
      lessons: [
        {
          id: 1,
          title: 'Connection Before Correction',
          duration: '6 min read',
          content: [
            {
              type: 'scripture',
              text: 'All Scripture is inspired by God and beneficial for teaching, for rebuke, for correction, for training in righteousness; so that the man or woman of God may be fully capable, equipped for every good work.',
              ref: '2 Timothy 3:16-17 NASB',
            },
            {
              type: 'paragraph',
              text: 'If you have stepped into a leadership role for any length of time you will realize that correction is a necessary part of the process. But how we bring correction is important. God has a plan for discipleship as we can see here in 2 Timothy 3:',
            },
            {
              type: 'numbered',
              items: [
                'Teaching: Reveals the reality of Christ and exposes brokenness that we cannot see.',
                'Rebuke: Calls out the root of brokenness and offers a path to wholeness.',
                'Correction: Resets the brokenness to proper alignment and covers the wound with grace.',
                'Training: Rehabilitates the area of life by exercising righteousness in Christ.',
              ],
            },
            {
              type: 'keyDefinition',
              text: "People don't care how much you know until they know how much you care.",
            },
            {
              type: 'paragraph',
              text: "As cliche as this may sound, it's true. Kids test us in this everyday as they observe and learn the way we connect and love them. Adults do the same thing. The lack of connection in our childhood produces skepticism. We become guarded from disappointment and true intimacy is now replaced with busyness and surface level relationships.",
            },
            {
              type: 'paragraph',
              text: 'One of the ways that a father displays His love for us is through correction and discipline. It is a necessary part of the parenting process yet misused in families throughout history where fathers will demand obedience at the cost of relationship.',
            },
            {
              type: 'keyDefinition',
              text: 'Correction without connection will create division.',
            },
            {
              type: 'scripture',
              text: 'My son, do not despise the chastening of the Lord, Nor detest His correction; For whom the Lord loves He corrects, Just as a father the son in whom he delights.',
              ref: 'Proverbs 3:11-12',
            },
          ],
        },
        {
          id: 2,
          title: 'Skin in the Game',
          duration: '7 min read',
          content: [
            {
              type: 'paragraph',
              text: "How do you establish connection when you've only had poor examples in your life? Let's use an example from the Bible. One of the most famous father-son relationships in the new testament is the apostle Paul and a young man named Timothy.",
            },
            {
              type: 'scripture',
              text: 'He (Paul) also came to Derbe and to Lystra. A disciple named Timothy was there, the son of a Jewish woman who was a believer, but whose father was a Greek. The brothers in Lystra and Iconium spoke well of him. Paul wanted Timothy to accompany him, and he took him and circumcised him because of the Jews who were in those places, for they all knew that his father was Greek.',
              ref: 'Acts 16:1-4',
            },
            {
              type: 'paragraph',
              text: "Paul knew that the Jews would not receive Timothy into their synagogues based on the fact that his father was Greek. So Paul circumcised him. Not for legalistic reasons but to become all things to all men and win some to the Kingdom of God.",
            },
            {
              type: 'paragraph',
              text: "Now this all makes sense if you are in Paul's shoes but if you are Timothy you might be having some deep internal questions about letting go of a piece of your flesh. There must have been a level of rapport built between them. And Paul had to have seen something special in this young man to ask such a bold request.",
            },
            {
              type: 'paragraph',
              text: 'This is the kind of relationship we desperately need in the church. Often the leaders of ministries have hang ups that hold them back from intimate connection with those under their guidance.',
            },
            {
              type: 'scripture',
              text: 'For though you may have ten thousand instructors in Christ, you do not have many fathers, because I became your father in Christ Jesus through the gospel. Therefore I urge you, imitate me. For this reason I have sent Timothy to you, who is my beloved and faithful son in the Lord.',
              ref: '1 Corinthians 4:15-17',
            },
            {
              type: 'paragraph',
              text: 'Here we have a beautiful example of the fruit that comes from intimate relationships founded in sacrifice and vulnerability. Paul boasts in his beloved and faithful son Timothy who allows him to be in many places at once. A good father can reach many places not because he is good at reaching but because he has many sons who can handle family business.',
            },
            {
              type: 'discussion',
              questions: [
                'Do you have this kind of relationship with God?',
                'Who would you trust with a "blade"?',
                'Are you trustworthy with a "blade" for someone else?',
              ],
            },
          ],
        },
        {
          id: 3,
          title: 'Patient When Wronged',
          duration: '5 min read',
          content: [
            {
              type: 'scripture',
              text: "The Lord's bond-servant must not be quarrelsome, but be kind to all, skillful in teaching, patient when wronged, with gentleness correcting those who are in opposition, if perhaps God may grant them repentance leading to the knowledge of the truth, and they may come to their senses and escape from the snare of the devil, having been held captive by him to do his will.",
              ref: '2 Timothy 2:24-26 NASB',
            },
            {
              type: 'paragraph',
              text: 'You will be wronged by someone you are discipling. And you could wrong them if you are unaware of the power of your words. How you respond when you are wronged is key. Keep in mind, you are a leader because you have developed character and relationship with Christ. The person you are discipling may be coming out of broken relationships, they may live in toxic environments and have no idea how to manage a healthy friendship.',
            },
            {
              type: 'paragraph',
              text: "Are you able to live \"unoffendable\" when your student does not respond the way you hoped they would? Christ wants to walk you through an experience He is well acquainted with; loving people who can't yet love you back. This is what it means to answer the call of disciple making.",
            },
            {
              type: 'scripture',
              text: "A person's discretion makes him slow to anger, And it is his glory to overlook an offense.",
              ref: 'Proverbs 19:11 NASB',
            },
            {
              type: 'paragraph',
              text: "There are things that God wants to teach you that you will only learn by answering the call of disciple making. You will learn long suffering, sacrificial love, consistency, and hearing God for people who can't hear yet. You will come face to face with frustration and disappointment that can only be remedied through surrender to God.",
            },
          ],
        },
        {
          id: 4,
          title: 'Is He Worthy?',
          duration: '5 min read',
          content: [
            {
              type: 'scripture',
              text: 'Suffer hardship with me, as a good soldier of Christ Jesus. No soldier in active service entangles himself in the affairs of everyday life, so that he may please the one who enlisted him as a soldier.',
              ref: '2 Timothy 2:3-4 NASB',
            },
            {
              type: 'paragraph',
              text: 'Have I talked you out of disciple making yet? If I can talk you out of true discipleship with this short manual then I pray you have a safe journey back to country club Christianity. But if nothing I say will detour you from saying yes to His command to make disciples then nothing will stop you.',
            },
            {
              type: 'keyDefinition',
              text: 'Jesus is worthy of a yes that is not tossed back and forth by the waves of life. He is worthy!',
            },
            {
              type: 'paragraph',
              text: "We must come to a place where our hearts break for those who don't know him, both in the church and outside of the church. Just because someone has been saved for years does not mean that they have been discipled into the call of Jesus to multiply. Does your heart overflow with compassion for those who fill church rows Sunday after Sunday only to manifest mediocrity in their faith week after week?",
            },
            {
              type: 'paragraph',
              text: 'I refuse to settle for lower versions of the Christian life. I also refuse to watch others settle for half of the gospel. Do you join me in this dissatisfaction?',
            },
            {
              type: 'paragraph',
              text: "Here's the reality. Christ died and resurrected for a church that is able to grow, produce fruit and multiply into a grove of abundance. This is the church that creation groans for. This is the salty church that preserves the earth so more and more people can enter the Kingdom. I will lay my life down for this. But none of us can do it alone.",
            },
            {
              type: 'discussion',
              text: 'How are you feeling about the call of discipleship?',
            },
          ],
        },
      ],
    },

    // ==========================================
    // SESSION 6: Are You Ready?
    // ==========================================
    {
      id: 6,
      title: 'Are You Ready?',
      verse:
        'I am the true vine, and My Father is the vinedresser. Every branch in Me that does not bear fruit, He takes away; and every branch that bears fruit, He prunes it so that it may bear more fruit.',
      verseRef: 'John 15:1-2 NASB',
      warmUp: [
        "What's something God has pruned from your life in the last year?",
        'How did it feel at the time vs. how do you feel about it now?',
      ],
      lessons: [
        {
          id: 1,
          title: 'Pruning is Love',
          duration: '5 min read',
          content: [
            {
              type: 'paragraph',
              text: 'Pruning is the act of cutting back branches of a tree so that resources can flow to the branches that will produce even more. Without pruning we wouldn\'t be as fruitful as we were created to be. No one enjoys being pruned. I don\'t think anyone really enjoys pruning others. It can be uncomfortable. But it is also necessary.',
            },
            {
              type: 'paragraph',
              text: 'For example, If you had an infection in your finger and no medicine to kill the infection, would you allow me to cut off your finger to save your whole body? In the same way there are things in our lives that can\'t go where Jesus is taking us. Those branches must get pruned from us to allow new healthy growth to occur.',
            },
            {
              type: 'paragraph',
              text: "Ultimately, Jesus is the gardener who tends to the growth of our lives. He decides what gets pruned and what doesn't. We are essentially assistants to the chief gardener.",
            },
            {
              type: 'paragraph',
              text: "There is a strategy for pruning. You can't go chop crazy and cut off too much too quickly. For one, we are dealing with human beings here and they need to be willing to allow an assistant gardener to come close with the clippers. Secondly, as someone who is pruning with Jesus you better be sure that this is what the Master gardener envisions.",
            },
            {
              type: 'keyDefinition',
              text: 'Before you prune others, be pruned.',
            },
            {
              type: 'checklist',
              items: [
                "You can't lead people where you haven't gone yourself",
                'The pruning you resist in your own life will become the thing you avoid in your disciples',
                'Jesus was tempted in every way, yet without sin—He knows what He\'s asking of us',
              ],
            },
            {
              type: 'discussion',
              text: "What area of your life still needs pruning before you're ready to lead others?",
            },
          ],
        },
        {
          id: 2,
          title: 'Are You Ready to Lead?',
          duration: '5 min read',
          content: [
            {
              type: 'paragraph',
              text: "Jesus said 'count the cost' before building a tower (Luke 14:28). Before you jump out and start discipling others, you need to be honest with yourself. This isn't about perfection—it's about preparation.",
            },
            {
              type: 'paragraph',
              text: 'We have carefully created a few assessments leading up to your DNA launch along with spiritual health check-ins throughout your disciple making journey. The first is called the Personal Flow Assessment (some of you have already taken this before going through this manual). The Flow Assessment addresses 7 roadblocks that could hold back the river of God from flowing properly in your life.',
            },
            {
              type: 'paragraph',
              text: 'The next is the DNA Readiness Quiz. This assessment includes a variety of questions in 4 categories:',
            },
            {
              type: 'numbered',
              items: [
                'Spiritual Maturity - Do you have a consistent devotional life?',
                'Life Stability - Is your life stable enough to commit for 12 months?',
                'Leadership Readiness - Do you naturally initiate spiritual conversations?',
                'DNA Competencies - Do you know the 3 phases of DNA?',
              ],
            },
            {
              type: 'paragraph',
              text: "If you're not ready yet, that's okay. Being honest about it now saves you and your disciples from pain later. Keep growing. Your time will come.",
            },
          ],
        },
        {
          id: 3,
          title: 'The Cost of Multiplication',
          duration: '5 min read',
          content: [
            {
              type: 'paragraph',
              text: "Discipleship is costly. Jesus didn't hide that from His followers, and neither should we. Before you say yes, you need to know what you're signing up for.",
            },
            {
              type: 'header',
              title: 'What DNA will cost you:',
            },
            {
              type: 'paragraph',
              text: "Time - 5-7 hours per week (meetings, prep, follow-up, spontaneous texts/calls). DNA doesn't break for holidays—it's year-round. You'll sacrifice other good things to prioritize this great thing.",
            },
            {
              type: 'paragraph',
              text: "Emotional Energy - You will be disappointed by people you invest in. You will have hard conversations that drain you. You will lose sleep praying for your disciples.",
            },
            {
              type: 'paragraph',
              text: 'Reputation - People will judge your disciples\' failures as YOUR failures. You\'ll be misunderstood when you have to correct someone. Some will call you "controlling" when you\'re just being faithful.',
            },
            {
              type: 'paragraph',
              text: "Control - You can't control outcomes—only faithfulness. Disciples will make decisions you disagree with. Multiplication means releasing control and trusting God.",
            },
            {
              type: 'keyDefinition',
              text: "The Reward: Seeing someone step into their calling because you invested in them? There's no greater joy. Every cost is worth it when you see Jesus multiplied in others.",
            },
            {
              type: 'discussion',
              text: 'What part of the cost scares you most? Why?',
            },
          ],
        },
        {
          id: 4,
          title: 'Your Next Step: The DNA Launch Guide',
          duration: '4 min read',
          content: [
            {
              type: 'paragraph',
              text: "You've completed the heart training. Now it's time for launch training. The DNA Launch Guide will walk you step-by-step from 'I want to make disciples' to 'I'm actively discipling someone.'",
            },
            {
              type: 'header',
              title: "What's in the Launch Guide?",
            },
            {
              type: 'paragraph',
              text: 'Phase 0: Pre-Launch (6 weeks) - Self-assessment, finding a co-leader, setting up rhythms, prayer strategy, the coffee conversation, the direct ask, setting expectations.',
            },
            {
              type: 'paragraph',
              text: 'Phase 1: Foundation (Months 1-3) - Building trust, life assessment, introducing DNA tools, addressing strongholds.',
            },
            {
              type: 'paragraph',
              text: 'Phase 2: Growth (Months 4-6) - Empowering disciples to lead, giving them "reps," processing failures, increasing ownership.',
            },
            {
              type: 'paragraph',
              text: 'Phase 3: Multiplication (Months 7-12) - Recognizing readiness, helping them find their first disciples, the multiplication conversation, releasing them to launch.',
            },
            {
              type: 'paragraph',
              text: "You'll also get the 90-Day Toolkit—a week-by-week plan for your first 12 meetings using the DNA tools (3D Journal, 4D Prayer, Creed Cards, Listening Prayer, etc.).",
            },
          ],
        },
        {
          id: 5,
          title: 'Commission',
          duration: '3 min read',
          content: [
            {
              type: 'paragraph',
              text: "Six sessions ago, you started with a question: What is discipleship? Now you know. It's a deliberate apprenticeship that results in fully formed, living copies of the Master.",
            },
            {
              type: 'keyDefinition',
              text: 'The Question Now Is: Will you do it?',
            },
            {
              type: 'paragraph',
              text: 'Not "Am I qualified?" (You\'re not, but neither were the 12). Not "Do I have everything figured out?" (You don\'t, and you never will). Not "What if I fail?" (You will, and that\'s part of the process).',
            },
            {
              type: 'paragraph',
              text: 'The Only Question That Matters: Will I obey Jesus and make disciples?',
            },
            {
              type: 'header',
              title: 'If the answer is yes, here\'s what happens:',
            },
            {
              type: 'paragraph',
              text: '2 becomes 4 → You and your co-leader disciple 2 people.',
            },
            {
              type: 'paragraph',
              text: '4 becomes 16 → Those 2 each start their own DNA groups.',
            },
            {
              type: 'paragraph',
              text: '16 becomes 256 → And the multiplication continues.',
            },
            {
              type: 'paragraph',
              text: '256 becomes 65,536 → In just 8 generations, you\'ve reached a city.',
            },
            {
              type: 'keyDefinition',
              text: 'This is the exponential math of the Kingdom. And it starts with you saying yes.',
            },
            {
              type: 'header',
              title: 'Closing Prayer',
            },
            {
              type: 'paragraph',
              text: 'Father, I thank You for calling me into this. Even though I may not be qualified, You are faithful. Even though I may make some mistakes, You cause the growth. I know this will cost me, but Jesus, You are worthy.',
            },
            {
              type: 'paragraph',
              text: 'Give me the courage to launch. Give me the patience to endure. Give me the love that never fails. Help me become a faithful disciple-maker who multiplies Your Kingdom.',
            },
            {
              type: 'paragraph',
              text: 'I surrender this journey to You. Not my will, but Yours. In Jesus\' name, Amen.',
            },
          ],
        },
      ],
    },
  ],
};

// Helper functions
export function getSession(sessionId: number): Session | undefined {
  return dnaManualData.sessions.find((s) => s.id === sessionId);
}

export function getLesson(
  sessionId: number,
  lessonId: number
): Lesson | undefined {
  const session = getSession(sessionId);
  return session?.lessons.find((l) => l.id === lessonId);
}

export function getTotalLessons(): number {
  return dnaManualData.sessions.reduce(
    (acc, session) => acc + session.lessons.length,
    0
  );
}

export function getSessionCount(): number {
  return dnaManualData.sessions.length;
}
