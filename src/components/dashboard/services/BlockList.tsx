'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronsUp, GripVertical, Pencil, Trash2 } from 'lucide-react';
import type { ServiceBlock } from '@/lib/types';
import { getBlockTypeInfo, getBlockConfigSummary } from './blockTypeConfig';

interface BlockListProps {
  blocks: ServiceBlock[];
  onReorder: (newBlocks: ServiceBlock[]) => void;
  onMoveToTop: (blockId: string) => void;
  onEdit: (block: ServiceBlock) => void;
  onDelete: (blockId: string) => void;
}

function SortableBlock({
  block,
  idx,
  isFirst,
  isLast,
  onMoveToTop,
  onEdit,
  onDelete,
  confirmDeleteId,
  setConfirmDeleteId,
}: {
  block: ServiceBlock;
  idx: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveToTop: (blockId: string) => void;
  onEdit: (block: ServiceBlock) => void;
  onDelete: (blockId: string) => void;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as number | string,
  };

  const info = getBlockTypeInfo(block.block_type);
  const Icon = info.icon;
  const summary = getBlockConfigSummary(block.block_type, block.config);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-lg border border-card-border hover:border-navy/20 transition-colors group bg-white"
    >
      {/* Drag handle */}
      <button
        className="p-0.5 text-foreground-muted hover:text-navy cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Position number */}
      <span className="text-xs font-medium text-foreground-muted w-5 text-center flex-shrink-0">
        {idx + 1}
      </span>

      {/* Move to top */}
      <button
        onClick={() => onMoveToTop(block.id)}
        disabled={isFirst}
        className="p-0.5 text-foreground-muted hover:text-navy disabled:opacity-20 disabled:cursor-default transition-colors flex-shrink-0"
        title="Move to top"
      >
        <ChevronsUp className="w-3.5 h-3.5" />
      </button>

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
}

export default function BlockList({ blocks, onReorder, onMoveToTop, onEdit, onDelete }: BlockListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(oldIndex, 1);
    newBlocks.splice(newIndex, 0, moved);

    onReorder(newBlocks);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {blocks.map((block, idx) => (
            <SortableBlock
              key={block.id}
              block={block}
              idx={idx}
              isFirst={idx === 0}
              isLast={idx === blocks.length - 1}
              onMoveToTop={onMoveToTop}
              onEdit={onEdit}
              onDelete={onDelete}
              confirmDeleteId={confirmDeleteId}
              setConfirmDeleteId={setConfirmDeleteId}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
