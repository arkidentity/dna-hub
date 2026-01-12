'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Upload,
  Save,
  X,
  Loader2,
  ExternalLink,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Check,
  MessageSquare,
  Pencil,
  Send,
} from 'lucide-react';

// Mock data for a test church
const MOCK_CHURCH_DATA = {
  church: {
    id: 'test-church-1',
    name: 'Grace Community Church',
    status: 'awaiting_strategy',
    current_phase: 1,
    created_at: '2025-01-05T10:00:00Z',
  },
  leader: {
    id: 'leader-1',
    name: 'Pastor James Wilson',
    email: 'james@gracecommunity.org',
    phone: '(555) 123-4567',
  },
  assessment: {
    id: 'assess-1',
    contact_name: 'Pastor James Wilson',
    contact_email: 'james@gracecommunity.org',
    church_name: 'Grace Community Church',
    submitted_at: '2025-01-05T10:00:00Z',
    congregation_size: '150-300',
    why_interested: 'We want to establish a stronger discipleship culture and help our members grow deeper in their faith.',
    pastor_commitment_level: 'fully_committed',
    desired_launch_timeline: '3-6 months',
    current_discipleship_approach: 'Small groups that meet weekly, but lacking structure',
    identified_leaders: 8,
    potential_barriers: 'Time constraints for leaders, need for training materials',
    first_year_goals: 'Launch 4 DNA groups with trained leaders, establish multiplication mindset',
    additional_questions: 'How do we handle leaders who are nervous about facilitating?',
  },
  documents: [
    {
      id: 'doc-1',
      document_type: '3_steps_pdf',
      file_url: '#',
      notes: null,
      created_at: '2025-01-05T10:30:00Z',
    },
    {
      id: 'doc-2',
      document_type: 'discovery_notes',
      file_url: null,
      notes: 'Great conversation! Pastor is very motivated. Has 8 potential leaders identified. Main concern is time for training.',
      created_at: '2025-01-08T14:00:00Z',
    },
    {
      id: 'doc-3',
      document_type: 'proposal_pdf',
      file_url: '#',
      notes: 'Sent Catalyst tier proposal based on church size and readiness.',
      created_at: '2025-01-10T09:00:00Z',
    },
  ],
  calls: [
    {
      id: 'call-1',
      call_type: 'discovery',
      scheduled_at: '2025-01-08T14:00:00Z',
      completed: true,
      notes: 'Excellent call. Pastor is very engaged and has clear vision for discipleship.',
    },
    {
      id: 'call-2',
      call_type: 'proposal',
      scheduled_at: '2025-01-12T10:00:00Z',
      completed: true,
      notes: 'Discussed Catalyst tier. They are ready to proceed.',
    },
  ],
  phases: [
    {
      id: 'phase-0',
      phase_number: 0,
      name: 'Onboarding',
      description: 'Complete initial setup and orientation',
      status: 'completed',
      completedCount: 3,
      totalCount: 3,
      milestones: [
        { id: 'm0-1', title: 'Agreement signed', is_key_milestone: true, progress: { completed: true, completed_at: '2025-01-15' } },
        { id: 'm0-2', title: 'Portal access confirmed', is_key_milestone: false, progress: { completed: true, completed_at: '2025-01-15' } },
        { id: 'm0-3', title: 'Strategy call completed', is_key_milestone: true, progress: { completed: true, completed_at: '2025-01-18' } },
      ],
    },
    {
      id: 'phase-1',
      phase_number: 1,
      name: 'Church Partnership',
      description: 'Establish partnership and alignment',
      status: 'current',
      completedCount: 2,
      totalCount: 5,
      milestones: [
        { id: 'm1-1', title: 'Pastor completes DNA overview', is_key_milestone: true, progress: { completed: true, completed_at: '2025-01-20' } },
        { id: 'm1-2', title: 'Leadership team introduction', is_key_milestone: false, progress: { completed: true, completed_at: '2025-01-22' } },
        { id: 'm1-3', title: 'Vision casting session scheduled', is_key_milestone: true, progress: { completed: false, target_date: '2025-02-01' } },
        { id: 'm1-4', title: 'Church calendar integration', is_key_milestone: false, progress: { completed: false } },
        { id: 'm1-5', title: 'Communication plan established', is_key_milestone: false, progress: { completed: false } },
      ],
    },
    {
      id: 'phase-2',
      phase_number: 2,
      name: 'Leader Preparation',
      description: 'Train and equip DNA group leaders',
      status: 'locked',
      completedCount: 0,
      totalCount: 6,
      milestones: [
        { id: 'm2-1', title: 'Leader identification complete', is_key_milestone: true, progress: { completed: false } },
        { id: 'm2-2', title: 'Leader training scheduled', is_key_milestone: false, progress: { completed: false } },
        { id: 'm2-3', title: 'Training materials distributed', is_key_milestone: false, progress: { completed: false } },
        { id: 'm2-4', title: 'First training session complete', is_key_milestone: true, progress: { completed: false } },
        { id: 'm2-5', title: 'Practice sessions scheduled', is_key_milestone: false, progress: { completed: false } },
        { id: 'm2-6', title: 'Leader assessment complete', is_key_milestone: true, progress: { completed: false } },
      ],
    },
  ],
};

