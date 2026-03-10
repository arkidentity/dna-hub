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
import { GripVertical, Trash2, Wrench, Activity } from 'lucide-react';
import { getToolIcon, type PathwayToolRecord } from './toolConfig';

export interface TimelineItem {
  weekNumber: number;
  tool: PathwayToolRecord;
}

interface PathwayTimelineProps {
  items: TimelineItem[];
  onReorder: (items: TimelineItem[]) => void;
  onRemove: (weekNumber: number) => void;
}

function SortableWeek({
  item,
  onRemove,
  confirmDeleteWeek,
  setConfirmDeleteWeek,
}: {
  item: TimelineItem;
  onRemove: (weekNumber: number) => void;
  confirmDeleteWeek: number | null;
  setConfirmDeleteWeek: (week: number | null) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `week-${item.weekNumber}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : ('auto' as number | string),
  };

  const Icon = getToolIcon(item.tool.icon_name);

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

      {/* Week number */}
      <span className="text-xs font-bold text-white bg-navy rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
        {item.weekNumber}
      </span>

      {/* Tool info */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <Icon className="w-4 h-4 text-navy flex-shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-medium text-navy">{item.tool.name}</div>
          <div className="flex items-center gap-1 mt-0.5">
            {item.tool.tool_type === 'app_tool' ? (
              <Wrench className="w-3 h-3 text-teal" />
            ) : (
              <Activity className="w-3 h-3 text-gold" />
            )}
            <span className="text-xs text-foreground-muted">
              {item.tool.tool_type === 'app_tool' ? 'App Tool' : 'Activity'}
            </span>
          </div>
        </div>
      </div>

      {/* Remove */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {confirmDeleteWeek === item.weekNumber ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => { onRemove(item.weekNumber); setConfirmDeleteWeek(null); }}
              className="px-2 py-0.5 bg-error text-white rounded text-xs"
            >
              Remove
            </button>
            <button
              onClick={() => setConfirmDeleteWeek(null)}
              className="px-2 py-0.5 border border-card-border rounded text-xs"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDeleteWeek(item.weekNumber)}
            className="p-1.5 text-foreground-muted hover:text-error transition-colors"
            title="Remove from pathway"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function PathwayTimeline({ items, onReorder, onRemove }: PathwayTimelineProps) {
  const [confirmDeleteWeek, setConfirmDeleteWeek] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => `week-${i.weekNumber}` === active.id);
    const newIndex = items.findIndex((i) => `week-${i.weekNumber}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...items];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Re-number weeks sequentially after reorder
    const renumbered = reordered.map((item, idx) => ({
      ...item,
      weekNumber: idx + 1,
    }));

    onReorder(renumbered);
  };

  if (items.length === 0) {
    return (
      <div className="border-2 border-dashed border-card-border rounded-lg p-8 text-center">
        <p className="text-sm text-foreground-muted">
          No tools added yet. Click a tool in the library to add it to this phase.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => `week-${i.weekNumber}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {items.map((item) => (
            <SortableWeek
              key={`week-${item.weekNumber}`}
              item={item}
              onRemove={onRemove}
              confirmDeleteWeek={confirmDeleteWeek}
              setConfirmDeleteWeek={setConfirmDeleteWeek}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
