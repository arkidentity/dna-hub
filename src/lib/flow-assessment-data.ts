/**
 * DNA Flow Assessment Data
 *
 * 7 Roadblocks (Internal obstacles to discipleship multiplication)
 * Identifies blockages that prevent the flow of discipleship multiplication
 */

export interface Roadblock {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  manifestations: string[];
  rootCauses: string[];
  blocksTheFlow: string[];
  scripture: {
    text: string;
    reference: string;
  };
  reflectionQuestions: string[];
  actionSteps: string[];
  accountabilityQuestion: string;
}

export const roadblocks: Roadblock[] = [
  {
    id: 'fear_of_failure',
    title: 'Fear of Failure',
    shortTitle: 'Failure',
    description: 'The anxiety that you won\'t be good enough or that your group will fall apart, leading to avoidance of starting or continuing.',
    manifestations: [
      'Perfectionism that prevents you from starting',
      'Excessive preparation to delay launching',
      'Catastrophic thinking about worst-case scenarios',
      'Comparing yourself unfavorably to others'
    ],
    rootCauses: [
      'Past experiences of failure or criticism',
      'Performance-based identity rather than grace-based identity',
      'Unrealistic expectations of yourself',
      'Pride masked as humility ("I\'m not ready yet")'
    ],
    blocksTheFlow: [
      'Never starting because conditions aren\'t "perfect"',
      'Quitting at the first sign of difficulty',
      'Holding back from vulnerability with disciples',
      'Avoiding multiplication because "they\'re not ready" (really: you\'re afraid)'
    ],
    scripture: {
      text: 'For God has not given us a spirit of fear, but of power and of love and of a sound mind.',
      reference: '2 Timothy 1:7 (NKJV)'
    },
    reflectionQuestions: [
      'When have you let fear of failure stop you from obeying God?',
      'What specific worst-case scenario plays in your mind when you think about leading a DNA group?',
      'How might God be inviting you to trust Him more than your own competence?',
      'What would it look like to take one small step of faith this week?'
    ],
    actionSteps: [
      'Write down your worst fear about DNA groups, then pray: "Jesus, even if this happens, You are enough."',
      'Identify one "imperfect action" you can take this week (text a potential co-leader, invite one person to coffee).',
      'Share your fear with a trusted friend and ask them to pray with you.',
      'Memorize 2 Timothy 1:7 and speak it aloud when fear arises.',
      'Read the story of Gideon (Judges 6-7) and journal about how God uses weak vessels.'
    ],
    accountabilityQuestion: 'Did you take one imperfect action toward launching a DNA group this week?'
  },
  {
    id: 'fear_of_conflict',
    title: 'Fear of Conflict',
    shortTitle: 'Conflict',
    description: 'The discomfort with tension or difficult conversations, leading to avoidance of correction and accountability.',
    manifestations: [
      'People-pleasing and saying yes when you mean no',
      'Avoiding hard conversations about sin or commitment',
      'Tolerating bad behavior to keep the peace',
      'Passive-aggressive communication instead of direct honesty'
    ],
    rootCauses: [
      'Growing up in a home where conflict was toxic or absent',
      'Believing that "nice" means never confronting',
      'Fear of rejection or being disliked',
      'Misunderstanding love as avoiding all discomfort'
    ],
    blocksTheFlow: [
      'Disciples never grow because you won\'t lovingly correct them',
      'Toxic people dominate the group because you won\'t set boundaries',
      'You burn out from resentment built up over unspoken issues',
      'Disciples don\'t learn to navigate conflict in their own relationships'
    ],
    scripture: {
      text: 'Speaking the truth in love, we will grow to become in every respect the mature body of him who is the head, that is, Christ.',
      reference: 'Ephesians 4:15 (NIV)'
    },
    reflectionQuestions: [
      'What messages did you receive growing up about conflict? Were they healthy?',
      'When was the last time you had a hard conversation that deepened a relationship?',
      'Who in your life right now needs truth spoken in love, but you\'ve been avoiding it?',
      'How might avoiding conflict actually be unloving?'
    ],
    actionSteps: [
      'Practice saying "No" to one small request this week, even if it feels uncomfortable.',
      'Write out a hard conversation you need to have, using "I feel..." statements.',
      'Ask a trusted mentor: "How do you know when to confront and when to let something go?"',
      'Read Matthew 18:15-20 and pray for courage to follow Jesus\' model of conflict resolution.',
      'Role-play a difficult conversation with your spouse or a friend.'
    ],
    accountabilityQuestion: 'Did you have one honest conversation this week that required courage?'
  },
  {
    id: 'fear_of_discomfort',
    title: 'Fear of Discomfort',
    shortTitle: 'Discomfort',
    description: 'The resistance to inconvenience, schedule disruption, or emotional intensity that discipleship requires.',
    manifestations: [
      'Overpacked schedule with no margin for people',
      'Viewing DNA groups as another obligation rather than joy',
      'Burnout from saying yes to everything',
      'Preferring programs over messy relationships'
    ],
    rootCauses: [
      'Comfort-seeking as a primary value',
      'Busy-ness as a badge of honor or identity',
      'Consumer mindset toward church ("What do I get?")',
      'Lack of rest and Sabbath, leading to depletion'
    ],
    blocksTheFlow: [
      'No time or energy for the slow work of discipleship',
      'Quitting when it gets hard or inconvenient',
      'Disciples feel like a burden instead of a blessing',
      'Multiplication never happens because you\'re too tired'
    ],
    scripture: {
      text: 'Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls. For my yoke is easy and my burden is light.',
      reference: 'Matthew 11:28-30 (NIV)'
    },
    reflectionQuestions: [
      'What would you need to say "no" to in order to say "yes" to a DNA group?',
      'When has discomfort led to the most growth in your life?',
      'What does "rest" mean to you? Is it the same as comfort?',
      'How might Jesus be inviting you to a lighter load through DNA, not a heavier one?'
    ],
    actionSteps: [
      'Audit your calendar: What one commitment can you remove to create margin for discipleship?',
      'Practice saying this phrase: "I\'m not available for that, but I am available for..."',
      'Schedule a Sabbath day this week and protect it fiercely.',
      'Read "The Ruthless Elimination of Hurry" by John Mark Comer (or watch his sermon series).',
      'Ask God: "What am I holding onto that You\'re asking me to release?"'
    ],
    accountabilityQuestion: 'Did you protect margin in your schedule this week for the things that matter most?'
  },
  {
    id: 'fear_of_rejection',
    title: 'Fear of Rejection',
    shortTitle: 'Rejection',
    description: 'The deep insecurity that if people truly knew you, they would walk away, leading to self-protection and surface-level relationships.',
    manifestations: [
      'Performing or wearing a mask in relationships',
      'Oversharing to test if people will stay (or undersharing to avoid risk)',
      'Taking all feedback as personal attack',
      'Fear of inviting people because they might say no'
    ],
    rootCauses: [
      'Past wounds of abandonment or betrayal',
      'Shame about your past or present struggles',
      'Believing your worth depends on others\' approval',
      'Not experiencing the unconditional love of the Father'
    ],
    blocksTheFlow: [
      'Disciples can\'t go deeper than you\'re willing to go yourself',
      'You won\'t multiply because you can\'t bear the thought of them leaving',
      'Invitations never happen because you\'re afraid of "no"',
      'You attract other performers instead of authentic disciples'
    ],
    scripture: {
      text: 'There is no fear in love. But perfect love drives out fear, because fear has to do with punishment. The one who fears is not made perfect in love.',
      reference: '1 John 4:18 (NIV)'
    },
    reflectionQuestions: [
      'What parts of your story do you hide from others? Why?',
      'When have you felt most loved and accepted just as you are?',
      'How does Jesus look at you in your worst moments?',
      'What would change if you truly believed you are God\'s beloved, regardless of performance?'
    ],
    actionSteps: [
      'Share one thing you\'ve been hiding with a safe person this week.',
      'Write a list: "Things I believe about myself" vs. "Things God says about me in Scripture."',
      'Practice this prayer: "Jesus, help me receive Your love even when I feel unlovable."',
      'Read the story of the Prodigal Son (Luke 15:11-32) and journal as the younger son.',
      'Invite someone to coffee this week, even if they might say no.'
    ],
    accountabilityQuestion: 'Did you risk being known by someone this week, even if it felt scary?'
  },
  {
    id: 'fear_of_loss_of_control',
    title: 'Fear of Loss of Control',
    shortTitle: 'Control',
    description: 'The need to manage every outcome, leading to micromanagement and inability to release disciples.',
    manifestations: [
      'Perfectionism and criticism of others\' methods',
      'Difficulty delegating or empowering others',
      'Anxiety when things don\'t go according to your plan',
      'Controlling conversations or dominating group time'
    ],
    rootCauses: [
      'Belief that you are responsible for outcomes, not just obedience',
      'Trust issues with God or others',
      'Past experiences of chaos or instability',
      'Pride in your own competence'
    ],
    blocksTheFlow: [
      'Disciples never mature because you do everything for them',
      'Multiplication terrifies you because you can\'t control their groups',
      'You burn out from carrying weight Jesus never asked you to carry',
      'Co-leaders feel stifled instead of empowered'
    ],
    scripture: {
      text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
      reference: 'Proverbs 3:5-6 (NIV)'
    },
    reflectionQuestions: [
      'What are you afraid will happen if you release control?',
      'Where do you see evidence of control in your relationships?',
      'How is your need for control connected to your view of God?',
      'What would it look like to hold your DNA group with open hands?'
    ],
    actionSteps: [
      'Identify one area where you can delegate or empower someone else this week.',
      'Practice this phrase: "I trust God with the outcome."',
      'Read the story of Abraham and Isaac (Genesis 22) and journal about surrender.',
      'Ask your spouse or close friend: "Where do you see me trying to control things?"',
      'Give your co-leader permission to lead one part of the group meeting without your input.'
    ],
    accountabilityQuestion: 'Did you release control of something to God or to others this week?'
  },
  {
    id: 'fear_of_financial_hardship',
    title: 'Fear of Financial Hardship',
    shortTitle: 'Financial',
    description: 'The anxiety about money, provision, and resources, leading to scarcity mindset and hoarding.',
    manifestations: [
      'Viewing generosity as a threat to security',
      'Believing you don\'t have "enough" to lead a group',
      'Anxiety about hosting people in your home',
      'Reluctance to give time, money, or resources'
    ],
    rootCauses: [
      'Past experiences of poverty or lack',
      'Trusting in money more than in God\'s provision',
      'Comparison with others who "have more"',
      'Belief that God\'s blessing equals financial prosperity'
    ],
    blocksTheFlow: [
      'You won\'t open your home or share meals because it costs money',
      'Disciples learn stinginess instead of generosity',
      'Multiplication doesn\'t happen because you feel you need more resources first',
      'You miss God\'s provision because you\'re trying to control it'
    ],
    scripture: {
      text: 'And my God will meet all your needs according to the riches of his glory in Christ Jesus.',
      reference: 'Philippians 4:19 (NIV)'
    },
    reflectionQuestions: [
      'What financial fears keep you up at night?',
      'When has God provided for you in unexpected ways?',
      'How does your view of money reflect your view of God?',
      'What would change if you truly believed God owns it all and you\'re just a steward?'
    ],
    actionSteps: [
      'Give sacrificially to someone in need this week, even if it stretches you.',
      'Invite someone over for a simple meal (pizza, spaghetti—it doesn\'t have to be fancy).',
      'Read Matthew 6:25-34 and journal about worry vs. trust.',
      'Track your spending for one week and prayerfully ask: "Am I living with open or closed hands?"',
      'Practice this prayer: "God, You are my provider. I trust You with my finances."'
    ],
    accountabilityQuestion: 'Did you practice generosity this week in a way that required faith?'
  },
  {
    id: 'fear_of_change',
    title: 'Fear of Change',
    shortTitle: 'Change',
    description: 'The resistance to the unknown and preference for the familiar, leading to stagnation and comfort with the status quo.',
    manifestations: [
      'Clinging to "the way we\'ve always done it"',
      'Avoiding new experiences or stepping outside your comfort zone',
      'Anxiety about the unknown future',
      'Viewing change as loss rather than opportunity'
    ],
    rootCauses: [
      'Past experiences of painful transitions',
      'Need for predictability and safety',
      'Lack of trust in God\'s goodness during change',
      'Comfort with the familiar, even if it\'s not life-giving'
    ],
    blocksTheFlow: [
      'You won\'t start a DNA group because it\'s unfamiliar',
      'Multiplication terrifies you because it disrupts the status quo',
      'Disciples learn to play it safe instead of taking faith risks',
      'You miss what God is doing next because you\'re holding onto what was'
    ],
    scripture: {
      text: 'Forget the former things; do not dwell on the past. See, I am doing a new thing! Now it springs up; do you not perceive it? I am making a way in the wilderness and streams in the wasteland.',
      reference: 'Isaiah 43:18-19 (NIV)'
    },
    reflectionQuestions: [
      'What change are you resisting right now? Why?',
      'When has change led to unexpected blessing in your life?',
      'What "old wineskin" is God asking you to release?',
      'How might your fear of change be limiting what God wants to do through you?'
    ],
    actionSteps: [
      'Do one thing differently this week (take a new route, try a new restaurant, change your routine).',
      'Journal about a past transition: What did you learn? How did God show up?',
      'Read the story of Abraham leaving Ur (Genesis 12:1-9) and reflect on God\'s call to "go."',
      'Ask God: "What new thing are You inviting me into?"',
      'Share your fear of change with a trusted friend and ask them to pray for courage.'
    ],
    accountabilityQuestion: 'Did you step into something new this week, even if it felt uncomfortable?'
  }
];