const DOCUMENT_TYPES = [
  { type: '3_steps_pdf', label: '3 Steps Guide', description: 'Assessment reward resource' },
  { type: 'discovery_notes', label: 'Discovery Notes', description: 'Notes from discovery call' },
  { type: 'proposal_pdf', label: 'Proposal PDF', description: '3-tier partnership proposal' },
  { type: 'agreement_notes', label: 'Agreement Notes', description: 'Notes from agreement call' },
  { type: 'agreement_pdf', label: 'Agreement PDF', description: 'Final signed agreement' },
];

export default function TestAdminChurchPage() {
  const [data, setData] = useState(MOCK_CHURCH_DATA);
  const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'dashboard'>('overview');

  // Document editing
  const [editingDoc, setEditingDoc] = useState<string | null>(null);
  const [docNotes, setDocNotes] = useState('');
  const [savingDoc, setSavingDoc] = useState(false);

  // Call scheduling
  const [addingCall, setAddingCall] = useState<string | null>(null);
  const [callDate, setCallDate] = useState('');
  const [savingCall, setSavingCall] = useState(false);

  // Dashboard state
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['phase-0', 'phase-1']));

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Mock handlers (just update local state for demo)
  const handleScheduleCall = (callType: string) => {
    if (!callDate) return;
    setSavingCall(true);

    // Simulate API call
    setTimeout(() => {
      const newCall = {
        id: `call-${Date.now()}`,
        call_type: callType,
        scheduled_at: new Date(callDate).toISOString(),
        completed: false,
        notes: undefined,
      };
      setData(prev => ({
        ...prev,
        calls: [...prev.calls, newCall],
      }));
      setAddingCall(null);
      setCallDate('');
      setSavingCall(false);
    }, 500);
  };

  const handleCompleteCall = (callId: string) => {
    setData(prev => ({
      ...prev,
      calls: prev.calls.map(c =>
        c.id === callId ? { ...c, completed: true } : c
      ),
    }));
  };

  const handleSaveDocNotes = (docType: string) => {
    setSavingDoc(true);
    setTimeout(() => {
      const existingDocIndex = data.documents.findIndex(d => d.document_type === docType);
      if (existingDocIndex >= 0) {
        const newDocs = [...data.documents];
        newDocs[existingDocIndex] = { ...newDocs[existingDocIndex], notes: docNotes };
        setData(prev => ({ ...prev, documents: newDocs }));
      } else {
        setData(prev => ({
          ...prev,
          documents: [...prev.documents, {
            id: `doc-${Date.now()}`,
            document_type: docType,
            file_url: null,
            notes: docNotes,
            created_at: new Date().toISOString(),
          }],
        }));
      }
      setEditingDoc(null);
      setDocNotes('');
      setSavingDoc(false);
    }, 500);
  };

  const handleStatusChange = (newStatus: string) => {
    setData(prev => ({
      ...prev,
      church: { ...prev.church, status: newStatus },
    }));
  };

  const { church, leader, assessment, documents, calls, phases } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Test Mode Banner */}
      <div className="bg-orange-500 text-white text-center py-2 text-sm font-medium">
        TEST MODE - Admin Church Detail View (Changes are local only)
      </div>

      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/test/admin"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Test Admin Panel
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{church.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-300">
                <span>{leader.name}</span>
                <span>•</span>
                <span className="text-gold">{leader.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => alert('TEST MODE: Magic link would be sent to ' + leader.email)}
                className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal-light transition-colors text-sm"
              >
                <Send className="w-4 h-4" />
                Send Login Link
              </button>
              <select
                value={church.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-navy border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="pending_assessment">Pending Review</option>
                <option value="awaiting_discovery">Awaiting Discovery</option>
                <option value="proposal_sent">Proposal Sent</option>
                <option value="awaiting_agreement">Awaiting Agreement</option>
                <option value="awaiting_strategy">Awaiting Strategy</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="declined">Declined</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-card-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-6">
            {['overview', 'funnel', 'dashboard'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-gold text-gold'
                    : 'border-transparent text-foreground-muted hover:text-navy'
                }`}
              >
                {tab === 'dashboard' ? 'Implementation Dashboard' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && assessment && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Assessment Details */}
            <div className="card">
              <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold" />
                Assessment Details
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-foreground-muted">Submitted</p>
                  <p className="font-medium">{formatDate(assessment.submitted_at)}</p>
                </div>
                {assessment.congregation_size && (
                  <div>
                    <p className="text-foreground-muted">Congregation Size</p>
                    <p className="font-medium">{assessment.congregation_size}</p>
                  </div>
                )}
                {assessment.pastor_commitment_level && (
                  <div>
                    <p className="text-foreground-muted">Pastor Commitment</p>
                    <p className="font-medium capitalize">{assessment.pastor_commitment_level.replace('_', ' ')}</p>
                  </div>
                )}
                {assessment.identified_leaders && (
                  <div>
                    <p className="text-foreground-muted">Identified Leaders</p>
                    <p className="font-medium">{assessment.identified_leaders}</p>
                  </div>
                )}
                {assessment.desired_launch_timeline && (
                  <div>
                    <p className="text-foreground-muted">Desired Timeline</p>
                    <p className="font-medium">{assessment.desired_launch_timeline}</p>
                  </div>
                )}
                {assessment.current_discipleship_approach && (
                  <div>
                    <p className="text-foreground-muted">Current Approach</p>
                    <p className="font-medium">{assessment.current_discipleship_approach}</p>
                  </div>
                )}
                {assessment.why_interested && (
                  <div>
                    <p className="text-foreground-muted">Why DNA?</p>
                    <p className="font-medium">{assessment.why_interested}</p>
                  </div>
                )}
                {assessment.potential_barriers && (
                  <div>
                    <p className="text-foreground-muted">Potential Barriers</p>
                    <p className="font-medium">{assessment.potential_barriers}</p>
                  </div>
                )}
                {assessment.first_year_goals && (
                  <div>
                    <p className="text-foreground-muted">First Year Goals</p>
                    <p className="font-medium">{assessment.first_year_goals}</p>
                  </div>
                )}
                {assessment.additional_questions && (
                  <div>
                    <p className="text-foreground-muted">Additional Questions</p>
                    <p className="font-medium">{assessment.additional_questions}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Scheduled Calls */}
            <div className="card">
              <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal" />
                Scheduled Calls
              </h3>
              <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded mb-4">
                This is where you add calls that were scheduled via Google Calendar
              </p>
              <div className="space-y-3">
                {calls.length === 0 ? (
                  <p className="text-sm text-foreground-muted">No calls scheduled yet</p>
                ) : (
                  calls.map((call) => (
                    <div
                      key={call.id}
                      className={`p-3 rounded-lg ${call.completed ? 'bg-success/5' : 'bg-background-secondary'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-navy capitalize">{call.call_type} Call</span>
                        {call.completed ? (
                          <span className="text-xs text-success flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Completed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleCompleteCall(call.id)}
                            className="text-xs text-teal hover:text-teal-light"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-foreground-muted">{formatDateTime(call.scheduled_at)}</p>
                      {call.notes && (
                        <p className="text-sm mt-2 p-2 bg-white rounded border border-card-border">
                          {call.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}

                {/* Add call buttons */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {['discovery', 'proposal', 'strategy'].map((callType) => {
                    const hasCall = calls.some((c) => c.call_type === callType);
                    if (hasCall) return null;

                    return addingCall === callType ? (
                      <div key={callType} className="flex items-center gap-2">
                        <input
                          type="datetime-local"
                          value={callDate}
                          onChange={(e) => setCallDate(e.target.value)}
                          className="text-sm px-2 py-1 border border-input-border rounded"
                        />
                        <button
                          onClick={() => handleScheduleCall(callType)}
                          disabled={savingCall}
                          className="p-1 text-success hover:bg-success/10 rounded"
                        >
                          {savingCall ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => { setAddingCall(null); setCallDate(''); }}
                          className="p-1 text-foreground-muted hover:bg-background-secondary rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        key={callType}
                        onClick={() => setAddingCall(callType)}
                        className="text-xs px-3 py-1.5 border border-teal text-teal rounded hover:bg-teal/5 transition-colors capitalize"
                      >
                        + {callType} Call
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Funnel Tab */}
        {activeTab === 'funnel' && (
          <div className="space-y-4">
            {DOCUMENT_TYPES.map((docType) => {
              const existingDoc = documents.find((d) => d.document_type === docType.type);
              const isEditing = editingDoc === docType.type;

              return (
                <div key={docType.type} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-navy">{docType.label}</h3>
                      <p className="text-sm text-foreground-muted">{docType.description}</p>

                      {/* File upload/display */}
                      {existingDoc?.file_url ? (
                        <button
                          onClick={() => alert('TEST MODE: Would open document')}
                          className="inline-flex items-center gap-2 mt-2 text-sm text-teal hover:text-teal-light"
                        >
                          <FileText className="w-4 h-4" />
                          View Document
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <label className="inline-flex items-center gap-2 mt-2 text-sm text-teal hover:text-teal-light cursor-pointer">
                          <Upload className="w-4 h-4" />
                          Upload PDF
                          <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={() => alert('TEST MODE: File upload simulated')}
                          />
                        </label>
                      )}

                      {/* Notes section */}
                      {isEditing ? (
                        <div className="mt-4">
                          <textarea
                            value={docNotes}
                            onChange={(e) => setDocNotes(e.target.value)}
                            placeholder="Add notes..."
                            className="w-full text-sm"
                            rows={4}
                            autoFocus
                          />
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => handleSaveDocNotes(docType.type)}
                              disabled={savingDoc}
                              className="text-sm px-3 py-1.5 bg-gold text-white rounded hover:bg-gold-dark transition-colors flex items-center gap-1"
                            >
                              {savingDoc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                              Save
                            </button>
                            <button
                              onClick={() => { setEditingDoc(null); setDocNotes(''); }}
                              className="text-sm px-3 py-1.5 text-foreground-muted hover:bg-background-secondary rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : existingDoc?.notes ? (
                        <div className="mt-4 p-3 bg-background-secondary rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{existingDoc.notes}</p>
                          <button
                            onClick={() => {
                              setEditingDoc(docType.type);
                              setDocNotes(existingDoc.notes || '');
                            }}
                            className="text-xs text-teal hover:text-teal-light mt-2 flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit Notes
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingDoc(docType.type);
                            setDocNotes('');
                          }}
                          className="text-sm text-teal hover:text-teal-light mt-4 flex items-center gap-1"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Add Notes
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && phases && (
          <div className="space-y-4">
            {/* Progress Overview */}
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-navy">Implementation Progress</h3>
                <span className="text-lg font-bold text-gold">
                  Phase {church.current_phase} of 5
                </span>
              </div>
              {phases.filter(p => p.phase_number > 0).map((phase) => {
                const percent = phase.totalCount > 0
                  ? Math.round((phase.completedCount / phase.totalCount) * 100)
                  : 0;
                const isCurrent = phase.phase_number === church.current_phase;

                return (
                  <div key={phase.id} className="flex items-center gap-3 mb-2">
                    <span className="w-20 text-sm text-foreground-muted">Phase {phase.phase_number}</span>
                    <div className="flex-1 h-2 bg-background-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${isCurrent ? 'bg-gold' : 'bg-success'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-12 text-sm text-right">{percent}%</span>
                    {isCurrent && phase.completedCount === phase.totalCount && phase.totalCount > 0 && (
                      <button
                        onClick={() => alert('TEST MODE: Would advance to next phase')}
                        className="text-xs px-2 py-1 bg-success text-white rounded hover:bg-success/90"
                      >
                        Complete Phase
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Phases list */}
            {phases.map((phase) => {
              const isExpanded = expandedPhases.has(phase.id);

              return (
                <div key={phase.id} className="card">
                  <button
                    onClick={() => {
                      const next = new Set(expandedPhases);
                      if (next.has(phase.id)) {
                        next.delete(phase.id);
                      } else {
                        next.add(phase.id);
                      }
                      setExpandedPhases(next);
                    }}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gold" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gold" />
                      )}
                      <div className="text-left">
                        <h4 className="font-semibold text-navy">
                          {phase.phase_number === 0 ? phase.name : `Phase ${phase.phase_number}: ${phase.name}`}
                        </h4>
                        <p className="text-sm text-foreground-muted">{phase.description}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {phase.completedCount}/{phase.totalCount}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="mt-4 pl-8 space-y-2">
                      {phase.milestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className={`p-2 rounded flex items-center gap-3 ${
                            milestone.progress?.completed ? 'bg-success/5' : 'bg-background-secondary'
                          }`}
                        >
                          {milestone.progress?.completed ? (
                            <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 border-2 border-card-border rounded flex-shrink-0" />
                          )}
                          <span className={`text-sm ${milestone.progress?.completed ? 'line-through text-foreground-muted' : ''}`}>
                            {milestone.title}
                          </span>
                          {milestone.is_key_milestone && (
                            <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded">Key</span>
                          )}
                          {milestone.progress?.target_date && !milestone.progress?.completed && (
                            <span className="text-xs text-foreground-muted ml-auto">
                              Target: {formatDate(milestone.progress.target_date)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
