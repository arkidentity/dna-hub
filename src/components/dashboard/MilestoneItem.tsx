'use client';

import {
  Check,
  FileText,
  Video,
  ExternalLink,
  BookOpen,
  Loader2,
  Calendar,
  Pencil,
  MessageSquare,
  X,
  Save,
  Paperclip,
  Trash2,
  File,
} from 'lucide-react';
import { MilestoneWithProgress } from '@/lib/types';
import { formatTargetDate, isOverdue, formatFileSize } from './utils';

interface MilestoneItemProps {
  milestone: MilestoneWithProgress;
  phaseStatus: string;
  isAdmin: boolean;
  compactView: boolean;
  updatingMilestone: string | null;
  editingDateId: string | null;
  editingNotesId: string | null;
  editDateValue: string;
  editNotesValue: string;
  uploadingMilestone: string | null;
  onToggle: (milestone: MilestoneWithProgress, phaseStatus: string) => void;
  onStartEditingDate: (milestoneId: string, currentDate?: string) => void;
  onStartEditingNotes: (milestoneId: string, currentNotes?: string) => void;
  onSaveDate: (milestoneId: string) => void;
  onSaveNotes: (milestoneId: string) => void;
  onCancelEditDate: () => void;
  onCancelEditNotes: () => void;
  onEditDateChange: (value: string) => void;
  onEditNotesChange: (value: string) => void;
  onFileUpload: (milestoneId: string, file: File) => void;
  onDeleteAttachment: (attachmentId: string) => void;
}

