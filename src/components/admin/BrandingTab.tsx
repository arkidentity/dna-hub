'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Palette,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink,
  Image as ImageIcon,
  Globe,
} from 'lucide-react';
import { ChurchBranding } from '@/lib/types';

interface Church {
  id: string;
  name: string;
}

export default function BrandingTab() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [selectedChurchId, setSelectedChurchId] = useState<string>('');
  const [branding, setBranding] = useState<ChurchBranding | null>(null);
  const [loadingChurches, setLoadingChurches] = useState(true);
  const [loadingBranding, setLoadingBranding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    subdomain: '',
    primary_color: '#143348',
    accent_color: '#e8b562',
    logo_url: '' as string | null,
    app_title: 'DNA Daily',
    app_description: 'Daily discipleship tools',
  });

  // ============================================
  // DATA FETCHING
  // ============================================

  useEffect(() => {
    fetchChurches();
  }, []);

  useEffect(() => {
    if (selectedChurchId) {
      fetchBranding(selectedChurchId);
    }
  }, [selectedChurchId]);

  const fetchChurches = async () => {
    try {
      const res = await fetch('/api/admin/churches');
      if (!res.ok) throw new Error('Failed to fetch churches');
      const data = await res.json();
      // churches endpoint returns array of church summaries
      const list = (data.churches || []).map((c: any) => ({ id: c.id, name: c.name }));
      setChurches(list);
      if (list.length > 0) setSelectedChurchId(list[0].id);
    } catch (err) {
      setError('Failed to load churches');
    } finally {
      setLoadingChurches(false);
    }
  };

  const fetchBranding = async (churchId: string) => {
    setLoadingBranding(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/branding?church_id=${churchId}`);
      if (!res.ok) throw new Error('Failed to fetch branding');
      const data = await res.json();
      const b: ChurchBranding = data.branding;
      setBranding(b);
      setForm({
        subdomain: b.subdomain ?? '',
        primary_color: b.primary_color ?? '#143348',
        accent_color: b.accent_color ?? '#e8b562',
        logo_url: b.logo_url ?? null,
        app_title: b.app_title ?? 'DNA Daily',
        app_description: b.app_description ?? 'Daily discipleship tools',
      });
    } catch (err) {
      setError('Failed to load branding settings');
    } finally {
      setLoadingBranding(false);
    }
  };

  // ============================================
  // LOGO UPLOAD
  // ============================================

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChurchId) return;

    setUploadingLogo(true);
    setSaveError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('church_id', selectedChurchId);

      const res = await fetch('/api/admin/branding/upload-logo', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();
      setForm(prev => ({ ...prev, logo_url: data.logo_url }));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Logo upload failed');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setForm(prev => ({ ...prev, logo_url: null }));
  };

  // ============================================
  // SAVE
  // ============================================

  const handleSave = async () => {
    if (!selectedChurchId) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      const res = await fetch('/api/admin/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          church_id: selectedChurchId,
          ...form,
          theme_color: form.primary_color,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  if (loadingChurches) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  if (error && !branding) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-lg">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  const subdomainPreview = form.subdomain
    ? `https://${form.subdomain}.dailydna.app`
    : null;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy">Church Branding</h2>
          <p className="text-sm text-foreground-muted mt-1">
            Configure subdomain, logo, and colors for each church&apos;s white-labeled Daily DNA app.
          </p>
        </div>
      </div>

      {/* Church Selector */}
      <div className="bg-white rounded-xl border border-card-border p-4">
        <label className="block text-sm font-medium text-navy mb-2">Select Church</label>
        <select
          value={selectedChurchId}
          onChange={e => setSelectedChurchId(e.target.value)}
          className="w-full max-w-sm border border-card-border rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold"
        >
          {churches.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loadingBranding ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-gold animate-spin" />
        </div>
      ) : branding && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Settings */}
          <div className="lg:col-span-2 space-y-5">

            {/* Subdomain */}
            <div className="bg-white rounded-xl border border-card-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-gold" />
                <h3 className="font-medium text-navy">Subdomain</h3>
              </div>

              <label className="block text-sm text-foreground-muted mb-1">
                Church subdomain
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-card-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gold">
                  <input
                    type="text"
                    value={form.subdomain}
                    onChange={e => setForm(prev => ({ ...prev, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    placeholder="mychurch"
                    className="px-3 py-2 text-sm text-navy outline-none w-40"
                  />
                  <span className="px-3 py-2 bg-gray-50 text-foreground-muted text-sm border-l border-card-border">
                    .dailydna.app
                  </span>
                </div>
              </div>

              {subdomainPreview && (
                <div className="flex items-center gap-2 mt-2">
                  <a
                    href={subdomainPreview}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {subdomainPreview}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              <p className="text-xs text-foreground-muted mt-2">
                Lowercase letters, numbers, and hyphens only. Leave blank to use the root domain.
              </p>
            </div>

            {/* Logo */}
            <div className="bg-white rounded-xl border border-card-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-4 h-4 text-gold" />
                <h3 className="font-medium text-navy">Church Logo</h3>
              </div>

              {form.logo_url ? (
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-lg border border-card-border bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.logo_url}
                      alt="Church logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="flex items-center gap-2 px-3 py-2 text-sm border border-card-border rounded-lg text-navy hover:bg-gray-50 transition-colors"
                    >
                      {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Replace Logo
                    </button>
                    <button
                      onClick={handleRemoveLogo}
                      className="flex items-center gap-2 px-3 py-2 text-sm border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Remove Logo
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="flex flex-col items-center gap-2 w-full py-8 border-2 border-dashed border-card-border rounded-lg text-foreground-muted hover:border-gold hover:text-gold transition-colors"
                >
                  {uploadingLogo ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                  <span className="text-sm font-medium">
                    {uploadingLogo ? 'Uploading...' : 'Upload Church Logo'}
                  </span>
                  <span className="text-xs">PNG, JPG, SVG, WebP — max 5MB</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>

            {/* Colors */}
            <div className="bg-white rounded-xl border border-card-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-4 h-4 text-gold" />
                <h3 className="font-medium text-navy">Brand Colors</h3>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* Primary color */}
                <div>
                  <label className="block text-sm text-foreground-muted mb-2">
                    Primary Color
                    <span className="ml-1 text-xs text-gray-400">(nav, backgrounds)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={form.primary_color}
                        onChange={e => setForm(prev => ({ ...prev, primary_color: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-card-border cursor-pointer p-0.5 bg-white"
                      />
                    </div>
                    <input
                      type="text"
                      value={form.primary_color}
                      onChange={e => {
                        const val = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                          setForm(prev => ({ ...prev, primary_color: val }));
                        }
                      }}
                      className="w-28 border border-card-border rounded-lg px-3 py-2 text-sm font-mono text-navy focus:outline-none focus:ring-2 focus:ring-gold"
                      placeholder="#143348"
                      maxLength={7}
                    />
                  </div>
                </div>

                {/* Accent color */}
                <div>
                  <label className="block text-sm text-foreground-muted mb-2">
                    Accent Color
                    <span className="ml-1 text-xs text-gray-400">(buttons, highlights)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.accent_color}
                      onChange={e => setForm(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-card-border cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={form.accent_color}
                      onChange={e => {
                        const val = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                          setForm(prev => ({ ...prev, accent_color: val }));
                        }
                      }}
                      className="w-28 border border-card-border rounded-lg px-3 py-2 text-sm font-mono text-navy focus:outline-none focus:ring-2 focus:ring-gold"
                      placeholder="#e8b562"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* App Metadata */}
            <div className="bg-white rounded-xl border border-card-border p-5">
              <h3 className="font-medium text-navy mb-4">App Metadata</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-foreground-muted mb-1">App Title</label>
                  <input
                    type="text"
                    value={form.app_title}
                    onChange={e => setForm(prev => ({ ...prev, app_title: e.target.value }))}
                    placeholder="DNA Daily"
                    className="w-full border border-card-border rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                  <p className="text-xs text-foreground-muted mt-1">Shown in browser tab and PWA home screen</p>
                </div>
                <div>
                  <label className="block text-sm text-foreground-muted mb-1">App Description</label>
                  <input
                    type="text"
                    value={form.app_description}
                    onChange={e => setForm(prev => ({ ...prev, app_description: e.target.value }))}
                    placeholder="Daily discipleship tools"
                    className="w-full border border-card-border rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
              </div>
            </div>

            {/* Error / Save */}
            {saveError && (
              <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {saveError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-gold text-navy font-medium px-5 py-2.5 rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save Branding'}
              </button>
              {saved && (
                <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Saved!
                </div>
              )}
            </div>
          </div>

          {/* Right: Preview */}
          <div className="space-y-4">
            <h3 className="font-medium text-navy">Live Preview</h3>

            {/* Phone mockup */}
            <div className="border-2 border-gray-200 rounded-3xl overflow-hidden w-56 mx-auto shadow-lg">
              {/* Status bar */}
              <div
                className="h-8 flex items-center justify-center"
                style={{ backgroundColor: form.primary_color }}
              >
                <div className="w-16 h-1.5 bg-white/30 rounded-full" />
              </div>

              {/* App header */}
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{ backgroundColor: form.primary_color }}
              >
                {form.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logo_url} alt="Logo" className="h-7 w-auto object-contain" />
                ) : (
                  <div
                    className="h-7 px-2 rounded text-xs font-bold flex items-center"
                    style={{ backgroundColor: form.accent_color, color: form.primary_color }}
                  >
                    {form.app_title || 'DNA Daily'}
                  </div>
                )}
              </div>

              {/* Content area */}
              <div className="bg-white p-3 space-y-2">
                {/* Mock card 1 */}
                <div className="rounded-lg p-2.5 text-xs" style={{ backgroundColor: `${form.primary_color}15` }}>
                  <div
                    className="w-12 h-1.5 rounded mb-1"
                    style={{ backgroundColor: form.accent_color }}
                  />
                  <div className="w-20 h-1 rounded bg-gray-200" />
                  <div className="w-16 h-1 rounded bg-gray-200 mt-1" />
                </div>
                {/* Mock card 2 */}
                <div className="rounded-lg p-2.5 text-xs bg-gray-50">
                  <div className="w-16 h-1.5 rounded mb-1 bg-gray-300" />
                  <div className="w-24 h-1 rounded bg-gray-200" />
                </div>
              </div>

              {/* Bottom nav */}
              <div
                className="flex justify-around py-2 px-1"
                style={{ backgroundColor: form.primary_color }}
              >
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded"
                    style={{
                      backgroundColor: i === 0 ? form.accent_color : `${form.accent_color}40`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Color swatches */}
            <div className="bg-white rounded-xl border border-card-border p-4 w-56 mx-auto">
              <p className="text-xs font-medium text-navy mb-3">Color Swatches</p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div
                    className="h-10 rounded-lg mb-1"
                    style={{ backgroundColor: form.primary_color }}
                  />
                  <p className="text-xs text-center font-mono text-foreground-muted">{form.primary_color}</p>
                  <p className="text-xs text-center text-foreground-muted">Primary</p>
                </div>
                <div className="flex-1">
                  <div
                    className="h-10 rounded-lg mb-1"
                    style={{ backgroundColor: form.accent_color }}
                  />
                  <p className="text-xs text-center font-mono text-foreground-muted">{form.accent_color}</p>
                  <p className="text-xs text-center text-foreground-muted">Accent</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
