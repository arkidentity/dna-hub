'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Download, BookOpen, Rocket, Compass, ArrowRight } from 'lucide-react';
import { Suspense } from 'react';

type ReadinessLevel = 'ready' | 'building' | 'exploring';

const PDF_URLS = {
  threeStepsReady: process.env.NEXT_PUBLIC_THREE_STEPS_READY_URL || '#',
  threeStepsBuilding: process.env.NEXT_PUBLIC_THREE_STEPS_BUILDING_URL || '#',
  threeStepsExploring: process.env.NEXT_PUBLIC_THREE_STEPS_EXPLORING_URL || '#',
  dnaManual: process.env.NEXT_PUBLIC_DNA_MANUAL_URL || '#',
};

interface TieredContent {
  readinessHeadline: string;
  readinessMessage: string;
  readinessIcon: React.ReactNode;
  threeStepsPdfUrl: string;
  resource: {
    title: string;
    description: string;
    buttonText: string;
    pdfUrl: string;
  };
  callHeading: string;
  callSubtext: string;
}

const tieredContent: Record<ReadinessLevel, TieredContent> = {
  ready: {
    readinessHeadline: "You're Ready to Launch!",
    readinessMessage: "Your church shows strong alignment for DNA implementation. You have the leadership buy-in and foundation in place to move quickly.",
    readinessIcon: <Rocket className="w-8 h-8" />,
    threeStepsPdfUrl: PDF_URLS.threeStepsReady,
    resource: { title: '', description: '', buttonText: '', pdfUrl: '' },
    callHeading: "Book Your Discovery Call — Receive the DNA Launch Guide",
    callSubtext: "A 15-minute conversation to talk through DNA and unlock your Church Dashboard with the Launch Guide included.",
  },
  building: {
    readinessHeadline: "You're Building the Foundation",
    readinessMessage: "You're on the right track. There are a few things to align before launching DNA, and we can help you get there.",
    readinessIcon: <BookOpen className="w-8 h-8" />,
    threeStepsPdfUrl: PDF_URLS.threeStepsBuilding,
    resource: {
      title: 'Read the DNA Manual',
      description: "Understand the theology and heart behind DNA. Share it with your leadership team.",
      buttonText: 'Download DNA Manual',
      pdfUrl: PDF_URLS.dnaManual,
    },
    callHeading: "Book Your Discovery Call — Receive the DNA Launch Guide",
    callSubtext: "A 15-minute conversation to talk through where your church is and unlock your Church Dashboard with the Launch Guide.",
  },
  exploring: {
    readinessHeadline: "You're in Discovery Mode",
    readinessMessage: "DNA might be a good fit down the road. Start by understanding the vision and sharing it with your team.",
    readinessIcon: <Compass className="w-8 h-8" />,
    threeStepsPdfUrl: PDF_URLS.threeStepsExploring,
    resource: {
      title: 'Read the DNA Manual',
      description: "Start with the 'why' behind multiplication discipleship before the 'how'.",
      buttonText: 'Download DNA Manual',
      pdfUrl: PDF_URLS.dnaManual,
    },
    callHeading: "Book a Discovery Call",
    callSubtext: "A 15-minute conversation to talk through your church's path and whether DNA is the right fit.",
  },
};

function ThankYouContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const level = (searchParams.get('level') as ReadinessLevel) || 'building';
  const churchName = searchParams.get('church') || 'your church';
  const email = searchParams.get('email') || '';
  const firstName = searchParams.get('name') || '';

  const content = tieredContent[level] || tieredContent.building;

  const bookingParams = new URLSearchParams({
    ...(email && { email }),
    ...(firstName && { name: firstName }),
    church: churchName,
    level,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold font-medium text-sm tracking-wide">DNA CHURCH HUB</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">

        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-6">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-navy mb-2">Assessment Received</h1>
          <p className="text-foreground-muted">
            Thanks for telling us about {churchName}.
          </p>
        </div>

        {/* 3 Steps Resource */}
        <div className="card text-center mb-8">
          <h2 className="text-2xl font-semibold text-navy mb-2">
            3 Steps to Becoming a Community That Multiplies
          </h2>
          <p className="text-foreground-muted mb-6">
            Your personalized guide based on where {churchName} is right now.
          </p>
          {content.threeStepsPdfUrl && content.threeStepsPdfUrl !== '#' ? (
            <a
              href={content.threeStepsPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gold hover:bg-gold-dark text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Your 3 Steps Guide (PDF)
            </a>
          ) : (
            <p className="text-foreground-muted text-sm italic">Your guide is being prepared — we&apos;ll send it to you by email.</p>
          )}
        </div>

        {/* Readiness Level */}
        <div className={`card mb-8 border ${
          level === 'ready' ? 'bg-success/5 border-success/20' :
          level === 'building' ? 'bg-gold/5 border-gold/20' :
          'bg-teal/5 border-teal/20'
        }`}>
          <div className="flex items-start gap-4 mb-4">
            <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center ${
              level === 'ready' ? 'bg-success/10 text-success' :
              level === 'building' ? 'bg-gold/10 text-gold' :
              'bg-teal/10 text-teal'
            }`}>
              {content.readinessIcon}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-navy mb-1">{content.readinessHeadline}</h3>
              <p className="text-foreground-muted">{content.readinessMessage}</p>
            </div>
          </div>

          {/* DNA Manual resource — shown for building/exploring only */}
          {level !== 'ready' && content.resource.title && (
            <div className="bg-white rounded-lg p-4 border border-border">
              <h4 className="font-semibold text-navy mb-1">{content.resource.title}</h4>
              <p className="text-foreground-muted text-sm mb-3">{content.resource.description}</p>
              {content.resource.pdfUrl && content.resource.pdfUrl !== '#' ? (
                <a
                  href={content.resource.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-teal hover:text-teal-light transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {content.resource.buttonText}
                </a>
              ) : (
                <p className="text-foreground-muted text-sm italic">Coming soon</p>
              )}
            </div>
          )}
        </div>

        {/* Book a Discovery Call CTA */}
        <div className="card text-center">
          <h3 className="text-xl font-semibold text-navy mb-2">{content.callHeading}</h3>
          <p className="text-foreground-muted mb-6 max-w-lg mx-auto">{content.callSubtext}</p>
          <button
            onClick={() => router.push(`/assessment/book-call?${bookingParams.toString()}`)}
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-dark text-white font-semibold px-8 py-4 rounded-lg transition-colors text-base"
          >
            Book a Discovery Call
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-foreground-muted text-xs mt-3">
            Free · 15 minutes · Choose a time that works for you
          </p>
        </div>

        {/* Footer note */}
        <div className="mt-10 text-center text-foreground-muted">
          <p className="text-sm">
            <strong>What happens next?</strong> We&apos;ll also review your assessment and reach out within 2 business days.
            <br />
            Questions? Email{' '}
            <a href="mailto:info@dnadiscipleship.com" className="text-teal hover:text-teal-light">
              info@dnadiscipleship.com
            </a>
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
