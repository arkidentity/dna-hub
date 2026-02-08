'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Users, Target, Zap, BookOpen, Calendar, Send } from 'lucide-react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-navy text-white py-4 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-gold font-medium tracking-wide">DNA DISCIPLESHIP</p>
            <Link
              href="/login"
              className="text-sm text-gold-light hover:text-gold transition-colors"
            >
              Church Login
            </Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-success/10 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>

          <h1 className="text-3xl font-bold text-navy mb-4">Check Your Email</h1>

          <p className="text-foreground-muted mb-8">
            The DNA Manual is on the way to <strong className="text-navy">{email}</strong>.
            <br />
            If you don&apos;t see the email in 2 minutes, check your spam folder.
          </p>

          <div className="card mb-8 text-left">
            <h3 className="font-semibold text-navy mb-3">What you received:</h3>
            <div className="flex items-center gap-3 text-success">
              <CheckCircle className="w-5 h-5" />
              <span>DNA Discipleship Manual (PDF)</span>
            </div>
          </div>

          <div className="card bg-navy text-white text-left">
            <h3 className="text-xl font-semibold text-white mb-3">Is DNA Right for Your Church?</h3>
            <p className="text-gray-300 mb-4">
              The Manual gives you the vision. The next step is figuring out if DNA is a good fit for your context.
            </p>
            <p className="text-gray-300 mb-6">
              Take our 5-minute Church Assessment and get:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                <span><strong>Your readiness level</strong> - Are you ready to launch, building the foundation, or still exploring?</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                <span><strong>Personalized next steps</strong> - Specific actions based on where you are</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                <span><strong>Option to connect</strong> - If it&apos;s a good fit, book a quick discovery call</span>
              </li>
            </ul>
            <Link
              href="/assessment"
              className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-dark text-white font-medium px-6 py-3 rounded-lg transition-colors w-full"
            >
              See If DNA Is Right for Your Church
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-card-border">
            <h3 className="font-semibold text-navy mb-4">What Happens After the Assessment</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-gold font-bold">1</span>
                </div>
                <p className="font-medium text-navy">Assessment</p>
                <p className="text-foreground-muted text-xs">5 minutes</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-gold font-bold">2</span>
                </div>
                <p className="font-medium text-navy">Discovery Call</p>
                <p className="text-foreground-muted text-xs">15 minutes</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-gold font-bold">3</span>
                </div>
                <p className="font-medium text-navy">Proposal Call</p>
                <p className="text-foreground-muted text-xs">30 minutes</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-gold font-bold">4</span>
                </div>
                <p className="font-medium text-navy">Strategy Call</p>
                <p className="text-foreground-muted text-xs">60 minutes</p>
              </div>
            </div>
            <p className="text-foreground-muted text-sm mt-4">
              We don&apos;t take every church. DNA requires commitment from leadership and a willingness to prioritize multiplication.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <p className="text-gold font-medium tracking-wide">DNA DISCIPLESHIP</p>
          <Link
            href="/login"
            className="text-sm text-gold-light hover:text-gold transition-colors"
          >
            Church Login
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6">
        {/* Hero */}
        <section className="text-center py-16 md:py-24">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-navy mb-6 leading-tight">
            Make Disciples Who<br />Make Disciples
          </h1>
          <p className="text-xl md:text-2xl text-foreground-muted max-w-2xl mx-auto mb-8">
            DNA is a proven 5-phase system that transforms believers into confident disciple-makers in 6-12 months.
          </p>

          {/* 3 Value Props */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-10">
            <div className="flex items-center gap-2 text-sm md:text-base">
              <CheckCircle className="w-5 h-5 text-gold" />
              <span><strong>Structured but Spirit-led</strong></span>
            </div>
            <div className="flex items-center gap-2 text-sm md:text-base">
              <CheckCircle className="w-5 h-5 text-gold" />
              <span><strong>Quality over speed</strong></span>
            </div>
            <div className="flex items-center gap-2 text-sm md:text-base">
              <CheckCircle className="w-5 h-5 text-gold" />
              <span><strong>Exponential by design</strong></span>
            </div>
          </div>

          {/* Email Capture Form */}
          <div className="card max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-navy mb-4">Get the DNA Manual (Free)</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              {error && (
                <p className="text-error text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full"
              >
                {isSubmitting ? 'Sending...' : 'Send Me the Manual'}
                {!isSubmitting && <Send className="w-4 h-4" />}
              </button>
            </form>
            <p className="text-xs text-foreground-muted mt-3">
              We&apos;ll email you the DNA Manual immediately. No spam—just helpful content from ARK Identity.
            </p>
          </div>
        </section>

        {/* The 5-Phase System */}
        <section className="py-16 border-t border-card-border">
          <h2 className="text-2xl md:text-3xl font-semibold text-navy text-center mb-4">
            The DNA Pathway
          </h2>
          <p className="text-foreground-muted text-center max-w-2xl mx-auto mb-12">
            DNA takes someone from &ldquo;being discipled&rdquo; to &ldquo;ready to disciple others&rdquo; through five intentional phases. No shortcuts, no guesswork—just a reproducible system that multiplies.
          </p>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute top-8 left-0 right-0 h-1 bg-gold/20" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {[
                { name: 'Pre-Launch', duration: '2-4 weeks', icon: Target },
                { name: 'Invitation', duration: '4-6 weeks', icon: Users },
                { name: 'Foundation', duration: 'Months 1-3', icon: BookOpen },
                { name: 'Growth', duration: 'Months 4-6', icon: Zap },
                { name: 'Multiplication', duration: 'Months 7-12', icon: Users },
              ].map((phase, i) => (
                <div key={i} className="text-center relative">
                  <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-3 relative z-10 border-4 border-background">
                    <phase.icon className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="font-semibold text-navy mb-1">{phase.name}</h3>
                  <p className="text-sm text-foreground-muted">{phase.duration}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What You Get */}
        <section className="py-16 border-t border-card-border">
          <h2 className="text-2xl md:text-3xl font-semibold text-navy text-center mb-4">
            Start with the DNA Manual
          </h2>
          <p className="text-foreground-muted text-center max-w-2xl mx-auto mb-10">
            The foundation of everything. This 6-session training covers the heart, theology, and practice of multiplication discipleship.
          </p>

          <div className="card max-w-2xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-16 h-20 bg-navy rounded flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-8 h-8 text-gold" />
              </div>
              <div>
                <h3 className="font-semibold text-navy text-lg mb-2">DNA Discipleship Manual</h3>
                <p className="text-foreground-muted text-sm mb-4">6 sessions • 49 pages</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>The biblical case for multiplication (not just addition)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>The 5-phase DNA process explained</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>How to identify and invite potential disciples</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>What makes a disciple &ldquo;ready&rdquo; to multiply</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Common mistakes and how to avoid them</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-center text-foreground-muted mt-8 text-sm">
            Join the growing movement of churches implementing DNA discipleship.
          </p>
        </section>

        {/* Final CTA */}
        <section className="py-16 border-t border-card-border">
          <div className="card bg-navy text-white text-center py-12 px-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">Ready to Make Disciples?</h2>
            <p className="text-gray-300 mb-8 max-w-xl mx-auto">
              Get the DNA Manual and see if multiplication discipleship is right for your church.
            </p>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-dark text-white font-medium px-8 py-4 rounded-lg transition-colors text-lg"
            >
              Get the Free Manual
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </section>

        {/* Already Started? */}
        <section className="py-8 text-center">
          <p className="text-foreground-muted">
            Already have the manual?{' '}
            <Link href="/assessment" className="text-teal hover:text-teal-light font-medium">
              Take the Church Assessment
            </Link>
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center text-foreground-muted py-8 border-t border-card-border">
        <p className="text-sm">
          Questions? Email{' '}
          <a href="mailto:travis@arkidentity.com" className="text-teal hover:text-teal-light">
            travis@arkidentity.com
          </a>
        </p>
        <p className="text-xs mt-2 text-foreground-muted/60">
          © {new Date().getFullYear()} ARK Identity Discipleship. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
