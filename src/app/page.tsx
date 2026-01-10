import Link from 'next/link';
import { ArrowRight, Users, CheckCircle, Rocket } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <p className="text-gold font-medium tracking-wide">DNA CHURCH HUB</p>
          <Link
            href="/login"
            className="text-sm text-gold-light hover:text-gold transition-colors"
          >
            Church Login
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-navy mb-6">
            DNA Church Implementation Hub
          </h1>
          <p className="text-xl text-foreground-muted max-w-2xl mx-auto mb-8">
            Partner with ARK Identity to implement DNA discipleship at your church.
            We&apos;ll guide you every step of the way.
          </p>
          <Link href="/onboarding" className="btn-primary text-lg px-8 py-4">
            Start Your Journey
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>

        {/* What You Get */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-navy text-center mb-10">
            What&apos;s Included
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gold/10 rounded-full mb-4">
                <Users className="w-7 h-7 text-gold" />
              </div>
              <h3 className="font-semibold text-navy mb-2">Strategy Call</h3>
              <p className="text-foreground-muted text-sm">
                One-on-one planning session to customize DNA for your church context.
              </p>
            </div>
            <div className="card text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gold/10 rounded-full mb-4">
                <CheckCircle className="w-7 h-7 text-gold" />
              </div>
              <h3 className="font-semibold text-navy mb-2">Phase-by-Phase Roadmap</h3>
              <p className="text-foreground-muted text-sm">
                Interactive dashboard with milestones to track your implementation progress.
              </p>
            </div>
            <div className="card text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gold/10 rounded-full mb-4">
                <Rocket className="w-7 h-7 text-gold" />
              </div>
              <h3 className="font-semibold text-navy mb-2">Ongoing Support</h3>
              <p className="text-foreground-muted text-sm">
                Resources, training materials, and direct access to help when you need it.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="card bg-navy text-white text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Ready to Make Disciples?</h2>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto">
            Start with our church assessment. It takes about 10-15 minutes and helps us
            understand your context so we can serve you well.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-dark text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Begin Assessment
            <ArrowRight className="w-4 h-4" />
          </Link>
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
          © {new Date().getFullYear()} ARK Identity. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
