'use client';

import { useState, useRef } from 'react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import type { ServiceBlock } from '@/lib/types';
import { getBlockTypeInfo } from './blockTypeConfig';

interface BlockConfigModalProps {
  block: ServiceBlock;
  onSave: (config: Record<string, unknown>, showOnDisplay?: boolean) => void;
  onClose: () => void;
}

export default function BlockConfigModal({ block, onSave, onClose }: BlockConfigModalProps) {
  const [config, setConfig] = useState<Record<string, unknown>>({ ...block.config });
  const [showOnDisplay, setShowOnDisplay] = useState(block.show_on_display ?? true);
  const [saving, setSaving] = useState(false);

  const info = getBlockTypeInfo(block.block_type);
  const Icon = info.icon;

  const handleSave = async () => {
    setSaving(true);
    await onSave(config, showOnDisplay);
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
          {block.block_type === 'prayer_wall' && (
            <PrayerWallForm config={config} onChange={updateField} />
          )}
          {block.block_type === 'announcement' && (
            <AnnouncementForm config={config} onChange={updateField} />
          )}

          {/* Display visibility toggle (all blocks) */}
          <div className="pt-3 border-t border-card-border">
            <ToggleField
              label="Show on projection display"
              checked={showOnDisplay}
              onChange={setShowOnDisplay}
            />
            <p className="text-xs text-foreground-muted mt-1 ml-11">
              When off, this block will only appear on phones, not the projection screen.
            </p>
          </div>
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
      <ToggleField
        label="Enable My Notes for congregation"
        checked={(config.show_notes as boolean) ?? true}
        onChange={(v) => onChange('show_notes', v)}
      />
    </>
  );
}

