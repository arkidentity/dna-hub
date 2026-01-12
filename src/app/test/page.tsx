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
} from 'lucide-react';

export default function TestIndexPage() {
  // Sales funnel flow pages (in order)
  const funnelPages = [
    {
      title: 'Landing Page',
      description: 'Public landing page with email signup for DNA Manual',
      href: '/',
      icon: Home,
      color: 'bg-navy/10 text-navy',
      requiresAuth: false,
    },
    {
      title: 'Assessment Form',
      description: 'Church assessment intake form (5-min questionnaire)',
      href: '/assessment',
      icon: FileText,
      color: 'bg-gold/10 text-gold',
      requiresAuth: false,
    },
    {
      title: 'Thank You - Ready',
      description: 'Post-assessment for churches ready to launch',
      href: '/assessment/thank-you?level=ready&church=Test%20Church',
      icon: Rocket,
      color: 'bg-success/10 text-success',
      requiresAuth: false,
    },
    {
      title: 'Thank You - Building',
      description: 'Post-assessment for churches building foundation',
      href: '/assessment/thank-you?level=building&church=Test%20Church',
      icon: BookOpen,
      color: 'bg-gold/10 text-gold',
      requiresAuth: false,
    },
    {
      title: 'Thank You - Exploring',
      description: 'Post-assessment for churches in discovery mode',
      href: '/assessment/thank-you?level=exploring&church=Test%20Church',
      icon: Compass,
      color: 'bg-teal/10 text-teal',
      requiresAuth: false,
    },
    {
      title: 'Login Page',
      description: 'Magic link email login for church leaders',
      href: '/login',
      icon: LogIn,
      color: 'bg-navy/10 text-navy',
      requiresAuth: false,
    },
    {
      title: 'Portal (Pre-Implementation)',
      description: 'Pre-implementation portal for churches awaiting activation',
      href: '/portal',
      icon: Users,
      color: 'bg-purple-100 text-purple-800',
      requiresAuth: true,
      testHref: '/test/portal',
    },
    {
      title: 'Onboarding Success',
      description: 'Welcome page after strategy call completion',
      href: '/onboarding',
      icon: CheckCircle,
      color: 'bg-success/10 text-success',
      requiresAuth: false,
    },
    {
      title: 'Dashboard (User)',
      description: 'Main implementation dashboard for church leaders',
      href: '/dashboard',
      icon: Layout,
      color: 'bg-gold/10 text-gold',
      requiresAuth: true,
      testHref: '/test/dashboard',
    },
  ];

  // Email templates
  const emailPages = [
    {
      title: 'Email Templates & Flow',
      description: 'All automated emails with preview and copy',
      href: '/test/emails',
      icon: Mail,
      color: 'bg-teal/10 text-teal',
    },
  ];

  // Admin pages
  const adminPages = [
    {
      title: 'Admin Panel',
      description: 'Church management dashboard for admins',
      href: '/admin',
      icon: Building2,
      color: 'bg-navy/10 text-navy',
      requiresAuth: true,
      testHref: '/test/admin',
    },
    {
      title: 'Dashboard (Admin View)',
      description: 'Dashboard with admin editing privileges',
      href: '/dashboard',
      icon: Settings,
      color: 'bg-teal/10 text-teal',
      requiresAuth: true,
      testHref: '/test/dashboard-admin',
    },
    {
      title: 'Church Detail (Admin)',
      description: 'Individual church management page with call scheduling',
      href: '/admin/church/[id]',
      icon: Eye,
      color: 'bg-navy/10 text-navy',
      requiresAuth: true,
      testHref: '/test/admin/church',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold font-medium text-sm tracking-wide">DNA HUB</p>
          <p className="font-semibold">All Pages Reference</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="card mb-8">
          <h1 className="text-xl font-semibold text-navy mb-2">Complete Page List</h1>
          <p className="text-foreground-muted">
            All pages in the DNA Hub application, organized by user flow.
            Pages marked with a lock require authentication - use the test versions for development.
          </p>
        </div>

        {/* Sales Funnel Flow */}
        <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center text-gold text-sm font-bold">1</span>
          Sales Funnel Flow
        </h2>
        <div className="grid gap-3 mb-10">
          {funnelPages.map((page, index) => {
            const Icon = page.icon;
            const linkHref = page.testHref || page.href;
            const isExternal = !page.requiresAuth && !page.testHref;

            return (
              <div key={page.href} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-foreground-muted w-5">{index + 1}.</span>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${page.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-navy">
                        {page.title}
                      </h3>
                      {page.requiresAuth && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                          Auth Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground-muted mt-1">
                      {page.description}
                    </p>
                    <p className="text-xs text-teal mt-1 font-mono">{page.href}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {page.testHref && (
                      <Link
                        href={page.testHref}
                        className="flex items-center gap-1 px-3 py-1.5 bg-teal text-white text-sm rounded hover:bg-teal-light transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Test
                      </Link>
                    )}
                    <Link
                      href={linkHref}
                      className="flex items-center gap-1 px-3 py-1.5 border border-navy text-navy text-sm rounded hover:bg-navy hover:text-white transition-colors"
                    >
                      {isExternal ? <ExternalLink className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {page.requiresAuth && !page.testHref ? 'Live' : 'View'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Admin Pages */}
        <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-navy/10 rounded-full flex items-center justify-center text-navy text-sm font-bold">2</span>
          Admin Pages
        </h2>
        <div className="grid gap-3 mb-10">
          {adminPages.map((page) => {
            const Icon = page.icon;

            return (
              <div key={page.title} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${page.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-navy">
                        {page.title}
                      </h3>
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                        Admin Only
                      </span>
                    </div>
                    <p className="text-sm text-foreground-muted mt-1">
                      {page.description}
                    </p>
                    <p className="text-xs text-teal mt-1 font-mono">{page.href}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {page.testHref && (
                      <Link
                        href={page.testHref}
                        className="flex items-center gap-1 px-3 py-1.5 bg-teal text-white text-sm rounded hover:bg-teal-light transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Test
                      </Link>
                    )}
                    <Link
                      href={page.testHref || page.href}
                      className="flex items-center gap-1 px-3 py-1.5 border border-navy text-navy text-sm rounded hover:bg-navy hover:text-white transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      {page.testHref ? 'View' : 'Live'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Email Templates */}
        <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-teal/10 rounded-full flex items-center justify-center text-teal text-sm font-bold">3</span>
          Email Templates
        </h2>
        <div className="grid gap-3 mb-10">
          {emailPages.map((page) => {
            const Icon = page.icon;

            return (
              <Link
                key={page.href}
                href={page.href}
                className="card hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${page.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-navy group-hover:text-teal transition-colors">
                      {page.title}
                    </h3>
                    <p className="text-sm text-foreground-muted mt-1">
                      {page.description}
                    </p>
                    <p className="text-xs text-teal mt-1 font-mono">{page.href}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-3 py-1.5 bg-teal text-white text-sm rounded group-hover:bg-teal-light transition-colors">
                      <Mail className="w-4 h-4" />
                      View All
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Legend */}
        <div className="card bg-background-secondary">
          <h3 className="font-semibold text-navy mb-3">Legend</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs">Auth Required</span>
              <span className="text-foreground-muted">Needs login to access live page</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs">Admin Only</span>
              <span className="text-foreground-muted">Requires admin email</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-teal text-white rounded text-xs">Test</span>
              <span className="text-foreground-muted">Test version with mock data</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 border border-navy text-navy rounded text-xs">View</span>
              <span className="text-foreground-muted">Direct link to page</span>
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="mt-8 p-4 bg-gold/5 rounded-lg border border-gold/20">
          <h3 className="font-semibold text-navy mb-2">Quick Test Access</h3>
          <div className="flex flex-wrap gap-2">
            <Link href="/test/dashboard" className="text-sm px-3 py-1.5 bg-gold text-white rounded hover:bg-gold-dark transition-colors">
              Test Dashboard
            </Link>
            <Link href="/test/dashboard-admin" className="text-sm px-3 py-1.5 bg-teal text-white rounded hover:bg-teal-light transition-colors">
              Test Admin Dashboard
            </Link>
            <Link href="/test/admin" className="text-sm px-3 py-1.5 bg-navy text-white rounded hover:bg-navy/90 transition-colors">
              Test Admin Panel
            </Link>
            <Link href="/test/portal" className="text-sm px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
              Test Portal
            </Link>
            <Link href="/test/emails" className="text-sm px-3 py-1.5 bg-teal text-white rounded hover:bg-teal-light transition-colors">
              Email Templates
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
