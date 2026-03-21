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
  Palette,
  UserCog,
  GraduationCap,
  Globe,
  ExternalLink,
  Heart,
  Radio,
  Route,
} from 'lucide-react';
import { GroupsTab } from '@/components/dashboard';
import { AdminChurchOverviewTab, AdminChurchJourneyTab, ChurchLeadersTab, BrandingTab, AdminCohortTab, DemoTab } from '@/components/admin';
import PrayerWallTab from '@/components/admin/PrayerWallTab';
import ServicesTab from '@/components/dashboard/services/ServicesTab';
import PathwayTab from '@/components/admin/PathwayTab';

interface ChurchDetail {
  church: {
    id: string;
    name: string;
    status: string;
    current_phase: number;
    coach_id?: string | null;
    created_at: string;
    subdomain?: string | null;
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
  coach?: { id: string; name: string; email: string | null } | null;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'journey' | 'leaders' | 'groups' | 'branding' | 'cohort' | 'demo' | 'prayer-wall' | 'services' | 'pathway'>('overview');

  // Church info editing state
  const [editingChurchInfo, setEditingChurchInfo] = useState(false);
  const [editChurchName, setEditChurchName] = useState('');
  const [editLeaderName, setEditLeaderName] = useState('');
  const [editLeaderEmail, setEditLeaderEmail] = useState('');
  const [savingChurchInfo, setSavingChurchInfo] = useState(false);

  // Alias editing state
  const [editingAliases, setEditingAliases] = useState(false);
  const [aliasInput, setAliasInput] = useState('');
  const [savingAliases, setSavingAliases] = useState(false);

  // Coach assignment state (admin-only)
  const [coachOptions, setCoachOptions] = useState<{ id: string; name: string }[]>([]);
  const [savingCoach, setSavingCoach] = useState(false);

  useEffect(() => {
    fetch('/api/admin/coaches')
      .then(r => r.ok ? r.json() : { coaches: [] })
      .then(d => setCoachOptions((d.coaches ?? []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))))
      .catch(() => {});
  }, []);

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

  const handleSendLoginLink = async () => {
    if (!data?.leader.email) return;

    try {
      const response = await fetch('/api/admin/send-login-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.leader.email, name: data.leader.name }),
      });

      if (!response.ok) {
        throw new Error('Failed to send login link');
      }

      alert(`Login link sent to ${data.leader.email}`);
    } catch (error) {
      console.error('Login link error:', error);
      alert('Failed to send login link');
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

  const handleCoachChange = async (newCoachId: string) => {
    setSavingCoach(true);
    try {
      const res = await fetch('/api/admin/churches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId, coachId: newCoachId || null }),
      });
      if (!res.ok) throw new Error('Failed to update coach');
      await fetchChurchData();
    } catch (error) {
      console.error('Coach update error:', error);
      alert('Failed to update coach assignment');
    } finally {
      setSavingCoach(false);
    }
  };

