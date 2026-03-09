'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, Loader2, Calendar, Blocks, Copy, Monitor, Check, ClipboardList } from 'lucide-react';
import type { InteractiveService, ServiceStatus } from '@/lib/types';
import ServiceEditor from './ServiceEditor';
import NextStepsResponsesTab from './NextStepsResponsesTab';

type SubTab = 'builder' | 'responses';

interface ServicesTabProps {
  churchId: string;
  subdomain?: string;
}

const STATUS_BADGES: Record<ServiceStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  published: { label: 'Published', className: 'bg-green-100 text-green-700' },
  live: { label: 'Live', className: 'bg-red-100 text-red-700' },
  archived: { label: 'Archived', className: 'bg-gray-100 text-gray-400' },
};

const FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'published', label: 'Published' },
  { id: 'archived', label: 'Archived' },
];

export default function ServicesTab({ churchId, subdomain }: ServicesTabProps) {
  const [subTab, setSubTab] = useState<SubTab>('builder');
  const [services, setServices] = useState<InteractiveService[]>([]);
  const [templates, setTemplates] = useState<InteractiveService[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDate, setCreateDate] = useState('');
  const [cloneFromId, setCloneFromId] = useState('');
  const [displayCopied, setDisplayCopied] = useState(false);
  const [transparentCopied, setTransparentCopied] = useState(false);

  const displayUrl = subdomain ? `https://${subdomain}.dailydna.app/live/display/${churchId}` : null;

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const [servicesRes, templatesRes] = await Promise.all([
        fetch(`/api/admin/services?church_id=${churchId}`),
        fetch(`/api/admin/services?church_id=${churchId}&include_templates=true`),
      ]);

      const servicesData = await servicesRes.json();
      const templatesData = await templatesRes.json();

      setServices((servicesData.services || []).filter((s: InteractiveService) => !s.is_template));
      setTemplates((templatesData.services || []).filter((s: InteractiveService) => s.is_template));
    } catch (err) {
      console.error('Error fetching services:', err);
    }
    setLoading(false);
  }, [churchId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim() || creating) return;
    setCreating(true);

    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          churchId,
          title: createTitle.trim(),
          serviceDate: createDate || null,
          cloneFromId: cloneFromId || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowCreate(false);
        setCreateTitle('');
        setCreateDate('');
        setCloneFromId('');
        setEditingServiceId(data.service.id);
        fetchServices();
      }
    } catch (err) {
      console.error('Error creating service:', err);
    }

    setCreating(false);
  };

  // If editing a service, show the editor
  if (editingServiceId) {
    return (
      <ServiceEditor
        serviceId={editingServiceId}
        churchId={churchId}
        onBack={() => {
          setEditingServiceId(null);
          fetchServices();
        }}
      />
    );
  }

  const filtered = filter === 'all'
    ? services
    : services.filter((s) => s.status === filter);

  return (
    <div>
      {/* Sub-navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSubTab('builder')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            subTab === 'builder'
              ? 'bg-navy text-white'
              : 'bg-gray-100 text-foreground-muted hover:bg-gray-200'
          }`}
        >
          <Blocks className="w-3.5 h-3.5" />
          Service Builder
        </button>
        <button
          onClick={() => setSubTab('responses')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            subTab === 'responses'
              ? 'bg-navy text-white'
              : 'bg-gray-100 text-foreground-muted hover:bg-gray-200'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Follow-Up Responses
        </button>
      </div>

      {/* Responses sub-tab */}
      {subTab === 'responses' ? (
        <NextStepsResponsesTab churchId={churchId} />
      ) : (
      <div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-navy">Church React</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-navy text-white rounded hover:bg-navy/90 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Service
        </button>
      </div>

      {/* Display URL */}
      {displayUrl && (
        <div className="bg-navy/5 rounded-lg border border-navy/10 p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Monitor className="w-4 h-4 text-navy" />
            <h3 className="text-sm font-semibold text-navy">Projection Display</h3>
          </div>
          <p className="text-xs text-foreground-muted mb-3">
            Open this URL on your projection screen to display live service content. Use the transparent version for ProPresenter or EasyWorship.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(displayUrl);
                setDisplayCopied(true);
                setTimeout(() => setDisplayCopied(false), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-card-border rounded text-xs font-medium text-navy hover:bg-gray-50 transition-colors"
            >
              {displayCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              {displayCopied ? 'Copied!' : 'Copy Display URL'}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${displayUrl}?transparent=true`);
                setTransparentCopied(true);
                setTimeout(() => setTransparentCopied(false), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-card-border rounded text-xs font-medium text-navy hover:bg-gray-50 transition-colors"
            >
              {transparentCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              {transparentCopied ? 'Copied!' : 'Copy Transparent URL'}
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-lg border border-card-border p-6 mb-6">
          <h3 className="text-sm font-semibold text-navy mb-4">New Service</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm text-foreground-muted mb-1">Title</label>
              <input
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="Sunday Service"
                className="w-full border border-card-border rounded px-3 py-2 text-sm"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-foreground-muted mb-1">Date (optional)</label>
                <input
                  type="date"
                  value={createDate}
                  onChange={(e) => setCreateDate(e.target.value)}
                  className="w-full border border-card-border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-foreground-muted mb-1">Clone from template</label>
                <select
                  value={cloneFromId}
                  onChange={(e) => setCloneFromId(e.target.value)}
                  className="w-full border border-card-border rounded px-3 py-2 text-sm"
                >
                  <option value="">Start from scratch</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.template_name || t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating || !createTitle.trim()}
                className="px-4 py-2 bg-navy text-white rounded hover:bg-navy/90 transition-colors text-sm disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowCreate(false); setCreateTitle(''); setCreateDate(''); setCloneFromId(''); }}
                className="px-4 py-2 border border-card-border rounded hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              filter === f.id
                ? 'bg-navy text-white'
                : 'bg-gray-100 text-foreground-muted hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Service list */}
      {loading ? (
        <p className="text-foreground-muted text-center py-8">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-foreground-muted">
          <Blocks className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {filter === 'all' ? 'No services yet. Create your first one!' : `No ${filter} services.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((service) => {
            const badge = STATUS_BADGES[service.status];
            return (
              <button
                key={service.id}
                onClick={() => setEditingServiceId(service.id)}
                className="w-full bg-white rounded-lg border border-card-border p-4 hover:border-navy/30 transition-colors text-left flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-navy text-sm truncate">{service.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-foreground-muted">
                    {service.service_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(service.service_date + 'T00:00:00').toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Blocks className="w-3 h-3" />
                      {service.block_count || 0} block{(service.block_count || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Templates section */}
      {templates.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-foreground-muted mb-3 flex items-center gap-1.5">
            <Copy className="w-3.5 h-3.5" />
            Saved Templates
          </h3>
          <div className="space-y-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setEditingServiceId(t.id)}
                className="w-full bg-gray-50 rounded-lg border border-card-border p-3 hover:border-navy/30 transition-colors text-left flex items-center gap-3"
              >
                <Copy className="w-4 h-4 text-foreground-muted flex-shrink-0" />
                <span className="text-sm text-navy truncate">{t.template_name || t.title}</span>
                <span className="text-xs text-foreground-muted ml-auto">
                  {t.block_count || 0} blocks
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
      )}
    </div>
  );
}
