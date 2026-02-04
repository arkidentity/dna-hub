'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { PhaseWithMilestones, MilestoneWithProgress, Church, ChurchLeader, FunnelDocument, ScheduledCall, GlobalResource } from '@/lib/types';
import {
  OverviewTab,
  JourneyTab,
  GroupsTab,
  TeamTab,
} from '@/components/dashboard';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'journey' | 'team' | 'groups'>('overview');
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

      // Auto-expand current and onboarding phases
      const toExpand = new Set<string>();
      dashboardData.phases.forEach((phase: PhaseWithMilestones) => {
        if (phase.status === 'current' || phase.phase_number === 0) {
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

  const toggleMilestone = async (milestone: MilestoneWithProgress, phaseStatus: string) => {
    if (phaseStatus === 'locked' || phaseStatus === 'upcoming') return;

    setUpdatingMilestone(milestone.id);

    try {
      const newCompleted = !milestone.progress?.completed;

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

      await fetchDashboard();
    } catch (error) {
      console.error('Progress update error:', error);
    } finally {
      setUpdatingMilestone(null);
    }
  };

  // Admin: Save target date
  const saveTargetDate = async (milestoneId: string) => {
    setUpdatingMilestone(milestoneId);
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          targetDate: editDateValue || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update date');
      }

      await fetchDashboard();
      setEditingDateId(null);
      setEditDateValue('');
    } catch (error) {
      console.error('Date update error:', error);
    } finally {
      setUpdatingMilestone(null);
    }
  };

  // Admin: Save notes
  const saveNotes = async (milestoneId: string) => {
    setUpdatingMilestone(milestoneId);
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          notes: editNotesValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update notes');
      }

      await fetchDashboard();
      setEditingNotesId(null);
      setEditNotesValue('');
    } catch (error) {
      console.error('Notes update error:', error);
    } finally {
      setUpdatingMilestone(null);
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
    setUpdatingMilestone(milestoneId);
    try {
      const response = await fetch('/api/church/progress/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          churchNotes: editChurchNotesValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update church notes');
      }

      await fetchDashboard();
      setEditingChurchNotesId(null);
      setEditChurchNotesValue('');
    } catch (error) {
      console.error('Church notes update error:', error);
      alert('Failed to save notes. Please try again.');
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

      const response = await fetch('/api/attachments', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to upload file');
        return;
      }

      await fetchDashboard();
    } catch (error) {
      console.error('Upload error:', error);
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
        const error = await response.json();
        alert(error.error || 'Failed to delete attachment');
        return;
      }

      await fetchDashboard();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete attachment');
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
      <div className="bg-navy text-white py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          {church.logo_url && (
            <Image
              src={church.logo_url}
              alt={church.name}
              width={40}
              height={40}
              className="rounded-full"
            />
          )}
          <div>
            <p className="text-gold font-medium text-sm tracking-wide">DNA ROADMAP</p>
            <p className="font-semibold">{church.name}</p>
          </div>
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
              { id: 'groups', label: 'DNA Groups', icon: Users },
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

        {/* Help Section */}
        <div className="mt-12 text-center text-foreground-muted">
          <p>
            Need help?{' '}
            <a href="mailto:travis@arkidentity.com" className="text-teal hover:text-teal-light">
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
