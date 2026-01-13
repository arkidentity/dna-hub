'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Users,
  Mail,
  Phone,
  Calendar,
  FileText,
  Upload,
  Trash2,
  Save,
  X,
  Loader2,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Check,
  Lock,
  Video,
  BookOpen,
  Download,
  Pencil,
  MessageSquare,
  Paperclip,
  File,
  Send,
  Play,
  Pause,
  Plus,
  Star,
} from 'lucide-react';

interface ChurchDetail {
  church: {
    id: string;
    name: string;
    status: string;
    current_phase: number;
    created_at: string;
    start_date?: string;
    phase_1_start?: string;
    phase_1_target?: string;
    phase_2_start?: string;
    phase_2_target?: string;
    phase_3_start?: string;
    phase_3_target?: string;
    phase_4_start?: string;
    phase_4_target?: string;
    phase_5_start?: string;
    phase_5_target?: string;
  };
  leader: {
    id: string;
    name: string;
    email: string;
    phone?: string;
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
    current_discipleship_approach?: string;
    identified_leaders?: number;
    potential_barriers?: string;
    first_year_goals?: string;
    additional_questions?: string;
  } | null;
  documents: Array<{
    id: string;
    document_type: string;
    file_url?: string;
    notes?: string;
    created_at: string;
  }>;
  calls: Array<{
    id: string;
    call_type: string;
    scheduled_at: string;
    completed: boolean;
    notes?: string;
  }>;
  phases?: Array<{
    id: string;
    phase_number: number;
    name: string;
    description?: string;
    milestones: Array<{
      id: string;
      title: string;
      description?: string;
      is_key_milestone: boolean;
      is_custom?: boolean;
      progress?: {
        completed: boolean;
        completed_at?: string;
        target_date?: string;
        notes?: string;
      };
      attachments?: Array<{
        id: string;
        file_name: string;
        file_url: string;
        file_type?: string;
        file_size?: number;
      }>;
      resources?: Array<{
        id: string;
        name: string;
        description?: string;
        file_url?: string;
        resource_type?: string;
      }>;
    }>;
    status: string;
    completedCount: number;
    totalCount: number;
  }>;
}

const DOCUMENT_TYPES = [
  { type: '3_steps_pdf', label: '3 Steps Guide', description: 'Assessment reward resource' },
  { type: 'discovery_notes', label: 'Discovery Notes', description: 'Notes from discovery call' },
  { type: 'proposal_pdf', label: 'Proposal PDF', description: '3-tier partnership proposal' },
  { type: 'agreement_notes', label: 'Agreement Notes', description: 'Notes from agreement call' },
  { type: 'agreement_pdf', label: 'Agreement PDF', description: 'Final signed agreement' },
  { type: 'implementation_plan', label: 'Implementation Plan', description: '12-month overview + 90-day game plan' },
];

