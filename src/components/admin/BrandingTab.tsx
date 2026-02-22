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
  Smartphone,
  LayoutTemplate,
} from 'lucide-react';
import { ChurchBranding } from '@/lib/types';

interface Church {
  id: string;
  name: string;
}

interface BrandingTabProps {
  /** When provided, skips the church selector and loads branding for this specific church. */
  churchId?: string;
}

type LogoType = 'header' | 'icon' | 'splash';

interface LogoSlot {
  type: LogoType;
  label: string;
  hint: string;
  dimensions: string;
  aspect: string; // CSS aspect-ratio for preview box
  icon: React.ReactNode;
  field: 'logo_url' | 'icon_url' | 'splash_logo_url';
}

const LOGO_SLOTS: LogoSlot[] = [
  {
    type: 'header',
    label: 'Header Logo',
    hint: 'Shown in the top-left of the app header (Journal, Pathway pages)',
    dimensions: 'Horizontal — recommended 400×120 px, transparent background',
    aspect: '3/1',
    icon: <LayoutTemplate className="w-4 h-4" />,
    field: 'logo_url',
  },
  {
    type: 'icon',
    label: 'App Icon',
    hint: 'Used as the PWA home screen icon when disciples save the app',
    dimensions: 'Square — recommended 512×512 px, no padding, transparent or solid bg',
    aspect: '1/1',
    icon: <Smartphone className="w-4 h-4" />,
    field: 'icon_url',
  },
  {
    type: 'splash',
    label: 'Splash / Loading Screen Logo',
    hint: 'Shown on the full-screen loading splash when the app opens',
    dimensions: 'Square or wide — recommended 400×400 px, transparent background',
    aspect: '1/1',
    icon: <ImageIcon className="w-4 h-4" />,
    field: 'splash_logo_url',
  },
];

