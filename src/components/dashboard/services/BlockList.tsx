'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import type { ServiceBlock } from '@/lib/types';
import { getBlockTypeInfo, getBlockConfigSummary } from './blockTypeConfig';

interface BlockListProps {
  blocks: ServiceBlock[];
  onReorder: (blockId: string, direction: 'up' | 'down') => void;
  onEdit: (block: ServiceBlock) => void;
  onDelete: (blockId: string) => void;
}

export default function BlockList({ blocks, onReorder, onEdit, onDelete }: BlockListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      {blocks.map((block, idx) => {
        const info = getBlockTypeInfo(block.block_type);
        const Icon = info.icon;
        const summary = getBlockConfigSummary(block.block_type, block.config);
        const isFirst = idx === 0;
        const isLast = idx === blocks.length - 1;

        return (
          <div
            key={block.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-card-border hover:border-navy/20 transition-colors group"
          >
            {/* Position number */}
            <span className="text-xs font-medium text-foreground-muted w-5 text-center flex-shrink-0">
              {idx + 1}
            </span>

            {/* Reorder arrows */}
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <button
                onClick={() => onReorder(block.id, 'up')}
                disabled={isFirst}
                className="p-0.5 text-foreground-muted hover:text-navy disabled:opacity-20 disabled:cursor-default transition-colors"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onReorder(block.id, 'down')}
                disabled={isLast}
                className="p-0.5 text-foreground-muted hover:text-navy disabled:opacity-20 disabled:cursor-default transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Block icon + info */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Icon className="w-4 h-4 text-navy flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-navy">{info.label}</div>
                <div className="text-xs text-foreground-muted truncate">{summary}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(block)}
                className="p-1.5 text-foreground-muted hover:text-navy transition-colors"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>

              {confirmDeleteId === block.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { onDelete(block.id); setConfirmDeleteId(null); }}
                    className="px-2 py-0.5 bg-error text-white rounded text-xs"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-2 py-0.5 border border-card-border rounded text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(block.id)}
                  className="p-1.5 text-foreground-muted hover:text-error transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
