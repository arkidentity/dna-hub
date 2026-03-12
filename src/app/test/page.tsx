'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Layout,
  Mail,
  Route,
  Eye,
} from 'lucide-react';

export default function TestIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-gold font-medium text-sm tracking-wide">DNA HUB</p>
          <p className="font-semibold">Test & Reference</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">

        {/* Two primary cards */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <Link
            href="/test/funnels"
            className="card group hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gold/10 text-gold flex items-center justify-center flex-shrink-0">
                <Route className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-navy text-lg group-hover:text-gold transition-colors">
                  Funnels & Emails
                </h2>
                <p className="text-sm text-foreground-muted mt-1">
                  All user-facing funnels with inline email previews. Main funnel, automated follow-ups, spiritual gifts, and demo.
                </p>
                <p className="text-xs text-teal mt-2 font-medium flex items-center gap-1">
                  16 emails <ArrowRight className="w-3.5 h-3.5" />
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/test/dashboards"
            className="card group hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-teal/10 text-teal flex items-center justify-center flex-shrink-0">
                <Layout className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-navy text-lg group-hover:text-teal transition-colors">
                  Dashboards & System
                </h2>
                <p className="text-sm text-foreground-muted mt-1">
                  All hub dashboards and admin pages with inline email previews. Training, groups, cohort, admin, and live service.
                </p>
                <p className="text-xs text-teal mt-2 font-medium flex items-center gap-1">
                  15 emails <ArrowRight className="w-3.5 h-3.5" />
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Test Access */}
        <div className="p-4 bg-gold/5 rounded-lg border border-gold/20">
          <h3 className="font-semibold text-navy mb-3 text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Quick Test Access
          </h3>
          <p className="text-xs text-foreground-muted mb-3">
            Mock-data versions of auth-required pages for development and review.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/test/dashboard" className="text-xs px-3 py-1.5 bg-gold text-white rounded hover:bg-gold-dark transition-colors">
              Test Dashboard
            </Link>
            <Link href="/test/dashboard-admin" className="text-xs px-3 py-1.5 bg-teal text-white rounded hover:bg-teal-light transition-colors">
              Test Admin Dashboard
            </Link>
            <Link href="/test/admin" className="text-xs px-3 py-1.5 bg-navy text-white rounded hover:bg-navy/90 transition-colors">
              Test Admin Panel
            </Link>
            <Link href="/test/portal" className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
              Test Portal
            </Link>
          </div>
        </div>

        {/* Stats summary */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-foreground-muted">
          <span className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            31 email templates total
          </span>
          <span>|</span>
          <span>4 mock test pages</span>
        </div>

      </main>
    </div>
  );
}
