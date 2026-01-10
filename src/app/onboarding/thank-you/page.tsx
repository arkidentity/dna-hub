'use client';

import Link from 'next/link';
import { CheckCircle, ArrowRight, Download, Calendar, BookOpen } from 'lucide-react';

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-gold font-medium text-sm tracking-wide">DNA CHURCH HUB</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-success/10 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-navy mb-4">Assessment Received!</h1>
          <p className="text-xl text-foreground-muted">
            Thanks for completing your DNA Church Assessment.
          </p>
        </div>

        {/* What Happens Next */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-navy mb-6">What happens next:</h2>
          <ol className="space-y-4">
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-gold text-white rounded-full flex items-center justify-center font-semibold">
                1
              </span>
              <div>
                <p className="font-medium text-navy">We&apos;ll review your responses</p>
                <p className="text-foreground-muted">Within 24-48 hours</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-gold text-white rounded-full flex items-center justify-center font-semibold">
                2
              </span>
              <div>
                <p className="font-medium text-navy">Strategy call confirmation</p>
                <p className="text-foreground-muted">If you&apos;ve already booked, we&apos;ll see you then. If not, we&apos;ll reach out to schedule.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-gold text-white rounded-full flex items-center justify-center font-semibold">
                3
              </span>
              <div>
                <p className="font-medium text-navy">Custom launch plan</p>
                <p className="text-foreground-muted">We&apos;ll customize a DNA implementation roadmap based on your church&apos;s context.</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Strategy Call Section */}
        <div className="card mb-8 border-2 border-gold">
          <div className="flex items-start gap-4">
            <Calendar className="w-8 h-8 text-gold flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold text-navy mb-2">Strategy Call</h2>
              <p className="text-foreground-muted mb-4">
                Have you already scheduled your strategy call with Travis?
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://calendly.com/arkidentity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Book Strategy Call
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link href="/onboarding" className="btn-secondary">
                  Already Booked
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* While You Wait */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-navy mb-6">While you wait:</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <a
              href="#"
              className="card hover:border-gold transition-colors flex items-start gap-4"
            >
              <Download className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-navy">Leader Identification Worksheet</h3>
                <p className="text-sm text-foreground-muted">Start identifying potential DNA leaders in your church.</p>
              </div>
            </a>
            <a
              href="#"
              className="card hover:border-gold transition-colors flex items-start gap-4"
            >
              <BookOpen className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-navy">Review DNA Materials</h3>
                <p className="text-sm text-foreground-muted">Explore the Manual, Launch Guide, and 8-Week Toolkit.</p>
              </div>
            </a>
          </div>
        </div>

        {/* Return to Hub */}
        <div className="text-center">
          <Link href="/onboarding" className="btn-secondary">
            Return to Onboarding Hub
          </Link>
        </div>

        {/* Footer */}
        <footer className="text-center text-foreground-muted py-8 mt-12 border-t border-card-border">
          <p>Questions? Email <a href="mailto:travis@arkidentity.com" className="text-teal hover:text-teal-light">travis@arkidentity.com</a></p>
        </footer>
      </main>
    </div>
  );
}