export default function MilestoneItem({
  milestone,
  phaseStatus,
  isAdmin,
  compactView,
  updatingMilestone,
  editingDateId,
  editingNotesId,
  editDateValue,
  editNotesValue,
  uploadingMilestone,
  onToggle,
  onStartEditingDate,
  onStartEditingNotes,
  onSaveDate,
  onSaveNotes,
  onCancelEditDate,
  onCancelEditNotes,
  onEditDateChange,
  onEditNotesChange,
  onFileUpload,
  onDeleteAttachment,
}: MilestoneItemProps) {
  const isCompleted = milestone.progress?.completed;
  const isAccessible = phaseStatus === 'current' || phaseStatus === 'completed';
  const isUpcoming = phaseStatus === 'upcoming';
  const canToggle = isAccessible;

  const getResourceIcon = (type?: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'link':
        return <ExternalLink className="w-4 h-4" />;
      case 'guide':
        return <BookOpen className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getFileIcon = (fileType?: string) => {
    if (fileType?.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (fileType?.includes('image')) return <File className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
        isCompleted ? 'bg-success/5' :
        isUpcoming ? 'bg-background-secondary/50' :
        'bg-background-secondary hover:bg-background-secondary/80'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(milestone, phaseStatus)}
        disabled={!canToggle || updatingMilestone === milestone.id}
        className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
          isCompleted
            ? 'bg-success border-success text-white'
            : canToggle
              ? 'border-input-border hover:border-gold'
              : 'border-input-border opacity-50'
        } ${!canToggle ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {updatingMilestone === milestone.id ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isCompleted ? (
          <Check className="w-4 h-4" />
        ) : null}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className={`font-medium ${isCompleted ? 'text-success line-through' : 'text-navy'}`}>
              {milestone.title}
            </p>
            {!compactView && milestone.description && (
              <p className="text-sm text-foreground-muted mt-1">
                {milestone.description}
              </p>
            )}
            {/* Compact: show target date inline */}
            {compactView && milestone.progress?.target_date && (
              <p className={`text-xs mt-0.5 ${isOverdue(milestone.progress.target_date, isCompleted) ? 'text-error' : 'text-foreground-muted'}`}>
                Target: {formatTargetDate(milestone.progress.target_date)}
              </p>
            )}
          </div>
          {milestone.resource_type && milestone.resource_url && (
            <a
              href={milestone.resource_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-teal hover:text-teal-light"
            >
              {getResourceIcon(milestone.resource_type)}
            </a>
          )}
        </div>

        {/* Expanded view content */}
        {!compactView && (
          <>
            {/* Completion info */}
            {isCompleted && milestone.progress && (
              <p className="text-xs text-foreground-muted mt-2">
                Completed by {milestone.completed_by_name || 'team member'} on{' '}
                {new Date(milestone.progress.completed_at!).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}

            {/* Target date display/edit */}
            {editingDateId === milestone.id ? (
              <div className="flex items-center gap-2 mt-2">
                <Calendar className="w-3 h-3 text-foreground-muted" />
                <input
                  type="date"
                  value={editDateValue}
                  onChange={(e) => onEditDateChange(e.target.value)}
                  className="text-xs px-2 py-1 border border-input-border rounded bg-white"
                  autoFocus
                />
                <button
                  onClick={() => onSaveDate(milestone.id)}
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
                  onClick={onCancelEditDate}
                  className="p-1 text-foreground-muted hover:bg-background-secondary rounded"
                  title="Cancel"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : milestone.progress?.target_date ? (
              <div className="flex items-center gap-1 mt-2">
                <p className={`text-xs flex items-center gap-1 ${
                  isOverdue(milestone.progress.target_date, milestone.progress?.completed)
                    ? 'text-error font-medium'
                    : 'text-foreground-muted'
                }`}>
                  <Calendar className="w-3 h-3" />
                  {isOverdue(milestone.progress.target_date, milestone.progress?.completed) && (
                    <span className="text-error">Overdue:</span>
                  )}
                  Target: {formatTargetDate(milestone.progress.target_date)}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => onStartEditingDate(milestone.id, milestone.progress?.target_date)}
                    className="p-1 text-foreground-muted hover:text-teal hover:bg-teal/10 rounded ml-1"
                    title="Edit date"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : isAdmin ? (
              <button
                onClick={() => onStartEditingDate(milestone.id)}
                className="text-xs text-teal hover:text-teal-light flex items-center gap-1 mt-2"
              >
                <Calendar className="w-3 h-3" />
                <span>Add target date</span>
              </button>
            ) : null}

            {/* Notes display/edit */}
            {editingNotesId === milestone.id ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={editNotesValue}
                  onChange={(e) => onEditNotesChange(e.target.value)}
                  placeholder="Add a note (challenges, victories, updates...)"
                  className="w-full text-sm px-3 py-2 border border-input-border rounded bg-white resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSaveNotes(milestone.id)}
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
                    onClick={onCancelEditNotes}
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
                  {isAdmin && (
                    <button
                      onClick={() => onStartEditingNotes(milestone.id, milestone.progress?.notes)}
                      className="p-1 text-foreground-muted hover:text-teal hover:bg-teal/10 rounded flex-shrink-0"
                      title="Edit note"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ) : isAdmin ? (
              <button
                onClick={() => onStartEditingNotes(milestone.id)}
                className="text-xs text-teal hover:text-teal-light flex items-center gap-1 mt-2"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Add note</span>
              </button>
            ) : null}

            {/* Global Resources section */}
            {milestone.resources && milestone.resources.length > 0 && (
              <div className="mt-3 space-y-1">
                {milestone.resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center gap-2 text-xs bg-purple-50 px-2 py-1.5 rounded"
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
                        <span className="text-orange-500 ml-1">(coming soon)</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Attachments section */}
            {(milestone.attachments && milestone.attachments.length > 0) || isAdmin ? (
              <div className="mt-3">
                {milestone.attachments && milestone.attachments.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {milestone.attachments.map(attachment => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-2 text-xs bg-teal/5 px-2 py-1.5 rounded group"
                      >
                        {getFileIcon(attachment.file_type)}
                        <a
                          href={attachment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal hover:text-teal-light flex-1 truncate"
                          title={attachment.file_name}
                        >
                          {attachment.file_name}
                        </a>
                        <span className="text-foreground-muted">
                          {formatFileSize(attachment.file_size)}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => onDeleteAttachment(attachment.id)}
                            className="p-1 text-foreground-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete attachment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {isAdmin && (
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
                              onFileUpload(milestone.id, file);
                              e.target.value = '';
                            }
                          }}
                        />
                      </>
                    )}
                  </label>
                )}
              </div>
            ) : null}

            {/* Key milestone badge */}
            {milestone.is_key_milestone && (
              <span className="inline-block text-xs text-gold bg-gold/10 px-2 py-0.5 rounded mt-2">
                Key Milestone
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