export default function AdminChurchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: churchId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<ChurchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'dashboard'>('overview');

  // Document editing
  const [editingDoc, setEditingDoc] = useState<string | null>(null);
  const [docNotes, setDocNotes] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [savingDoc, setSavingDoc] = useState(false);

  // Call scheduling
  const [addingCall, setAddingCall] = useState<string | null>(null);
  const [callDate, setCallDate] = useState('');
  const [savingCall, setSavingCall] = useState(false);

  // Dashboard state
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [addingMilestone, setAddingMilestone] = useState<string | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDescription, setNewMilestoneDescription] = useState('');
  const [newMilestoneTargetDate, setNewMilestoneTargetDate] = useState('');
  const [newMilestoneIsKey, setNewMilestoneIsKey] = useState(false);
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [togglingMilestone, setTogglingMilestone] = useState<string | null>(null);

  useEffect(() => {
    fetchChurchData();
  }, [churchId]);

  const fetchChurchData = async () => {
    try {
      const response = await fetch(`/api/admin/church/${churchId}`);

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (response.status === 403) {
        router.push('/dashboard');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch church data');
      }

      const churchData = await response.json();
      setData(churchData);

      // Auto-expand current phase
      if (churchData.phases) {
        const toExpand = new Set<string>();
        churchData.phases.forEach((phase: { id: string; status: string; phase_number: number }) => {
          if (phase.status === 'current' || phase.phase_number === 0) {
            toExpand.add(phase.id);
          }
        });
        setExpandedPhases(toExpand);
      }
    } catch (error) {
      console.error('Church fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDocNotes = async (docType: string) => {
    setSavingDoc(true);
    try {
      const response = await fetch(`/api/admin/church/${churchId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_type: docType,
          notes: docNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save notes');
      }

      await fetchChurchData();
      setEditingDoc(null);
      setDocNotes('');
    } catch (error) {
      console.error('Save notes error:', error);
      alert('Failed to save notes');
    } finally {
      setSavingDoc(false);
    }
  };

  const handleUploadDocument = async (docType: string, file: File) => {
    setUploadingDoc(docType);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', docType);

      const response = await fetch(`/api/admin/church/${churchId}/documents`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      await fetchChurchData();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleScheduleCall = async (callType: string) => {
    if (!callDate) return;
    setSavingCall(true);
    try {
      const response = await fetch(`/api/admin/church/${churchId}/calls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_type: callType,
          scheduled_at: new Date(callDate).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule call');
      }

      await fetchChurchData();
      setAddingCall(null);
      setCallDate('');
    } catch (error) {
      console.error('Schedule call error:', error);
      alert('Failed to schedule call');
    } finally {
      setSavingCall(false);
    }
  };

  const handleCompleteCall = async (callId: string, notes?: string) => {
    try {
      const response = await fetch(`/api/admin/church/${churchId}/calls`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_id: callId,
          completed: true,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete call');
      }

      await fetchChurchData();
    } catch (error) {
      console.error('Complete call error:', error);
      alert('Failed to mark call as complete');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch('/api/admin/churches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      await fetchChurchData();
    } catch (error) {
      console.error('Status update error:', error);
      alert('Failed to update status');
    }
  };

  const handlePhaseComplete = async (phaseNumber: number) => {
    try {
      const response = await fetch('/api/admin/churches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId, current_phase: phaseNumber + 1 }),
      });

      if (!response.ok) {
        throw new Error('Failed to advance phase');
      }

      await fetchChurchData();
    } catch (error) {
      console.error('Phase advance error:', error);
      alert('Failed to advance phase');
    }
  };

  const handleSendMagicLink = async () => {
    if (!data?.leader.email) return;

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.leader.email }),
      });

      if (!response.ok) {
        throw new Error('Failed to send magic link');
      }

      alert(`Magic link sent to ${data.leader.email}`);
    } catch (error) {
      console.error('Magic link error:', error);
      alert('Failed to send magic link');
    }
  };

  const handleAddMilestone = async (phaseId: string) => {
    if (!newMilestoneTitle.trim()) return;
    setSavingMilestone(true);
    try {
      const response = await fetch(`/api/admin/church/${churchId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase_id: phaseId,
          title: newMilestoneTitle.trim(),
          description: newMilestoneDescription.trim() || null,
          is_key_milestone: newMilestoneIsKey,
          target_date: newMilestoneTargetDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create milestone');
      }

      await fetchChurchData();
      setAddingMilestone(null);
      setNewMilestoneTitle('');
      setNewMilestoneDescription('');
      setNewMilestoneTargetDate('');
      setNewMilestoneIsKey(false);
    } catch (error) {
      console.error('Add milestone error:', error);
      alert('Failed to add milestone');
    } finally {
      setSavingMilestone(false);
    }
  };

  const handleToggleMilestone = async (milestoneId: string, currentCompleted: boolean) => {
    setTogglingMilestone(milestoneId);
    try {
      const response = await fetch(`/api/admin/church/${churchId}/milestones`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone_id: milestoneId,
          completed: !currentCompleted,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update milestone');
      }

      await fetchChurchData();
    } catch (error) {
      console.error('Toggle milestone error:', error);
      alert('Failed to update milestone');
    } finally {
      setTogglingMilestone(null);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this custom milestone?')) return;

    try {
      const response = await fetch(
        `/api/admin/church/${churchId}/milestones?milestone_id=${milestoneId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete milestone');
      }

      await fetchChurchData();
    } catch (error) {
      console.error('Delete milestone error:', error);
      alert('Failed to delete milestone');
    }
  };

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
        <p className="text-foreground-muted">Church not found</p>
      </div>
    );
  }

  const { church, leader, assessment, documents, calls, phases } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Churches
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{church.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-300">
                <span>{leader.name}</span>
                <span>•</span>
                <a href={`mailto:${leader.email}`} className="text-gold hover:text-gold-light">
                  {leader.email}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSendMagicLink}
                className="flex items-center gap-1.5 px-2 py-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors text-xs"
                title="Send login link to church leader"
              >
                <Send className="w-3 h-3" />
                Send Link
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
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Assessment Details */}
            <div className="card">
              <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold" />
                Assessment Details
              </h3>
              {assessment ? (
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
              ) : (
                <p className="text-sm text-foreground-muted">No assessment submitted yet for this church.</p>
              )}
            </div>

            {/* Scheduled Calls */}
            <div className="card">
              <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal" />
                Scheduled Calls
              </h3>
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
                        <a
                          href={existingDoc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-2 text-sm text-teal hover:text-teal-light"
                        >
                          <FileText className="w-4 h-4" />
                          View Document
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <label className="inline-flex items-center gap-2 mt-2 text-sm text-teal hover:text-teal-light cursor-pointer">
                          {uploadingDoc === docType.type ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Upload PDF
                              <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadDocument(docType.type, file);
                                }}
                              />
                            </>
                          )}
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
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {phases && phases.length > 0 ? (
              <>
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
                            onClick={() => handlePhaseComplete(phase.phase_number)}
                            className="text-xs px-2 py-1 bg-success text-white rounded hover:bg-success/90"
                          >
                            Complete Phase
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Phases list - admin view with add/toggle capability */}
                {phases.map((phase) => {
                  const isExpanded = expandedPhases.has(phase.id);
                  const isAddingToPhase = addingMilestone === phase.id;

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
                            <div key={milestone.id} className="space-y-1">
                              <div
                                className={`p-2 rounded flex items-center gap-3 group ${
                                  milestone.progress?.completed ? 'bg-success/5' : 'bg-background-secondary'
                                }`}
                              >
                                {togglingMilestone === milestone.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-gold flex-shrink-0" />
                                ) : (
                                  <button
                                    onClick={() => handleToggleMilestone(milestone.id, !!milestone.progress?.completed)}
                                    className="flex-shrink-0 hover:scale-110 transition-transform"
                                  >
                                    {milestone.progress?.completed ? (
                                      <CheckCircle className="w-4 h-4 text-success" />
                                    ) : (
                                      <div className="w-4 h-4 border-2 border-card-border rounded hover:border-gold" />
                                    )}
                                  </button>
                                )}
                                <span className={`text-sm flex-1 ${milestone.progress?.completed ? 'line-through text-foreground-muted' : ''}`}>
                                  {milestone.title}
                                </span>
                                {milestone.is_key_milestone && (
                                  <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded">Key</span>
                                )}
                                {milestone.is_custom && (
                                  <span className="text-xs bg-teal/10 text-teal px-2 py-0.5 rounded">Custom</span>
                                )}
                                {milestone.resources && milestone.resources.length > 0 && (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {milestone.resources.length}
                                  </span>
                                )}
                                {milestone.progress?.target_date && (
                                  <span className="text-xs text-foreground-muted">
                                    Target: {formatDate(milestone.progress.target_date)}
                                  </span>
                                )}
                                {milestone.is_custom && (
                                  <button
                                    onClick={() => handleDeleteMilestone(milestone.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-opacity"
                                    title="Delete custom milestone"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              {/* Resources attached to this milestone */}
                              {milestone.resources && milestone.resources.length > 0 && (
                                <div className="ml-7 pl-3 border-l-2 border-purple-200 space-y-1">
                                  {milestone.resources.map((resource) => (
                                    <div
                                      key={resource.id}
                                      className="flex items-center gap-2 p-1.5 rounded text-xs hover:bg-purple-50 transition-colors"
                                    >
                                      {resource.resource_type === 'pdf' && <FileText className="w-3 h-3 text-red-500" />}
                                      {resource.resource_type === 'worksheet' && <FileText className="w-3 h-3 text-blue-500" />}
                                      {resource.resource_type === 'video' && <Video className="w-3 h-3 text-purple-500" />}
                                      {resource.resource_type === 'guide' && <BookOpen className="w-3 h-3 text-teal" />}
                                      {resource.resource_type === 'link' && <ExternalLink className="w-3 h-3 text-gray-500" />}
                                      {!resource.resource_type && <File className="w-3 h-3 text-gray-400" />}
                                      {resource.file_url ? (
                                        <a
                                          href={resource.file_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-purple-700 hover:text-purple-900 hover:underline flex-1"
                                        >
                                          {resource.name}
                                        </a>
                                      ) : (
                                        <span className="text-foreground-muted flex-1">
                                          {resource.name}
                                          <span className="text-orange-500 ml-1">(no file uploaded)</span>
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Add Milestone Form */}
                          {isAddingToPhase ? (
                            <div className="p-3 border border-gold/30 rounded-lg bg-gold/5 space-y-3">
                              <input
                                type="text"
                                value={newMilestoneTitle}
                                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                                placeholder="Milestone title *"
                                className="w-full text-sm px-3 py-2 border border-input-border rounded-lg"
                                autoFocus
                              />
                              <textarea
                                value={newMilestoneDescription}
                                onChange={(e) => setNewMilestoneDescription(e.target.value)}
                                placeholder="Description (optional)"
                                className="w-full text-sm px-3 py-2 border border-input-border rounded-lg"
                                rows={2}
                              />
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <label className="text-xs text-foreground-muted block mb-1">Target Date</label>
                                  <input
                                    type="date"
                                    value={newMilestoneTargetDate}
                                    onChange={(e) => setNewMilestoneTargetDate(e.target.value)}
                                    className="text-sm px-3 py-1.5 border border-input-border rounded"
                                  />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={newMilestoneIsKey}
                                    onChange={(e) => setNewMilestoneIsKey(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300"
                                  />
                                  <span className="text-sm flex items-center gap-1">
                                    <Star className="w-3 h-3 text-gold" />
                                    Key Milestone
                                  </span>
                                </label>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleAddMilestone(phase.id)}
                                  disabled={savingMilestone || !newMilestoneTitle.trim()}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-gold text-white rounded hover:bg-gold-dark transition-colors disabled:opacity-50 text-sm"
                                >
                                  {savingMilestone ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Plus className="w-3 h-3" />
                                  )}
                                  Add
                                </button>
                                <button
                                  onClick={() => {
                                    setAddingMilestone(null);
                                    setNewMilestoneTitle('');
                                    setNewMilestoneDescription('');
                                    setNewMilestoneTargetDate('');
                                    setNewMilestoneIsKey(false);
                                  }}
                                  className="px-3 py-1.5 text-foreground-muted hover:bg-background-secondary rounded transition-colors text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAddingMilestone(phase.id)}
                              className="flex items-center gap-2 p-2 text-sm text-teal hover:bg-teal/5 rounded transition-colors w-full"
                            >
                              <Plus className="w-4 h-4" />
                              Add custom item
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="card text-center py-8">
                <p className="text-foreground-muted mb-4">No implementation phases found in the database.</p>
                <p className="text-sm text-foreground-muted">
                  Run the database schema SQL to seed the phases and milestones.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
