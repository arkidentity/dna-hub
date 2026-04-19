'use client';

import { useState, useEffect } from 'react';
import { X, Upload, AlertCircle, Loader2, FileText, CheckCircle2 } from 'lucide-react';

interface ParsedEntry {
  date: string;
  reference: string;
  theme: string;
  error?: string;
}

interface Conflict {
  date: string;
  series_name: string;
}

interface UploadSeriesModalProps {
  churchId: string;
  replaceSeriesId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadSeriesModal({
  churchId, replaceSeriesId, onClose, onSuccess,
}: UploadSeriesModalProps) {
  const isReplace = !!replaceSeriesId;
  const [step, setStep] = useState<'input' | 'preview' | 'conflicts'>('input');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fileText, setFileText] = useState('');
  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill name/description when replacing an existing series
  useEffect(() => {
    if (!replaceSeriesId) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/passage-plan/${replaceSeriesId}`);
        if (!res.ok) return;
        const data = await res.json();
        setName(data.series?.name ?? '');
        setDescription(data.series?.description ?? '');
      } catch {}
    })();
  }, [replaceSeriesId]);

  const parseCsv = (text: string): ParsedEntry[] => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    // Skip header if present (starts with "date")
    const startIdx = /^date\s*,/i.test(lines[0]) ? 1 : 0;
    const rows: ParsedEntry[] = [];
    const seenDates = new Set<string>();

    for (let i = startIdx; i < lines.length; i++) {
      // Simple CSV: no quoted-field support needed for our 3 columns
      const cells = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const [date = '', reference = '', theme = ''] = cells;
      let error: string | undefined;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        error = 'Invalid date format (expected YYYY-MM-DD)';
      } else if (!reference) {
        error = 'Reference is required';
      } else if (seenDates.has(date)) {
        error = 'Duplicate date in upload';
      }
      if (!error) seenDates.add(date);

      rows.push({ date, reference, theme, error });
    }
    return rows;
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || '');
      setFileText(text);
      setEntries(parseCsv(text));
    };
    reader.readAsText(file);
  };

  const validEntries = entries.filter(e => !e.error);
  const errorCount = entries.filter(e => e.error).length;

  const goToPreview = () => {
    setError(null);
    if (!name.trim()) { setError('Series name is required'); return; }
    if (entries.length === 0) { setError('Upload a CSV file with at least one passage'); return; }
    if (errorCount > 0) { setError(`${errorCount} row(s) have errors. Fix your CSV and re-upload.`); return; }
    setStep('preview');
  };

  const submit = async (overwrite: boolean) => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        church_id: churchId,
        name: name.trim(),
        description: description.trim() || null,
        entries: validEntries.map(e => ({
          date: e.date,
          reference: e.reference,
          theme: e.theme || null,
        })),
      };

      const url = isReplace
        ? `/api/admin/passage-plan/${replaceSeriesId}${overwrite ? '?overwrite=true' : ''}`
        : `/api/admin/passage-plan${overwrite ? '?overwrite=true' : ''}`;
      const method = isReplace ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        const data = await res.json();
        setConflicts(data.conflicts || []);
        setStep('conflicts');
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-card-border">
          <h2 className="font-semibold text-navy">
            {isReplace ? 'Replace Series CSV' : 'Upload New Series'}
          </h2>
          <button onClick={onClose} className="text-foreground-muted hover:text-navy">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === 'input' && (
            <>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Series name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acts Series, Easter Week 2026"
                  className="w-full px-3 py-2 border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short note for your records"
                  className="w-full px-3 py-2 border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1">CSV file</label>
                <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-foreground-muted mb-2">
                    Columns: <code className="bg-gray-100 px-1 rounded">date</code>,{' '}
                    <code className="bg-gray-100 px-1 rounded">reference</code>,{' '}
                    <code className="bg-gray-100 px-1 rounded">theme</code>
                    {' '}· Dates as YYYY-MM-DD · Theme is optional
                  </p>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={onFileChange}
                    className="text-sm"
                  />
                  {entries.length > 0 && (
                    <p className="mt-2 text-xs text-foreground-muted">
                      Parsed {entries.length} row{entries.length === 1 ? '' : 's'}
                      {errorCount > 0 && <span className="text-red-600"> · {errorCount} error{errorCount === 1 ? '' : 's'}</span>}
                    </p>
                  )}
                </div>
              </div>

              {entries.length > 0 && errorCount > 0 && (
                <div className="border border-red-200 rounded-lg overflow-hidden">
                  <div className="bg-red-50 px-3 py-2 text-xs font-medium text-red-700 border-b border-red-200">
                    Errors found
                  </div>
                  <table className="w-full text-xs">
                    <tbody>
                      {entries.map((e, i) => e.error && (
                        <tr key={i} className="border-b border-red-100 last:border-b-0">
                          <td className="px-3 py-1.5 text-foreground-muted">Row {i + 1}</td>
                          <td className="px-3 py-1.5 font-mono">{e.date || '—'}</td>
                          <td className="px-3 py-1.5 font-mono">{e.reference || '—'}</td>
                          <td className="px-3 py-1.5 text-red-700">{e.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}

          {step === 'preview' && (
            <>
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {validEntries.length} passage{validEntries.length === 1 ? '' : 's'} ready to upload for
                <strong className="mx-1">{name}</strong>
              </div>

              <div className="border border-card-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-card-border">
                      <th className="text-left px-3 py-2 font-medium text-foreground-muted">Date</th>
                      <th className="text-left px-3 py-2 font-medium text-foreground-muted">Reference</th>
                      <th className="text-left px-3 py-2 font-medium text-foreground-muted">Theme</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validEntries.map((e, i) => (
                      <tr key={i} className="border-b border-card-border last:border-b-0">
                        <td className="px-3 py-1.5 font-mono text-xs">{e.date}</td>
                        <td className="px-3 py-1.5">{e.reference}</td>
                        <td className="px-3 py-1.5 text-foreground-muted">{e.theme || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}

          {step === 'conflicts' && (
            <>
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">
                    {conflicts.length} date{conflicts.length === 1 ? '' : 's'} already have a passage from another series.
                  </p>
                  <p className="text-xs">
                    Overwriting will remove those rows from the other series (that series will shrink).
                    Cancel to adjust your CSV and try again.
                  </p>
                </div>
              </div>

              <div className="border border-card-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-card-border">
                      <th className="text-left px-3 py-2 font-medium text-foreground-muted">Date</th>
                      <th className="text-left px-3 py-2 font-medium text-foreground-muted">Currently belongs to</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conflicts.map((c, i) => (
                      <tr key={i} className="border-b border-card-border last:border-b-0">
                        <td className="px-3 py-1.5 font-mono text-xs">{c.date}</td>
                        <td className="px-3 py-1.5">{c.series_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-card-border bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-3 py-1.5 rounded-lg text-sm text-foreground-muted hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>

          {step === 'input' && (
            <button
              onClick={goToPreview}
              className="px-4 py-1.5 rounded-lg text-sm bg-navy text-white hover:bg-navy/90"
            >
              Preview
            </button>
          )}

          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('input')}
                disabled={submitting}
                className="px-3 py-1.5 rounded-lg text-sm text-foreground-muted hover:bg-gray-200 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={() => submit(false)}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm bg-navy text-white hover:bg-navy/90 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {isReplace ? 'Replace' : 'Upload'}
              </button>
            </>
          )}

          {step === 'conflicts' && (
            <>
              <button
                onClick={() => setStep('input')}
                disabled={submitting}
                className="px-3 py-1.5 rounded-lg text-sm text-foreground-muted hover:bg-gray-200 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={() => submit(true)}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Overwrite & Continue
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
