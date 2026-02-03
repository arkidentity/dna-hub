'use client';

import { useState } from 'react';
import {
  Calendar,
  FileText,
  Trash2,
  Save,
  X,
  Loader2,
  CheckCircle,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Video,
  BookOpen,
  Pencil,
  MessageSquare,
  File,
  Plus,
  Star,
  List,
  LayoutList,
  Paperclip,
  Phone,
  Link2,
  Unlink,
  ExternalLink,
} from 'lucide-react';

interface LinkedCall {
  id: string;
  call_type: string;
  scheduled_at: string;
  completed: boolean;
  meet_link?: string;
}

interface Milestone {
  id: string;
  title: string;
  description?: string;
  is_key_milestone: boolean;
  is_custom?: boolean;
  display_order?: number;
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
  linked_calls?: LinkedCall[];
}

interface ScheduledCall {
  id: string;
  call_type: string;
  scheduled_at: string;
  completed: boolean;
  meet_link?: string;
  milestone_id?: string;
}

const CALL_TYPE_LABELS: Record<string, string> = {
  discovery: 'Discovery',
  proposal: 'Proposal',
  strategy: 'Strategy',
  kickoff: 'Kick-off',
  assessment: 'Assessment',
  onboarding: 'Onboarding',
  checkin: 'Check-in',
};

interface Phase {
  id: string;
  phase_number: number;
  name: string;
  description?: string;
  milestones: Milestone[];
  status: string;
  completedCount: number;
  totalCount: number;
}

interface AdminChurchJourneyTabProps {
  churchId: string;
  currentPhase: number;
  phases: Phase[];
  calls?: ScheduledCall[];
  onRefresh: () => Promise<void>;
}

