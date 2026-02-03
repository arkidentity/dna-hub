'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Send,
  Plus,
  LayoutDashboard,
  Map,
  Users,
  Pencil,
  Tag,
  Check,
  X,
} from 'lucide-react';
import { GroupsTab } from '@/components/dashboard';
import { AdminChurchOverviewTab, AdminChurchJourneyTab } from '@/components/admin';

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
    aliases?: string[];
    template_applied_at?: string;
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
    meet_link?: string;
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

export default function AdminChurchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: churchId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<ChurchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'journey' | 'groups'>('overview');

  // Alias editing state
  const [editingAliases, setEditingAliases] = useState(false);
  const [aliasInput, setAliasInput] = useState('');
  const [savingAliases, setSavingAliases] = useState(false);

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
    } catch (error) {
      console.error('Church fetch error:', error);
    } finally {
      setLoading(false);
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

  const handlePhaseChange = async (newPhase: number) => {
    try {
      const response = await fetch('/api/admin/churches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId, current_phase: newPhase }),
      });

      if (!response.ok) {
        throw new Error('Failed to update phase');
      }

      await fetchChurchData();
    } catch (error) {
      console.error('Phase update error:', error);
      alert('Failed to update phase');
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

  const handleSaveAliases = async () => {
    setSavingAliases(true);
    try {
      // Parse comma-separated aliases
      const aliases = aliasInput
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      const response = await fetch('/api/admin/churches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId, aliases }),
      });

      if (!response.ok) {
        throw new Error('Failed to save aliases');
      }

      await fetchChurchData();
      setEditingAliases(false);
    } catch (error) {
      console.error('Save aliases error:', error);
      alert('Failed to save aliases');
    } finally {
      setSavingAliases(false);
    }
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
              <h1 className="text-xl font-semibold text-white">{church.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-300">
                <span>{leader.name}</span>
                <span>•</span>
                <a href={`mailto:${leader.email}`} className="text-gold hover:text-gold-light">
                  {leader.email}
                </a>
              </div>
              {/* Calendar Aliases */}
              <div className="flex items-center gap-2 mt-2">
                <Tag className="w-3 h-3 text-gray-400" />
                {editingAliases ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={aliasInput}
                      onChange={(e) => setAliasInput(e.target.value)}
                      placeholder="e.g., BLVD, Boulevard"
                      className="text-xs px-2 py-1 bg-white/10 border border-gray-500 rounded text-white placeholder-gray-400 w-48"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveAliases}
                      disabled={savingAliases}
                      className="p-1 text-green-400 hover:bg-white/10 rounded"
                    >
                      {savingAliases ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingAliases(false);
                        setAliasInput(church.aliases?.join(', ') || '');
                      }}
                      className="p-1 text-gray-400 hover:bg-white/10 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAliasInput(church.aliases?.join(', ') || '');
                      setEditingAliases(true);
                    }}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                    title="Calendar aliases for matching events"
                  >
                    {church.aliases && church.aliases.length > 0 ? (
                      <>
                        <span>Aliases: {church.aliases.join(', ')}</span>
                        <Pencil className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        <span className="italic">Add calendar aliases</span>
                        <Plus className="w-3 h-3" />
                      </>
                    )}
                  </button>
                )}
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

      {/* Tab Navigation */}
      <div className="bg-white border-b border-card-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-6">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'journey', label: 'DNA Journey', icon: Map },
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

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <AdminChurchOverviewTab
            churchId={churchId}
            currentPhase={church.current_phase}
            calls={calls}
            documents={documents}
            assessment={assessment}
            phases={phases}
            onPhaseChange={handlePhaseChange}
            onRefresh={fetchChurchData}
          />
        )}

        {/* DNA Journey Tab */}
        {activeTab === 'journey' && phases && (
          <AdminChurchJourneyTab
            churchId={churchId}
            currentPhase={church.current_phase}
            phases={phases}
            calls={data?.calls || []}
            templateApplied={!!church.template_applied_at}
            onRefresh={fetchChurchData}
          />
        )}

        {/* DNA Groups Tab */}
        {activeTab === 'groups' && (
          <GroupsTab
            churchId={churchId}
            churchName={church.name}
            isAdmin={true}
          />
        )}
      </main>
    </div>
  );
}
