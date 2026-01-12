'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Clock,
  FileText,
  Download,
  Calendar,
  ArrowRight,
  Loader2,
  LogOut,
  User,
  Phone,
  Video,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

interface PortalData {
  church: {
    id: string;
    name: string;
    status: string;
    created_at: string;
  };
  leader: {
    id: string;
    name: string;
    email: string;
  };
  assessment: {
    id: string;
    contact_name: string;
    contact_email: string;
    church_name: string;
    submitted_at: string;
    congregation_size?: string;
    why_interested?: string;
    pastor_commitment_level?: string;
    desired_launch_timeline?: string;
  } | null;
  documents: Array<{
    id: string;
    document_type: string;
    file_url?: string;
    notes?: string;
    created_at: string;
  }>;
  nextCall: {
    id: string;
    call_type: string;
    scheduled_at: string;
  } | null;
  completedCalls: Array<{
    id: string;
    call_type: string;
    scheduled_at: string;
    notes?: string;
  }>;
}

const STATUS_INFO: Record<string, { label: string; description: string; color: string }> = {
  pending_assessment: {
    label: 'Assessment Submitted',
    description: 'We\'re reviewing your assessment and will be in touch soon.',
    color: 'bg-gold/10 text-gold',
  },
  awaiting_discovery: {
    label: 'Discovery Call',
    description: 'Book your 15-minute discovery call to discuss if DNA is right for your church.',
    color: 'bg-teal/10 text-teal',
  },
  proposal_sent: {
    label: 'Proposal Sent',
    description: 'Review your partnership proposal and book a call to discuss options.',
    color: 'bg-gold/10 text-gold',
  },
  awaiting_agreement: {
    label: 'Agreement Phase',
    description: 'Book your agreement call to finalize partnership details.',
    color: 'bg-teal/10 text-teal',
  },
  awaiting_strategy: {
    label: 'Strategy Call',
    description: 'Book your strategy call to create your implementation plan and get dashboard access.',
    color: 'bg-success/10 text-success',
  },
};

const CALL_INFO: Record<string, { label: string; duration: string; purpose: string; icon: typeof Phone }> = {
  discovery: {
    label: 'Discovery Call',
    duration: '15 min',
    purpose: 'Quick fit check to see if DNA is right for your church context.',
    icon: Phone,
  },
  proposal: {
    label: 'Proposal Call',
    duration: '30 min',
    purpose: 'Review partnership options and discuss which tier is right for you.',
    icon: Video,
  },
  strategy: {
    label: 'Strategy Call',
    duration: '60 min',
    purpose: 'Create your implementation plan and get full dashboard access.',
    icon: Video,
  },
};

const BOOKING_LINKS: Record<string, string> = {
  discovery: 'https://calendar.app.google/Qi2b2ZNx163nYdeR7',
  proposal: 'https://calendar.app.google/QCxrVixhV9yV8dvD7',
  strategy: 'https://calendar.app.google/DaGEKGrMrYdfsTAr7',
};

