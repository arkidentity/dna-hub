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
} from 'lucide-react';

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
  coach_name: string;
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
    coach_name: 'Travis',
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

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dnadiscipleship.com';
  const demoBaseUrl = subdomain ? `${BASE_URL}/demo/${subdomain}` : null;

  useEffect(() => {
    fetchSettings();
  }, [churchId]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/admin/demo/${churchId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (data.settings) {
        setSettings({
          video_url: data.settings.video_url ?? '',
          demo_enabled: data.settings.demo_enabled ?? false,
          default_temp: data.settings.default_temp ?? 'warm',
          demo_seeded_at: data.settings.demo_seeded_at ?? null,
          coach_name: data.settings.coach_name ?? 'Travis',
        });
      }
    } catch (err) {
      setError('Failed to load demo settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const copyLink = (temp: string) => {
    if (!demoBaseUrl) return;
    const url = `${demoBaseUrl}?temp=${temp}`;
    void navigator.clipboard.writeText(url);
    setCopiedTemp(temp);
    setTimeout(() => setCopiedTemp(null), 2000);
  };

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
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a2332', margin: 0 }}>
          Demo Page
        </h2>
        <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Configure the personalized demo page for {churchName}. Coaches share this link with church prospects.
        </p>
      </div>

      {/* Demo Enabled Toggle */}
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

      {/* Video URL */}
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

      {/* Coach Name */}
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

      {/* Default Temperature */}
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

      {/* Save Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={handleSave}
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

      {/* Divider */}
      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: 0 }} />

      {/* Generated Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ fontWeight: 600, color: '#1a2332', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link2 className="w-4 h-4" />
          Demo Links
        </div>
        {!subdomain ? (
          <div style={{ padding: '1rem', background: '#fff8e1', borderRadius: '8px', color: '#7d5a00', fontSize: '0.875rem', border: '1px solid #ffe082' }}>
            ⚠️ This church doesn't have a subdomain set yet. Configure one in the Branding tab first.
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

      {/* Divider */}
      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: 0 }} />

      {/* Seed Data */}
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
    </div>
  );
}
