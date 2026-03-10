'use client';

import { useState, useCallback, useEffect } from 'react';
import { RotateCcw, Save, Loader2, Info } from 'lucide-react';
import ToolLibrary from './ToolLibrary';
import PathwayTimeline, { type TimelineItem } from './PathwayTimeline';
import type { PathwayToolRecord, PathwayItemRecord } from './toolConfig';

interface PathwayEditorProps {
  churchId: string;
  phase: number;
  allTools: PathwayToolRecord[];
}

export default function PathwayEditor({ churchId, phase, allTools }: PathwayEditorProps) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [weekCount, setWeekCount] = useState(12);
  const [isDefault, setIsDefault] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Load pathway data
  const loadPathway = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pathway?church_id=${churchId}&phase=${phase}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setIsDefault(data.isDefault);

      if (data.pathway) {
        setWeekCount(data.pathway.week_count);
      }

      if (data.items && data.items.length > 0) {
        const timelineItems: TimelineItem[] = data.items.map((item: PathwayItemRecord) => ({
          weekNumber: item.week_number,
          tool: item.pathway_tools,
        }));
        setItems(timelineItems);
      } else {
        setItems([]);
      }

      setDirty(false);
    } catch {
      setError('Failed to load pathway');
    } finally {
      setLoading(false);
    }
  }, [churchId, phase]);

  useEffect(() => {
    loadPathway();
  }, [loadPathway]);

  // Add tool from library
  const handleAddTool = (tool: PathwayToolRecord) => {
    const nextWeek = items.length + 1;
    const maxWeeks = phase === 1 ? 16 : 26;
    if (nextWeek > maxWeeks) {
      setError(`Maximum ${maxWeeks} weeks for Phase ${phase}`);
      return;
    }

    setItems((prev) => [...prev, { weekNumber: nextWeek, tool }]);
    // Auto-adjust week count if needed
    if (nextWeek > weekCount) {
      setWeekCount(nextWeek);
    }
    setDirty(true);
    setError(null);
  };

  // Remove tool from timeline
  const handleRemoveTool = (weekNumber: number) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.weekNumber !== weekNumber);
      // Re-number sequentially
      return filtered.map((item, idx) => ({ ...item, weekNumber: idx + 1 }));
    });
    setDirty(true);
  };

  // Reorder (from drag-and-drop)
  const handleReorder = (reordered: TimelineItem[]) => {
    setItems(reordered);
    setDirty(true);
  };

  // Save pathway
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/admin/pathway', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          churchId,
          phase,
          weekCount: items.length,
          items: items.map((item) => ({
            weekNumber: item.weekNumber,
            toolId: item.tool.id,
          })),
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      setDirty(false);
      setIsDefault(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to save pathway');
    } finally {
      setSaving(false);
    }
  };

  // Reset to ARK default
  const handleReset = async () => {
    setShowResetConfirm(false);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pathway?church_id=${churchId}&phase=${phase}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      // Reload to show ARK default
      await loadPathway();
    } catch {
      setError('Failed to reset pathway');
    } finally {
      setSaving(false);
    }
  };

  // Week count controls
  const maxWeeks = phase === 1 ? 16 : 26;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Default banner */}
      {isDefault && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm text-blue-800">
            Using ARK Default Pathway. Make changes and save to create your custom pathway.
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          Pathway saved successfully!
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: '400px' }}>
        {/* Tool library (left) */}
        <div className="lg:col-span-1 border border-card-border rounded-lg p-4 bg-gray-50/50">
          <ToolLibrary tools={allTools} onAddTool={handleAddTool} />
        </div>

        {/* Timeline (right) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-navy">
              Phase {phase} Pathway
              <span className="text-foreground-muted font-normal ml-2">
                {items.length} {items.length === 1 ? 'week' : 'weeks'}
                {items.length > 0 && ` (max ${maxWeeks})`}
              </span>
            </h3>
          </div>

          <PathwayTimeline
            items={items}
            onReorder={handleReorder}
            onRemove={handleRemoveTool}
          />
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between pt-4 border-t border-card-border">
        <div className="flex items-center gap-2">
          {!isDefault && (
            <>
              {showResetConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground-muted">Reset to ARK Default?</span>
                  <button
                    onClick={handleReset}
                    disabled={saving}
                    className="px-3 py-1.5 bg-error text-white rounded-lg text-sm hover:bg-error/90 transition-colors"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1.5 border border-card-border rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground-muted border border-card-border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset to Default
                </button>
              )}
            </>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !dirty || items.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>
    </div>
  );
}
