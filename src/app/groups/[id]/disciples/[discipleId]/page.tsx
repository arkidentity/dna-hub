'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { DiscipleshipLogEntry, DiscipleProfile, DNAGroupPhase } from '@/lib/types';

type LogFilter = 'all' | 'note' | 'prayer' | 'milestone';

// Streak motivational messages (mirrors DNA app)
function getStreakMessage(current: number, longest: number): string {
  if (current === 0) return 'No active streak yet';
  if (current === 1) return 'Just getting started!';
  if (current < 7) return 'Building momentum';
  if (current < 21) return 'Forming a habit!';
  if (current < 50) return 'This is becoming who they are';
  if (current < 100) return 'Incredible consistency';
  if (current >= longest && current > 0) return 'Longest streak ever!';
  return 'Faithful and growing';
}

// Month names for pathway display
const MONTH_NAMES = ['Building Habits', 'Going Deeper', 'Breakthrough'];
const WEEK_TITLES = [
  'Life Assessment', '3D Journal', '4D Prayer', 'Creed Cards',
  'Q&A Deep Dive', 'Listening Prayer', 'Outreach/Mission', 'Testimony Time',
  'Breaking Strongholds', 'Identity Shift', 'Spiritual Gifts', 'Life Assessment Revisited',
];

function DiscipleProfileContent() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const discipleId = params.discipleId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disciple, setDisciple] = useState<DiscipleProfile | null>(null);

  // Log filter
  const [logFilter, setLogFilter] = useState<LogFilter>('all');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'note' | 'prayer'>('note');
  const [modalContent, setModalContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Answer prayer modal
  const [answeringEntry, setAnsweringEntry] = useState<DiscipleshipLogEntry | null>(null);
  const [answerNotes, setAnswerNotes] = useState('');

  // Life Assessment expandable category state
  const [expandedLACategory, setExpandedLACategory] = useState<string | null>(null);

  // Time filter for app activity metrics
  const [metricsDays, setMetricsDays] = useState<number | null>(null);

  // Phase display helpers
  const phaseLabels: Record<string, string> = {
    'pre-launch': 'Pre-Launch',
    'invitation': 'Invitation',
    'foundation': 'Foundation',
    'growth': 'Growth',
    'multiplication': 'Multiplication',
  };

  const phaseColors: Record<string, string> = {
    'pre-launch': 'bg-gray-100 text-gray-700',
    'invitation': 'bg-blue-100 text-blue-700',
    'foundation': 'bg-yellow-100 text-yellow-700',
    'growth': 'bg-green-100 text-green-700',
    'multiplication': 'bg-purple-100 text-purple-700',
  };

  useEffect(() => {
    fetchProfile();
  }, [groupId, discipleId, metricsDays]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchProfile() {
    try {
      const daysQuery = metricsDays ? `?days=${metricsDays}` : '';
      const response = await fetch(`/api/groups/${groupId}/disciples/${discipleId}${daysQuery}`);

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok || data.error) {
        setError(data.error || 'Failed to load disciple profile');
        setLoading(false);
        return;
      }

      setDisciple(data.disciple);
      setLoading(false);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Failed to load disciple profile');
      setLoading(false);
    }
  }

  function openAddModal(type: 'note' | 'prayer') {
    setModalType(type);
    setModalContent('');
    setSubmitError(null);
    setShowAddModal(true);
  }

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!modalContent.trim()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/groups/${groupId}/disciples/${discipleId}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_type: modalType,
          content: modalContent.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        setSubmitError(data.error || 'Failed to add entry');
        setSubmitting(false);
        return;
      }

      if (disciple) {
        setDisciple({
          ...disciple,
          log_entries: [data.entry, ...disciple.log_entries],
        });
      }

      setShowAddModal(false);
      setModalContent('');
      setSubmitting(false);
    } catch (err) {
      console.error('Add entry error:', err);
      setSubmitError('Failed to add entry. Please try again.');
      setSubmitting(false);
    }
  }

  async function handleMarkAnswered(entry: DiscipleshipLogEntry) {
    try {
      const response = await fetch(`/api/groups/${groupId}/disciples/${discipleId}/log/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_answered: true,
          answer_notes: answerNotes.trim() || null,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) return;

      if (disciple) {
        setDisciple({
          ...disciple,
          log_entries: disciple.log_entries.map(e =>
            e.id === entry.id ? data.entry : e
          ),
        });
      }

      setAnsweringEntry(null);
      setAnswerNotes('');
    } catch (err) {
      console.error('Mark answered error:', err);
    }
  }

  async function handleDeleteEntry(entryId: string) {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const response = await fetch(`/api/groups/${groupId}/disciples/${discipleId}/log/${entryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) return;

      if (disciple) {
        setDisciple({
          ...disciple,
          log_entries: disciple.log_entries.filter(e => e.id !== entryId),
        });
      }
    } catch (err) {
      console.error('Delete entry error:', err);
    }
  }

  // Filter log entries
  const filteredEntries = disciple?.log_entries.filter(entry => {
    if (logFilter === 'all') return true;
    return entry.entry_type === logFilter;
  }) || [];

  // Life assessment data
  const lifeAssessments = disciple?.app_activity?.life_assessments;
  const week1Assessment = lifeAssessments?.week1 ?? null;
  const week12Assessment = lifeAssessments?.week12 ?? null;
  const hasLifeAssessment = !!(week1Assessment || week12Assessment);

  // Category display config with questions (matches assessmentData.ts, excludes reflection)
  type LAQuestion = { id: number; text: string; type: 'likert' | 'mc' | 'open' | 'checkbox'; choices?: string[]; followUpPrompt?: string };
  type LACategory = { id: string; label: string; questions: LAQuestion[] };
  const LIFE_ASSESSMENT_CATEGORIES: LACategory[] = [
    { id: 'relationship_with_god', label: 'Relationship with God', questions: [
      { id: 1, text: 'How would you describe your current relationship with God?', type: 'mc', choices: ['Distant and struggling','Inconsistent—hot and cold','Growing but still immature','Steady and deepening','Intimate and thriving'] },
      { id: 2, text: 'Rate your devotional consistency (prayer, Bible, journal)', type: 'likert' },
      { id: 3, text: "When you pray, do you sense God's presence and hear His voice?", type: 'likert', followUpPrompt: 'Explain:' },
      { id: 4, text: 'Can you clearly articulate the gospel?', type: 'mc', choices: ['Yes','Somewhat','No'], followUpPrompt: 'If yes, write it in 2-3 sentences:' },
      { id: 5, text: 'Do you believe God likes you, or just loves you out of obligation?', type: 'mc', choices: ['Likes me','Just loves me','Not sure'], followUpPrompt: 'Why?' },
      { id: 6, text: "Rate your confidence in God's goodness when life is hard", type: 'likert' },
    ]},
    { id: 'spiritual_freedom', label: 'Spiritual Freedom', questions: [
      { id: 7, text: 'Are you currently walking in freedom from lifestyle sin?', type: 'mc', choices: ['Yes','Mostly','Struggling','No'] },
      { id: 8, text: "Is there any area of ongoing sin you're aware of but haven't addressed?", type: 'mc', choices: ['Yes','No'], followUpPrompt: 'If yes, what:' },
      { id: 9, text: 'Do you struggle with any of the following?', type: 'checkbox', choices: ['Pornography or sexual sin','Substance abuse','Anger or rage','Fear or anxiety','Pride or control','Gossip or slander','Lying or deception','Bitterness or unforgiveness','Other'] },
      { id: 10, text: 'Do you feel free in Christ, or trapped by guilt and shame?', type: 'mc', choices: ['Free','Mostly free','Trapped','Somewhere in between'] },
      { id: 11, text: 'When you sin, how do you typically respond?', type: 'mc', choices: ['Hide and avoid dealing with it','Feel shame and beat myself up','Minimize it','Confess to God but not people','Confess quickly to God and trusted people'] },
      { id: 12, text: 'Rate your ability to receive correction without becoming defensive', type: 'likert' },
    ]},
    { id: 'identity_emotions', label: 'Identity & Emotions', questions: [
      { id: 13, text: "When you think about yourself, what's the first word that comes to mind?", type: 'open' },
      { id: 14, text: 'Do you see yourself the way God sees you?', type: 'likert' },
      { id: 15, text: "What's your biggest insecurity?", type: 'open' },
      { id: 16, text: 'How do you respond to failure or mistakes?', type: 'mc', choices: ['Catastrophize','Get defensive or blame others','Feel bad but move on','Process with trusted people','Learn from it and grow'] },
      { id: 17, text: 'Rate your ability to manage strong emotions (anger, fear, sadness)', type: 'likert' },
    ]},
    { id: 'relationships', label: 'Relationships', questions: [
      { id: 18, text: 'Do you have 2-3 close, healthy, life-giving friendships?', type: 'mc', choices: ['Yes','1-2','No'] },
      { id: 19, text: 'Are there any broken or unresolved relationships you need to address?', type: 'mc', choices: ['Yes','No'], followUpPrompt: 'If yes, with whom:' },
      { id: 20, text: 'How do you typically handle conflict?', type: 'mc', choices: ['Avoid it','Get defensive or aggressive','Shut down emotionally','Address it but struggle','Address it well with grace and truth'] },
      { id: 21, text: 'Have you ever discipled someone or led someone to Christ?', type: 'mc', choices: ['Yes','No'] },
      { id: 22, text: 'Who knows the real you—struggles and all?', type: 'open' },
    ]},
    { id: 'calling_purpose', label: 'Calling & Purpose', questions: [
      { id: 23, text: 'Do you have a sense of what God has called you to?', type: 'mc', choices: ['Yes, clear','Somewhat','No idea'], followUpPrompt: 'If yes, what:' },
      { id: 24, text: 'What breaks your heart or makes you angry in the world?', type: 'open' },
      { id: 25, text: "If you could do anything for God's Kingdom without limitation, what would it be?", type: 'open' },
      { id: 26, text: 'Rate your current sense of purpose and direction in life', type: 'likert' },
    ]},
    { id: 'lifestyle_stewardship', label: 'Lifestyle & Stewardship', questions: [
      { id: 27, text: 'Rate the stability of your financial situation', type: 'likert' },
      { id: 28, text: 'Do you have healthy boundaries with your time and energy?', type: 'likert' },
      { id: 29, text: 'Rate the health of your physical body (sleep, exercise, diet)', type: 'likert' },
      { id: 30, text: 'Rate your work/life balance', type: 'likert' },
    ]},
    { id: 'spiritual_fruit', label: 'Spiritual Fruit', questions: [
      { id: 31, text: 'LOVE — Sacrificial care for others', type: 'likert' },
      { id: 32, text: 'JOY — Deep contentment regardless of circumstances', type: 'likert' },
      { id: 33, text: 'PEACE — Inner rest and trust in God', type: 'likert' },
      { id: 34, text: 'PATIENCE — Slow to anger, extending grace', type: 'likert' },
      { id: 35, text: 'KINDNESS — Actively seeking others\' good', type: 'likert' },
      { id: 36, text: 'GOODNESS — Moral integrity and generosity', type: 'likert' },
      { id: 37, text: 'FAITHFULNESS — Reliable and consistent follow-through', type: 'likert' },
      { id: 38, text: 'GENTLENESS — Strength under control', type: 'likert' },
      { id: 39, text: 'SELF-CONTROL — Mastery over impulses and appetites', type: 'likert' },
    ]},
  ];

  // Format a raw answer value for display
  // Note: jsonb values from Supabase may have numeric indices stored as numbers or strings
  const formatLAAnswer = (q: LAQuestion, val: unknown): string => {
    if (val === null || val === undefined || val === '') return '—';
    if (q.type === 'likert') return `${val}/5`;
    if (q.type === 'mc' && q.choices) {
      // Scored mc: answer is a 1-based index (may come back as number or numeric string)
      const numVal = typeof val === 'number' ? val : typeof val === 'string' && !isNaN(Number(val)) ? Number(val) : null;
      if (numVal !== null) return q.choices[numVal - 1] ?? String(val);
      return String(val);
    }
    if (q.type === 'checkbox' && Array.isArray(val)) return val.join(', ') || '—';
    return String(val);
  };

  // Reflection question text (matches assessmentData.ts Q40-Q42)
  const REFLECTION_QUESTIONS: Record<number, string> = {
    40: "What's the biggest area of growth you need in the next 3 months?",
    41: "If you're honest, what are you afraid of?",
    42: "Why did you say yes to DNA discipleship?",
  };

  // Extract app data with safe defaults
  const appConnected = disciple?.app_activity?.connected ?? false;
  const progress = disciple?.app_activity?.progress;
  const toolkit = disciple?.app_activity?.toolkit;
  const filtered = disciple?.app_activity?.filtered_metrics;
  const creed = disciple?.app_activity?.creed_progress;
  const testimonies = disciple?.app_activity?.testimonies;
  const checkpointCompletions = disciple?.app_activity?.checkpoint_completions || [];

  const currentStreak = progress?.current_streak ?? 0;
  const longestStreak = progress?.longest_streak ?? 0;
  const journalEntries = filtered ? filtered.journal_entries : (progress?.total_journal_entries ?? 0);
  const prayerSessions = filtered ? filtered.prayer_sessions : (progress?.total_prayer_sessions ?? 0);
  const prayerCards = filtered ? filtered.prayer_cards : (progress?.total_prayer_cards ?? 0);
  const creedMastered = creed?.total_cards_mastered ?? 0;
  const totalTestimonies = testimonies?.length ?? 0;

  // Toolkit/Pathway data
  const currentWeek = toolkit?.current_week ?? 0;
  const currentMonth = toolkit?.current_month ?? 1;
  const toolkitStarted = toolkit?.started_at != null;
  const pathwayPercent = toolkitStarted ? Math.round((currentWeek / 12) * 100) : 0;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
          <p className="mt-4 text-navy">Loading disciple profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !disciple) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Disciple not found'}</p>
          <Link
            href={`/groups/${groupId}`}
            className="inline-block bg-gold hover:bg-gold-dark text-white font-semibold py-3 px-6 rounded-lg"
          >
            Back to Group
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ============================================================ */}
      {/* HEADER - Name, Status, Email, Date Joined, Group, Phase      */}
      {/* ============================================================ */}
      <header className="bg-navy text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start gap-4">
            <Link
              href={`/groups/${groupId}`}
              className="text-white/70 hover:text-white transition-colors mt-1"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold text-lg font-bold">{disciple.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-white truncate">{disciple.name}</h1>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      disciple.current_status === 'active'
                        ? 'bg-green-500/20 text-green-300'
                        : disciple.current_status === 'completed'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {disciple.current_status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-white/60 flex-wrap">
                    <span className="truncate">{disciple.email}</span>
                    <span className="hidden sm:inline">&bull;</span>
                    <span>Joined {new Date(disciple.joined_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
              {/* Group & Phase badge row */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-white/50 text-sm">{disciple.group.group_name}</span>
                <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium ${phaseColors[disciple.group.current_phase] || 'bg-gray-100 text-gray-700'}`}>
                  {phaseLabels[disciple.group.current_phase] || disciple.group.current_phase}
                </span>
                {/* Assessment badges */}
                <div className="flex items-center gap-1 ml-auto">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    disciple.week1_assessment_status === 'completed'
                      ? 'bg-green-500/20 text-green-300'
                      : disciple.week1_assessment_status === 'sent'
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : 'bg-white/10 text-white/40'
                  }`}>
                    W1 {disciple.week1_assessment_status === 'completed' ? '✓' : disciple.week1_assessment_status === 'sent' ? 'Sent' : '—'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    disciple.week12_assessment_status === 'completed'
                      ? 'bg-green-500/20 text-green-300'
                      : disciple.week12_assessment_status === 'sent'
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : 'bg-white/10 text-white/40'
                  }`}>
                    W12 {disciple.week12_assessment_status === 'completed' ? '✓' : disciple.week12_assessment_status === 'sent' ? 'Sent' : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ============================================================ */}
        {/* DAILY DNA ACTIVITY - Streak Hero + Growth Area Cards          */}
        {/* ============================================================ */}
        <div className="bg-white rounded-xl shadow-sm border border-card-border overflow-hidden">
          {/* Section header with time filter */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ${appConnected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <h2 className="text-lg font-bold text-navy">Daily DNA Activity</h2>
              {!appConnected && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Not connected</span>
              )}
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              {[
                { label: '7d', value: 7 },
                { label: '30d', value: 30 },
                { label: '90d', value: 90 },
                { label: 'All', value: null },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setMetricsDays(opt.value)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    metricsDays === opt.value
                      ? 'bg-white text-navy shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Streak Hero Card */}
          <div className="mx-6 mb-4 rounded-xl overflow-hidden" style={{
            background: 'linear-gradient(135deg, #D4A853 0%, #d4a454 50%, #B8923F 100%)',
          }}>
            <div className="px-6 py-5 flex items-center gap-5">
              {/* Streak icon — lightning bolt */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                  <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-navy">{currentStreak}</span>
                  <span className="text-navy/70 font-medium text-sm">day streak</span>
                </div>
                <p className="text-navy/60 text-sm mt-0.5">{getStreakMessage(currentStreak, longestStreak)}</p>
              </div>
              {longestStreak > 0 && (
                <div className="text-right flex-shrink-0">
                  <p className="text-navy/50 text-xs">Best</p>
                  <p className="text-navy font-bold text-lg">{longestStreak}</p>
                </div>
              )}
            </div>
          </div>

          {/* Growth Areas Grid */}
          <div className="px-6 pb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Growth Areas</h3>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 px-6 pb-5">
            {/* Journal Entries */}
            <div className="rounded-lg p-3 text-center transition-all hover:-translate-y-0.5" style={{ background: 'rgba(45, 106, 106, 0.08)' }}>
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-md flex items-center justify-center" style={{ background: 'rgba(45, 106, 106, 0.15)' }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--teal)' }}>
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <p className="text-xl font-bold leading-none" style={{ color: 'var(--teal)' }}>{journalEntries}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Journal</p>
            </div>

            {/* Prayer Sessions */}
            <div className="rounded-lg p-3 text-center transition-all hover:-translate-y-0.5" style={{ background: 'rgba(95, 12, 11, 0.06)' }}>
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-md flex items-center justify-center" style={{ background: 'rgba(95, 12, 11, 0.12)' }}>
                <svg className="w-4 h-4 text-[#5f0c0b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4.318 6.318a4.5 4.5 0 0 0 0 6.364L12 20.364l7.682-7.682a4.5 4.5 0 0 0-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 0 0-6.364 0z" />
                </svg>
              </div>
              <p className="text-xl font-bold leading-none text-[#5f0c0b]">{prayerSessions}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Prayer</p>
            </div>

            {/* Prayer Cards */}
            <div className="rounded-lg p-3 text-center transition-all hover:-translate-y-0.5" style={{ background: 'rgba(95, 12, 11, 0.04)' }}>
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-md flex items-center justify-center" style={{ background: 'rgba(95, 12, 11, 0.08)' }}>
                <svg className="w-4 h-4 text-[#8b2020]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 10h18" />
                </svg>
              </div>
              <p className="text-xl font-bold leading-none text-[#8b2020]">{prayerCards}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Prayer Cards</p>
            </div>

            {/* Creed Cards */}
            <div className="rounded-lg p-3 text-center transition-all hover:-translate-y-0.5" style={{ background: 'rgba(212, 168, 83, 0.08)' }}>
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-md flex items-center justify-center" style={{ background: 'rgba(212, 168, 83, 0.15)' }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--gold)' }}>
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 10h18" />
                </svg>
              </div>
              <p className="text-xl font-bold leading-none" style={{ color: 'var(--gold-dark)' }}>
                {creedMastered}<span className="text-xs font-normal text-gray-400">/50</span>
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Creed</p>
            </div>

            {/* Testimonies */}
            <div className="rounded-lg p-3 text-center transition-all hover:-translate-y-0.5" style={{ background: 'rgba(74, 158, 127, 0.06)' }}>
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-md flex items-center justify-center" style={{ background: 'rgba(74, 158, 127, 0.12)' }}>
                <svg className="w-4 h-4 text-[#4A9E7F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <p className="text-xl font-bold leading-none text-[#4A9E7F]">{totalTestimonies}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Testimonies</p>
            </div>

            {/* Time Spent */}
            <div className="rounded-lg p-3 text-center transition-all hover:-translate-y-0.5" style={{ background: 'rgba(59, 130, 246, 0.06)' }}>
              <div className="w-7 h-7 mx-auto mb-1.5 rounded-md flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.12)' }}>
                <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <p className="text-xl font-bold leading-none text-blue-600">
                {progress ? `${Math.floor(progress.total_time_minutes / 60)}` : '0'}
                <span className="text-xs font-normal text-gray-400">h</span>
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Time</p>
            </div>
          </div>

          {/* Last active + app connection status footer */}
          <div className="px-6 pb-4 flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
            <span>
              {progress?.last_activity_date
                ? `Last active: ${new Date(progress.last_activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : 'No activity recorded yet'}
            </span>
            {appConnected && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                App Connected
              </span>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* PATHWAY - Phase / Toolkit Visual Progress                     */}
        {/* ============================================================ */}
        <div className="bg-white rounded-xl shadow-sm border border-card-border overflow-hidden">
          <div className="px-6 pt-5 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Pathway</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Phase 1 &middot; 90-Day Toolkit
                </p>
              </div>
              {toolkitStarted && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-gold-dark">{pathwayPercent}%</p>
                  <p className="text-xs text-gray-400">Complete</p>
                </div>
              )}
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>Week {currentWeek} of 12</span>
              <span>Month {currentMonth} of 3</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pathwayPercent}%`,
                  background: 'linear-gradient(90deg, var(--gold) 0%, var(--gold-dark) 100%)',
                }}
              ></div>
            </div>
          </div>

          {/* Month-by-month breakdown */}
          <div className="px-6 pb-5 space-y-3">
            {[1, 2, 3].map((month) => {
              const monthCompleted = month === 1
                ? toolkit?.month_1_completed_at != null
                : month === 2
                ? toolkit?.month_2_completed_at != null
                : toolkit?.month_3_completed_at != null;
              const monthActive = currentMonth === month && toolkitStarted;
              const weeksInMonth = [1, 2, 3, 4].map(w => w + (month - 1) * 4);
              const weeksBelowCurrent = weeksInMonth.filter(w => w <= currentWeek).length;

              return (
                <div
                  key={month}
                  className={`rounded-lg border transition-all ${
                    monthCompleted
                      ? 'border-green-200 bg-green-50/50'
                      : monthActive
                      ? 'border-gold/30 bg-gold/5'
                      : 'border-gray-100 bg-gray-50/50'
                  }`}
                >
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {monthCompleted ? (
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : monthActive ? (
                          <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                        )}
                        <span className={`text-sm font-semibold ${
                          monthCompleted ? 'text-green-700' : monthActive ? 'text-navy' : 'text-gray-400'
                        }`}>
                          Month {month}: {MONTH_NAMES[month - 1]}
                        </span>
                      </div>
                      {monthCompleted && (
                        <span className="text-xs text-green-600 font-medium">Complete</span>
                      )}
                      {monthActive && !monthCompleted && (
                        <span className="text-xs text-gold-dark font-medium">{weeksBelowCurrent}/4 weeks</span>
                      )}
                    </div>

                    {/* Week pills */}
                    <div className="flex gap-1.5 ml-7">
                      {weeksInMonth.map((weekNum) => {
                        const weekIdx = weekNum - 1;
                        const isComplete = weekNum < currentWeek || monthCompleted;
                        const isCurrent = weekNum === currentWeek && !monthCompleted;
                        // Check checkpoint completions for this week
                        const hasCheckpoints = checkpointCompletions.some(c => {
                          const cpId = c.checkpoint_id;
                          return cpId >= (weekNum - 1) * 3 && cpId < weekNum * 3;
                        });

                        return (
                          <div
                            key={weekNum}
                            className={`flex-1 group relative`}
                          >
                            <div className={`h-1.5 rounded-full transition-all ${
                              isComplete
                                ? 'bg-green-400'
                                : isCurrent
                                ? 'bg-gold'
                                : 'bg-gray-200'
                            }`}></div>
                            <p className={`text-[10px] mt-1 truncate ${
                              isComplete ? 'text-green-600' : isCurrent ? 'text-navy font-medium' : 'text-gray-300'
                            }`}>
                              W{weekNum}
                            </p>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                              <div className="bg-navy text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
                                {WEEK_TITLES[weekIdx] || `Week ${weekNum}`}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checkpoint count footer */}
          <div className="px-6 pb-4 flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
            <span>{checkpointCompletions.length} checkpoints completed</span>
            {toolkit?.started_at && (
              <span>Started {new Date(toolkit.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* LIFE ASSESSMENT                                               */}
        {/* ============================================================ */}
        {hasLifeAssessment && (
          <div className="bg-white rounded-xl shadow-sm border border-card-border overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-navy">Life Assessment</h2>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {week1Assessment?.submitted_at && (
                    <span>W1: {new Date(week1Assessment.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  )}
                  {week12Assessment?.submitted_at && (
                    <span>W12: {new Date(week12Assessment.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Score Summary — column headers */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-[1fr_80px_80px_56px] gap-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <span>Category</span>
                <span className="text-center">Week 1</span>
                <span className="text-center">Week 12</span>
                <span className="text-center">Change</span>
              </div>

              {/* Expandable category rows */}
              <div className="space-y-1">
                {LIFE_ASSESSMENT_CATEGORIES.map((cat) => {
                  const w1Score = week1Assessment?.category_scores?.[cat.id] ?? null;
                  const w12Score = week12Assessment?.category_scores?.[cat.id] ?? null;
                  const delta = w1Score !== null && w12Score !== null
                    ? Math.round((w12Score - w1Score) * 10) / 10
                    : null;
                  const isExpanded = expandedLACategory === cat.id;

                  return (
                    <div key={cat.id} className="rounded-lg overflow-hidden border border-transparent hover:border-gray-100 transition-colors">
                      {/* Row header — click to expand */}
                      <button
                        className="w-full grid grid-cols-[1fr_80px_80px_56px] gap-2 items-center py-2 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        onClick={() => setExpandedLACategory(isExpanded ? null : cat.id)}
                      >
                        <span className="flex items-center gap-1.5 text-sm text-navy font-medium">
                          <svg className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                          {cat.label}
                        </span>

                        {/* Week 1 score */}
                        <div className="flex flex-col items-center gap-1">
                          {w1Score !== null ? (
                            <>
                              <span className="text-xs font-semibold text-gray-700">{w1Score.toFixed(1)}<span className="text-gray-400 font-normal">/5</span></span>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-navy/40" style={{ width: `${(w1Score / 5) * 100}%` }} />
                              </div>
                            </>
                          ) : <span className="text-xs text-gray-300">—</span>}
                        </div>

                        {/* Week 12 score */}
                        <div className="flex flex-col items-center gap-1">
                          {w12Score !== null ? (
                            <>
                              <span className="text-xs font-semibold text-gray-700">{w12Score.toFixed(1)}<span className="text-gray-400 font-normal">/5</span></span>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${(w12Score / 5) * 100}%`, background: 'var(--gold)' }} />
                              </div>
                            </>
                          ) : <span className="text-xs text-gray-300">—</span>}
                        </div>

                        {/* Delta */}
                        <div className="flex justify-center">
                          {delta !== null ? (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${delta > 0 ? 'bg-green-100 text-green-700' : delta < 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                              {delta > 0 ? `+${delta}` : delta === 0 ? '—' : delta}
                            </span>
                          ) : <span className="text-xs text-gray-300">—</span>}
                        </div>
                      </button>

                      {/* Expanded Q&A panel */}
                      {isExpanded && (
                        <div className="mt-1 mb-2 ml-5 space-y-3 border-l-2 border-gray-100 pl-3">
                          {cat.questions.map((q) => {
                            // JSON object keys from Supabase jsonb are always strings — coerce id
                            const qKey = String(q.id);
                            const w1Raw = week1Assessment?.responses?.[qKey] ?? week1Assessment?.responses?.[q.id];
                            const w12Raw = week12Assessment?.responses?.[qKey] ?? week12Assessment?.responses?.[q.id];
                            const w1Ans = w1Raw !== undefined && w1Raw !== null ? formatLAAnswer(q, w1Raw) : null;
                            const w12Ans = w12Raw !== undefined && w12Raw !== null ? formatLAAnswer(q, w12Raw) : null;

                            // Follow-up text answers (e.g. "Explain:", "Why?", "If yes, what:")
                            const w1FollowUp = (week1Assessment?.follow_ups?.[qKey] ?? week1Assessment?.follow_ups?.[q.id]) as string | undefined;
                            const w12FollowUp = (week12Assessment?.follow_ups?.[qKey] ?? week12Assessment?.follow_ups?.[q.id]) as string | undefined;
                            const hasFollowUp = !!(w1FollowUp || w12FollowUp);

                            if (!w1Ans && !w12Ans && !hasFollowUp) return null;

                            return (
                              <div key={q.id}>
                                <p className="text-[11px] text-gray-500 mb-1 leading-snug">{q.text}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                                  {w1Ans && (
                                    <span className="text-sm text-navy">
                                      <span className="text-[10px] font-semibold text-navy/40 uppercase tracking-wider mr-1.5">W1</span>
                                      {w1Ans}
                                    </span>
                                  )}
                                  {w12Ans && (
                                    <span className="text-sm text-navy">
                                      <span className="text-[10px] font-semibold uppercase tracking-wider mr-1.5" style={{ color: 'var(--gold-dark)' }}>W12</span>
                                      {w12Ans}
                                    </span>
                                  )}
                                </div>
                                {/* Follow-up explanation text */}
                                {hasFollowUp && (
                                  <div className="mt-1.5 pl-1 border-l-2 border-gold/20 ml-0.5">
                                    {q.followUpPrompt && (
                                      <p className="text-[10px] text-gray-400 italic mb-0.5">{q.followUpPrompt}</p>
                                    )}
                                    {w1FollowUp && (
                                      <div className="mb-1">
                                        <span className="text-[10px] font-semibold text-navy/40 uppercase tracking-wider mr-1.5">W1</span>
                                        <span className="text-sm text-navy/80 italic">{w1FollowUp}</span>
                                      </div>
                                    )}
                                    {w12FollowUp && (
                                      <div>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider mr-1.5" style={{ color: 'var(--gold-dark)' }}>W12</span>
                                        <span className="text-sm text-navy/80 italic">{w12FollowUp}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Overall scores */}
              {(week1Assessment?.overall_score !== null || week12Assessment?.overall_score !== null) && (
                <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-[1fr_80px_80px_56px] gap-2 items-center">
                  <span className="text-sm font-bold text-navy pl-[18px]">Overall</span>
                  <span className="text-center text-sm font-bold text-navy">
                    {week1Assessment?.overall_score != null ? `${week1Assessment.overall_score.toFixed(1)}/5` : '—'}
                  </span>
                  <span className="text-center text-sm font-bold" style={{ color: 'var(--gold-dark)' }}>
                    {week12Assessment?.overall_score != null ? `${week12Assessment.overall_score.toFixed(1)}/5` : '—'}
                  </span>
                  <div className="flex justify-center">
                    {week1Assessment?.overall_score != null && week12Assessment?.overall_score != null ? (() => {
                      const d = Math.round((week12Assessment.overall_score - week1Assessment.overall_score) * 10) / 10;
                      return (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${d > 0 ? 'bg-green-100 text-green-700' : d < 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                          {d > 0 ? `+${d}` : d === 0 ? '—' : d}
                        </span>
                      );
                    })() : <span className="text-xs text-gray-300">—</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Reflection Answers */}
            {(week1Assessment || week12Assessment) && (
              <div className="px-6 pb-5 border-t border-gray-100">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-3">Reflection</h3>
                <div className="space-y-4">
                  {([40, 41, 42] as const).map((qId) => {
                    // jsonb keys from Supabase are strings — check both
                    const qKey = String(qId);
                    const w1Answer = (week1Assessment?.responses?.[qKey] ?? week1Assessment?.responses?.[qId]) as string | undefined;
                    const w12Answer = (week12Assessment?.responses?.[qKey] ?? week12Assessment?.responses?.[qId]) as string | undefined;
                    if (!w1Answer && !w12Answer) return null;

                    return (
                      <div key={qId}>
                        <p className="text-xs text-gray-500 mb-1.5">{REFLECTION_QUESTIONS[qId]}</p>
                        {w1Answer && (
                          <div className="mb-1.5">
                            <span className="text-[10px] font-semibold text-navy/40 uppercase tracking-wider mr-2">W1</span>
                            <span className="text-sm text-navy">{w1Answer}</span>
                          </div>
                        )}
                        {w12Answer && (
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider mr-2" style={{ color: 'var(--gold-dark)' }}>W12</span>
                            <span className="text-sm text-navy">{w12Answer}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* CREED CARDS & TESTIMONIES (Compact row)                      */}
        {/* ============================================================ */}
        {(creedMastered > 0 || totalTestimonies > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Creed Progress */}
            {creed && creedMastered > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-card-border p-5">
                <h3 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 10h18" />
                  </svg>
                  Creed Cards
                </h3>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-3xl font-bold text-gold-dark">{creedMastered}</p>
                    <p className="text-xs text-gray-400">mastered</p>
                  </div>
                  <div className="h-10 border-l border-gray-200"></div>
                  <div>
                    <p className="text-lg font-semibold text-navy">{creed.total_study_sessions}</p>
                    <p className="text-xs text-gray-400">study sessions</p>
                  </div>
                  {creed.last_studied_at && (
                    <>
                      <div className="h-10 border-l border-gray-200"></div>
                      <div>
                        <p className="text-sm font-medium text-navy">{new Date(creed.last_studied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        <p className="text-xs text-gray-400">last studied</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Testimonies */}
            {testimonies && totalTestimonies > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-card-border p-5">
                <h3 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#4A9E7F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Testimonies
                </h3>
                <div className="space-y-2">
                  {testimonies.map((t) => (
                    <div key={t.id} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === 'complete' ? 'bg-green-500' : 'bg-yellow-400'}`}></span>
                      <span className="text-sm text-navy truncate">{t.title}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {t.status === 'complete' ? 'Complete' : 'Draft'}
                        {t.testimony_type && ` · ${t.testimony_type.replace(/_/g, ' ')}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* QUICK ACTIONS                                                 */}
        {/* ============================================================ */}
        <div className="flex gap-3">
          <button
            onClick={() => openAddModal('note')}
            className="flex items-center gap-2 bg-gold hover:bg-gold-dark text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Add Note
          </button>
          <button
            onClick={() => openAddModal('prayer')}
            className="flex items-center gap-2 bg-teal hover:bg-teal-light text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Add Prayer Request
          </button>
        </div>

        {/* ============================================================ */}
        {/* DISCIPLESHIP LOG                                              */}
        {/* ============================================================ */}
        <div className="bg-white rounded-xl shadow-sm border border-card-border">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy">Discipleship Log</h2>
              <span className="text-sm text-gray-400">{filteredEntries.length} entries</span>
            </div>
            <div className="flex gap-2 mt-3">
              {(['all', 'note', 'prayer', 'milestone'] as LogFilter[]).map(filter => (
                <button
                  key={filter}
                  onClick={() => setLogFilter(filter)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    logFilter === filter
                      ? 'bg-navy text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter === 'note' ? 'Notes' : filter === 'prayer' ? 'Prayers' : 'Milestones'}
                </button>
              ))}
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">No entries yet</h3>
              <p className="text-gray-500 mb-4 max-w-sm mx-auto">
                Start documenting your discipleship journey with notes and prayer requests.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredEntries.map(entry => (
                <div key={entry.id} className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      entry.entry_type === 'note'
                        ? 'bg-blue-100'
                        : entry.entry_type === 'prayer'
                        ? 'bg-purple-100'
                        : 'bg-green-100'
                    }`}>
                      {entry.entry_type === 'note' ? (
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      ) : entry.entry_type === 'prayer' ? (
                        <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {entry.entry_type === 'prayer' ? 'Prayer Request' : entry.entry_type === 'note' ? 'Note' : 'Milestone'}
                        </span>
                        {entry.entry_type === 'prayer' && entry.is_answered && (
                          <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Answered
                          </span>
                        )}
                      </div>
                      <p className="text-navy whitespace-pre-wrap">{entry.content}</p>

                      {entry.entry_type === 'prayer' && entry.is_answered && entry.answer_notes && (
                        <div className="mt-2 pl-3 border-l-2 border-green-300">
                          <p className="text-sm text-green-700 italic">{entry.answer_notes}</p>
                          {entry.answered_at && (
                            <p className="text-xs text-green-600 mt-1">
                              Answered {new Date(entry.answered_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400">
                          {entry.created_by_name && `${entry.created_by_name} · `}
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>

                        {entry.entry_type === 'prayer' && !entry.is_answered && (
                          <button
                            onClick={() => { setAnsweringEntry(entry); setAnswerNotes(''); }}
                            className="text-xs text-teal hover:text-teal-light font-medium"
                          >
                            Mark Answered
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-xs text-gray-400 hover:text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ============================================================ */}
      {/* ADD NOTE/PRAYER MODAL                                         */}
      {/* ============================================================ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-navy">
                {modalType === 'note' ? 'Add Note' : 'Add Prayer Request'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {submitError && (
              <div className="bg-red-50 text-red-700 rounded-lg p-4 mb-4 text-sm">
                {submitError}
              </div>
            )}

            <form onSubmit={handleAddEntry}>
              <textarea
                value={modalContent}
                onChange={(e) => setModalContent(e.target.value)}
                rows={4}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold resize-none"
                placeholder={modalType === 'note'
                  ? 'Write your note about this disciple...'
                  : 'Write the prayer request...'
                }
              />

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !modalContent.trim()}
                  className={`font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white ${
                    modalType === 'note'
                      ? 'bg-gold hover:bg-gold-dark'
                      : 'bg-teal hover:bg-teal-light'
                  }`}
                >
                  {submitting ? 'Adding...' : modalType === 'note' ? 'Add Note' : 'Add Prayer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MARK PRAYER ANSWERED MODAL                                    */}
      {/* ============================================================ */}
      {answeringEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-navy">Mark Prayer Answered</h2>
              <button
                onClick={() => setAnsweringEntry(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-purple-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-purple-800">{answeringEntry.content}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1">
                How was this prayer answered? <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={answerNotes}
                onChange={(e) => setAnswerNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold resize-none"
                placeholder="Share how God answered this prayer..."
              />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setAnsweringEntry(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMarkAnswered(answeringEntry)}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Mark Answered
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
        <p className="mt-4 text-navy">Loading...</p>
      </div>
    </div>
  );
}

export default function DiscipleProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <DiscipleProfileContent />
    </Suspense>
  );
}
