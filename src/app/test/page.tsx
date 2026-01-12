'use client';

import Link from 'next/link';
import { Eye, Building2, Users, Layout, FileText, Home, Settings } from 'lucide-react';

export default function TestIndexPage() {
  const testPages = [
    {
      title: 'Dashboard (User View)',
      description: 'Main implementation dashboard as a church leader would see it',
      href: '/test/dashboard',
      icon: Layout,
      color: 'bg-gold/10 text-gold',
    },
    {
      title: 'Dashboard (Admin View)',
      description: 'Dashboard with admin privileges - can edit dates, notes, attachments',
      href: '/test/dashboard-admin',
      icon: Settings,
      color: 'bg-teal/10 text-teal',
    },
    {
      title: 'Admin Panel',
      description: 'Church management dashboard for admins',
      href: '/test/admin',
      icon: Building2,
      color: 'bg-navy/10 text-navy',
    },
    {
      title: 'Portal (Pre-Implementation)',
      description: 'Pre-implementation portal for churches not yet active',
      href: '/test/portal',
      icon: Users,
      color: 'bg-purple-100 text-purple-800',
    },
    {
      title: 'Assessment Form',
      description: 'Church assessment intake form (live page - no auth required)',
      href: '/assessment',
      icon: FileText,
      color: 'bg-green-100 text-green-800',
    },
    {
      title: 'Landing Page',
      description: 'Public landing page (live page - no auth required)',
      href: '/',
      icon: Home,
      color: 'bg-blue-100 text-blue-800',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold font-medium text-sm tracking-wide">DNA HUB</p>
          <p className="font-semibold">Test Pages</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="card mb-8">
          <h1 className="text-xl font-semibold text-navy mb-2">Development Test Pages</h1>
          <p className="text-foreground-muted">
            These pages display the UI with mock data, bypassing authentication.
            Use them to test and preview components without needing to log in.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {testPages.map((page) => {
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
                    <h3 className="font-semibold text-navy group-hover:text-gold transition-colors">
                      {page.title}
                    </h3>
                    <p className="text-sm text-foreground-muted mt-1">
                      {page.description}
                    </p>
                  </div>
                  <Eye className="w-5 h-5 text-foreground-muted group-hover:text-gold transition-colors flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-gold/5 rounded-lg border border-gold/20">
          <p className="text-sm text-foreground-muted">
            <strong className="text-navy">Note:</strong> Test pages use static mock data.
            Changes made on these pages won&apos;t persist. For real functionality, use the
            actual pages with proper authentication.
          </p>
        </div>
      </main>
    </div>
  );
}
