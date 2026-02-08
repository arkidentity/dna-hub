'use client';

import Link from 'next/link';
import { CheckCircle, BookOpen, Users, Rocket, ArrowRight, MessageCircle } from 'lucide-react';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <p className="text-gold font-medium text-sm tracking-wide">DNA CHURCH HUB</p>
          <Link href="/login" className="text-white/80 hover:text-white text-sm">
            Go to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-6">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-4xl font-bold text-navy mb-4">
            Welcome to DNA
          </h1>
          <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
            You&apos;re now part of the DNA family. We&apos;re honored to partner with you in multiplying disciple-makers.
          </p>
        </section>

        {/* What's Next Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-navy mb-8 text-center">What Happens Now</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="card text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gold/10 text-gold rounded-full mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">Access Your Dashboard</h3>
              <p className="text-foreground-muted text-sm">
                Your implementation roadmap is ready. Track progress, access resources, and check off milestones as you go.
              </p>
            </div>

            <div className="card text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gold/10 text-gold rounded-full mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">Gather Your Leaders</h3>
              <p className="text-foreground-muted text-sm">
                Start identifying and inviting potential DNA leaders. The 8-Week Toolkit in your dashboard will guide the process.
              </p>
            </div>

            <div className="card text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gold/10 text-gold rounded-full mb-4">
                <Rocket className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">Launch Phase 1</h3>
              <p className="text-foreground-muted text-sm">
                Work through the phases at your pace. We&apos;ll be with you every step of the way.
              </p>
            </div>
          </div>
        </section>

        {/* Dashboard CTA */}
        <section className="mb-16">
          <div className="card bg-navy text-white text-center py-10">
            <h3 className="text-2xl font-semibold text-white mb-3">Ready to Get Started?</h3>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Your personalized implementation dashboard is ready. Log in to see your roadmap, access resources, and begin Phase 1.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-gold hover:bg-gold-dark text-white font-medium px-8 py-3 rounded-lg transition-colors"
            >
              Go to Your Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Your DNA Coach */}
        <section className="mb-16">
          <div className="card">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-shrink-0 w-24 h-24 bg-background-secondary rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-navy">TG</span>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-semibold text-navy mb-1">Travis Gluckler</h3>
                <p className="text-gold font-medium text-sm mb-3">Your DNA Coach</p>
                <p className="text-foreground-muted">
                  I&apos;m here to support you throughout your DNA journey. Have questions? Need to troubleshoot? Just want to celebrate a win? Reach out anytime.
                </p>
              </div>
              <div className="flex-shrink-0">
                <a
                  href="mailto:travis@arkidentity.com"
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Get in Touch
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-navy mb-6">Quick Links</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/dashboard" className="card hover:border-gold transition-colors group">
              <div className="flex items-center justify-between">
                <span className="font-medium text-navy group-hover:text-gold transition-colors">Implementation Dashboard</span>
                <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-gold transition-colors" />
              </div>
            </Link>
            <a href="https://calendly.com/arkidentity" target="_blank" rel="noopener noreferrer" className="card hover:border-gold transition-colors group">
              <div className="flex items-center justify-between">
                <span className="font-medium text-navy group-hover:text-gold transition-colors">Schedule Office Hours</span>
                <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-gold transition-colors" />
              </div>
            </a>
            <a href="#" className="card hover:border-gold transition-colors group">
              <div className="flex items-center justify-between">
                <span className="font-medium text-navy group-hover:text-gold transition-colors">DNA Manual (PDF)</span>
                <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-gold transition-colors" />
              </div>
            </a>
            <a href="#" className="card hover:border-gold transition-colors group">
              <div className="flex items-center justify-between">
                <span className="font-medium text-navy group-hover:text-gold transition-colors">Order Physical Books</span>
                <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-gold transition-colors" />
              </div>
            </a>
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
