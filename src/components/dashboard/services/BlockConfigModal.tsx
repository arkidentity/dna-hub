'use client';

import { useState, useRef } from 'react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import type { ServiceBlock } from '@/lib/types';
import { getBlockTypeInfo } from './blockTypeConfig';

interface BlockConfigModalProps {
  block: ServiceBlock;
  onSave: (config: Record<string, unknown>) => void;
  onClose: () => void;
}

export default function BlockConfigModal({ block, onSave, onClose }: BlockConfigModalProps) {
  const [config, setConfig] = useState<Record<string, unknown>>({ ...block.config });
  const [saving, setSaving] = useState(false);

  const info = getBlockTypeInfo(block.block_type);
  const Icon = info.icon;

  const handleSave = async () => {
    setSaving(true);
    await onSave(config);
    setSaving(false);
  };

  const updateField = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-card-border px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-navy flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {info.label}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-navy">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {block.block_type === 'scripture' && (
            <ScriptureForm config={config} onChange={updateField} />
          )}
          {block.block_type === 'teaching_note' && (
            <TeachingNoteForm config={config} onChange={updateField} />
          )}
          {block.block_type === 'creed_card' && (
            <CreedCardForm config={config} onChange={updateField} />
          )}
          {block.block_type === 'worship_set' && (
            <WorshipSetForm config={config} onChange={updateField} />
          )}
          {block.block_type === 'poll' && (
            <PollForm config={config} onChange={updateField} />
          )}
          {block.block_type === 'open_response' && (
            <OpenResponseForm config={config} onChange={updateField} />
          )}
          {block.block_type === 'breakout_prompt' && (
            <BreakoutForm config={config} onChange={updateField} />
          )}
          {block.block_type === 'giving' && (
            <GivingForm config={config} onChange={updateField} />
          )}
          {block.block_type === 'next_steps' && (
            <NextStepsForm config={config} onChange={updateField} />
          )}
          {block.block_type === 'connect_card' && (
            <ConnectCardForm config={config} onChange={updateField} />
          )}
          {block.block_type === 'fill_in_blank' && (
            <FillInBlankForm config={config} onChange={updateField} />
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-card-border px-6 py-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-card-border rounded text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-navy text-white rounded text-sm hover:bg-navy/90 disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Per-type form components
// ============================================

interface FormProps {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

function ScriptureForm({ config, onChange }: FormProps) {
  return (
    <>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Passage Reference</label>
        <input
          type="text"
          value={(config.passage_ref as string) || ''}
          onChange={(e) => onChange('passage_ref', e.target.value)}
          placeholder="Romans 12:1-2"
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Passage Text</label>
        <textarea
          value={(config.passage_text as string) || ''}
          onChange={(e) => onChange('passage_text', e.target.value)}
          placeholder="Therefore, I urge you, brothers and sisters..."
          rows={5}
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Translation</label>
        <select
          value={(config.translation as string) || 'NIV'}
          onChange={(e) => onChange('translation', e.target.value)}
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        >
          <option value="NIV">NIV</option>
          <option value="ESV">ESV</option>
          <option value="KJV">KJV</option>
          <option value="NASB">NASB</option>
          <option value="NLT">NLT</option>
          <option value="CSB">CSB</option>
        </select>
      </div>
    </>
  );
}

function TeachingNoteForm({ config, onChange }: FormProps) {
  return (
    <>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Title</label>
        <input
          type="text"
          value={(config.title as string) || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Section heading displayed in bold"
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Teaching Notes</label>
        <textarea
          value={(config.text as string) || ''}
          onChange={(e) => onChange('text', e.target.value)}
          placeholder="Key points for today's teaching..."
          rows={8}
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        />
      </div>
    </>
  );
}

function CreedCardForm({ config, onChange }: FormProps) {
  return (
    <div>
      <label className="block text-sm text-foreground-muted mb-1">Creed Card Number</label>
      <input
        type="number"
        min={1}
        max={50}
        value={(config.card_id as number) || 1}
        onChange={(e) => onChange('card_id', parseInt(e.target.value) || 1)}
        className="w-full border border-card-border rounded px-3 py-2 text-sm"
      />
      <p className="text-xs text-foreground-muted mt-1">Enter a card number between 1 and 50.</p>
    </div>
  );
}

function WorshipSetForm({ config, onChange }: FormProps) {
  const songs = (config.songs as { title: string; artist: string }[]) || [];

  const addSong = () => {
    onChange('songs', [...songs, { title: '', artist: '' }]);
  };

  const updateSong = (idx: number, field: string, value: string) => {
    const updated = songs.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
    onChange('songs', updated);
  };

  const removeSong = (idx: number) => {
    onChange('songs', songs.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <label className="block text-sm text-foreground-muted mb-2">Songs</label>
      <div className="space-y-2">
        {songs.map((song, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              type="text"
              value={song.title}
              onChange={(e) => updateSong(idx, 'title', e.target.value)}
              placeholder="Song title"
              className="flex-1 border border-card-border rounded px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={song.artist}
              onChange={(e) => updateSong(idx, 'artist', e.target.value)}
              placeholder="Artist"
              className="flex-1 border border-card-border rounded px-3 py-2 text-sm"
            />
            <button onClick={() => removeSong(idx)} className="p-2 text-error hover:bg-red-50 rounded">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addSong}
        className="mt-2 flex items-center gap-1.5 text-sm text-navy hover:text-navy/70"
      >
        <Plus className="w-3.5 h-3.5" /> Add Song
      </button>
    </div>
  );
}

function PollForm({ config, onChange }: FormProps) {
  const options = (config.options as { id: string; label: string }[]) || [];

  const addOption = () => {
    if (options.length >= 4) return;
    const nextId = String.fromCharCode(97 + options.length); // a, b, c, d
    onChange('options', [...options, { id: nextId, label: '' }]);
  };

  const updateOption = (idx: number, value: string) => {
    const updated = options.map((o, i) => (i === idx ? { ...o, label: value } : o));
    onChange('options', updated);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    onChange('options', options.filter((_, i) => i !== idx));
  };

  return (
    <>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Question</label>
        <input
          type="text"
          value={(config.question as string) || ''}
          onChange={(e) => onChange('question', e.target.value)}
          placeholder="Where are you at with this?"
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-2">
          Options ({options.length}/4)
        </label>
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={opt.id} className="flex gap-2 items-center">
              <span className="text-xs font-medium text-foreground-muted w-5 text-center uppercase">
                {opt.id}
              </span>
              <input
                type="text"
                value={opt.label}
                onChange={(e) => updateOption(idx, e.target.value)}
                placeholder={`Option ${opt.id.toUpperCase()}`}
                className="flex-1 border border-card-border rounded px-3 py-2 text-sm"
              />
              {options.length > 2 && (
                <button onClick={() => removeOption(idx)} className="p-1 text-error hover:bg-red-50 rounded">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        {options.length < 4 && (
          <button
            onClick={addOption}
            className="mt-2 flex items-center gap-1.5 text-sm text-navy hover:text-navy/70"
          >
            <Plus className="w-3.5 h-3.5" /> Add Option
          </button>
        )}
      </div>
      <div className="flex items-center gap-4">
        <ToggleField
          label="Anonymous"
          checked={(config.anonymous as boolean) ?? true}
          onChange={(v) => onChange('anonymous', v)}
        />
        <ToggleField
          label="Show results live"
          checked={(config.show_results_live as boolean) ?? true}
          onChange={(v) => onChange('show_results_live', v)}
        />
      </div>
    </>
  );
}

function OpenResponseForm({ config, onChange }: FormProps) {
  return (
    <>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Title</label>
        <input
          type="text"
          value={(config.title as string) || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Heading displayed in bold"
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Question</label>
        <textarea
          value={(config.question as string) || ''}
          onChange={(e) => onChange('question', e.target.value)}
          placeholder="What is God speaking to you today?"
          rows={3}
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        />
      </div>
      <ToggleField
        label="Require approval before display"
        checked={(config.moderated as boolean) ?? true}
        onChange={(v) => onChange('moderated', v)}
      />
    </>
  );
}

function BreakoutForm({ config, onChange }: FormProps) {
  return (
    <>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Title</label>
        <input
          type="text"
          value={(config.title as string) || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Heading displayed in bold"
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Discussion Question</label>
        <textarea
          value={(config.question as string) || ''}
          onChange={(e) => onChange('question', e.target.value)}
          placeholder="Turn to someone near you and share..."
          rows={3}
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-foreground-muted mb-1">Timer (seconds)</label>
          <input
            type="number"
            min={30}
            max={600}
            value={(config.timer_seconds as number) || 180}
            onChange={(e) => onChange('timer_seconds', parseInt(e.target.value) || 180)}
            className="w-full border border-card-border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-foreground-muted mb-1">Warning at (seconds)</label>
          <input
            type="number"
            min={10}
            max={120}
            value={(config.timer_warning_at as number) || 30}
            onChange={(e) => onChange('timer_warning_at', parseInt(e.target.value) || 30)}
            className="w-full border border-card-border rounded px-3 py-2 text-sm"
          />
        </div>
      </div>
    </>
  );
}

function GivingForm({ config, onChange }: FormProps) {
  return (
    <>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Giving URL</label>
        <input
          type="url"
          value={(config.giving_url as string) || ''}
          onChange={(e) => onChange('giving_url', e.target.value)}
          placeholder="https://tithe.ly/give?c=12345"
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Message</label>
        <textarea
          value={(config.message as string) || ''}
          onChange={(e) => onChange('message', e.target.value)}
          placeholder="Thank you for your generosity."
          rows={2}
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        />
      </div>
    </>
  );
}

function NextStepsForm({ config, onChange }: FormProps) {
  const steps = (config.steps as { id: string; label: string; icon: string }[]) || [];

  const addStep = () => {
    if (steps.length >= 5) return;
    onChange('steps', [...steps, { id: `step_${steps.length + 1}`, label: '', icon: 'heart' }]);
  };

  const updateStep = (idx: number, field: string, value: string) => {
    const updated = steps.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
    onChange('steps', updated);
  };

  const removeStep = (idx: number) => {
    if (steps.length <= 1) return;
    onChange('steps', steps.filter((_, i) => i !== idx));
  };

  const iconOptions = ['heart', 'users', 'water', 'hand', 'message', 'calendar', 'star', 'book'];

  return (
    <>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Prompt</label>
        <input
          type="text"
          value={(config.prompt as string) || ''}
          onChange={(e) => onChange('prompt', e.target.value)}
          placeholder="What's your next step today?"
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-2">
          Steps ({steps.length}/5)
        </label>
        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex gap-2">
              <select
                value={step.icon}
                onChange={(e) => updateStep(idx, 'icon', e.target.value)}
                className="w-24 border border-card-border rounded px-2 py-2 text-sm"
              >
                {iconOptions.map((ic) => (
                  <option key={ic} value={ic}>{ic}</option>
                ))}
              </select>
              <input
                type="text"
                value={step.label}
                onChange={(e) => updateStep(idx, 'label', e.target.value)}
                placeholder="I want to join a DNA Group"
                className="flex-1 border border-card-border rounded px-3 py-2 text-sm"
              />
              {steps.length > 1 && (
                <button onClick={() => removeStep(idx)} className="p-2 text-error hover:bg-red-50 rounded">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        {steps.length < 5 && (
          <button
            onClick={addStep}
            className="mt-2 flex items-center gap-1.5 text-sm text-navy hover:text-navy/70"
          >
            <Plus className="w-3.5 h-3.5" /> Add Step
          </button>
        )}
      </div>
    </>
  );
}

function ConnectCardForm({ config, onChange }: FormProps) {
  const fields = (config.fields as string[]) || [];
  const availableFields = [
    { id: 'first_time', label: 'First time visitor?' },
    { id: 'address', label: 'Address' },
    { id: 'how_heard', label: 'How did you hear about us?' },
    { id: 'prayer_request', label: 'Prayer request' },
  ];

  const toggleField = (fieldId: string) => {
    if (fields.includes(fieldId)) {
      onChange('fields', fields.filter((f) => f !== fieldId));
    } else {
      onChange('fields', [...fields, fieldId]);
    }
  };

  return (
    <div>
      <label className="block text-sm text-foreground-muted mb-2">Fields to include</label>
      <div className="space-y-2">
        {availableFields.map((f) => (
          <label key={f.id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={fields.includes(f.id)}
              onChange={() => toggleField(f.id)}
              className="rounded border-card-border"
            />
            <span className="text-sm text-navy">{f.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function FillInBlankForm({ config, onChange }: FormProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const BLANK_MARKER = '___';

  const segments = (config.segments as string[]) || ['', ''];
  const blankCount = (config.blank_count as number) || 0;
  const blankLabels = (config.blank_labels as string[]) || [];

  // Reconstruct raw text from segments
  const rawText = segments.join(BLANK_MARKER);

  // Parse raw text back to segments on change
  const handleTextChange = (text: string) => {
    const parts = text.split(BLANK_MARKER);
    const count = Math.max(parts.length - 1, 0);
    onChange('segments', parts);
    onChange('blank_count', count);
    // Build a human-readable prompt
    onChange('prompt', text);
  };

  const insertBlank = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const text = rawText;
    const newText = text.slice(0, pos) + BLANK_MARKER + text.slice(pos);
    handleTextChange(newText);
    // Restore cursor after the inserted marker
    setTimeout(() => {
      ta.focus();
      const newPos = pos + BLANK_MARKER.length;
      ta.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">
          Sentence Template
        </label>
        <textarea
          ref={textareaRef}
          value={rawText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder='I ___ so that ___ could ___'
          rows={3}
          className="w-full border border-card-border rounded px-3 py-2 text-sm font-mono"
        />
        <button
          type="button"
          onClick={insertBlank}
          className="mt-1.5 flex items-center gap-1.5 text-sm text-navy hover:text-navy/70"
        >
          <Plus className="w-3.5 h-3.5" /> Blank
        </button>
        {blankCount > 0 && (
          <p className="text-xs text-foreground-muted mt-1">
            {blankCount} blank{blankCount > 1 ? 's' : ''} detected
          </p>
        )}
      </div>
      {/* Preview */}
      {blankCount > 0 && (
        <div>
          <label className="block text-sm text-foreground-muted mb-1">Preview</label>
          <div className="bg-gray-50 rounded p-3 text-sm leading-relaxed">
            {segments.map((seg, i) => (
              <span key={i}>
                {seg}
                {i < blankCount && (
                  <span className="inline-block mx-1 px-2 py-0.5 bg-gold/20 text-navy font-medium rounded text-xs border border-gold/40">
                    {blankLabels[i] || `blank ${i + 1}`}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
      {/* Optional hint labels */}
      {blankCount > 0 && (
        <div>
          <label className="block text-sm text-foreground-muted mb-2">
            Blank Hints (optional placeholders shown to congregation)
          </label>
          <div className="space-y-2">
            {Array.from({ length: blankCount }).map((_, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-xs font-medium text-foreground-muted w-14">
                  Blank {i + 1}
                </span>
                <input
                  type="text"
                  value={blankLabels[i] || ''}
                  onChange={(e) => {
                    const updated = [...blankLabels];
                    updated[i] = e.target.value;
                    onChange('blank_labels', updated);
                  }}
                  placeholder={`e.g. verb, name, place...`}
                  className="flex-1 border border-card-border rounded px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// Shared toggle component
// ============================================

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? 'bg-gold' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4.5' : 'translate-x-0.5'
          }`}
        />
      </button>
      <span className="text-sm text-navy">{label}</span>
    </label>
  );
}
