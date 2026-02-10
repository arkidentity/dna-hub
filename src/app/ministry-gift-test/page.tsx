/**
 * Pastor/Leader Landing Page for Spiritual Gifts Assessment
 *
 * StoryBrand framework applied:
 * - Character: Pastor with team in wrong roles
 * - Problem: Burnout, ineffective ministry, guessing game
 * - Guide: DNA Discipleship (authority + empathy)
 * - Plan: Simple 3-step process
 * - Success: Team thriving in their sweet spot
 * - Failure: Continue losing best people to burnout
 */

import SpiritualGiftsLeaderForm from '@/components/spiritual-gifts/SpiritualGiftsLeaderForm';

export const metadata = {
  title: 'Free Ministry Gifts Test for Your Team | DNA Discipleship',
  description: 'Get a free biblical ministry gifts test for your entire team. Place every team member in their sweet spot where they\'re energized, effective, and thriving.',
};

export default function MinistryGiftTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section - Character + Problem */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--navy)] mb-6 text-center leading-tight">
            Get a Free Ministry Gifts Test<br />
            <span className="text-[var(--teal)]">for Your Entire Team</span>
          </h1>

          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-xl text-gray-700 mb-4 leading-relaxed">
              When Nicole was organizing events at Cornerstone Church, she felt completely drained.
            </p>
            <p className="text-lg text-gray-600 mb-4">
              It wasn&apos;t because she was lazy or uncommitted.
            </p>
            <p className="text-xl text-gray-700 mb-4">
              It was because she was serving <strong>outside her God-given design</strong>.
            </p>
            <p className="text-xl text-gray-700 mb-6">
              After discovering her gift of <strong className="text-[var(--teal)]">mercy</strong> through our assessment, she moved to pastoral care—and now she&apos;s <strong className="text-[var(--teal)]">thriving</strong>.
            </p>
            <p className="text-2xl font-semibold text-[var(--navy)]">
              What if every person on your team could serve in their sweet spot?
            </p>
          </div>

          <div className="text-center">
            <a
              href="#get-access"
              className="inline-block bg-[var(--gold)] text-white px-10 py-5 rounded-lg font-bold text-xl hover:opacity-90 transition-opacity shadow-xl"
            >
              Get Free Team Assessment
            </a>
            <p className="text-sm text-gray-500 mt-4">
              ✓ Results in 15 minutes • ✓ Biblical framework (Romans 12, 1 Cor 12, Ephesians 4)<br />
              ⏰ <strong>Limited to 50 churches this month</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Plan - Simple 3 Steps */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-b border-gray-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-[var(--navy)] text-center mb-4">
            How It Works
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Simple. Biblical. Actionable.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                step: '1',
                title: 'Request Team Access',
                time: '2 minutes',
                desc: 'Fill out the form below. We\'ll send assessment links to your team within 24 hours.',
              },
              {
                step: '2',
                title: 'Your Team Takes the Assessment',
                time: '15 minutes each',
                desc: '96 questions across 3 biblical gift tiers (Romans 12, 1 Cor 12, Ephesians 4).',
              },
              {
                step: '3',
                title: 'View Your Team Dashboard',
                time: 'Instant',
                desc: 'See everyone\'s ministry gifts in one place. Know who belongs where—finally.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-[var(--gold)] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-[var(--navy)] mb-2">{item.title}</h3>
                <p className="text-[var(--teal)] font-semibold mb-3">{item.time}</p>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 p-6 rounded-xl border-2 border-[var(--teal)] text-center">
            <p className="text-gray-600 italic">
              📊 Visual preview of team dashboard coming soon
            </p>
          </div>
        </div>
      </section>

      {/* Stakes - What's at Risk */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[var(--navy)] text-center mb-12">
            What happens when people serve outside their gifting?
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
              {[
                'Your best volunteers quit (and you don\'t know why)',
                'Ministry feels like obligation instead of joy',
                'You spend more time recruiting than discipling',
                'People serve for 6 months and disappear',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p className="text-gray-700 text-lg">{item}</p>
                </div>
              ))}
            </div>

            <div className="bg-[var(--navy)] text-white p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-4 text-[var(--gold)]">
                The Worst Part?
              </h3>
              <p className="text-lg leading-relaxed mb-4">
                They think <em>they&apos;re</em> the problem.
              </p>
              <p className="text-lg leading-relaxed">
                But the problem isn&apos;t them.<br />
                <strong>It&apos;s the wrong fit.</strong>
              </p>
            </div>
          </div>

          <div className="text-center bg-blue-50 p-8 rounded-2xl border-2 border-[var(--teal)]">
            <p className="text-2xl font-semibold text-[var(--navy)] mb-3">
              What if you could place every team member in their sweet spot—
            </p>
            <p className="text-xl text-gray-700">
              where they&apos;re <strong>energized</strong>, <strong>effective</strong>, and operating in their <strong>God-given design</strong>?
            </p>
          </div>
        </div>
      </section>

      {/* Guide - We Understand + Authority */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[var(--navy)] mb-6">
            Not another personality test.
          </h2>
          <p className="text-xl text-gray-700 mb-8 leading-relaxed max-w-3xl mx-auto">
            At DNA Discipleship, we help churches discover and deploy their teams
            according to their biblical gifting. We specialize in equipping leaders to build
            multiplication movements—not burn people out.
          </p>
        </div>
      </section>

      {/* Proof - Real Transformation */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[var(--gold)]/10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-start gap-4 mb-6">
              <svg className="w-12 h-12 text-[var(--gold)] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <div>
                <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                  "Before the assessment, I had John on the greeting team. He was polite but drained.
                  Turns out he&apos;s wired for <strong>teaching</strong>. Now he leads our men&apos;s Bible study and he&apos;s <strong className="text-[var(--teal)]">THRIVING</strong>."
                </p>
                <p className="text-sm font-semibold text-[var(--navy)]">
                  — Pastor Mike, Journey Church (Columbus, OH)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section - CTA */}
      <section id="get-access" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--navy)] to-[var(--navy)]/90">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Get Free Team Assessment
            </h2>
            <p className="text-xl text-gray-200">
              Stop losing your best people to burnout.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-2xl">
            <SpiritualGiftsLeaderForm />
          </div>

          <p className="text-center text-gray-300 mt-6 text-sm">
            🔒 We'll never spam you. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* Success Vision */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[var(--navy)] mb-8">
            Imagine a Team Where...
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: '⚡', text: 'Every person serves in their sweet spot' },
              { icon: '🔥', text: 'Burnout is replaced with energized ministry' },
              { icon: '📈', text: 'Your church multiplies leaders instead of losing them' },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-md">
                <div className="text-4xl mb-3">{item.icon}</div>
                <p className="text-gray-700 font-medium">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-white p-8 rounded-2xl border-2 border-[var(--gold)]">
            <p className="text-2xl font-bold text-[var(--navy)] mb-4">
              When your team serves in their gifts:
            </p>
            <ul className="text-left max-w-xl mx-auto space-y-3 text-lg">
              {[
                'Retention goes up',
                'Recruitment gets easier',
                'Ministry becomes sustainable',
                'People actually enjoy serving',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Why Biblical Gifts Matter */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-[var(--navy)] mb-6 text-center">
            Why Biblical Gifts Matter More Than Personality
          </h2>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            This isn&apos;t about preferences (introvert vs extrovert).
          </p>
          <p className="text-xl text-gray-700 mb-4 leading-relaxed">
            This is about God-given <strong>FUNCTION</strong>—what you were designed to <em>DO</em>.
          </p>
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            Our assessment identifies where people will be most effective and fulfilled—not just comfortable.
          </p>
          <div className="bg-[var(--navy)] text-white p-6 rounded-xl">
            <p className="text-lg leading-relaxed">
              Romans 12, 1 Corinthians 12, and Ephesians 4 aren&apos;t suggestions.<br />
              <strong className="text-[var(--gold)] text-xl">They're your team blueprint.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--teal)] to-[var(--navy)] text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">
            Stop Losing Your Best People
          </h2>
          <p className="text-xl mb-10 leading-relaxed">
            Get your free team assessment and place every team member<br />
            in the role they were designed for.
          </p>
          <a
            href="#get-access"
            className="inline-block bg-[var(--gold)] text-white px-12 py-6 rounded-lg font-bold text-2xl hover:opacity-90 transition-opacity shadow-2xl"
          >
            Get Free Team Assessment
          </a>
          <p className="text-sm text-gray-200 mt-6">
            No credit card. No commitment. Just clarity.<br />
            ⏰ <strong>Only 50 spots available this month</strong>
          </p>
        </div>
      </section>
    </div>
  );
}