export default function BrandingTab({ churchId: fixedChurchId }: BrandingTabProps = {}) {
  const [churches, setChurches] = useState<Church[]>([]);
  const [selectedChurchId, setSelectedChurchId] = useState<string>(fixedChurchId ?? '');
  const [branding, setBranding] = useState<ChurchBranding | null>(null);
  const [loadingChurches, setLoadingChurches] = useState(!fixedChurchId);
  const [loadingBranding, setLoadingBranding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState<LogoType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fileInputRefs = useRef<Record<LogoType, HTMLInputElement | null>>({
    header: null,
    icon: null,
    splash: null,
  });

  // Form state
  const [form, setForm] = useState({
    subdomain: '',
    primary_color: '#143348',
    accent_color: '#e8b562',
    logo_url: null as string | null,
    icon_url: null as string | null,
    splash_logo_url: null as string | null,
    app_title: 'DNA Daily',
    app_description: 'Daily discipleship tools',
    header_style: 'text' as 'text' | 'logo',
    reading_plan_id: null as string | null,
    custom_link_1_title: '',
    custom_link_1_url: '',
    custom_link_2_title: '',
    custom_link_2_url: '',
  });

  // ============================================
  // DATA FETCHING
  // ============================================

  useEffect(() => {
    if (fixedChurchId) {
      fetchBranding(fixedChurchId);
    } else {
      fetchChurches();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!fixedChurchId && selectedChurchId) {
      fetchBranding(selectedChurchId);
    }
  }, [fixedChurchId, selectedChurchId]);

  const fetchChurches = async () => {
    try {
      const res = await fetch('/api/admin/churches');
      if (!res.ok) throw new Error('Failed to fetch churches');
      const data = await res.json();
      const list = (data.churches || []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }));
      setChurches(list);
      if (list.length > 0) setSelectedChurchId(list[0].id);
    } catch {
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
        icon_url: b.icon_url ?? null,
        splash_logo_url: b.splash_logo_url ?? null,
        app_title: b.app_title ?? 'DNA Daily',
        app_description: b.app_description ?? 'Daily discipleship tools',
        header_style: (b.header_style ?? 'text') as 'text' | 'logo',
        reading_plan_id: b.reading_plan_id ?? null,
        custom_link_1_title: b.custom_link_1_title ?? '',
        custom_link_1_url: b.custom_link_1_url ?? '',
        custom_link_2_title: b.custom_link_2_title ?? '',
        custom_link_2_url: b.custom_link_2_url ?? '',
      });
    } catch {
      setError('Failed to load branding settings');
    } finally {
      setLoadingBranding(false);
    }
  };

  // ============================================
  // LOGO UPLOAD
  // ============================================

  const handleLogoUpload = async (logoType: LogoType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChurchId) return;

    setUploadingLogo(logoType);
    setSaveError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('church_id', selectedChurchId);
      fd.append('logo_type', logoType);

      const res = await fetch('/api/admin/branding/upload-logo', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();
      const slot = LOGO_SLOTS.find(s => s.type === logoType)!;
      setForm(prev => ({ ...prev, [slot.field]: data.logo_url }));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Logo upload failed');
    } finally {
      setUploadingLogo(null);
      const ref = fileInputRefs.current[logoType];
      if (ref) ref.value = '';
    }
  };

  const handleRemoveLogo = (slot: LogoSlot) => {
    setForm(prev => ({ ...prev, [slot.field]: null }));
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
  // RENDER HELPERS
  // ============================================

  const renderLogoSlot = (slot: LogoSlot) => {
    const currentUrl = form[slot.field];
    const isUploading = uploadingLogo === slot.type;

    return (
      <div key={slot.type} className="bg-white rounded-xl border border-card-border p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-gold">{slot.icon}</span>
          <h4 className="font-medium text-navy text-sm">{slot.label}</h4>
        </div>
        <p className="text-xs text-foreground-muted mb-1">{slot.hint}</p>
        <p className="text-xs text-gray-400 mb-4 italic">{slot.dimensions}</p>

        {currentUrl ? (
          <div className="flex items-start gap-4">
            {/* Preview — icon slot uses primary_color bg to match what the OS renders */}
            <div
              className="rounded-lg border border-card-border flex items-center justify-center overflow-hidden shrink-0"
              style={{
                aspectRatio: slot.aspect,
                width: slot.aspect === '1/1' ? '80px' : '160px',
                height: slot.aspect === '1/1' ? '80px' : '53px',
                backgroundColor: slot.type === 'icon' ? form.primary_color : '#f3f4f6',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUrl}
                alt={slot.label}
                className="object-contain"
                style={{
                  // Icon slot: 80% of box to match server-side compositing padding
                  width: slot.type === 'icon' ? '80%' : '100%',
                  height: slot.type === 'icon' ? '80%' : '100%',
                }}
              />
            </div>
            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => fileInputRefs.current[slot.type]?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-3 py-1.5 text-xs border border-card-border rounded-lg text-navy hover:bg-gray-50 transition-colors"
              >
                {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                Replace
              </button>
              <button
                onClick={() => handleRemoveLogo(slot)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <X className="w-3 h-3" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRefs.current[slot.type]?.click()}
            disabled={isUploading}
            className="flex flex-col items-center gap-2 w-full py-6 border-2 border-dashed border-card-border rounded-lg text-foreground-muted hover:border-gold hover:text-gold transition-colors"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            <span className="text-xs font-medium">
              {isUploading ? 'Uploading...' : `Upload ${slot.label}`}
            </span>
            <span className="text-xs text-gray-400">PNG, JPG, SVG, WebP — max 5MB</span>
          </button>
        )}

        <input
          ref={el => { fileInputRefs.current[slot.type] = el; }}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
          onChange={e => handleLogoUpload(slot.type, e)}
          className="hidden"
        />
      </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================

  if (loadingChurches && !fixedChurchId) {
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

  const subdomainPreview = form.subdomain ? `https://${form.subdomain}.dailydna.app` : null;

  return (
    <div className="space-y-6">

      {/* Header + Church Selector — only shown in global admin view */}
      {!fixedChurchId && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-navy">Church Branding</h2>
              <p className="text-sm text-foreground-muted mt-1">
                Configure subdomain, logos, and colors for each church&apos;s white-labeled Daily DNA app.
              </p>
            </div>
          </div>

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
        </>
      )}

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

              <label className="block text-sm text-foreground-muted mb-1">Church subdomain</label>
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
                Lowercase letters, numbers, and hyphens only.
              </p>
            </div>

            {/* Logos — 3 slots */}
            <div className="bg-white rounded-xl border border-card-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-4 h-4 text-gold" />
                <h3 className="font-medium text-navy">Logos</h3>
              </div>
              <p className="text-xs text-foreground-muted mb-4">
                Upload separate logo versions for each context — they display at very different sizes and aspect ratios.
              </p>
              <div className="space-y-4">
                {LOGO_SLOTS.map(renderLogoSlot)}
              </div>
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
                    <span className="ml-1 text-xs text-gray-400">(nav, backgrounds, cards)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.primary_color}
                      onChange={e => setForm(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-card-border cursor-pointer p-0.5 bg-white"
                    />
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
              <h3 className="font-medium text-navy mb-4">App Name &amp; Description</h3>
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
                  <p className="text-xs text-foreground-muted mt-1">
                    Replaces &ldquo;DAILY DNA&rdquo; in the app header, browser tab, and PWA home screen name
                  </p>
                </div>

                {/* Header style toggle — only shown when a header logo has been uploaded */}
                {form.logo_url && (
                  <div>
                    <label className="block text-sm text-foreground-muted mb-2">App Header Style</label>
                    <div className="flex rounded-lg border border-card-border overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, header_style: 'text' }))}
                        className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                          form.header_style === 'text'
                            ? 'bg-navy text-white'
                            : 'bg-white text-foreground-muted hover:bg-gray-50'
                        }`}
                      >
                        Text Title
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, header_style: 'logo' }))}
                        className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors border-l border-card-border ${
                          form.header_style === 'logo'
                            ? 'bg-navy text-white'
                            : 'bg-white text-foreground-muted hover:bg-gray-50'
                        }`}
                      >
                        Header Logo
                      </button>
                    </div>
                    <p className="text-xs text-foreground-muted mt-1">
                      {form.header_style === 'logo'
                        ? 'Your header logo will appear in the Pathway and Journal headers'
                        : 'App title text will appear in the Pathway and Journal headers'}
                    </p>
                  </div>
                )}

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

                <div>
                  <label className="block text-sm text-foreground-muted mb-1">Bible Reading Plan</label>
                  <select
                    value={form.reading_plan_id ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, reading_plan_id: e.target.value || null }))}
                    className="w-full border border-card-border rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold bg-white"
                  >
                    <option value="">NT in 90 Days (default)</option>
                    <option value="chronological">Bible in Chronological Order (365 days)</option>
                    <option value="nt-90">New Testament in 90 Days</option>
                    <option value="bible-in-one-year">Bible in One Year</option>
                    <option value="identity-30">Identity in Christ — 30 Days</option>
                    <option value="psalms-proverbs">Psalms &amp; Proverbs — 31 Days</option>
                  </select>
                  <p className="text-xs text-foreground-muted mt-1">
                    The reading plan shown to your disciples in the DNA Daily app
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Menu Links */}
            <div className="bg-card rounded-xl border border-card-border p-5 space-y-4">
              <div>
                <h3 className="font-medium text-navy">Custom Menu Links</h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Add up to 2 links that appear in the app settings menu below the Profile button. Links open inside the app in a branded page.
                </p>
              </div>

              {/* Link 1 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-navy">Link 1</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.custom_link_1_title}
                    onChange={e => setForm(prev => ({ ...prev, custom_link_1_title: e.target.value }))}
                    placeholder="Title (e.g. Our Website)"
                    className="w-1/3 border border-card-border rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                  <input
                    type="url"
                    value={form.custom_link_1_url}
                    onChange={e => setForm(prev => ({ ...prev, custom_link_1_url: e.target.value }))}
                    placeholder="https://mychurch.com"
                    className="flex-1 border border-card-border rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
              </div>

              {/* Link 2 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-navy">Link 2</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.custom_link_2_title}
                    onChange={e => setForm(prev => ({ ...prev, custom_link_2_title: e.target.value }))}
                    placeholder="Title (e.g. Give Online)"
                    className="w-1/3 border border-card-border rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                  <input
                    type="url"
                    value={form.custom_link_2_url}
                    onChange={e => setForm(prev => ({ ...prev, custom_link_2_url: e.target.value }))}
                    placeholder="https://mychurch.com/give"
                    className="flex-1 border border-card-border rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
              </div>
              <p className="text-xs text-foreground-muted">Leave both fields blank to hide a link. Both title and URL are required for a link to appear.</p>
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

              {/* App header — shows header logo or text */}
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{ backgroundColor: form.primary_color }}
              >
                {form.header_style === 'logo' && form.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logo_url} alt="Header logo" className="h-7 w-auto object-contain" />
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
                <div className="rounded-lg p-2.5 text-xs" style={{ backgroundColor: `${form.primary_color}15` }}>
                  <div className="w-12 h-1.5 rounded mb-1" style={{ backgroundColor: form.accent_color }} />
                  <div className="w-20 h-1 rounded bg-gray-200" />
                  <div className="w-16 h-1 rounded bg-gray-200 mt-1" />
                </div>
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
                    style={{ backgroundColor: i === 0 ? form.accent_color : `${form.accent_color}40` }}
                  />
                ))}
              </div>
            </div>

            {/* App icon preview */}
            {form.icon_url && (
              <div className="bg-white rounded-xl border border-card-border p-4 w-56 mx-auto">
                <p className="text-xs font-medium text-navy mb-2">App Icon Preview</p>
                <div className="flex items-center gap-3">
                  {/* iOS-style rounded square — matches server compositing: 80% padding */}
                  <div
                    className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center shadow-md"
                    style={{ backgroundColor: form.primary_color }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.icon_url} alt="App icon" className="object-contain" style={{ width: '80%', height: '80%' }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-navy">{form.app_title || 'DNA Daily'}</p>
                    <p className="text-xs text-foreground-muted">Home screen</p>
                  </div>
                </div>
              </div>
            )}

            {/* Color swatches */}
            <div className="bg-white rounded-xl border border-card-border p-4 w-56 mx-auto">
              <p className="text-xs font-medium text-navy mb-3">Color Swatches</p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="h-10 rounded-lg mb-1" style={{ backgroundColor: form.primary_color }} />
                  <p className="text-xs text-center font-mono text-foreground-muted">{form.primary_color}</p>
                  <p className="text-xs text-center text-foreground-muted">Primary</p>
                </div>
                <div className="flex-1">
                  <div className="h-10 rounded-lg mb-1" style={{ backgroundColor: form.accent_color }} />
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
