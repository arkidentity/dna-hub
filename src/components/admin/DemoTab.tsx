'use client';

import { useState, useEffect } from 'react';
import {
  Play,
  Link2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Database,
  Thermometer,
  Eye,
  EyeOff,
  User,
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  X,
} from 'lucide-react';

interface DnaCoach {
  id: string;
  name: string;
  email: string | null;
  booking_embed: string | null;
}

interface DemoTabProps {
  churchId: string;
  churchName: string;
  subdomain?: string | null;
}

interface DemoSettings {
  video_url: string | null;
  demo_enabled: boolean;
  default_temp: 'cold' | 'warm' | 'hot';
  demo_seeded_at: string | null;
  hub_demo_seeded_at: string | null;
  coach_name: string;
  booking_url: string;
  coach_id: string | null;
}

const TEMPS = [
  {
    value: 'cold' as const,
    label: 'Cold',
    description: 'New prospect — educational tone',
    color: '#6b9ab8',
  },
  {
    value: 'warm' as const,
    label: 'Warm',
    description: 'Engaged lead — personalized tone',
    color: '#e8a84a',
  },
  {
    value: 'hot' as const,
    label: 'Hot',
    description: 'Ready to launch — action tone',
    color: '#c0392b',
  },
];

/** Extract YouTube video ID from any YouTube URL format */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
}