export const assessmentIntro = {
  title: 'The Flow Assessment',
  subtitle: 'Identify Your Internal Roadblocks to Multiplication',
  description: 'This assessment helps you identify the internal obstacles that might be blocking the flow of discipleship in your life. We call them "roadblocks" because they dam up the river of God\'s work through you.',
  timeEstimate: '25-30 minutes',
  instructions: [
    'Find a quiet place where you can be honest with yourself and God.',
    'Rate each roadblock on a scale of 1-5 based on how much it impacts you.',
    'Answer the reflection questions thoughtfully—this is for you and God, not for show.',
    'You\'ll create an action plan for your top 2-3 roadblocks at the end.',
    'You can retake this assessment in 3 months to track your growth.'
  ],
  ratingScale: {
    1: 'Not an issue for me',
    2: 'Occasionally impacts me',
    3: 'Moderately impacts me',
    4: 'Frequently impacts me',
    5: 'Significantly blocks me'
  }
};

export const assessmentConclusion = {
  title: 'Your Action Plan',
  description: 'Based on your ratings, let\'s create a focused action plan for your top 2-3 roadblocks.',
  instructions: [
    'Review your top roadblocks (rated 3 or higher).',
    'Choose 1-2 action steps for each roadblock.',
    'Set a realistic deadline for each action.',
    'Identify an accountability partner who will check in with you.',
    'Schedule your first check-in date.'
  ],
  encouragement: 'Remember: God doesn\'t call the equipped—He equips the called. These roadblocks don\'t disqualify you; they\'re simply areas where God wants to grow you. Trust the process.'
};
