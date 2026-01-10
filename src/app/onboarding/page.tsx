'use client';

import Link from 'next/link';
import { ClipboardList, Calendar, BookOpen, Users, Video, MessageCircle } from 'lucide-react';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold font-medium text-sm tracking-wide">DNA CHURCH HUB</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="mb-16">
          <h1 className="text-4xl font-bold text-navy mb-4">
            Welcome to DNA Implementation
          </h1>
          <p className="text-xl text-foreground-muted">
            You&apos;ve committed to multiplying disciple-makers. Here&apos;s how we&apos;ll partner with you.
          </p>
        </section>

        {/* Next Steps Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-navy mb-8">Your Next Steps</h2>

          <div className="space-y-6">
            {/* Step 1: Assessment */}
            <div className="card flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gold text-white rounded-full flex items-center justify-center text-xl font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-navy mb-2 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-gold" />
                  Complete Your Church Assessment
                </h3>
                <p className="text-foreground-muted mb-4">
                  Help us understand your context so we can support you well. Takes about 10-15 minutes.
                </p>
                <Link href="/onboarding/assessment" className="btn-primary inline-flex">
                  Start Assessment
                </Link>
              </div>
            </div>

            {/* Step 2: Strategy Call */}
            <div className="card flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gold text-white rounded-full flex items-center justify-center text-xl font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-navy mb-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gold" />
                  Schedule Your Strategy Call
                </h3>
                <p className="text-foreground-muted mb-4">
                  We&apos;ll create a custom launch plan for your church. 60-minute call with Travis.
                </p>
                <a
                  href="https://calendly.com/arkidentity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex"
                >
                  Book Strategy Call
                </a>
              </div>
            </div>

            {/* Step 3: Order Manuals */}
            <div className="card flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gold text-white rounded-full flex items-center justify-center text-xl font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-navy mb-2 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-gold" />
                  Order Physical DNA Manuals
                </h3>
                <p className="text-foreground-muted mb-4">
                  Leaders need the manual. Order on Amazon for fastest delivery.
                </p>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex"
                >
                  View on Amazon
                </a>
              </div>
            </div>

            {/* Step 4: Leader Worksheet */}
            <div className="card flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gold text-white rounded-full flex items-center justify-center text-xl font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-navy mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-gold" />
                  Download Leader Identification Worksheet
                </h3>
                <p className="text-foreground-muted mb-4">
                  Who should lead your first DNA groups? Use this tool to decide.
                </p>
                <a
                  href="#"
                  className="btn-secondary inline-flex"
                >
                  Download Worksheet (PDF)
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Essential Resources Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-navy mb-8">Essential Resources</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* For Church Leadership */}
            <div className="card">
              <h3 className="text-lg font-semibold text-navy mb-4">For Church Leadership</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-teal hover:text-teal-light flex items-center gap-2">
                    📄 DNA Launch Timeline Template
                  </a>
                </li>
                <li>
                  <a href="#" className="text-teal hover:text-teal-light flex items-center gap-2">
                    📄 Vision Casting Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="text-teal hover:text-teal-light flex items-center gap-2">
                    📄 Leader Recruitment Email Templates
                  </a>
                </li>
              </ul>
            </div>

            {/* For DNA Leaders */}
            <div className="card">
              <h3 className="text-lg font-semibold text-navy mb-4">For DNA Leaders</h3>
              <ul className="space-y-3">
                <li>
                  <span className="text-foreground-muted flex items-center gap-2">
                    🎥 Leader Orientation Video
                    <span className="text-xs bg-background-secondary px-2 py-1 rounded">After call</span>
                  </span>
                </li>
                <li>
                  <a href="#" className="text-teal hover:text-teal-light flex items-center gap-2">
                    📄 DNA Group Agreement Templates
                  </a>
                </li>
                <li>
                  <a href="#" className="text-teal hover:text-teal-light flex items-center gap-2">
                    📄 Weekly Meeting Facilitation Guide
                  </a>
                </li>
              </ul>
            </div>

            {/* Graphics & Promotion */}
            <div className="card">
              <h3 className="text-lg font-semibold text-navy mb-4">Graphics & Promotion</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-teal hover:text-teal-light flex items-center gap-2">
                    🎨 Social Media Graphics
                  </a>
                </li>
                <li>
                  <a href="#" className="text-teal hover:text-teal-light flex items-center gap-2">
                    🎨 Church Slide Templates
                  </a>
                </li>
                <li>
                  <a href="#" className="text-teal hover:text-teal-light flex items-center gap-2">
                    🎥 Promotional Video
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Ongoing Support Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-navy mb-8">Ongoing Support</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-navy mb-2 flex items-center gap-2">
                <Video className="w-5 h-5 text-gold" />
                Monthly DNA Leaders Call
              </h3>
              <p className="text-foreground-muted mb-4">
                Join Travis and other DNA leaders for live Q&A, troubleshooting, and encouragement.
              </p>
              <a href="#" className="btn-secondary inline-flex">
                Join Next Call
              </a>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-navy mb-2 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-gold" />
                Need Help?
              </h3>
              <p className="text-foreground-muted mb-4">
                Schedule a 30-minute office hours session for personalized support.
              </p>
              <a
                href="https://calendly.com/arkidentity"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex"
              >
                Schedule Office Hours
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-foreground-muted py-8 border-t border-card-border">
          <p>Questions? Email <a href="mailto:travis@arkidentity.com" className="text-teal hover:text-teal-light">travis@arkidentity.com</a></p>
        </footer>
      </main>
    </div>
  );
}