export default function DemoTab({ churchId, churchName, subdomain }: DemoTabProps) {
  const [settings, setSettings] = useState<DemoSettings>({
    video_url: '',
    demo_enabled: false,
    default_temp: 'warm',
    demo_seeded_at: null,
    hub_demo_seeded_at: null,
    coach_name: 'Travis',
    booking_url: '',
    coach_id: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const [copiedTemp, setCopiedTemp] = useState<string | null>(null);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [hubSeeding, setHubSeeding] = useState(false);
  const [showHubSeedConfirm, setShowHubSeedConfirm] = useState(false);
  const [hubSeedSuccess, setHubSeedSuccess] = useState(false);
  const [copiedHub, setCopiedHub] = useState(false);

  // ── Coach state ──────────────────────────────────────────────────────────
  const [coaches, setCoaches] = useState<DnaCoach[]>([]);
  const [showCoachManager, setShowCoachManager] = useState(false);
  const [showAddCoach, setShowAddCoach] = useState(false);
  const [newCoach, setNewCoach] = useState({ name: '', email: '', booking_embed: '' });
  const [addingCoach, setAddingCoach] = useState(false);
  const [deletingCoachId, setDeletingCoachId] = useState<string | null>(null);
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ name: '', email: '', booking_embed: '' });
  const [savingCoachId, setSavingCoachId] = useState<string | null>(null);
  const [coachError, setCoachError] = useState<string | null>(null);

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dnadiscipleship.com';
  const demoBaseUrl = subdomain ? `${BASE_URL}/demo/${subdomain}` : null;
  const hubDemoUrl = subdomain ? `${BASE_URL}/demo-hub/${subdomain}` : null;

  useEffect(() => {
    void fetchAll();
  }, [churchId]);

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [settingsRes, coachesRes] = await Promise.all([
        fetch(`/api/admin/demo/${churchId}`),
        fetch('/api/admin/coaches'),
      ]);

      if (!settingsRes.ok) throw new Error('Failed to fetch settings');
      const settingsData = await settingsRes.json();
      if (settingsData.settings) {
        setSettings({
          video_url: settingsData.settings.video_url ?? '',
          demo_enabled: settingsData.settings.demo_enabled ?? false,
          default_temp: settingsData.settings.default_temp ?? 'warm',
          demo_seeded_at: settingsData.settings.demo_seeded_at ?? null,
          hub_demo_seeded_at: settingsData.settings.hub_demo_seeded_at ?? null,
          coach_name: settingsData.settings.coach_name ?? 'Travis',
          booking_url: settingsData.settings.booking_url ?? '',
          coach_id: settingsData.settings.coach_id ?? null,
        });
      }

      if (coachesRes.ok) {
        const coachesData = await coachesRes.json();
        setCoaches(coachesData.coaches ?? []);
      }
    } catch (err) {
      setError('Failed to load demo settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Coach actions ────────────────────────────────────────────────────────

  const handleSelectCoach = (coachId: string) => {
    if (!coachId) {
      setSettings(prev => ({ ...prev, coach_id: null }));
      return;
    }
    const coach = coaches.find(c => c.id === coachId);
    if (coach) {
      setSettings(prev => ({
        ...prev,
        coach_id: coach.id,
        coach_name: coach.name,
        booking_url: coach.booking_embed ?? '',
      }));
    }
  };

  const handleAddCoach = async () => {
    if (!newCoach.name.trim()) return;
    setAddingCoach(true);
    setCoachError(null);
    try {
      const res = await fetch('/api/admin/coaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCoach.name.trim(),
          email: newCoach.email.trim() || null,
          booking_embed: newCoach.booking_embed.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to add coach');
      }
      const data = await res.json();
      setCoaches(prev => [...prev, data.coach]);
      setNewCoach({ name: '', email: '', booking_embed: '' });
      setShowAddCoach(false);
    } catch (err) {
      setCoachError(err instanceof Error ? err.message : 'Failed to add coach');
    } finally {
      setAddingCoach(false);
    }
  };

  const handleStartEdit = (coach: DnaCoach) => {
    setEditingCoachId(coach.id);
    setEditDraft({
      name: coach.name,
      email: coach.email ?? '',
      booking_embed: coach.booking_embed ?? '',
    });
  };

  const handleSaveCoach = async (coachId: string) => {
    if (!editDraft.name.trim()) return;
    setSavingCoachId(coachId);
    setCoachError(null);
    try {
      const res = await fetch(`/api/admin/coaches/${coachId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editDraft.name.trim(),
          email: editDraft.email.trim() || null,
          booking_embed: editDraft.booking_embed.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to update coach');
      }
      const data = await res.json();
      setCoaches(prev => prev.map(c => (c.id === coachId ? data.coach : c)));
      // Sync auto-filled fields if this is the selected coach
      if (settings.coach_id === coachId) {
        setSettings(prev => ({
          ...prev,
          coach_name: data.coach.name,
          booking_url: data.coach.booking_embed ?? '',
        }));
      }
      setEditingCoachId(null);
    } catch (err) {
      setCoachError(err instanceof Error ? err.message : 'Failed to update coach');
    } finally {
      setSavingCoachId(null);
    }
  };

  const handleDeleteCoach = async (coachId: string) => {
    setDeletingCoachId(coachId);
    setCoachError(null);
    try {
      const res = await fetch(`/api/admin/coaches/${coachId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to delete coach');
      }
      setCoaches(prev => prev.filter(c => c.id !== coachId));
      if (settings.coach_id === coachId) {
        setSettings(prev => ({ ...prev, coach_id: null }));
      }
    } catch (err) {
      setCoachError(err instanceof Error ? err.message : 'Failed to delete coach');
    } finally {
      setDeletingCoachId(null);
    }
  };

  // ── Demo settings actions ────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSavedOk(false);

    try {
      const res = await fetch(`/api/admin/demo/${churchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_url: settings.video_url?.trim() || null,
          demo_enabled: settings.demo_enabled,
          default_temp: settings.default_temp,
          coach_name: settings.coach_name?.trim() || 'Travis',
          booking_url: settings.booking_url?.trim() || null,
          coach_id: settings.coach_id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Save failed');
      }

      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedSuccess(false);
    setShowSeedConfirm(false);

    try {
      const res = await fetch(`/api/admin/demo/${churchId}/seed`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Seed failed');
      }

      const now = new Date().toISOString();
      setSettings(prev => ({ ...prev, demo_seeded_at: now }));
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 4000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  const handleHubSeed = async () => {
    setHubSeeding(true);
    setHubSeedSuccess(false);
    setShowHubSeedConfirm(false);

    try {
      const res = await fetch(`/api/admin/demo/${churchId}/hub-seed`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Hub seed failed');
      }

      const now = new Date().toISOString();
      setSettings(prev => ({ ...prev, hub_demo_seeded_at: now }));
      setHubSeedSuccess(true);
      setTimeout(() => setHubSeedSuccess(false), 4000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Hub seed failed');
    } finally {
      setHubSeeding(false);
    }
  };

  const copyHubLink = () => {
    if (!hubDemoUrl) return;
    void navigator.clipboard.writeText(hubDemoUrl);
    setCopiedHub(true);
    setTimeout(() => setCopiedHub(false), 2000);
  };

  const copyLink = (temp: string) => {
    if (!demoBaseUrl) return;
    const url = `${demoBaseUrl}?temp=${temp}`;
    void navigator.clipboard.writeText(url);
    setCopiedTemp(temp);
    setTimeout(() => setCopiedTemp(null), 2000);
  };

  // ── Shared mini-styles for coach manager ─────────────────────────────────

  const cmInputStyle: React.CSSProperties = {
    padding: '0.5rem 0.625rem',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '0.875rem',
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  };

  const cmSaveBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.35rem 0.75rem',
    background: '#1a3a52',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.825rem',
    fontWeight: 600,
    fontFamily: 'inherit',
  };

  const cmCancelBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.35rem 0.75rem',
    background: 'transparent',
    color: '#555',
    border: '1px solid #ddd',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.825rem',
    fontFamily: 'inherit',
  };

  const cmIconBtnStyle: React.CSSProperties = {
    padding: '0.3rem',
    background: 'none',
    border: '1px solid #e8e8e8',
    borderRadius: '5px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888',
    flexShrink: 0,
  };

  // ── Render guards ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '2rem', color: '#888' }}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading demo settings…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '2rem', color: '#c0392b' }}>
        <AlertCircle className="w-4 h-4" />
        <span>{error}</span>
      </div>
    );
  }

  const videoId = settings.video_url ? extractYouTubeId(settings.video_url) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '720px' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a2332', margin: 0 }}>
          Demo Page
        </h2>
        <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Configure the personalized demo page for {churchName}. Coaches share this link with church prospects.
        </p>
      </div>

      {/* ── Demo Enabled Toggle ─────────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600, color: '#1a2332', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {settings.demo_enabled
              ? <Eye className="w-4 h-4" style={{ color: '#27ae60' }} />
              : <EyeOff className="w-4 h-4" style={{ color: '#999' }} />
            }
            Demo Page {settings.demo_enabled ? 'Active' : 'Inactive'}
          </div>
          <p style={{ color: '#666', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
            {settings.demo_enabled
              ? 'The demo page is live and accessible via the link below.'
              : 'Enable to make the demo page accessible to prospects.'}
          </p>
        </div>
        <button
          onClick={() => setSettings(prev => ({ ...prev, demo_enabled: !prev.demo_enabled }))}
          style={{
            width: '48px',
            height: '26px',
            borderRadius: '13px',
            border: 'none',
            cursor: 'pointer',
            background: settings.demo_enabled ? '#27ae60' : '#ccc',
            position: 'relative',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
          aria-label="Toggle demo enabled"
        >
          <span style={{
            position: 'absolute',
            top: '3px',
            left: settings.demo_enabled ? '25px' : '3px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </button>
      </div>

      {/* ── DNA Coach Selector ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontWeight: 600, color: '#1a2332', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User className="w-4 h-4" />
          DNA Coach
        </label>
        <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>
          Select a coach to auto-fill their name and booking link, or enter details manually below.
        </p>

        {/* Selector row */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={settings.coach_id ?? ''}
            onChange={e => handleSelectCoach(e.target.value)}
            style={{
              padding: '0.625rem 0.75rem',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '0.9rem',
              outline: 'none',
              fontFamily: 'inherit',
              background: '#fff',
              cursor: 'pointer',
              minWidth: '200px',
              flex: '1 1 200px',
              maxWidth: '320px',
            }}
          >
            <option value="">— Select a coach —</option>
            {coaches.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}{c.email ? ` (${c.email})` : ''}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setShowCoachManager(prev => !prev);
              if (showCoachManager) {
                // closing — also reset edit/add state
                setEditingCoachId(null);
                setShowAddCoach(false);
                setCoachError(null);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.55rem 0.875rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              background: showCoachManager ? '#f0f4f8' : '#fff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#333',
              fontFamily: 'inherit',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            {showCoachManager ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Manage Coaches
          </button>
        </div>

        {/* ── Inline Coach Manager ──────────────────────────────────────── */}
        {showCoachManager && (
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            overflow: 'hidden',
            marginTop: '0.25rem',
          }}>
            {/* Manager header */}
            <div style={{
              padding: '0.625rem 1rem',
              background: '#f5f7fa',
              borderBottom: '1px solid #e8e8e8',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#555',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              Coach Registry
            </div>

            {/* Coach list */}
            <div>
              {coaches.length === 0 && (
                <div style={{ padding: '1.25rem', color: '#aaa', fontSize: '0.875rem', textAlign: 'center' }}>
                  No coaches added yet — add one below.
                </div>
              )}

              {coaches.map(coach => (
                <div key={coach.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  {editingCoachId === coach.id ? (
                    /* Edit form */
                    <div style={{ padding: '0.875rem 1rem', background: '#fafffe' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input
                          type="text"
                          value={editDraft.name}
                          onChange={e => setEditDraft(p => ({ ...p, name: e.target.value }))}
                          placeholder="Name *"
                          style={cmInputStyle}
                        />
                        <input
                          type="email"
                          value={editDraft.email}
                          onChange={e => setEditDraft(p => ({ ...p, email: e.target.value }))}
                          placeholder="Email (optional)"
                          style={cmInputStyle}
                        />
                        <textarea
                          value={editDraft.booking_embed}
                          onChange={e => setEditDraft(p => ({ ...p, booking_embed: e.target.value }))}
                          placeholder="Booking URL or full <iframe> embed code (optional)"
                          rows={3}
                          style={{ ...cmInputStyle, fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical', lineHeight: 1.5 }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => void handleSaveCoach(coach.id)}
                            disabled={savingCoachId === coach.id || !editDraft.name.trim()}
                            style={{ ...cmSaveBtnStyle, opacity: (!editDraft.name.trim()) ? 0.5 : 1 }}
                          >
                            {savingCoachId === coach.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Check className="w-3.5 h-3.5" />
                            }
                            Save
                          </button>
                          <button onClick={() => setEditingCoachId(null)} style={cmCancelBtnStyle}>
                            <X className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Display row */
                    <div style={{ padding: '0.625rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a2332', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {coach.name}
                          {settings.coach_id === coach.id && (
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: '#1a3a52',
                              background: '#dce8f5',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '10px',
                              letterSpacing: '0.02em',
                            }}>
                              Selected
                            </span>
                          )}
                        </div>
                        {coach.email && (
                          <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.1rem' }}>{coach.email}</div>
                        )}
                        {coach.booking_embed ? (
                          <div style={{ fontSize: '0.75rem', color: '#27ae60', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                            <CheckCircle2 className="w-3 h-3" />
                            Booking configured
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: '#bbb', marginTop: '0.2rem' }}>
                            No booking link
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleStartEdit(coach)}
                        title="Edit coach"
                        style={cmIconBtnStyle}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => void handleDeleteCoach(coach.id)}
                        disabled={deletingCoachId === coach.id}
                        title="Delete coach"
                        style={{ ...cmIconBtnStyle, color: '#c0392b', borderColor: '#fce4e4' }}
                      >
                        {deletingCoachId === coach.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add new coach */}
            <div style={{ padding: '0.75rem 1rem', borderTop: coaches.length > 0 ? '1px solid #eee' : 'none', background: '#fafafa' }}>
              {!showAddCoach ? (
                <button
                  onClick={() => setShowAddCoach(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    width: '100%',
                    background: 'none',
                    border: '1px dashed #ccc',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: '#666',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add New Coach
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a2332', marginBottom: '0.1rem' }}>
                    New Coach
                  </div>
                  <input
                    type="text"
                    value={newCoach.name}
                    onChange={e => setNewCoach(p => ({ ...p, name: e.target.value }))}
                    placeholder="Name *"
                    style={cmInputStyle}
                  />
                  <input
                    type="email"
                    value={newCoach.email}
                    onChange={e => setNewCoach(p => ({ ...p, email: e.target.value }))}
                    placeholder="Email (optional)"
                    style={cmInputStyle}
                  />
                  <textarea
                    value={newCoach.booking_embed}
                    onChange={e => setNewCoach(p => ({ ...p, booking_embed: e.target.value }))}
                    placeholder="Booking URL or full <iframe> embed code (optional)"
                    rows={3}
                    style={{ ...cmInputStyle, fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical', lineHeight: 1.5 }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => void handleAddCoach()}
                      disabled={addingCoach || !newCoach.name.trim()}
                      style={{ ...cmSaveBtnStyle, opacity: !newCoach.name.trim() ? 0.5 : 1 }}
                    >
                      {addingCoach
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Plus className="w-3.5 h-3.5" />
                      }
                      Add Coach
                    </button>
                    <button
                      onClick={() => {
                        setShowAddCoach(false);
                        setNewCoach({ name: '', email: '', booking_embed: '' });
                      }}
                      style={cmCancelBtnStyle}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Coach error */}
            {coachError && (
              <div style={{
                padding: '0.5rem 1rem',
                background: '#fff5f5',
                borderTop: '1px solid #fce4e4',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                color: '#c0392b',
              }}>
                <AlertCircle className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
                {coachError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Video URL ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontWeight: 600, color: '#1a2332', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Play className="w-4 h-4" />
          Coach Video URL
        </label>
        <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>
          Upload a personal 60–90 second vertical video to YouTube (unlisted), then paste the URL here.
        </p>
        <input
          type="url"
          value={settings.video_url ?? ''}
          onChange={e => setSettings(prev => ({ ...prev, video_url: e.target.value }))}
          placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
          style={{
            padding: '0.625rem 0.75rem',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '0.9rem',
            outline: 'none',
            fontFamily: 'inherit',
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
        {videoId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#27ae60', fontSize: '0.85rem' }}>
            <CheckCircle2 className="w-4 h-4" />
            Valid YouTube video detected (ID: {videoId})
          </div>
        )}
        {settings.video_url && !videoId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e67e22', fontSize: '0.85rem' }}>
            <AlertCircle className="w-4 h-4" />
            Could not parse a YouTube video ID from this URL
          </div>
        )}
      </div>

      {/* ── Coach Name ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontWeight: 600, color: '#1a2332', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User className="w-4 h-4" />
          Your Name
        </label>
        <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>
          Appears as the caption below your video — e.g. &ldquo;Travis · Founder, DNA Discipleship&rdquo;
        </p>
        <input
          type="text"
          value={settings.coach_name}
          onChange={e => setSettings(prev => ({ ...prev, coach_name: e.target.value }))}
          placeholder="Travis"
          style={{
            padding: '0.625rem 0.75rem',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '0.9rem',
            outline: 'none',
            fontFamily: 'inherit',
            width: '100%',
            maxWidth: '280px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* ── Booking Link / Embed Code ───────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontWeight: 600, color: '#1a2332', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link2 className="w-4 h-4" />
          Booking Link or Embed Code
        </label>
        <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>
          Paste your scheduling URL <em>or</em> the full embed code from Google Calendar / Calendly.
          Prospects click &ldquo;Book a Discovery Call&rdquo; and it opens as an embedded pop-up.
        </p>
        <textarea
          value={settings.booking_url}
          onChange={e => setSettings(prev => ({ ...prev, booking_url: e.target.value }))}
          placeholder={`Paste a URL:\nhttps://calendly.com/yourname/30min\n\nOR the Google Calendar embed snippet:\n<!-- Google Calendar Appointment Scheduling begin -->\n<iframe src="https://calendar.google.com/..." ...></iframe>`}
          rows={4}
          style={{
            padding: '0.625rem 0.75rem',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '0.82rem',
            outline: 'none',
            fontFamily: 'monospace',
            width: '100%',
            boxSizing: 'border-box',
            resize: 'vertical',
            lineHeight: 1.5,
          }}
        />
        {settings.booking_url && (() => {
          const raw = settings.booking_url.trim();
          const isEmbed = raw.includes('<iframe');
          const srcMatch = isEmbed ? raw.match(/\bsrc=["']([^"']+)["']/i) : null;
          const extractedUrl = srcMatch?.[1] ?? null;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#27ae60', fontSize: '0.85rem' }}>
                <CheckCircle2 className="w-4 h-4" />
                {isEmbed
                  ? 'Embed code detected — URL extracted and ready to use'
                  : 'Direct URL saved — will embed as a pop-up for prospects'}
              </div>
              {isEmbed && extractedUrl && (
                <div style={{ fontSize: '0.78rem', color: '#888', paddingLeft: '1.5rem', wordBreak: 'break-all' }}>
                  Embed URL: {extractedUrl}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Default Temperature ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label style={{ fontWeight: 600, color: '#1a2332', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Thermometer className="w-4 h-4" />
          Default Lead Temperature
        </label>
        <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>
          Sets the default language tone when someone opens the demo link. Coaches can override per-link with <code>?temp=hot</code>.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {TEMPS.map(t => (
            <button
              key={t.value}
              onClick={() => setSettings(prev => ({ ...prev, default_temp: t.value }))}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                border: `2px solid ${settings.default_temp === t.value ? t.color : '#e0e0e0'}`,
                background: settings.default_temp === t.value ? t.color + '18' : 'transparent',
                color: settings.default_temp === t.value ? t.color : '#555',
                cursor: 'pointer',
                fontWeight: settings.default_temp === t.value ? 600 : 400,
                fontSize: '0.9rem',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 400, color: settings.default_temp === t.value ? t.color : '#999' }}>
                {t.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Save Button ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? 'Saving…' : 'Save Demo Settings'}
        </button>
        {savedOk && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#27ae60', fontSize: '0.9rem' }}>
            <CheckCircle2 className="w-4 h-4" />
            Saved
          </div>
        )}
        {saveError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c0392b', fontSize: '0.9rem' }}>
            <AlertCircle className="w-4 h-4" />
            {saveError}
          </div>
        )}
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: 0 }} />

      {/* ── Generated Links ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ fontWeight: 600, color: '#1a2332', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link2 className="w-4 h-4" />
          Demo Links
        </div>
        {!subdomain ? (
          <div style={{ padding: '1rem', background: '#fff8e1', borderRadius: '8px', color: '#7d5a00', fontSize: '0.875rem', border: '1px solid #ffe082' }}>
            ⚠️ This church doesn&apos;t have a subdomain set yet. Configure one in the Branding tab first.
          </div>
        ) : !settings.demo_enabled ? (
          <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px', color: '#888', fontSize: '0.875rem' }}>
            Enable the demo page above and save to generate shareable links.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {TEMPS.map(t => (
              <div
                key={t.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  background: '#f9f9f9',
                  borderRadius: '8px',
                  border: '1px solid #eee',
                }}
              >
                <span style={{
                  width: '52px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: t.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  flexShrink: 0,
                }}>
                  {t.label}
                </span>
                <code style={{ flex: 1, fontSize: '0.8rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {demoBaseUrl}?temp={t.value}
                </code>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    onClick={() => copyLink(t.value)}
                    title="Copy link"
                    style={{ padding: '0.25rem 0.5rem', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: '#555' }}
                  >
                    {copiedTemp === t.value ? <Check className="w-3.5 h-3.5" style={{ color: '#27ae60' }} /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedTemp === t.value ? 'Copied' : 'Copy'}
                  </button>
                  <a
                    href={`${demoBaseUrl}?temp=${t.value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Preview"
                    style={{ padding: '0.25rem 0.5rem', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: '#555', textDecoration: 'none' }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: 0 }} />

      {/* ── Demo Seed Data ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ fontWeight: 600, color: '#1a2332', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database className="w-4 h-4" />
          Demo Seed Data
        </div>
        <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>
          Seeds upcoming calendar events in this church&apos;s account so the Hub demo shows realistic activity.
          Safe to run multiple times — prior seed events are replaced.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Status badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: settings.demo_seeded_at ? '#e8f5e9' : '#f5f5f5',
            color: settings.demo_seeded_at ? '#27ae60' : '#999',
            border: `1px solid ${settings.demo_seeded_at ? '#c8e6c9' : '#e0e0e0'}`,
          }}>
            {settings.demo_seeded_at ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Seeded {new Date(settings.demo_seeded_at).toLocaleDateString()}
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                Not seeded
              </>
            )}
          </div>

          {/* Seed button or confirm */}
          {!showSeedConfirm ? (
            <button
              onClick={() => setShowSeedConfirm(true)}
              disabled={seeding}
              style={{
                padding: '0.4rem 0.875rem',
                borderRadius: '6px',
                border: '1px solid #ddd',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              {settings.demo_seeded_at ? 'Re-seed Demo Data' : 'Seed Demo Data'}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff3cd', padding: '0.5rem 0.875rem', borderRadius: '8px', border: '1px solid #ffc107', fontSize: '0.85rem' }}>
              <span style={{ color: '#856404' }}>Seed {settings.demo_seeded_at ? '(replaces existing)' : ''} for {churchName}?</span>
              <button
                onClick={() => void handleSeed()}
                style={{ padding: '0.25rem 0.625rem', background: '#856404', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
              >
                Yes, seed
              </button>
              <button
                onClick={() => setShowSeedConfirm(false)}
                style={{ padding: '0.25rem 0.625rem', background: 'transparent', color: '#856404', border: '1px solid #856404', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem' }}
              >
                Cancel
              </button>
            </div>
          )}

          {seedSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#27ae60', fontSize: '0.875rem' }}>
              <CheckCircle2 className="w-4 h-4" />
              Seeded successfully!
            </div>
          )}
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: 0 }} />

      {/* ── Hub Dashboard Demo ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ fontWeight: 600, color: '#1a2332', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LayoutDashboard className="w-4 h-4" />
          Hub Dashboard Demo
        </div>
        <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>
          Seeds a full leader account (groups, disciples, cohort, training) in this church&apos;s Hub so prospects
          can explore the real dashboard without a login. Safe to re-run — prior seed data is replaced.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Status badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: settings.hub_demo_seeded_at ? '#e8f5e9' : '#f5f5f5',
            color: settings.hub_demo_seeded_at ? '#27ae60' : '#999',
            border: `1px solid ${settings.hub_demo_seeded_at ? '#c8e6c9' : '#e0e0e0'}`,
          }}>
            {settings.hub_demo_seeded_at ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Seeded {new Date(settings.hub_demo_seeded_at).toLocaleDateString()}
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                Not seeded
              </>
            )}
          </div>

          {/* Seed button or confirm */}
          {!showHubSeedConfirm ? (
            <button
              onClick={() => setShowHubSeedConfirm(true)}
              disabled={hubSeeding}
              style={{
                padding: '0.4rem 0.875rem',
                borderRadius: '6px',
                border: '1px solid #ddd',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              {hubSeeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LayoutDashboard className="w-3.5 h-3.5" />}
              {settings.hub_demo_seeded_at ? 'Re-seed Hub Demo' : 'Seed Hub Demo'}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff3cd', padding: '0.5rem 0.875rem', borderRadius: '8px', border: '1px solid #ffc107', fontSize: '0.85rem' }}>
              <span style={{ color: '#856404' }}>Seed Hub demo{settings.hub_demo_seeded_at ? ' (replaces existing)' : ''} for {churchName}?</span>
              <button
                onClick={() => void handleHubSeed()}
                style={{ padding: '0.25rem 0.625rem', background: '#856404', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
              >
                Yes, seed
              </button>
              <button
                onClick={() => setShowHubSeedConfirm(false)}
                style={{ padding: '0.25rem 0.625rem', background: 'transparent', color: '#856404', border: '1px solid #856404', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem' }}
              >
                Cancel
              </button>
            </div>
          )}

          {hubSeedSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#27ae60', fontSize: '0.875rem' }}>
              <CheckCircle2 className="w-4 h-4" />
              Hub demo seeded!
            </div>
          )}
        </div>

        {/* Hub demo URL */}
        {settings.hub_demo_seeded_at && hubDemoUrl && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.625rem 0.875rem',
            background: '#f9f9f9',
            borderRadius: '8px',
            border: '1px solid #eee',
            marginTop: '0.25rem',
          }}>
            <span style={{
              width: '52px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#1a2332',
              flexShrink: 0,
            }}>
              Hub
            </span>
            <code style={{ flex: 1, fontSize: '0.8rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {hubDemoUrl}
            </code>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button
                onClick={copyHubLink}
                title="Copy link"
                style={{ padding: '0.25rem 0.5rem', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: '#555' }}
              >
                {copiedHub ? <Check className="w-3.5 h-3.5" style={{ color: '#27ae60' }} /> : <Copy className="w-3.5 h-3.5" />}
                {copiedHub ? 'Copied' : 'Copy'}
              </button>
              <a
                href={hubDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Preview Hub demo"
                style={{ padding: '0.25rem 0.5rem', border: '1px solid #ddd', borderRadius: '4px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: '#555', textDecoration: 'none' }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
