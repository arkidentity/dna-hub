'use client';

import { useState, useEffect, useCallback } from 'react';
import { Upload, Download, Trash2, Calendar, AlertCircle, Loader2, FileText } from 'lucide-react';
import UploadSeriesModal from './UploadSeriesModal';

interface Series {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  row_count: number;
  created_at: string;
}

interface PassagePlanTabProps {
  churchId: string;
}

function seriesStatus(s: Series): 'past' | 'active' | 'upcoming' {
  const today = new Date().toISOString().slice(0, 10);
  if (s.end_date < today) return 'past';
  if (s.start_date > today) return 'upcoming';
  return 'active';
}

function formatRange(start: string, end: string): string {
  const fmt = (d: string) => {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function PassagePlanTab({ churchId }: PassagePlanTabProps) {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [replaceSeriesId, setReplaceSeriesId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSeries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/passage-plan?church_id=${churchId}`);
      if (!res.ok) throw new Error('Failed to fetch series');
      const data = await res.json();
      setSeries(data.series || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load series');
    } finally {
      setLoading(false);
    }
  }, [churchId]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const downloadTemplate = () => {
    const csv = [
      'date,reference,theme',
      '2026-04-20,Acts 1:8,Acts Series Week 1',
      '2026-04-21,Acts 2:1-4,Acts Series Week 1',
      '2026-04-22,Acts 2:37-41,Acts Series Week 1',
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'passage-plan-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteSeries = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its passages? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/passage-plan/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSeries(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete series');
    }
  };

  const activeCount = series.filter(s => seriesStatus(s) === 'active').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h2 className="font-semibold text-navy mb-1">Custom Passage Plans</h2>
          <p className="text-sm text-foreground-muted">
            Upload your own curated series (sermon series, Easter week, Advent) to override the
            global Passage of the Day. Days without a custom passage fall back to the global curated passage.
            Enable the feature toggle under Branding first.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-foreground-muted hover:bg-gray-200"
          >
            <Download className="w-3.5 h-3.5" />
            Template
          </button>
          <button
            onClick={() => { setReplaceSeriesId(null); setUploadOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-navy text-white hover:bg-navy/90"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Series
          </button>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center gap-2">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>
            {activeCount} {activeCount === 1 ? 'series is' : 'series are'} live now — disciples on this subdomain
            will see custom passages whenever a row covers today&apos;s date.
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-foreground-muted">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading series...
        </div>
      ) : series.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-base font-medium text-navy mb-1">No custom series yet</p>
          <p className="text-sm text-foreground-muted mb-4">
            Upload a CSV to override the global Passage of the Day on specific dates.
          </p>
          <button
            onClick={() => { setReplaceSeriesId(null); setUploadOpen(true); }}
            className="px-4 py-2 rounded-lg bg-navy text-white text-sm hover:bg-navy/90"
          >
            Upload your first series
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {series.map((s) => {
            const status = seriesStatus(s);
            const statusLabel = status === 'active' ? 'Active now' : status === 'upcoming' ? 'Upcoming' : 'Past';
            const statusClass =
              status === 'active' ? 'bg-green-100 text-green-700'
              : status === 'upcoming' ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600';

            return (
              <div key={s.id} className="border border-card-border rounded-xl p-4 bg-card hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium text-navy truncate">{s.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                    {s.description && (
                      <p className="text-xs text-foreground-muted mb-1">{s.description}</p>
                    )}
                    <p className="text-xs text-foreground-muted">
                      {formatRange(s.start_date, s.end_date)} · {s.row_count} {s.row_count === 1 ? 'passage' : 'passages'}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => { setReplaceSeriesId(s.id); setUploadOpen(true); }}
                      className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 text-foreground-muted hover:bg-gray-200"
                      title="Replace all entries by uploading a new CSV"
                    >
                      Replace CSV
                    </button>
                    <button
                      onClick={() => deleteSeries(s.id, s.name)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-red-50 text-red-700 hover:bg-red-100 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {uploadOpen && (
        <UploadSeriesModal
          churchId={churchId}
          replaceSeriesId={replaceSeriesId}
          onClose={() => setUploadOpen(false)}
          onSuccess={() => {
            setUploadOpen(false);
            fetchSeries();
          }}
        />
      )}
    </div>
  );
}
