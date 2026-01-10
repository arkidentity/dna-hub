'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Calendar, BookOpen, Users, Target, ArrowRight } from 'lucide-react';
import { Suspense } from 'react';

type ReadinessLevel = 'ready' | 'building' | 'exploring';

interface StepContent {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const stepsContent: Record<ReadinessLevel, { headline: string; subheadline: string; steps: StepContent[] }> = {
  ready: {
    headline: 'You\'re Ready to Launch',
    subheadline: 'Your church has the foundation in place. Here\'s how to move forward quickly.',
    steps: [
      {
        title: 'Confirm Your DNA Champion',
        description: 'Finalize who will lead this initiative. They\'ll be your point person for training, communication, and ongoing support.',
        icon: <Users className="w-6 h-6" />,
      },
      {
        title: 'Identify Your First 3-5 Leaders',
        description: 'Look for people who are spiritually mature, faithful, and hungry to multiply. They don\'t need to be perfect—just willing.',
        icon: <Target className="w-6 h-6" />,
      },
      {
        title: 'Schedule Your Discovery Call',
        description: 'Let\'s talk through your specific context and create a launch timeline. We\'ll make sure you\'re set up for success.',
        icon: <Calendar className="w-6 h-6" />,
      },
    ],
  },
  building: {
    headline: 'You\'re Building the Foundation',
    subheadline: 'You\'re on the right track. A few key pieces will set you up for a strong launch.',
    steps: [
      {
        title: 'Read the DNA Manual',
        description: 'Start with the theology and heart behind DNA. This 6-session resource will give you and your leaders a shared vision for multiplication.',
        icon: <BookOpen className="w-6 h-6" />,
      },
      {
        title: 'Get Leadership Alignment',
        description: 'Before launching to the church, make sure your elders/board are fully on board. DNA works best when it\'s championed from the top.',
        icon: <Users className="w-6 h-6" />,
      },
      {
        title: 'Schedule Your Discovery Call',
        description: 'We\'ll help you think through timing, leader selection, and how to communicate DNA to your congregation.',
        icon: <Calendar className="w-6 h-6" />,
      },
    ],
  },
  exploring: {
    headline: 'You\'re Exploring the Possibilities',
    subheadline: 'Great that you\'re thinking about discipleship multiplication. Here\'s where to start.',
    steps: [
      {
        title: 'Read the DNA Manual',
        description: 'Before anything else, understand what DNA is and isn\'t. The manual covers the theology, process, and vision for multiplication discipleship.',
        icon: <BookOpen className="w-6 h-6" />,
      },
      {
        title: 'Cast Vision to Your Leadership',
        description: 'Share what you\'re learning with your pastor or board. DNA requires buy-in from the top to succeed long-term.',
        icon: <Users className="w-6 h-6" />,
      },
      {
        title: 'Schedule Your Discovery Call',
        description: 'Even if you\'re early in the process, we can help you think through whether DNA is right for your context and what it would take to launch.',
        icon: <Calendar className="w-6 h-6" />,
      },
    ],
  },
};

function ThankYouContent() {
  const searchParams = useSearchParams();
  const level = (searchParams.get('level') as ReadinessLevel) || 'building';
  const churchName = searchParams.get('church') || 'your church';

  const content = stepsContent[level] || stepsContent.building;

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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-6">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-navy mb-3">Assessment Received</h1>
          <p className="text-foreground-muted text-lg">
            Thanks for taking the time to tell us about {churchName}.
          </p>
        </div>

        {/* Personalized 3 Steps */}
        <div className="card mb-10">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-navy mb-2">{content.headline}</h2>
            <p className="text-foreground-muted">{content.subheadline}</p>
          </div>

          <div className="space-y-6">
            {content.steps.map((step, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gold/10 text-gold rounded-full flex items-center justify-center">
                  {step.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-navy mb-1">
                    Step {index + 1}: {step.title}
                  </h3>
                  <p className="text-foreground-muted text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA: Book Discovery Call */}
        <div className="card bg-navy text-white text-center">
          <h3 className="text-xl font-semibold mb-3">Ready to Take the Next Step?</h3>
          <p className="text-white/80 mb-6">
            Schedule a 15-minute discovery call. We&apos;ll review your assessment together and see if DNA is a good fit for {churchName}.
          </p>
          <a
            href="https://calendly.com/arkidentity"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-dark text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Book Your Discovery Call
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* What Happens Next */}
        <div className="mt-10 text-center text-foreground-muted">
          <p className="text-sm">
            <strong>What happens next?</strong> We&apos;ll review your assessment and reach out within 2 business days.
            <br />
            Questions? Email <a href="mailto:travis@arkidentity.com" className="text-teal hover:text-teal-light">travis@arkidentity.com</a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function AssessmentThankYouPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground-muted">Loading...</div>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}