export default function PortalPage() {
  const router = useRouter();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortalData();
  }, []);

  const fetchPortalData = async () => {
    try {
      const response = await fetch('/api/portal');

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (response.status === 302 || response.status === 307) {
        // Church is active, redirect to dashboard
        router.push('/dashboard');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch portal data');
      }

      const portalData = await response.json();

      // If church is active, redirect to full dashboard
      if (portalData.church.status === 'active') {
        router.push('/dashboard');
        return;
      }

      setData(portalData);
    } catch (error) {
      console.error('Portal error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const getNextCallType = (status: string): string | null => {
    switch (status) {
      case 'pending_assessment':
      case 'awaiting_discovery':
        return 'discovery';
      case 'proposal_sent':
      case 'awaiting_agreement':
        return 'proposal';
      case 'awaiting_strategy':
        return 'strategy';
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground-muted">Failed to load portal</p>
      </div>
    );
  }

  const { church, leader, assessment, documents, nextCall, completedCalls } = data;
  const statusInfo = STATUS_INFO[church.status] || STATUS_INFO.pending_assessment;
  const suggestedCallType = getNextCallType(church.status);
  const suggestedCallInfo = suggestedCallType ? CALL_INFO[suggestedCallType] : null;

  // Get documents by type
  const discoveryNotes = documents.find(d => d.document_type === 'discovery_notes');
  const proposalPdf = documents.find(d => d.document_type === 'proposal_pdf');
  const agreementNotes = documents.find(d => d.document_type === 'agreement_notes');
  const agreementPdf = documents.find(d => d.document_type === 'agreement_pdf');
  const threeStepsPdf = documents.find(d => d.document_type === '3_steps_pdf');

  // Timeline steps
  const steps = [
    { key: 'assessment', label: 'Assessment', completed: true },
    { key: 'discovery', label: 'Discovery Call', completed: completedCalls.some(c => c.call_type === 'discovery') || ['proposal_sent', 'awaiting_agreement', 'awaiting_strategy', 'active'].includes(church.status) },
    { key: 'proposal', label: 'Proposal Call', completed: completedCalls.some(c => c.call_type === 'proposal') || ['awaiting_strategy', 'active'].includes(church.status) },
    { key: 'strategy', label: 'Strategy Call', completed: church.status === 'active' },
    { key: 'dashboard', label: 'Dashboard Access', completed: church.status === 'active' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-gold font-medium text-sm tracking-wide">DNA PARTNERSHIP</p>
            <p className="font-semibold">{church.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <User className="w-4 h-4" />
              <span>{leader.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-300 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Status Banner */}
        <div className={`card mb-8 ${statusInfo.color.replace('text-', 'border-l-4 border-')}`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${statusInfo.color}`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-navy text-lg">{statusInfo.label}</h2>
              <p className="text-foreground-muted mt-1">{statusInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="card mb-8">
          <h3 className="font-semibold text-navy mb-6">Your Journey to DNA Implementation</h3>
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-card-border" />
            <div
              className="absolute top-4 left-0 h-0.5 bg-gold transition-all duration-500"
              style={{ width: `${(steps.filter(s => s.completed).length - 1) / (steps.length - 1) * 100}%` }}
            />

            {steps.map((step, i) => (
              <div key={step.key} className="relative flex flex-col items-center z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step.completed
                    ? 'bg-gold border-gold text-white'
                    : 'bg-white border-card-border text-foreground-muted'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-medium">{i + 1}</span>
                  )}
                </div>
                <span className={`text-xs mt-2 text-center max-w-[80px] ${
                  step.completed ? 'text-navy font-medium' : 'text-foreground-muted'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Appointment / Book Call */}
        {nextCall ? (
          <div className="card mb-8 border-l-4 border-teal">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-teal" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-navy">
                  Upcoming: {CALL_INFO[nextCall.call_type]?.label || 'Call'}
                </h3>
                <p className="text-foreground-muted mt-1">
                  {formatDate(nextCall.scheduled_at)}
                </p>
                <p className="text-sm text-foreground-muted mt-2">
                  {CALL_INFO[nextCall.call_type]?.purpose}
                </p>
              </div>
            </div>
          </div>
        ) : suggestedCallType && suggestedCallInfo ? (
          <div className="card mb-8 bg-navy text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                <suggestedCallInfo.icon className="w-6 h-6 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Next Step: {suggestedCallInfo.label}</h3>
                <p className="text-gray-300 mt-1">{suggestedCallInfo.duration} • {suggestedCallInfo.purpose}</p>
                <a
                  href={BOOKING_LINKS[suggestedCallType]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gold hover:bg-gold-dark text-white font-medium px-6 py-3 rounded-lg transition-colors mt-4"
                >
                  Book Your {suggestedCallInfo.label}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Your Documents */}
          <div className="card">
            <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold" />
              Your Documents
            </h3>
            <div className="space-y-3">
              {/* 3 Steps Resource - Always shown after assessment */}
              <a
                href={threeStepsPdf?.file_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  threeStepsPdf?.file_url
                    ? 'bg-success/5 hover:bg-success/10 cursor-pointer'
                    : 'bg-background-secondary cursor-not-allowed opacity-50'
                }`}
              >
                <Download className={`w-5 h-5 ${threeStepsPdf?.file_url ? 'text-success' : 'text-foreground-muted'}`} />
                <div className="flex-1">
                  <p className="font-medium text-navy text-sm">3 Steps to Becoming a Community That Multiplies</p>
                  <p className="text-xs text-foreground-muted">Your assessment reward</p>
                </div>
                {threeStepsPdf?.file_url && <ExternalLink className="w-4 h-4 text-foreground-muted" />}
              </a>

              {/* Proposal PDF - Only after discovery */}
              {proposalPdf?.file_url && (
                <a
                  href={proposalPdf.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gold/5 hover:bg-gold/10 rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5 text-gold" />
                  <div className="flex-1">
                    <p className="font-medium text-navy text-sm">Partnership Proposal</p>
                    <p className="text-xs text-foreground-muted">Your 3-tier options</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-foreground-muted" />
                </a>
              )}

              {/* Agreement PDF - Only after agreement */}
              {agreementPdf?.file_url && (
                <a
                  href={agreementPdf.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-teal/5 hover:bg-teal/10 rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5 text-teal" />
                  <div className="flex-1">
                    <p className="font-medium text-navy text-sm">Partnership Agreement</p>
                    <p className="text-xs text-foreground-muted">Your finalized agreement</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-foreground-muted" />
                </a>
              )}

              {/* No documents yet message */}
              {!threeStepsPdf?.file_url && !proposalPdf?.file_url && !agreementPdf?.file_url && (
                <p className="text-sm text-foreground-muted text-center py-4">
                  Documents will appear here as you progress through the partnership process.
                </p>
              )}
            </div>
          </div>

          {/* Call Notes */}
          <div className="card">
            <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-teal" />
              Call Notes
            </h3>
            <div className="space-y-3">
              {/* Discovery Notes */}
              {discoveryNotes?.notes && (
                <div className="p-3 bg-background-secondary rounded-lg">
                  <p className="font-medium text-navy text-sm mb-1">Discovery Call Notes</p>
                  <p className="text-sm text-foreground-muted whitespace-pre-wrap">{discoveryNotes.notes}</p>
                </div>
              )}

              {/* Agreement Notes */}
              {agreementNotes?.notes && (
                <div className="p-3 bg-background-secondary rounded-lg">
                  <p className="font-medium text-navy text-sm mb-1">Agreement Call Notes</p>
                  <p className="text-sm text-foreground-muted whitespace-pre-wrap">{agreementNotes.notes}</p>
                </div>
              )}

              {/* No notes yet */}
              {!discoveryNotes?.notes && !agreementNotes?.notes && (
                <p className="text-sm text-foreground-muted text-center py-4">
                  Notes from your calls will appear here.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Assessment Summary */}
        {assessment && (
          <div className="card mt-6">
            <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold" />
              Your Assessment Summary
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-foreground-muted">Submitted</p>
                <p className="font-medium text-navy">{formatShortDate(assessment.submitted_at)}</p>
              </div>
              {assessment.congregation_size && (
                <div>
                  <p className="text-foreground-muted">Congregation Size</p>
                  <p className="font-medium text-navy">{assessment.congregation_size}</p>
                </div>
              )}
              {assessment.pastor_commitment_level && (
                <div>
                  <p className="text-foreground-muted">Pastor Commitment</p>
                  <p className="font-medium text-navy capitalize">{assessment.pastor_commitment_level.replace('_', ' ')}</p>
                </div>
              )}
              {assessment.desired_launch_timeline && (
                <div>
                  <p className="text-foreground-muted">Desired Timeline</p>
                  <p className="font-medium text-navy">{assessment.desired_launch_timeline}</p>
                </div>
              )}
              {assessment.why_interested && (
                <div className="md:col-span-2">
                  <p className="text-foreground-muted">Why DNA?</p>
                  <p className="font-medium text-navy">{assessment.why_interested}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 text-center text-foreground-muted">
          <p>
            Questions?{' '}
            <a href="mailto:travis@arkidentity.com" className="text-teal hover:text-teal-light">
              Email Travis
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
