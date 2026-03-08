'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  Loader2,
  Save,
  Send,
  Archive,
  Copy,
  Trash2,
  Plus,
  BookmarkPlus,
  Undo2,
} from 'lucide-react';
import type { InteractiveService, ServiceBlock, BlockType, ServiceStatus } from '@/lib/types';
import BlockList from './BlockList';
import BlockConfigModal from './BlockConfigModal';
import { getBlockTypesByCategory, getBlockTypeInfo } from './blockTypeConfig';

const STATUS_BADGES: Record<ServiceStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  published: { label: 'Published', className: 'bg-green-100 text-green-700' },
  live: { label: 'Live', className: 'bg-red-100 text-red-700' },
  archived: { label: 'Archived', className: 'bg-gray-100 text-gray-400' },
};

interface ServiceEditorProps {
  serviceId: string;
  churchId: string;
  onBack: () => void;
}

export default function ServiceEditor({ serviceId, churchId, onBack }: ServiceEditorProps) {
  const [service, setService] = useState<InteractiveService | null>(null);
  const [blocks, setBlocks] = useState<ServiceBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [dirty, setDirty] = useState(false);

  // Block add dropdown
  const [showAddBlock, setShowAddBlock] = useState(false);

  // Block config modal
  const [editingBlock, setEditingBlock] = useState<ServiceBlock | null>(null);

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchService = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/services/${serviceId}`);
      if (!res.ok) return;
      const data = await res.json();
      setService(data.service);
      setBlocks(data.blocks);
      setEditTitle(data.service.title);
      setEditDate(data.service.service_date?.split('T')[0] || '');
    } catch (err) {
      console.error('Error fetching service:', err);
    }
    setLoading(false);
  }, [serviceId]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          serviceDate: editDate || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setService(data.service);
        setDirty(false);
      }
    } catch (err) {
      console.error('Error saving service:', err);
    }

    setSaving(false);
  };

  const handleAction = async (action: string, extra?: Record<string, unknown>) => {
    setActioning(action);

    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, churchId, ...extra }),
      });

      if (res.ok) {
        const data = await res.json();
        if (action === 'duplicate' || action === 'save_as_template') {
          // Go back to list to see the new item
          onBack();
        } else {
          setService(data.service);
        }
      }
    } catch (err) {
      console.error('Error actioning service:', err);
    }

    setActioning(null);
  };

  const handleDelete = async () => {
    setActioning('delete');

    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onBack();
      }
    } catch (err) {
      console.error('Error deleting service:', err);
    }

    setActioning(null);
  };

  const handleAddBlock = async (blockType: BlockType) => {
    setShowAddBlock(false);
    const info = getBlockTypeInfo(blockType);

    try {
      const res = await fetch(`/api/admin/services/${serviceId}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockType,
          config: info.defaultConfig,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBlocks((prev) => [...prev, data.block]);
        // Open config modal for the new block
        setEditingBlock(data.block);
      }
    } catch (err) {
      console.error('Error adding block:', err);
    }
  };

  const handleReorder = async (blockId: string, direction: 'up' | 'down') => {
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === blocks.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newBlocks = [...blocks];
    [newBlocks[idx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[idx]];

    // Optimistic update
    setBlocks(newBlocks);

    try {
      await fetch(`/api/admin/services/${serviceId}/blocks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: newBlocks.map((b, i) => ({ id: b.id, sortOrder: i })),
        }),
      });
    } catch (err) {
      console.error('Error reordering blocks:', err);
      fetchService(); // Revert on failure
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    // Optimistic removal
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));

    try {
      await fetch(`/api/admin/services/${serviceId}/blocks`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId }),
      });
    } catch (err) {
      console.error('Error deleting block:', err);
      fetchService();
    }
  };

  const handleSaveBlockConfig = async (blockId: string, config: Record<string, unknown>, showOnDisplay?: boolean) => {
    try {
      const res = await fetch(`/api/admin/services/${serviceId}/blocks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId, config, show_on_display: showOnDisplay }),
      });

      if (res.ok) {
        const data = await res.json();
        setBlocks((prev) => prev.map((b) => (b.id === blockId ? data.block : b)));
      }
    } catch (err) {
      console.error('Error saving block config:', err);
    }

    setEditingBlock(null);
  };

  if (loading) {
    return <p className="text-foreground-muted text-center py-8">Loading...</p>;
  }

  if (!service) {
    return <p className="text-error text-center py-8">Service not found.</p>;
  }

  const badge = STATUS_BADGES[service.status];
  const categories = getBlockTypesByCategory();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-1.5 text-foreground-muted hover:text-navy transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-navy truncate">{service.title}</h2>
            <span className={`px-2 py-0.5 rounded-full text-xs flex-shrink-0 ${badge.className}`}>
              {badge.label}
            </span>
          </div>
        </div>
      </div>

      {/* Meta form */}
      <div className="bg-white rounded-lg border border-card-border p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-foreground-muted mb-1">Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => { setEditTitle(e.target.value); setDirty(true); }}
              className="w-full border border-card-border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-foreground-muted mb-1">Service Date</label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => { setEditDate(e.target.value); setDirty(true); }}
              className="w-full border border-card-border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-card-border">
          {dirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-navy text-white rounded text-sm hover:bg-navy/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          )}

          {service.status === 'draft' && (
            <button
              onClick={() => handleAction('publish')}
              disabled={!!actioning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {actioning === 'publish' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Publish
            </button>
          )}

          {service.status === 'published' && (
            <button
              onClick={() => handleAction('unpublish')}
              disabled={!!actioning}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-card-border rounded text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {actioning === 'unpublish' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
              Unpublish
            </button>
          )}

          {service.status !== 'archived' && (
            <button
              onClick={() => handleAction('archive')}
              disabled={!!actioning}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-card-border rounded text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {actioning === 'archive' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
              Archive
            </button>
          )}

          {service.status === 'archived' && (
            <button
              onClick={() => handleAction('unarchive')}
              disabled={!!actioning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-navy text-white rounded text-sm hover:bg-navy/90 transition-colors disabled:opacity-50"
            >
              {actioning === 'unarchive' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
              Unarchive
            </button>
          )}

          <button
            onClick={() => handleAction('duplicate')}
            disabled={!!actioning}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-card-border rounded text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {actioning === 'duplicate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
            Duplicate
          </button>

          {!service.is_template && (
            <button
              onClick={() => handleAction('save_as_template')}
              disabled={!!actioning}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-card-border rounded text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {actioning === 'save_as_template' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
              Save as Template
            </button>
          )}

          <div className="flex-1" />

          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-error">Delete this service?</span>
              <button
                onClick={handleDelete}
                disabled={!!actioning}
                className="px-3 py-1.5 bg-error text-white rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actioning === 'delete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 border border-card-border rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-error border border-red-200 rounded text-sm hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Block list */}
      <div className="bg-white rounded-lg border border-card-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-navy">
            Blocks ({blocks.length})
          </h3>

          {/* Add block dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAddBlock(!showAddBlock)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-navy text-white rounded text-sm hover:bg-navy/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Block
            </button>

            {showAddBlock && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowAddBlock(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg border border-card-border shadow-lg z-20 w-64 py-1 max-h-80 overflow-y-auto">
                  {categories.map((cat) => (
                    <div key={cat.category}>
                      <div className="px-3 py-1.5 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                        {cat.label}
                      </div>
                      {cat.types.map((bt) => {
                        const Icon = bt.icon;
                        return (
                          <button
                            key={bt.type}
                            onClick={() => handleAddBlock(bt.type)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2.5"
                          >
                            <Icon className="w-4 h-4 text-navy flex-shrink-0" />
                            <div>
                              <div className="text-sm text-navy">{bt.label}</div>
                              <div className="text-xs text-foreground-muted">{bt.description}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {blocks.length === 0 ? (
          <p className="text-sm text-foreground-muted text-center py-8">
            No blocks yet. Add your first block to start building the service flow.
          </p>
        ) : (
          <BlockList
            blocks={blocks}
            onReorder={handleReorder}
            onEdit={setEditingBlock}
            onDelete={handleDeleteBlock}
          />
        )}
      </div>

      {/* Block config modal */}
      {editingBlock && (
        <BlockConfigModal
          block={editingBlock}
          onSave={(config, showOnDisplay) => handleSaveBlockConfig(editingBlock.id, config, showOnDisplay)}
          onClose={() => setEditingBlock(null)}
        />
      )}
    </div>
  );
}