  const handleSaveChurchInfo = async () => {
    setSavingChurchInfo(true);
    try {
      const body: Record<string, string> = {};
      if (editChurchName.trim() !== data?.church.name) body.churchName = editChurchName.trim();
      if (editLeaderName.trim() !== data?.leader.name) body.leaderName = editLeaderName.trim();
      if (editLeaderEmail.trim().toLowerCase() !== data?.leader.email.toLowerCase()) body.leaderEmail = editLeaderEmail.trim();

      if (Object.keys(body).length === 0) {
        setEditingChurchInfo(false);
        return;
      }

      const res = await fetch(`/api/admin/church/${churchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update');
      }

      await fetchChurchData();
      setEditingChurchInfo(false);
    } catch (error) {
      console.error('Save church info error:', error);
      alert('Failed to save changes');
    } finally {
      setSavingChurchInfo(false);
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

  const { church, coach, leader, assessment, documents, calls, phases } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Churches
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              {editingChurchInfo ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-400">Church Name</label>
                    <input
                      type="text"
                      value={editChurchName}
                      onChange={(e) => setEditChurchName(e.target.value)}
                      className="block w-full text-lg font-semibold px-2 py-1 bg-white/10 border border-gray-500 rounded text-white placeholder-gray-400"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase tracking-wider text-gray-400">Primary Leader</label>
                      <input
                        type="text"
                        value={editLeaderName}
                        onChange={(e) => setEditLeaderName(e.target.value)}
                        className="block w-full text-sm px-2 py-1 bg-white/10 border border-gray-500 rounded text-white placeholder-gray-400"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] uppercase tracking-wider text-gray-400">Email</label>
                      <input
                        type="email"
                        value={editLeaderEmail}
                        onChange={(e) => setEditLeaderEmail(e.target.value)}
                        className="block w-full text-sm px-2 py-1 bg-white/10 border border-gray-500 rounded text-white placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveChurchInfo}
                      disabled={savingChurchInfo}
                      className="flex items-center gap-1 px-3 py-1 bg-gold text-navy rounded text-xs font-medium hover:bg-gold-light disabled:opacity-50"
                    >
                      {savingChurchInfo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Save
                    </button>
                    <button
                      onClick={() => setEditingChurchInfo(false)}
                      className="flex items-center gap-1 px-3 py-1 text-gray-300 hover:text-white hover:bg-white/10 rounded text-xs"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-white">{church.name}</h1>
                    <button
                      onClick={() => {
                        setEditChurchName(church.name);
                        setEditLeaderName(leader.name);
                        setEditLeaderEmail(leader.email);
                        setEditingChurchInfo(true);
                      }}
                      className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                      title="Edit church name, leader, and email"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-300">
                    <span>{leader.name}</span>
                    <span>•</span>
                    <a href={`mailto:${leader.email}`} className="text-gold hover:text-gold-light">
                      {leader.email}
                    </a>
                  </div>
                </>
              )}
              {/* Subdomain link */}
              {church.subdomain && (
                <div className="flex items-center gap-2 mt-1.5">
                  <Globe className="w-3 h-3 text-gray-400" />
                  <a
                    href={`https://${church.subdomain}.dailydna.app`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gold hover:text-gold-light flex items-center gap-1"
                  >
                    {church.subdomain}.dailydna.app
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

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
              {/* Assigned Coach */}
              {(coach || coachOptions.length > 0) && (
                <div className="flex items-center gap-2 mt-2">
                  <Users className="w-3 h-3 text-gray-400" />
                  {coachOptions.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={church.coach_id ?? ''}
                        onChange={e => handleCoachChange(e.target.value)}
                        disabled={savingCoach}
                        className="text-xs px-2 py-1 bg-white/10 border border-gray-500 rounded text-white disabled:opacity-50"
                      >
                        <option value="">— No coach —</option>
                        {coachOptions.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      {savingCoach && <Loader2 className="w-3 h-3 animate-spin text-gold" />}
                    </div>
                  ) : coach ? (
                    <span className="text-xs text-gray-300">Coach: {coach.name}</span>
                  ) : null}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={handleSendLoginLink}
                className="flex items-center gap-1.5 px-2 py-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors text-xs"
                title="Send login link to church leader"
              >
                <Send className="w-3 h-3" />
                <span className="hidden sm:inline">Send Link</span>
              </button>
              <select
                value={church.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-navy border border-gray-600 text-white rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm max-w-[160px] sm:max-w-none"
              >
                <option value="prospect">Prospect</option>
                <option value="demo">Demo</option>
                <option value="demo_sent">Demo Sent</option>
                <option value="pending_assessment">Pending Assessment</option>
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 sm:gap-6 min-w-max">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'journey', label: 'Journey', icon: Map },
              { id: 'leaders', label: 'Leaders', icon: UserCog },
              { id: 'groups', label: 'Groups', icon: Users },
              { id: 'cohort', label: 'Cohort', icon: GraduationCap },
              { id: 'prayer-wall', label: 'Prayer', icon: Heart },
              { id: 'pathway', label: 'Pathway', icon: Route },
              { id: 'services', label: 'Services', icon: Radio },
              { id: 'branding', label: 'Branding', icon: Palette },
              { id: 'demo', label: 'Demo', icon: ExternalLink },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-2 sm:px-0 border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'border-gold text-navy font-medium'
                    : 'border-transparent text-foreground-muted hover:text-navy'
                }`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
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

        {/* Leaders Tab */}
        {activeTab === 'leaders' && (
          <ChurchLeadersTab
            churchId={churchId}
            churchName={church.name}
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

        {/* Cohort Tab */}
        {activeTab === 'cohort' && (
          <AdminCohortTab churchId={churchId} />
        )}

        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <BrandingTab churchId={churchId} />
        )}

        {/* Prayer Wall Tab */}
        {activeTab === 'prayer-wall' && (
          <PrayerWallTab churchId={churchId} subdomain={church.subdomain || undefined} />
        )}

        {/* Pathway Tab */}
        {activeTab === 'pathway' && (
          <PathwayTab churchId={churchId} />
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <ServicesTab churchId={churchId} subdomain={church.subdomain || undefined} isAdmin={true} />
        )}

        {/* Demo Tab */}
        {activeTab === 'demo' && (
          <DemoTab
            churchId={churchId}
            churchName={church.name}
            subdomain={church.subdomain}
            leaderEmail={data?.leader?.email}
            leaderName={data?.leader?.name}
          />
        )}
      </main>
    </div>
  );
}
