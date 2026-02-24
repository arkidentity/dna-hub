'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Loader2,
  LayoutDashboard,
  Map,
  Users,
  AlertCircle,
  RefreshCw,
  UserCog,
  Sparkles,
} from 'lucide-react';
import { PhaseWithMilestones, MilestoneWithProgress, Church, ChurchLeader, FunnelDocument, ScheduledCall, GlobalResource } from '@/lib/types';
import {
  OverviewTab,
  JourneyTab,
  GroupsTab,
  TeamTab,
} from '@/components/dashboard';
import TeamGiftsTab from '@/components/spiritual-gifts/TeamGiftsTab';

interface DashboardData {
  church: Church;
  leader: ChurchLeader;
  phases: PhaseWithMilestones[];
  documents: FunnelDocument[];
  calls: ScheduledCall[];
  globalResources: GlobalResource[];
  isAdmin: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'journey' | 'team' | 'groups' | 'gifts'>('overview');
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [compactView, setCompactView] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashboard_compact_view') === 'true';
    }
    return false;
  });
  const [updatingMilestone, setUpdatingMilestone] = useState<string | null>(null);

  // Admin editing state
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [editDateValue, setEditDateValue] = useState<string>('');
  const [editNotesValue, setEditNotesValue] = useState<string>('');
  const [uploadingMilestone, setUploadingMilestone] = useState<string | null>(null);

  // Church notes editing state
  const [editingChurchNotesId, setEditingChurchNotesId] = useState<string | null>(null);
  const [editChurchNotesValue, setEditChurchNotesValue] = useState<string>('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Prefetch tab data in the background after initial dashboard loads
  useEffect(() => {
    if (!data) return;
    const churchId = data.church.id;
    // Warm up browser fetch cache for tab endpoints
    fetch(`/api/churches/${churchId}/dna-groups`).catch(() => {});
    fetch(`/api/admin/church-leaders/invite?church_id=${churchId}`).catch(() => {});
  }, [data?.church?.id]);

  // Persist compact view preference
  useEffect(() => {
    localStorage.setItem('dashboard_compact_view', String(compactView));
  }, [compactView]);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard');

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (response.status === 307) {
        const data = await response.json();
        router.push(data.redirect || '/portal');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard');
      }

      const dashboardData = await response.json();

      if (dashboardData.redirect) {
        router.push(dashboardData.redirect);
        return;
      }

      setData(dashboardData);

      // Auto-expand only the current in-progress phase; completed phases stay closed
      const toExpand = new Set<string>();
      dashboardData.phases.forEach((phase: PhaseWithMilestones) => {
        if (phase.status === 'current') {
          toExpand.add(phase.id);
        }
      });
      setExpandedPhases(toExpand);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  // Helper to update a specific milestone's progress in local state
  const updateMilestoneInState = useCallback((
    milestoneId: string,
    updater: (progress: MilestoneWithProgress['progress']) => Partial<NonNullable<MilestoneWithProgress['progress']>>
  ) => {
    setData(prev => {
      if (!prev) return prev;
      const now = new Date().toISOString();
      return {
        ...prev,
        phases: prev.phases.map(phase => ({
          ...phase,
          milestones: phase.milestones.map(m => {
            if (m.id !== milestoneId) return m;
            const updates = updater(m.progress);
            const base = m.progress || {
              id: `temp-${milestoneId}`,
              church_id: prev.church.id,
              milestone_id: milestoneId,
              completed: false,
              created_at: now,
              updated_at: now,
            };
            return { ...m, progress: { ...base, ...updates, updated_at: now } };
          }),
          completedCount: phase.milestones.reduce((count, m) => {
            if (m.id === milestoneId) {
              const updates = updater(m.progress);
              return count + (updates.completed ? 1 : 0);
            }
            return count + (m.progress?.completed ? 1 : 0);
          }, 0),
        })),
      };
    });
  }, []);

  const toggleMilestone = async (milestone: MilestoneWithProgress, phaseStatus: string) => {
    if (phaseStatus === 'locked' || phaseStatus === 'upcoming') return;

    const newCompleted = !milestone.progress?.completed;

    // Optimistic update — reflect change immediately
    updateMilestoneInState(milestone.id, () => ({
      completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : undefined,
    }));

    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId: milestone.id,
          completed: newCompleted,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }
    } catch (error) {
      console.error('Progress update error:', error);
      // Revert on failure
      await fetchDashboard();
    }
  };

  // Admin: Save target date
  const saveTargetDate = async (milestoneId: string) => {
    const dateVal = editDateValue || null;

    // Optimistic update
    updateMilestoneInState(milestoneId, () => ({
      target_date: dateVal || undefined,
    }));
    setEditingDateId(null);
    setEditDateValue('');

    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          targetDate: dateVal,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update date');
      }
    } catch (error) {
      console.error('Date update error:', error);
      await fetchDashboard();
    }
  };

  // Admin: Save notes
  const saveNotes = async (milestoneId: string) => {
    const notesVal = editNotesValue;

    // Optimistic update
    updateMilestoneInState(milestoneId, () => ({
      notes: notesVal,
    }));
    setEditingNotesId(null);
    setEditNotesValue('');

    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          notes: notesVal,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update notes');
      }
    } catch (error) {
      console.error('Notes update error:', error);
      await fetchDashboard();
    }
  };

  const startEditingDate = (milestoneId: string, currentDate?: string) => {
    setEditingDateId(milestoneId);
    setEditDateValue(currentDate ? currentDate.split('T')[0] : '');
    setEditingNotesId(null);
  };

  const startEditingNotes = (milestoneId: string, currentNotes?: string) => {
    setEditingNotesId(milestoneId);
    setEditNotesValue(currentNotes || '');
    setEditingDateId(null);
  };

  // Church notes handlers
  const startEditingChurchNotes = (milestoneId: string, currentNotes?: string) => {
    setEditingChurchNotesId(milestoneId);
    setEditChurchNotesValue(currentNotes || '');
  };

  const saveChurchNotes = async (milestoneId: string) => {
    const notesVal = editChurchNotesValue;

    // Optimistic update — update the milestone's church_notes in local state
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        phases: prev.phases.map(phase => ({
          ...phase,
          milestones: phase.milestones.map(m =>
            m.id === milestoneId ? { ...m, church_notes: notesVal } : m
          ),
        })),
      };
    });
    setEditingChurchNotesId(null);
    setEditChurchNotesValue('');

    try {
      const response = await fetch('/api/church/progress/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          churchNotes: notesVal,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update church notes');
      }
    } catch (error) {
      console.error('Church notes update error:', error);
      alert('Failed to save notes. Please try again.');
      await fetchDashboard();
    }
  };

  const handleFileUpload = async (milestoneId: string, file: File) => {
    setUploadingMilestone(milestoneId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('milestoneId', milestoneId);

      const response = await fetch('/api/attachments', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to upload file');
        return;
      }

      // Refresh to get the new attachment with server-generated ID/URL
      fetchDashboard();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploadingMilestone(null);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Delete this attachment?')) return;

    // Optimistic removal from local state
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        phases: prev.phases.map(phase => ({
          ...phase,
          milestones: phase.milestones.map(m => ({
            ...m,
            attachments: m.attachments?.filter(a => a.id !== attachmentId) || [],
          })),
        })),
      };
    });

    try {
      const response = await fetch(`/api/attachments?id=${attachmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to delete attachment');
        await fetchDashboard();
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete attachment');
      await fetchDashboard();
    }
  };

  const exportCalendar = (phaseNumber?: number) => {
    const url = phaseNumber
      ? `/api/calendar?phase=${phaseNumber}`
      : '/api/calendar';
    window.location.href = url;
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
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-navy mb-2">Failed to load dashboard</h2>
          <p className="text-foreground-muted mb-4">Something went wrong. Please try again.</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchDashboard();
            }}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { church, leader, phases, documents, calls, globalResources, isAdmin } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Page Title with Church Info */}
      <div className="bg-navy text-white py-3 px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          {(church.splash_logo_url || church.logo_url) ? (
            <Image
              src={church.splash_logo_url || church.logo_url!}
              alt={church.name}
              width={180}
              height={56}
              className="object-contain max-h-14"
            />
          ) : (
            <p className="font-semibold text-lg">{church.name}</p>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-card-border">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-6">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'journey', label: 'DNA Journey', icon: Map },
              { id: 'team', label: 'Team', icon: UserCog },
              { id: 'groups', label: 'DNA Leaders', icon: Users },
              { id: 'gifts', label: 'Ministry Gifts', icon: Sparkles },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-gold text-navy font-medium'
                    : 'border-transparent text-foreground-muted hover:text-navy'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <OverviewTab
            phases={phases}
            church={church}
            documents={documents}
            calls={calls}
            globalResources={globalResources}
            onViewAllClick={() => setActiveTab('journey')}
          />
        )}

        {activeTab === 'journey' && (
          <JourneyTab
            phases={phases}
            church={church}
            calls={calls}
            isAdmin={isAdmin}
            compactView={compactView}
            expandedPhases={expandedPhases}
            updatingMilestone={updatingMilestone}
            editingDateId={editingDateId}
            editingNotesId={editingNotesId}
            editDateValue={editDateValue}
            editNotesValue={editNotesValue}
            uploadingMilestone={uploadingMilestone}
            editingChurchNotesId={editingChurchNotesId}
            editChurchNotesValue={editChurchNotesValue}
            onToggleCompactView={() => setCompactView(!compactView)}
            onTogglePhase={togglePhase}
            onToggleMilestone={toggleMilestone}
            onStartEditingDate={startEditingDate}
            onStartEditingNotes={startEditingNotes}
            onSaveDate={saveTargetDate}
            onSaveNotes={saveNotes}
            onCancelEditDate={() => { setEditingDateId(null); setEditDateValue(''); }}
            onCancelEditNotes={() => { setEditingNotesId(null); setEditNotesValue(''); }}
            onEditDateChange={setEditDateValue}
            onEditNotesChange={setEditNotesValue}
            onFileUpload={handleFileUpload}
            onDeleteAttachment={handleDeleteAttachment}
            onExportCalendar={exportCalendar}
            onStartEditingChurchNotes={startEditingChurchNotes}
            onSaveChurchNotes={saveChurchNotes}
            onCancelEditChurchNotes={() => { setEditingChurchNotesId(null); setEditChurchNotesValue(''); }}
            onEditChurchNotesChange={setEditChurchNotesValue}
          />
        )}

        {activeTab === 'team' && (
          <TeamTab
            churchId={church.id}
            churchName={church.name}
          />
        )}

        {activeTab === 'groups' && (
          <GroupsTab
            churchId={church.id}
            churchName={church.name}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'gifts' && (
          <TeamGiftsTab churchId={church.id} subdomain={church.subdomain} />
        )}

        {/* Help Section */}
        <div className="mt-12 text-center text-foreground-muted">
          <p>
            Need help?{' '}
            <a href="mailto:info@dnadiscipleship.com" className="text-teal hover:text-teal-light">
              Email Travis
            </a>{' '}
            or{' '}
            <a
              href="https://calendly.com/arkidentity"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal hover:text-teal-light"
            >
              schedule office hours
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
