'use client';

import { useSearchParams } from 'next/navigation';
import { CheckCircle, Download, BookOpen, Rocket, Compass } from 'lucide-react';
import { Suspense } from 'react';

type ReadinessLevel = 'ready' | 'building' | 'exploring';

// PDF URLs - placeholders until actual PDFs are hosted
const PDF_URLS = {
  threeStepsReady: process.env.NEXT_PUBLIC_THREE_STEPS_READY_URL || '#',
  threeStepsBuilding: process.env.NEXT_PUBLIC_THREE_STEPS_BUILDING_URL || '#',
  threeStepsExploring: process.env.NEXT_PUBLIC_THREE_STEPS_EXPLORING_URL || '#',
  launchGuide: process.env.NEXT_PUBLIC_LAUNCH_GUIDE_URL || '#',
  dnaManual: process.env.NEXT_PUBLIC_DNA_MANUAL_URL || '#',
};

// Google Calendar embed URL for Discovery Call (15 min) - configured in .env.local
const DISCOVERY_CALENDAR_EMBED = process.env.NEXT_PUBLIC_DISCOVERY_CALENDAR_URL || 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ0LdUpKkvo_qoOrtiu6fQfPgkQJUZaG9RxPtYVieJrl1RAFnUmgTN9WATs6jAxSbkdo5M4-bpfI?gv=true';

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
  calendarIncentive: string;
}

const tieredContent: Record<ReadinessLevel, TieredContent> = {
  ready: {
    readinessHeadline: "You're Ready to Launch!",
    readinessMessage: "Your church shows strong alignment for DNA implementation. You have the leadership buy-in and foundation in place to move quickly.",
    readinessIcon: <Rocket className="w-8 h-8" />,
    threeStepsPdfUrl: PDF_URLS.threeStepsReady,
    resource: {
      title: 'Get Your Launch Guide',
      description: "Everything you need to prepare for a successful DNA launch at your church.",
      buttonText: 'Download Launch Guide',
      pdfUrl: PDF_URLS.launchGuide,
    },
    calendarIncentive: "Book Your Discovery Call and Receive the 8-Week Toolkit",
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
    calendarIncentive: "Book Your Discovery Call and Receive the Launch Guide",
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
    calendarIncentive: "Book Your Discovery Call",
  },
};

function ThankYouContent() {
  const searchParams = useSearchParams();
  const level = (searchParams.get('level') as ReadinessLevel) || 'building';
  const churchName = searchParams.get('church') || 'your church';

  const content = tieredContent[level] || tieredContent.building;

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
          <a
            href={content.threeStepsPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-dark text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
            Download Your 3 Steps Guide (PDF)
          </a>
        </div>

        {/* Readiness Level Message with Integrated Resource */}
        <div className={`card mb-8 ${
          level === 'ready' ? 'bg-success/5 border-success/20' :
          level === 'building' ? 'bg-gold/5 border-gold/20' :
          'bg-teal/5 border-teal/20'
        } border`}>
          <div className="flex items-start gap-4 mb-6">
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

          {/* Nested Resource Box */}
          <div className="bg-white rounded-lg p-4 border border-border">
            <h4 className="font-semibold text-navy mb-1">{content.resource.title}</h4>
            <p className="text-foreground-muted text-sm mb-3">{content.resource.description}</p>
            <a
              href={content.resource.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 font-medium transition-colors ${
                level === 'ready' ? 'text-success hover:text-success/80' : 'text-teal hover:text-teal-light'
              }`}
            >
              <Download className="w-4 h-4" />
              {content.resource.buttonText}
            </a>
          </div>
        </div>

        {/* Embedded Google Calendar */}
        <div className="card">
          <h3 className="text-xl font-semibold text-navy mb-2 text-center">{content.calendarIncentive}</h3>
          <p className="text-foreground-muted text-center mb-6">
            Choose a time that works for you. This is a 15-minute conversation to see if DNA is right for {churchName}.
          </p>
          <div className="rounded-lg overflow-hidden border border-border">
            <iframe
              src={DISCOVERY_CALENDAR_EMBED}
              style={{ border: 0 }}
              width="100%"
              height="600"
              frameBorder="0"
              title="Book Discovery Call"
            />
          </div>
        </div>

        {/* What Happens Next */}
        <div className="mt-10 text-center text-foreground-muted">
          <p className="text-sm">
            <strong>What happens next?</strong> We&apos;ll also review your assessment and reach out within 2 business days.
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