function TeachingNoteForm({ config, onChange }: FormProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const BLANK_MARKER = '___';

  const insertBlankInTitle = () => {
    const el = titleRef.current;
    if (!el) return;
    const pos = el.selectionStart ?? ((config.title as string) || '').length;
    const current = (config.title as string) || '';
    const newVal = current.slice(0, pos) + BLANK_MARKER + current.slice(pos);
    onChange('title', newVal);
    // Auto-enable blanks
    if (!(config.has_blanks as boolean)) onChange('has_blanks', true);
    setTimeout(() => {
      el.focus();
      const newPos = pos + BLANK_MARKER.length;
      el.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const insertBlankInText = () => {
    const el = textRef.current;
    if (!el) return;
    const pos = el.selectionStart ?? ((config.text as string) || '').length;
    const current = (config.text as string) || '';
    const newVal = current.slice(0, pos) + BLANK_MARKER + current.slice(pos);
    onChange('text', newVal);
    // Auto-enable blanks
    if (!(config.has_blanks as boolean)) onChange('has_blanks', true);
    setTimeout(() => {
      el.focus();
      const newPos = pos + BLANK_MARKER.length;
      el.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Title</label>
        <input
          ref={titleRef}
          type="text"
          value={(config.title as string) || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Section heading displayed in bold"
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        />
        <button type="button" onClick={insertBlankInTitle} className="mt-1 flex items-center gap-1.5 text-xs text-navy hover:text-navy/70">
          <Plus className="w-3 h-3" /> Blank
        </button>
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Content</label>
        <textarea
          ref={textRef}
          value={(config.text as string) || ''}
          onChange={(e) => onChange('text', e.target.value)}
          placeholder="Key points for today's teaching... Use ___ for blanks"
          rows={8}
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        />
        <button type="button" onClick={insertBlankInText} className="mt-1 flex items-center gap-1.5 text-xs text-navy hover:text-navy/70">
          <Plus className="w-3 h-3" /> Blank
        </button>
      </div>
      <ToggleField
        label="Include fill-in-the-blanks"
        checked={(config.has_blanks as boolean) ?? false}
        onChange={(v) => onChange('has_blanks', v)}
      />
      {(config.has_blanks as boolean) && (
        <p className="text-xs text-foreground-muted ml-11">
          Use ___ (three underscores) in the title or content to create blanks. The congregation fills them in on their phones as you teach.
        </p>
      )}
      <ToggleField
        label="Enable My Notes for congregation"
        checked={(config.show_notes as boolean) ?? true}
        onChange={(v) => onChange('show_notes', v)}
      />
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
    const nextId = String.fromCharCode(97 + options.length);
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
        <label className="block text-sm text-foreground-muted mb-2">Options ({options.length}/4)</label>
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={opt.id} className="flex gap-2 items-center">
              <span className="text-xs font-medium text-foreground-muted w-5 text-center uppercase">{opt.id}</span>
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
          <button onClick={addOption} className="mt-2 flex items-center gap-1.5 text-sm text-navy hover:text-navy/70">
            <Plus className="w-3.5 h-3.5" /> Add Option
          </button>
        )}
      </div>
      <div className="flex items-center gap-4">
        <ToggleField label="Anonymous" checked={(config.anonymous as boolean) ?? true} onChange={(v) => onChange('anonymous', v)} />
        <ToggleField label="Show results live" checked={(config.show_results_live as boolean) ?? true} onChange={(v) => onChange('show_results_live', v)} />
      </div>
    </>
  );
}

function OpenResponseForm({ config, onChange }: FormProps) {
  return (
    <>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Title</label>
        <input type="text" value={(config.title as string) || ''} onChange={(e) => onChange('title', e.target.value)} placeholder="Heading displayed in bold" className="w-full border border-card-border rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Question</label>
        <textarea value={(config.question as string) || ''} onChange={(e) => onChange('question', e.target.value)} placeholder="What is God speaking to you today?" rows={3} className="w-full border border-card-border rounded px-3 py-2 text-sm" />
      </div>
      <ToggleField label="Require approval before display" checked={(config.moderated as boolean) ?? true} onChange={(v) => onChange('moderated', v)} />
    </>
  );
}

function BreakoutForm({ config, onChange }: FormProps) {
  const mode = (config.mode as string) || 'discussion';
  return (
    <>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Mode</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => onChange('mode', 'discussion')} className={`flex-1 px-3 py-2 rounded text-sm border ${mode === 'discussion' ? 'bg-navy text-white border-navy' : 'border-card-border text-navy hover:bg-gray-50'}`}>Discussion</button>
          <button type="button" onClick={() => onChange('mode', 'introspective')} className={`flex-1 px-3 py-2 rounded text-sm border ${mode === 'introspective' ? 'bg-navy text-white border-navy' : 'border-card-border text-navy hover:bg-gray-50'}`}>Introspective</button>
        </div>
        <p className="text-xs text-foreground-muted mt-1">
          {mode === 'discussion' ? 'Group discussion — congregation discusses the question with those around them.' : 'Personal reflection — congregation writes their thoughts privately in the app.'}
        </p>
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Title</label>
        <input type="text" value={(config.title as string) || ''} onChange={(e) => onChange('title', e.target.value)} placeholder="Heading displayed in bold" className="w-full border border-card-border rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">{mode === 'discussion' ? 'Discussion Question' : 'Reflection Prompt'}</label>
        <textarea value={(config.question as string) || ''} onChange={(e) => onChange('question', e.target.value)} placeholder={mode === 'discussion' ? 'Turn to someone near you and share...' : 'Take a moment to write down what God is speaking to you...'} rows={3} className="w-full border border-card-border rounded px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-foreground-muted mb-1">Timer (seconds)</label>
          <input type="number" min={30} max={600} value={(config.timer_seconds as number) || 180} onChange={(e) => onChange('timer_seconds', parseInt(e.target.value) || 180)} className="w-full border border-card-border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-foreground-muted mb-1">Warning at (seconds)</label>
          <input type="number" min={10} max={120} value={(config.timer_warning_at as number) || 30} onChange={(e) => onChange('timer_warning_at', parseInt(e.target.value) || 30)} className="w-full border border-card-border rounded px-3 py-2 text-sm" />
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
        <input type="url" value={(config.giving_url as string) || ''} onChange={(e) => onChange('giving_url', e.target.value)} placeholder="https://tithe.ly/give?c=12345" className="w-full border border-card-border rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Message</label>
        <textarea value={(config.message as string) || ''} onChange={(e) => onChange('message', e.target.value)} placeholder="Thank you for your generosity." rows={2} className="w-full border border-card-border rounded px-3 py-2 text-sm" />
      </div>
    </>
  );
}

function NextStepsForm({ config, onChange }: FormProps) {
  const steps = (config.steps as { id: string; label: string }[]) || [];

  const addStep = () => {
    if (steps.length >= 8) return;
    onChange('steps', [...steps, { id: `step_${steps.length + 1}`, label: '' }]);
  };

  const updateStep = (idx: number, value: string) => {
    const updated = steps.map((s, i) => (i === idx ? { ...s, label: value } : s));
    onChange('steps', updated);
  };

  const removeStep = (idx: number) => {
    if (steps.length <= 1) return;
    onChange('steps', steps.filter((_, i) => i !== idx));
  };

  return (
    <>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Prompt</label>
        <input type="text" value={(config.prompt as string) || ''} onChange={(e) => onChange('prompt', e.target.value)} placeholder="What's your next step today?" className="w-full border border-card-border rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-2">Steps ({steps.length}/8)</label>
        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex gap-2">
              <input type="text" value={step.label} onChange={(e) => updateStep(idx, e.target.value)} placeholder="e.g. Water Baptism, Join a Life Group..." className="flex-1 border border-card-border rounded px-3 py-2 text-sm" />
              {steps.length > 1 && (
                <button onClick={() => removeStep(idx)} className="p-2 text-error hover:bg-red-50 rounded">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        {steps.length < 8 && (
          <button onClick={addStep} className="mt-2 flex items-center gap-1.5 text-sm text-navy hover:text-navy/70">
            <Plus className="w-3.5 h-3.5" /> Add Step
          </button>
        )}
      </div>
      <p className="text-xs text-foreground-muted">Congregation can select multiple steps. Their contact info is captured for follow-up.</p>
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
            <input type="checkbox" checked={fields.includes(f.id)} onChange={() => toggleField(f.id)} className="rounded border-card-border" />
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
  const rawText = segments.join(BLANK_MARKER);

  const handleTextChange = (text: string) => {
    const parts = text.split(BLANK_MARKER);
    const count = Math.max(parts.length - 1, 0);
    onChange('segments', parts);
    onChange('blank_count', count);
    onChange('prompt', text);
  };

  const insertBlank = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const text = rawText;
    const newText = text.slice(0, pos) + BLANK_MARKER + text.slice(pos);
    handleTextChange(newText);
    setTimeout(() => {
      ta.focus();
      const newPos = pos + BLANK_MARKER.length;
      ta.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Title / Instructions</label>
        <input type="text" value={(config.title as string) || ''} onChange={(e) => onChange('title', e.target.value)} placeholder="Fill in the blanks as you follow along..." className="w-full border border-card-border rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Sentence Template</label>
        <textarea ref={textareaRef} value={rawText} onChange={(e) => handleTextChange(e.target.value)} placeholder='I ___ so that ___ could ___' rows={3} className="w-full border border-card-border rounded px-3 py-2 text-sm font-mono" />
        <button type="button" onClick={insertBlank} className="mt-1.5 flex items-center gap-1.5 text-sm text-navy hover:text-navy/70">
          <Plus className="w-3.5 h-3.5" /> Blank
        </button>
        {blankCount > 0 && <p className="text-xs text-foreground-muted mt-1">{blankCount} blank{blankCount > 1 ? 's' : ''} detected</p>}
      </div>
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
      {blankCount > 0 && (
        <div>
          <label className="block text-sm text-foreground-muted mb-2">Blank Hints (optional)</label>
          <div className="space-y-2">
            {Array.from({ length: blankCount }).map((_, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-xs font-medium text-foreground-muted w-14">Blank {i + 1}</span>
                <input type="text" value={blankLabels[i] || ''} onChange={(e) => { const updated = [...blankLabels]; updated[i] = e.target.value; onChange('blank_labels', updated); }} placeholder="e.g. verb, name, place..." className="flex-1 border border-card-border rounded px-3 py-2 text-sm" />
              </div>
            ))}
          </div>
        </div>
      )}
      <ToggleField label="Send responses to conductor" checked={(config.send_to_conductor as boolean) ?? true} onChange={(v) => onChange('send_to_conductor', v)} />
      <p className="text-xs text-foreground-muted ml-11">
        {(config.send_to_conductor as boolean) ?? true
          ? 'Responses are sent for review and can be shown on the projection display.'
          : "Responses are private — saved only on the user's device (church bulletin style)."}
      </p>
    </>
  );
}

function PrayerWallForm({ config, onChange }: FormProps) {
  return (
    <>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Title</label>
        <input
          type="text"
          value={(config.title as string) || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Church Prayer Wall"
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Number of prayers to show</label>
        <input
          type="number"
          min={3}
          max={30}
          value={(config.display_count as number) || 10}
          onChange={(e) => onChange('display_count', parseInt(e.target.value) || 10)}
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        />
        <p className="text-xs text-foreground-muted mt-1">Shows the most recent active prayer requests from your church prayer wall.</p>
      </div>
    </>
  );
}

function AnnouncementForm({ config, onChange }: FormProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const ctaType = (config.cta_type as string) || 'sign_up';

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('service_id', 'announcement');
    formData.append('block_id', `${Date.now()}`);

    try {
      const res = await fetch('/api/admin/services/upload-image', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        onChange('image_url', data.image_url);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploading(false);
  };

  return (
    <>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Title</label>
        <input
          type="text"
          value={(config.title as string) || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Mission Trip to Guatemala"
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Description</label>
        <textarea
          value={(config.description as string) || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Join us this summer for an incredible opportunity to serve..."
          rows={3}
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Image</label>
        {(config.image_url as string) ? (
          <div className="relative">
            <img
              src={config.image_url as string}
              alt="Announcement"
              className="w-full h-40 object-cover rounded border border-card-border"
            />
            <button
              type="button"
              onClick={() => { onChange('image_url', ''); if (fileRef.current) fileRef.current.value = ''; }}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
            >
              <Trash2 className="w-3.5 h-3.5 text-error" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-card-border rounded-lg p-6 text-center cursor-pointer hover:border-navy/40 transition-colors"
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-sm text-foreground-muted">
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
              </div>
            ) : (
              <p className="text-sm text-foreground-muted">Click to upload image (PNG, JPG, WebP — max 5MB)</p>
            )}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleUpload} className="hidden" />
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Button Text</label>
        <input
          type="text"
          value={(config.cta_text as string) || ''}
          onChange={(e) => onChange('cta_text', e.target.value)}
          placeholder="Sign Up"
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm text-foreground-muted mb-1">Button Action</label>
        <select
          value={ctaType}
          onChange={(e) => onChange('cta_type', e.target.value)}
          className="w-full border border-card-border rounded px-3 py-2 text-sm"
        >
          <option value="sign_up">Sign Up (captures contact info)</option>
          <option value="learn_more">Learn More (captures interest)</option>
          <option value="external_link">External Link (opens URL)</option>
        </select>
      </div>
      {ctaType === 'external_link' && (
        <div>
          <label className="block text-sm text-foreground-muted mb-1">Link URL</label>
          <input
            type="url"
            value={(config.cta_url as string) || ''}
            onChange={(e) => onChange('cta_url', e.target.value)}
            placeholder="https://..."
            className="w-full border border-card-border rounded px-3 py-2 text-sm"
          />
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
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-gold' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
      </button>
      <span className="text-sm text-navy">{label}</span>
    </label>
  );
}
