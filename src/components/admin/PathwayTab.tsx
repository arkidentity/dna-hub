'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import PathwayEditor from './pathway/PathwayEditor';
import type { PathwayToolRecord } from './pathway/toolConfig';

interface PathwayTabProps {
  churchId: string;
  isPaid?: boolean;
}

export default function PathwayTab({ churchId, isPaid = false }: PathwayTabProps) {
  const [activePhase, setActivePhase] = useState<1 | 2>(1);
  const [allTools, setAllTools] = useState<PathwayToolRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tool library once
  useEffect(() => {
    async function loadTools() {
      try {
        const res = await fetch('/api/admin/pathway/tools');
        const data = await res.json();
        if (data.error) {
          setError(data.error);
          return;
        }
        setAllTools(data.tools || []);
      } catch {
        setError('Failed to load tool library');
      } finally {
        setLoading(false);
      }
    }
    loadTools();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Phase pills */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActivePhase(1)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activePhase === 1
              ? 'bg-navy text-white'
              : 'bg-gray-100 text-foreground-muted hover:bg-gray-200'
          }`}
        >
          Phase 1 — Foundation
        </button>
        <button
          onClick={() => setActivePhase(2)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activePhase === 2
              ? 'bg-navy text-white'
              : 'bg-gray-100 text-foreground-muted hover:bg-gray-200'
          }`}
        >
          Phase 2 — Growth
        </button>
      </div>

      {/* Editor for the selected phase */}
      <PathwayEditor
        key={`${churchId}-${activePhase}`}
        churchId={churchId}
        phase={activePhase}
        allTools={allTools}
        isPaid={isPaid}
      />
    </div>
  );
}
