'use client';

import { useState } from 'react';
import {
  Calendar,
  FileText,
  Upload,
  Save,
  X,
  Loader2,
  ExternalLink,
  CheckCircle,
  Check,
  Video,
  Pencil,
  MessageSquare,
  Trash2,
  ChevronDown,
} from 'lucide-react';

const CALL_TYPES = [
  { value: 'discovery', label: 'Discovery' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'kickoff', label: 'Kick-off' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'checkin', label: 'Check-in' },
];

interface Call {
  id: string;
  call_type: string;
  scheduled_at: string;
  completed: boolean;
  notes?: string;
  meet_link?: string;
}

interface Document {
  id: string;
  document_type: string;
  file_url?: string;
  notes?: string;
  created_at: string;
}

interface Assessment {
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
}

interface Phase {
  id: string;
  phase_number: number;
  name: string;
  description?: string;
  status: string;
  completedCount: number;
  totalCount: number;
}

interface AdminChurchOverviewTabProps {
  churchId: string;
  currentPhase: number;
  calls: Call[];
  documents: Document[];
  assessment: Assessment | null;
  phases?: Phase[];
  onPhaseChange: (newPhase: number) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const DOCUMENT_TYPES = [
  { type: '3_steps_pdf', label: '3 Steps Guide', description: 'Assessment reward resource' },
  { type: 'discovery_notes', label: 'Discovery Notes', description: 'Notes from discovery call' },
  { type: 'proposal_pdf', label: 'Proposal PDF', description: '3-tier partnership proposal' },
  { type: 'agreement_notes', label: 'Agreement Notes', description: 'Notes from agreement call' },
  { type: 'agreement_pdf', label: 'Agreement PDF', description: 'Final signed agreement' },
  { type: 'implementation_plan', label: 'Implementation Plan', description: '12-month overview + 90-day game plan' },
];

export default function AdminChurchOverviewTab({
  churchId,
  currentPhase,
  calls,
  documents,
  assessment,
  phases,
  onPhaseChange,
  onRefresh,
}: AdminChurchOverviewTabProps) {
  // Document editing
  const [editingDoc, setEditingDoc] = useState<string | null>(null);
  const [docNotes, setDocNotes] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [savingDoc, setSavingDoc] = useState(false);

  // Call scheduling
  const [addingCall, setAddingCall] = useState<string | null>(null);
  const [callDate, setCallDate] = useState('');
  const [savingCall, setSavingCall] = useState(false);

  // Call editing (for reassigning call types)
  const [editingCallId, setEditingCallId] = useState<string | null>(null);
  const [editCallType, setEditCallType] = useState('');

  // Calculate progress stats
  const totalMilestones = phases?.filter(p => p.phase_number > 0).reduce((sum, p) => sum + p.totalCount, 0) || 0;
  const completedMilestones = phases?.filter(p => p.phase_number > 0).reduce((sum, p) => sum + p.completedCount, 0) || 0;
  const overallProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

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

      await onRefresh();
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

      await onRefresh();
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

      await onRefresh();
      setAddingCall(null);
      setCallDate('');
    } catch (error) {
      console.error('Schedule call error:', error);
      alert('Failed to schedule call');
    } finally {
      setSavingCall(false);
    }
  };

  const handleCompleteCall = async (callId: string) => {
    try {
      const response = await fetch(`/api/admin/church/${churchId}/calls`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_id: callId,
          completed: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete call');
      }

      await onRefresh();
    } catch (error) {
      console.error('Complete call error:', error);
      alert('Failed to mark call as complete');
    }
  };

  const handleDeleteCall = async (callId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled call?')) return;

    try {
      const response = await fetch(`/api/admin/church/${churchId}/calls?call_id=${callId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete call');
      }

      await onRefresh();
    } catch (error) {
      console.error('Delete call error:', error);
      alert('Failed to delete call');
    }
  };

  const handleUpdateCallType = async (callId: string, newCallType: string) => {
    try {
      const response = await fetch('/api/admin/calls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId,
          callType: newCallType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update call type');
      }

      await onRefresh();
      setEditingCallId(null);
      setEditCallType('');
    } catch (error) {
      console.error('Update call type error:', error);
      alert('Failed to update call type');
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

  return (
    <div className="space-y-6">
      {/* Progress Overview Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-navy">Implementation Progress</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground-muted">Phase:</span>
              <select
                value={currentPhase}
                onChange={(e) => onPhaseChange(Number(e.target.value))}
                className="text-sm border border-input-border rounded px-2 py-1"
              >
                {[0, 1, 2, 3, 4, 5].map((p) => (
                  <option key={p} value={p}>Phase {p}</option>
                ))}
              </select>
            </div>
            <span className="text-2xl font-bold text-gold">{overallProgress}%</span>
          </div>
        </div>
        <div className="h-3 bg-background-secondary rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gold transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        {/* Per-phase mini progress */}
        <div className="flex gap-2">
          {phases?.filter(p => p.phase_number > 0).map((phase) => {
            const percent = phase.totalCount > 0
              ? Math.round((phase.completedCount / phase.totalCount) * 100)
              : 0;
            const isCurrent = phase.phase_number === currentPhase ||
              (currentPhase === 0 && phase.phase_number === 1);

            return (
              <div key={phase.id} className="flex-1">
                <div className="h-1.5 bg-background-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      percent === 100 ? 'bg-success' : isCurrent ? 'bg-gold' : 'bg-gray-300'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className={`text-xs mt-1 text-center ${isCurrent ? 'text-gold font-medium' : 'text-foreground-muted'}`}>
                  P{phase.phase_number}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
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
              calls.map((call) => {
                const isUpcoming = !call.completed && new Date(call.scheduled_at) > new Date();
                const isEditing = editingCallId === call.id;
                return (
                  <div
                    key={call.id}
                    className={`p-3 rounded-lg group ${call.completed ? 'bg-success/5' : 'bg-background-secondary'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <select
                              value={editCallType}
                              onChange={(e) => setEditCallType(e.target.value)}
                              className="text-sm pl-2 pr-7 py-1 border border-input-border rounded appearance-none bg-white"
                            >
                              {CALL_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>
                          <button
                            onClick={() => handleUpdateCallType(call.id, editCallType)}
                            className="p-1 text-success hover:bg-success/10 rounded"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingCallId(null);
                              setEditCallType('');
                            }}
                            className="p-1 text-foreground-muted hover:bg-background-secondary rounded"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-medium text-navy capitalize">{call.call_type} Call</span>
                      )}
                      {!isEditing && (
                        <div className="flex items-center gap-2">
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
                          <button
                            onClick={() => {
                              setEditingCallId(call.id);
                              setEditCallType(call.call_type);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-teal hover:bg-teal/10 rounded transition-opacity"
                            title="Change call type"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteCall(call.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-opacity"
                            title="Delete call"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-foreground-muted">{formatDateTime(call.scheduled_at)}</p>
                    {isUpcoming && call.meet_link && (
                      <a
                        href={call.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-teal text-white text-xs font-medium rounded hover:bg-teal/90 transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Join Google Meet
                      </a>
                    )}
                    {call.notes && (
                      <p className="text-sm mt-2 p-2 bg-white rounded border border-card-border">
                        {call.notes}
                      </p>
                    )}
                  </div>
                );
              })
            )}

            {/* Add call buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              {['discovery', 'proposal', 'strategy', 'checkin'].map((callType) => {
                const existingCalls = calls.filter((c) => c.call_type === callType);
                // Allow multiple checkin calls, but only one of each other type
                if (callType !== 'checkin' && existingCalls.length > 0) return null;

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
                    + {callType === 'checkin' ? 'Check-in' : callType} Call
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Assessment Details */}
        <div className="card">
          <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold" />
            Assessment Details
          </h3>
          {assessment ? (
            <div className="space-y-3 text-sm max-h-80 overflow-y-auto">
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
            </div>
          ) : (
            <p className="text-sm text-foreground-muted">No assessment submitted yet.</p>
          )}
        </div>
      </div>

      {/* Documents Section */}
      <div className="card">
        <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal" />
          Documents
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DOCUMENT_TYPES.map((docType) => {
            const existingDoc = documents.find((d) => d.document_type === docType.type);
            const isEditing = editingDoc === docType.type;

            return (
              <div key={docType.type} className="p-4 bg-background-secondary rounded-lg">
                <h4 className="font-medium text-navy text-sm">{docType.label}</h4>
                <p className="text-xs text-foreground-muted mb-2">{docType.description}</p>

                {existingDoc?.file_url ? (
                  <a
                    href={existingDoc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-teal hover:text-teal-light"
                  >
                    <FileText className="w-3 h-3" />
                    View Document
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <label className="inline-flex items-center gap-1 text-xs text-teal hover:text-teal-light cursor-pointer">
                    {uploadingDoc === docType.type ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3" />
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

                {isEditing ? (
                  <div className="mt-2">
                    <textarea
                      value={docNotes}
                      onChange={(e) => setDocNotes(e.target.value)}
                      placeholder="Add notes..."
                      className="w-full text-xs p-2 border border-input-border rounded"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => handleSaveDocNotes(docType.type)}
                        disabled={savingDoc}
                        className="text-xs px-2 py-1 bg-gold text-white rounded hover:bg-gold-dark flex items-center gap-1"
                      >
                        {savingDoc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save
                      </button>
                      <button
                        onClick={() => { setEditingDoc(null); setDocNotes(''); }}
                        className="text-xs px-2 py-1 text-foreground-muted hover:bg-white rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : existingDoc?.notes ? (
                  <div className="mt-2 p-2 bg-white rounded text-xs">
                    <p className="text-foreground-muted whitespace-pre-wrap">{existingDoc.notes}</p>
                    <button
                      onClick={() => {
                        setEditingDoc(docType.type);
                        setDocNotes(existingDoc.notes || '');
                      }}
                      className="text-teal hover:text-teal-light mt-1 flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingDoc(docType.type);
                      setDocNotes('');
                    }}
                    className="text-xs text-teal hover:text-teal-light mt-2 flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Add Notes
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