export default function AdminChurchJourneyTab({
  churchId,
  currentPhase,
  phases,
  calls = [],
  onRefresh,
}: AdminChurchJourneyTabProps) {
  // Journey state
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    phases.forEach((phase) => {
      if (phase.status === 'current' || phase.phase_number === 0) {
        initial.add(phase.id);
      }
    });
    return initial;
  });
  const [compactView, setCompactView] = useState(false);
  const [addingMilestone, setAddingMilestone] = useState<string | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDescription, setNewMilestoneDescription] = useState('');
  const [newMilestoneTargetDate, setNewMilestoneTargetDate] = useState('');
  const [newMilestoneIsKey, setNewMilestoneIsKey] = useState(false);
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [togglingMilestone, setTogglingMilestone] = useState<string | null>(null);

  // Milestone editing state
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [editDateValue, setEditDateValue] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [editNotesValue, setEditNotesValue] = useState('');
  const [updatingMilestone, setUpdatingMilestone] = useState<string | null>(null);
  const [uploadingMilestone, setUploadingMilestone] = useState<string | null>(null);

  // Call linking state
  const [linkingMilestoneId, setLinkingMilestoneId] = useState<string | null>(null);
  const [linkingCallId, setLinkingCallId] = useState('');
  const [linkingInProgress, setLinkingInProgress] = useState(false);

  // Milestone reordering state
  const [reorderingMilestone, setReorderingMilestone] = useState<string | null>(null);

  // Get unlinked calls (calls without a milestone_id)
  const unlinkedCalls = calls.filter(c => !c.milestone_id);

  // Calculate progress stats
  const totalMilestones = phases?.filter(p => p.phase_number > 0).reduce((sum, p) => sum + p.totalCount, 0) || 0;
  const completedMilestones = phases?.filter(p => p.phase_number > 0).reduce((sum, p) => sum + p.completedCount, 0) || 0;
  const overallProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

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

      await onRefresh();
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

      await onRefresh();
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

      await onRefresh();
    } catch (error) {
      console.error('Delete milestone error:', error);
      alert('Failed to delete milestone');
    }
  };

  const handleSaveTargetDate = async (milestoneId: string) => {
    setUpdatingMilestone(milestoneId);
    try {
      const response = await fetch(`/api/admin/church/${churchId}/milestones`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone_id: milestoneId,
          target_date: editDateValue || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save target date');
      }

      await onRefresh();
      setEditingDateId(null);
      setEditDateValue('');
    } catch (error) {
      console.error('Save target date error:', error);
      alert('Failed to save target date');
    } finally {
      setUpdatingMilestone(null);
    }
  };

  const handleSaveNotes = async (milestoneId: string) => {
    setUpdatingMilestone(milestoneId);
    try {
      const response = await fetch(`/api/admin/church/${churchId}/milestones`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone_id: milestoneId,
          notes: editNotesValue || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save notes');
      }

      await onRefresh();
      setEditingNotesId(null);
      setEditNotesValue('');
    } catch (error) {
      console.error('Save notes error:', error);
      alert('Failed to save notes');
    } finally {
      setUpdatingMilestone(null);
    }
  };

  const handleFileUpload = async (milestoneId: string, file: File) => {
    setUploadingMilestone(milestoneId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('milestoneId', milestoneId);
      formData.append('churchId', churchId);

      const response = await fetch('/api/attachments', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      await onRefresh();
    } catch (error) {
      console.error('File upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploadingMilestone(null);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Delete this attachment?')) return;

    try {
      const response = await fetch(`/api/attachments?id=${attachmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete attachment');
      }

      await onRefresh();
    } catch (error) {
      console.error('Delete attachment error:', error);
      alert('Failed to delete attachment');
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
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleLinkCall = async (milestoneId: string) => {
    if (!linkingCallId) return;
    setLinkingInProgress(true);
    try {
      const response = await fetch('/api/admin/calls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: linkingCallId,
          milestoneId: milestoneId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to link call');
      }

      await onRefresh();
      setLinkingMilestoneId(null);
      setLinkingCallId('');
    } catch (error) {
      console.error('Link call error:', error);
      alert('Failed to link call to milestone');
    } finally {
      setLinkingInProgress(false);
    }
  };

  const handleUnlinkCall = async (callId: string) => {
    if (!confirm('Unlink this call from the milestone?')) return;
    try {
      const response = await fetch('/api/admin/calls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: callId,
          milestoneId: null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to unlink call');
      }

      await onRefresh();
    } catch (error) {
      console.error('Unlink call error:', error);
      alert('Failed to unlink call');
    }
  };

  const handleMoveMilestone = async (milestoneId: string, direction: 'up' | 'down') => {
    setReorderingMilestone(milestoneId);
    try {
      const response = await fetch(`/api/admin/church/${churchId}/milestones`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone_id: milestoneId,
          action: `move_${direction}`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to move milestone');
      }

      await onRefresh();
    } catch (error) {
      console.error('Move milestone error:', error);
      alert(error instanceof Error ? error.message : 'Failed to move milestone');
    } finally {
      setReorderingMilestone(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview with Per-Phase Bars */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-navy">DNA Journey</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCompactView(!compactView)}
              className={`p-2 rounded-lg transition-colors ${compactView ? 'bg-gold/10 text-gold' : 'text-foreground-muted hover:bg-background-secondary'}`}
              title={compactView ? 'Expanded view' : 'Compact view'}
            >
              {compactView ? <LayoutList className="w-5 h-5" /> : <List className="w-5 h-5" />}
            </button>
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

      {/* Phases */}
      <div className="space-y-4">
        {phases && phases.length > 0 ? (
          phases.map((phase) => {
            const isExpanded = expandedPhases.has(phase.id);
            const isAddingToPhase = addingMilestone === phase.id;
            const isCurrent = phase.phase_number === currentPhase;

            return (
              <div
                key={phase.id}
                className={`card ${isCurrent ? 'ring-2 ring-gold/30' : ''}`}
              >
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
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-navy">
                          {phase.phase_number === 0 ? phase.name : `Phase ${phase.phase_number}: ${phase.name}`}
                        </h4>
                        {isCurrent && (
                          <span className="text-xs bg-gold text-white px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      {!compactView && phase.description && (
                        <p className="text-sm text-foreground-muted mt-1">{phase.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    {phase.completedCount}/{phase.totalCount}
                  </span>
                </button>

                {isExpanded && (
                  <div className="mt-4 pl-8 space-y-2">
                    {phase.milestones.map((milestone, milestoneIndex) => {
                      const isFirstInPhase = milestoneIndex === 0;
                      const isLastInPhase = milestoneIndex === phase.milestones.length - 1;
                      const isReordering = reorderingMilestone === milestone.id;

                      return (
                      <div key={milestone.id} className="space-y-1">
                        <div
                          className={`p-3 rounded-lg flex items-start gap-3 group ${
                            milestone.progress?.completed ? 'bg-success/5' : 'bg-background-secondary'
                          }`}
                        >
                          {togglingMilestone === milestone.id ? (
                            <Loader2 className="w-5 h-5 animate-spin text-gold flex-shrink-0 mt-0.5" />
                          ) : (
                            <button
                              onClick={() => handleToggleMilestone(milestone.id, !!milestone.progress?.completed)}
                              className="flex-shrink-0 hover:scale-110 transition-transform mt-0.5"
                            >
                              {milestone.progress?.completed ? (
                                <CheckCircle className="w-5 h-5 text-success" />
                              ) : (
                                <div className="w-5 h-5 border-2 border-card-border rounded-full hover:border-gold" />
                              )}
                            </button>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`font-medium ${milestone.progress?.completed ? 'line-through text-foreground-muted' : 'text-navy'}`}>
                                {milestone.title}
                              </p>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {milestone.is_key_milestone && (
                                  <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded">Key</span>
                                )}
                                {milestone.is_custom && (
                                  <span className="text-xs bg-teal/10 text-teal px-2 py-0.5 rounded">Custom</span>
                                )}
                                {/* Reorder buttons */}
                                {isReordering ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-gold" />
                                ) : (
                                  <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleMoveMilestone(milestone.id, 'up')}
                                      disabled={isFirstInPhase}
                                      className={`p-0.5 rounded transition-colors ${
                                        isFirstInPhase
                                          ? 'text-gray-300 cursor-not-allowed'
                                          : 'text-foreground-muted hover:text-teal hover:bg-teal/10'
                                      }`}
                                      title="Move up"
                                    >
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleMoveMilestone(milestone.id, 'down')}
                                      disabled={isLastInPhase}
                                      className={`p-0.5 rounded transition-colors ${
                                        isLastInPhase
                                          ? 'text-gray-300 cursor-not-allowed'
                                          : 'text-foreground-muted hover:text-teal hover:bg-teal/10'
                                      }`}
                                      title="Move down"
                                    >
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                  </div>
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
                            </div>
                            {!compactView && milestone.description && (
                              <p className="text-sm text-foreground-muted mt-1">{milestone.description}</p>
                            )}

                            {/* Target Date - Editable */}
                            {!compactView && (
                              editingDateId === milestone.id ? (
                                <div className="flex items-center gap-2 mt-2">
                                  <Calendar className="w-3 h-3 text-foreground-muted" />
                                  <input
                                    type="date"
                                    value={editDateValue}
                                    onChange={(e) => setEditDateValue(e.target.value)}
                                    className="text-xs px-2 py-1 border border-input-border rounded bg-white"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveTargetDate(milestone.id)}
                                    disabled={updatingMilestone === milestone.id}
                                    className="p-1 text-success hover:bg-success/10 rounded"
                                    title="Save"
                                  >
                                    {updatingMilestone === milestone.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Save className="w-3 h-3" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => { setEditingDateId(null); setEditDateValue(''); }}
                                    className="p-1 text-foreground-muted hover:bg-background-secondary rounded"
                                    title="Cancel"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : milestone.progress?.target_date ? (
                                <div className="flex items-center gap-1 mt-2">
                                  <p className="text-xs text-foreground-muted flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Target: {formatDate(milestone.progress.target_date)}
                                  </p>
                                  <button
                                    onClick={() => {
                                      setEditingDateId(milestone.id);
                                      setEditDateValue(milestone.progress?.target_date || '');
                                    }}
                                    className="p-1 text-foreground-muted hover:text-teal hover:bg-teal/10 rounded ml-1"
                                    title="Edit date"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingDateId(milestone.id);
                                    setEditDateValue('');
                                  }}
                                  className="text-xs text-teal hover:text-teal-light flex items-center gap-1 mt-2"
                                >
                                  <Calendar className="w-3 h-3" />
                                  <span>Add target date</span>
                                </button>
                              )
                            )}

                            {/* Notes - Editable */}
                            {!compactView && (
                              editingNotesId === milestone.id ? (
                                <div className="mt-3 space-y-2">
                                  <textarea
                                    value={editNotesValue}
                                    onChange={(e) => setEditNotesValue(e.target.value)}
                                    placeholder="Add a note (challenges, victories, updates...)"
                                    className="w-full text-sm px-3 py-2 border border-input-border rounded bg-white resize-none"
                                    rows={3}
                                    autoFocus
                                  />
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleSaveNotes(milestone.id)}
                                      disabled={updatingMilestone === milestone.id}
                                      className="text-xs px-3 py-1 bg-gold text-white rounded hover:bg-gold/90 flex items-center gap-1"
                                    >
                                      {updatingMilestone === milestone.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Save className="w-3 h-3" />
                                      )}
                                      Save
                                    </button>
                                    <button
                                      onClick={() => { setEditingNotesId(null); setEditNotesValue(''); }}
                                      className="text-xs px-3 py-1 text-foreground-muted hover:bg-background-secondary rounded"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : milestone.progress?.notes ? (
                                <div className="mt-3 p-2 bg-gold/5 border-l-2 border-gold/30 rounded-r">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-gold/80 mb-1">Note:</p>
                                      <p className="text-sm text-foreground-muted italic whitespace-pre-wrap">
                                        {milestone.progress.notes}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setEditingNotesId(milestone.id);
                                        setEditNotesValue(milestone.progress?.notes || '');
                                      }}
                                      className="p-1 text-foreground-muted hover:text-teal hover:bg-teal/10 rounded flex-shrink-0"
                                      title="Edit note"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingNotesId(milestone.id);
                                    setEditNotesValue('');
                                  }}
                                  className="text-xs text-teal hover:text-teal-light flex items-center gap-1 mt-2"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>Add note</span>
                                </button>
                              )
                            )}

                            {/* Resources */}
                            {!compactView && milestone.resources && milestone.resources.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {milestone.resources.map((resource) => (
                                  <div
                                    key={resource.id}
                                    className="flex items-center gap-2 text-xs bg-purple-50 px-2 py-1.5 rounded"
                                  >
                                    {resource.resource_type === 'pdf' && <FileText className="w-3 h-3 text-red-500" />}
                                    {resource.resource_type === 'video' && <Video className="w-3 h-3 text-purple-500" />}
                                    {resource.resource_type === 'guide' && <BookOpen className="w-3 h-3 text-teal" />}
                                    {!resource.resource_type && <File className="w-3 h-3 text-gray-400" />}
                                    {resource.file_url ? (
                                      <a
                                        href={resource.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-purple-700 hover:text-purple-900 hover:underline"
                                      >
                                        {resource.name}
                                      </a>
                                    ) : (
                                      <span className="text-foreground-muted">{resource.name}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Attachments - with upload */}
                            {!compactView && (
                              <div className="mt-3">
                                {milestone.attachments && milestone.attachments.length > 0 && (
                                  <div className="space-y-1 mb-2">
                                    {milestone.attachments.map((attachment) => (
                                      <div
                                        key={attachment.id}
                                        className="flex items-center gap-2 text-xs bg-teal/5 px-2 py-1.5 rounded group"
                                      >
                                        <File className="w-3 h-3 text-teal" />
                                        <a
                                          href={attachment.file_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-teal hover:text-teal-light flex-1 truncate"
                                          title={attachment.file_name}
                                        >
                                          {attachment.file_name}
                                        </a>
                                        {attachment.file_size && (
                                          <span className="text-foreground-muted">
                                            {(attachment.file_size / 1024).toFixed(0)}KB
                                          </span>
                                        )}
                                        <button
                                          onClick={() => handleDeleteAttachment(attachment.id)}
                                          className="p-1 text-foreground-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Delete attachment"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <label className="text-xs text-teal hover:text-teal-light flex items-center gap-1 cursor-pointer">
                                  {uploadingMilestone === milestone.id ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      <span>Uploading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Paperclip className="w-3 h-3" />
                                      <span>Attach file</span>
                                      <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            handleFileUpload(milestone.id, file);
                                            e.target.value = '';
                                          }
                                        }}
                                      />
                                    </>
                                  )}
                                </label>
                              </div>
                            )}

                            {/* Linked Calls */}
                            {!compactView && (
                              <div className="mt-3">
                                {milestone.linked_calls && milestone.linked_calls.length > 0 && (
                                  <div className="space-y-1 mb-2">
                                    <p className="text-xs font-medium text-navy/70 flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      Linked Calls:
                                    </p>
                                    {milestone.linked_calls.map((call) => (
                                      <div
                                        key={call.id}
                                        className="flex items-center justify-between text-xs bg-blue-50 px-2 py-1.5 rounded group"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className={`font-medium ${call.completed ? 'text-green-700' : 'text-blue-700'}`}>
                                            {CALL_TYPE_LABELS[call.call_type] || call.call_type}
                                          </span>
                                          <span className="text-foreground-muted">
                                            {formatDateTime(call.scheduled_at)}
                                          </span>
                                          {call.completed && (
                                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                              Completed
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          {call.meet_link && (
                                            <a
                                              href={call.meet_link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-1 text-blue-600 hover:text-blue-800"
                                              title="Open Meet link"
                                            >
                                              <ExternalLink className="w-3 h-3" />
                                            </a>
                                          )}
                                          <button
                                            onClick={() => handleUnlinkCall(call.id)}
                                            className="p-1 text-foreground-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Unlink call"
                                          >
                                            <Unlink className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Link call form */}
                                {linkingMilestoneId === milestone.id ? (
                                  <div className="flex items-center gap-2 mt-2">
                                    <select
                                      value={linkingCallId}
                                      onChange={(e) => setLinkingCallId(e.target.value)}
                                      className="flex-1 text-xs px-2 py-1 border border-input-border rounded bg-white"
                                    >
                                      <option value="">Select a call...</option>
                                      {unlinkedCalls.map((call) => (
                                        <option key={call.id} value={call.id}>
                                          {CALL_TYPE_LABELS[call.call_type] || call.call_type} - {formatDateTime(call.scheduled_at)}
                                          {call.completed ? ' (Completed)' : ''}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => handleLinkCall(milestone.id)}
                                      disabled={linkingInProgress || !linkingCallId}
                                      className="p-1 text-success hover:bg-success/10 rounded disabled:opacity-50"
                                      title="Link"
                                    >
                                      {linkingInProgress ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Check className="w-3 h-3" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setLinkingMilestoneId(null);
                                        setLinkingCallId('');
                                      }}
                                      className="p-1 text-foreground-muted hover:bg-background-secondary rounded"
                                      title="Cancel"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : unlinkedCalls.length > 0 ? (
                                  <button
                                    onClick={() => setLinkingMilestoneId(milestone.id)}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                                  >
                                    <Link2 className="w-3 h-3" />
                                    <span>Link a call</span>
                                  </button>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                    })}

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
                        Add custom milestone
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="card text-center py-8">
            <p className="text-foreground-muted mb-4">No implementation phases found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
