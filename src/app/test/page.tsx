'use client';

import Link from 'next/link';
import {
  Eye,
  Building2,
  Users,
  Layout,
  FileText,
  Home,
  Settings,
  LogIn,
  CheckCircle,
  Rocket,
  BookOpen,
  Compass,
  ExternalLink,
  Mail,
  Gift,
  Star,
  GraduationCap,
  UserPlus,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StepItem {
  type: 'page' | 'email';
  title: string;
  description: string;
  href: string;
  emailId?: string; // maps to /test/emails#emailId
  icon: React.ElementType;
  color: string;
  requiresAuth?: boolean;
  testHref?: string;
  badge?: string;
  emails?: { label: string; emailId: string }[];
}

interface FunnelSection {
  id: string;
  label: string;
  color: string;
  steps: StepItem[];
}

// ─── Funnel Data ──────────────────────────────────────────────────────────────

const funnels: FunnelSection[] = [
  {
    id: 'main',
    label: 'Main Funnel — DNA Manual & Church Assessment',
    color: 'bg-gold/10 text-gold border-gold/30',
    steps: [
      {
        type: 'page',
        title: 'Landing Page',
        description: 'Public landing page — church leaders sign up to receive the DNA Manual',
        href: '/',
        icon: Home,
        color: 'bg-navy/10 text-navy',
        emails: [{ label: 'DNA Manual Delivery', emailId: 'dna-manual' }],
      },
      {
        type: 'page',
        title: 'Manual Signup Confirmation',
        description: '"Check your inbox" confirmation shown after signing up on the landing page',
        href: '/thank-you',
        icon: CheckCircle,
        color: 'bg-success/10 text-success',
      },
      {
        type: 'page',
        title: 'Church Assessment',
        description: '5-minute questionnaire to evaluate church readiness for DNA',
        href: '/assessment',
        icon: FileText,
        color: 'bg-gold/10 text-gold',
        emails: [
          { label: '3 Steps Guide — Ready', emailId: '3-steps-ready' },
          { label: '3 Steps Guide — Building', emailId: '3-steps-building' },
          { label: '3 Steps Guide — Exploring', emailId: '3-steps-exploring' },
        ],
      },
      {
        type: 'page',
        title: 'Assessment Confirmation — Ready',
        description: 'Post-assessment page for churches ready to launch — book a discovery call to receive dashboard access + Launch Guide',
        href: '/assessment/thank-you?level=ready&church=Test%20Church',
        icon: Rocket,
        color: 'bg-success/10 text-success',
        emails: [{ label: 'Discovery Call — Dashboard Access', emailId: 'discovery-call-access' }],
      },
      {
        type: 'page',
        title: 'Assessment Confirmation — Building',
        description: 'Post-assessment page for churches building their foundation',
        href: '/assessment/thank-you?level=building&church=Test%20Church',
        icon: BookOpen,
        color: 'bg-gold/10 text-gold',
        emails: [{ label: 'Discovery Call — Dashboard Access', emailId: 'discovery-call-access' }],
      },
      {
        type: 'page',
        title: 'Assessment Confirmation — Exploring',
        description: 'Post-assessment page for churches in discovery mode',
        href: '/assessment/thank-you?level=exploring&church=Test%20Church',
        icon: Compass,
        color: 'bg-teal/10 text-teal',
        emails: [{ label: 'Discovery Call — Dashboard Access', emailId: 'discovery-call-access' }],
      },
      {
        type: 'page',
        title: 'Login Page',
        description: 'Magic link login — church leaders enter email to receive access link',
        href: '/login',
        icon: LogIn,
        color: 'bg-navy/10 text-navy',
        emails: [{ label: 'Magic Link Login', emailId: 'magic-link' }],
      },
      {
        type: 'page',
        title: 'Portal — Pre-Implementation',
        description: 'Pre-implementation portal for churches awaiting activation',
        href: '/portal',
        icon: Users,
        color: 'bg-purple-100 text-purple-800',
        requiresAuth: true,
        testHref: '/test/portal',
        emails: [
          { label: 'Proposal Ready', emailId: 'proposal-ready' },
          { label: 'Agreement Confirmed', emailId: 'agreement-confirmed' },
        ],
      },
      {
        type: 'page',
        title: 'Onboarding Success',
        description: 'Welcome page shown after strategy call completion',
        href: '/onboarding',
        icon: CheckCircle,
        color: 'bg-success/10 text-success',
        emails: [{ label: 'Dashboard Access', emailId: 'dashboard-access' }],
      },
      {
        type: 'page',
        title: 'Church Leader Dashboard',
        description: 'Main implementation dashboard — phases, milestones, resources',
        href: '/dashboard',
        icon: Layout,
        color: 'bg-gold/10 text-gold',
        requiresAuth: true,
        testHref: '/test/dashboard',
      },
    ],
  },
  {
    id: 'gifts',
    label: 'Spiritual Gifts Funnel — Ministry Gift Test',
    color: 'bg-purple-50 text-purple-800 border-purple-200',
    steps: [
      {
        type: 'page',
        title: 'Spiritual Gifts Assessment',
        description: 'Public landing and assessment flow for the Ministry Gift Test',
        href: '/ministry-gift-test',
        icon: Gift,
        color: 'bg-purple-100 text-purple-800',
      },
      {
        type: 'page',
        title: 'Spiritual Gifts Confirmation',
        description: 'Post-submission confirmation page after completing the Spiritual Gifts test',
        href: '/ministry-gift-test/confirmation',
        icon: Star,
        color: 'bg-purple-100 text-purple-800',
      },
    ],
  },
];

// ─── Hub System ───────────────────────────────────────────────────────────────

const hubSections: { label: string; badge: string; badgeColor: string; items: StepItem[] }[] = [
  {
    label: 'Training',
    badge: 'Auth Required',
    badgeColor: 'bg-orange-100 text-orange-800',
    items: [
      {
        type: 'page',
        title: 'Training Dashboard',
        description: 'DNA leader training — flow assessment, manual sessions, launch guide',
        href: '/training',
        icon: GraduationCap,
        color: 'bg-gold/10 text-gold',
        requiresAuth: true,
        emails: [
          { label: 'DNA Leader Direct Invite', emailId: 'dna-leader-direct-invite' },
          { label: 'Training Welcome', emailId: 'training-welcome' },
          { label: 'DNA Leader Magic Link', emailId: 'dna-leader-magic-link' },
        ],
      },
    ],
  },
  {
    label: 'Groups',
    badge: 'Auth Required',
    badgeColor: 'bg-orange-100 text-orange-800',
    items: [
      {
        type: 'page',
        title: 'Groups Dashboard',
        description: 'DNA leader groups — create and manage DNA groups',
        href: '/groups',
        icon: Users,
        color: 'bg-teal/10 text-teal',
        requiresAuth: true,
        emails: [{ label: 'Co-Leader Invitation', emailId: 'co-leader-invitation' }],
      },
      {
        type: 'page',
        title: 'Group Signup — Disciple',
        description: 'Disciple-facing signup page to join a DNA group',
        href: '/groups/signup',
        icon: UserPlus,
        color: 'bg-teal/10 text-teal',
      },
    ],
  },
  {
    label: 'Cohort',
    badge: 'Auth Required',
    badgeColor: 'bg-orange-100 text-orange-800',
    items: [
      {
        type: 'page',
        title: 'Cohort',
        description: 'DNA cohort — feed, members, calendar, discussion',
        href: '/cohort',
        icon: BookOpen,
        color: 'bg-navy/10 text-navy',
        requiresAuth: true,
      },
    ],
  },
];

// ─── Admin ────────────────────────────────────────────────────────────────────

const adminItems: StepItem[] = [
  {
    type: 'page',
    title: 'Admin Panel',
    description: 'Church management dashboard',
    href: '/admin',
    icon: Building2,
    color: 'bg-navy/10 text-navy',
    requiresAuth: true,
    testHref: '/test/admin',
    emails: [
      { label: 'New Assessment Notification', emailId: 'assessment-notification' },
      { label: 'Key Milestone Completed', emailId: 'milestone-notification' },
      { label: 'Phase Completed', emailId: 'phase-completion-notification' },
    ],
  },
  {
    type: 'page',
    title: 'Dashboard — Admin View',
    description: 'Dashboard with admin editing privileges',
    href: '/dashboard',
    icon: Settings,
    color: 'bg-teal/10 text-teal',
    requiresAuth: true,
    testHref: '/test/dashboard-admin',
  },
  {
    type: 'page',
    title: 'Church Detail — Admin',
    description: 'Individual church management with call scheduling',
    href: '/admin/church/[id]',
    icon: Eye,
    color: 'bg-navy/10 text-navy',
    requiresAuth: true,
    testHref: '/test/admin/church',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PageRow({ item, index, showIndex = false }: { item: StepItem; index?: number; showIndex?: boolean }) {
  const Icon = item.icon;
  const linkHref = item.testHref || item.href;

  return (
    <div className="bg-white border border-card-border rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-4">
        {showIndex && (
          <span className="text-xs text-foreground-muted w-5 pt-1 flex-shrink-0">{index}.</span>
        )}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${item.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-navy text-sm">{item.title}</h3>
            {item.requiresAuth && (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">Auth Required</span>
            )}
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">{item.description}</p>
          <p className="text-xs text-teal mt-1 font-mono">{item.href}</p>

          {/* Related emails */}
          {item.emails && item.emails.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {item.emails.map((e) => (
                <Link
                  key={e.emailId}
                  href={`/test/emails#${e.emailId}`}
                  className="flex items-center gap-1 text-xs bg-teal/5 text-teal border border-teal/20 px-2 py-1 rounded hover:bg-teal/10 transition-colors"
                >
                  <Mail className="w-3 h-3" />
                  {e.label}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {item.testHref && (
            <Link
              href={item.testHref}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-teal text-white text-xs rounded hover:bg-teal-light transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Test
            </Link>
          )}
          <Link
            href={linkHref}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-navy text-navy text-xs rounded hover:bg-navy hover:text-white transition-colors"
          >
            {!item.requiresAuth || item.testHref ? <ExternalLink className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {item.requiresAuth && !item.testHref ? 'Live' : 'View'}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TestIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-gold font-medium text-sm tracking-wide">DNA HUB</p>
            <p className="font-semibold">All Pages Reference</p>
          </div>
          <Link
            href="/test/emails"
            className="flex items-center gap-2 text-sm px-3 py-1.5 bg-teal text-white rounded hover:bg-teal-light transition-colors"
          >
            <Mail className="w-4 h-4" />
            All Emails
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* Intro */}
        <div className="card mb-8">
          <h1 className="text-xl font-semibold text-navy mb-1">Complete Page & Email Reference</h1>
          <p className="text-foreground-muted text-sm">
            Pages are organized in funnel order. Email chips below each page link directly to that email's preview.
            Pages with a lock icon require authentication — use the Test button for dev access.
          </p>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full">Auth Required</span> needs login</span>
            <span className="flex items-center gap-1.5"><span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full">Admin Only</span> admin email required</span>
            <span className="flex items-center gap-1.5"><span className="px-2 py-0.5 bg-teal text-white rounded">Test</span> mock-data version</span>
            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-teal" /> email chip = links to email preview</span>
          </div>
        </div>

        {/* ── FUNNELS ── */}
        {funnels.map((funnel, fi) => (
          <div key={funnel.id} className="mb-12">
            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border mb-4 ${funnel.color}`}>
              <span className="font-bold text-sm w-6 h-6 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0">{fi + 1}</span>
              <span className="font-semibold text-sm">{funnel.label}</span>
            </div>

            <div className="relative pl-6">
              {/* Vertical connector line */}
              <div className="absolute left-2.5 top-4 bottom-4 w-px bg-card-border" />

              <div className="space-y-2">
                {funnel.steps.map((step, si) => (
                  <div key={step.href + si} className="relative">
                    {/* Dot on the line */}
                    <div className="absolute -left-6 top-4 w-3 h-3 rounded-full bg-white border-2 border-card-border" />
                    <PageRow item={step} index={si + 1} showIndex={false} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* ── HUB SYSTEM ── */}
        <div className="mb-12">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-teal/5 text-teal border-teal/20 mb-4">
            <span className="font-bold text-sm w-6 h-6 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0">{funnels.length + 1}</span>
            <span className="font-semibold text-sm">DNA Hub System — Leader &amp; Disciple Areas</span>
          </div>

          <div className="space-y-6">
            {hubSections.map((section) => (
              <div key={section.label}>
                <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-2 pl-1">{section.label}</h3>
                <div className="space-y-2">
                  {section.items.map((item, i) => (
                    <PageRow key={item.href + i} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── ADMIN ── */}
        <div className="mb-12">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-navy/5 text-navy border-navy/20 mb-4">
            <span className="font-bold text-sm w-6 h-6 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0">{funnels.length + 2}</span>
            <span className="font-semibold text-sm">Admin — Church Management</span>
          </div>
          <div className="space-y-2">
            {adminItems.map((item, i) => (
              <PageRow key={item.href + i} item={item} />
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <div className="p-4 bg-gold/5 rounded-lg border border-gold/20">
          <h3 className="font-semibold text-navy mb-2 text-sm">Quick Test Access</h3>
          <div className="flex flex-wrap gap-2">
            <Link href="/test/dashboard" className="text-xs px-3 py-1.5 bg-gold text-white rounded hover:bg-gold-dark transition-colors">Test Dashboard</Link>
            <Link href="/test/dashboard-admin" className="text-xs px-3 py-1.5 bg-teal text-white rounded hover:bg-teal-light transition-colors">Test Admin Dashboard</Link>
            <Link href="/test/admin" className="text-xs px-3 py-1.5 bg-navy text-white rounded hover:bg-navy/90 transition-colors">Test Admin Panel</Link>
            <Link href="/test/portal" className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">Test Portal</Link>
            <Link href="/test/emails" className="text-xs px-3 py-1.5 bg-teal text-white rounded hover:bg-teal-light transition-colors">All Email Templates</Link>
          </div>
        </div>

      </main>
    </div>
  );
}
