'use client';

import { useState, useRef } from 'react';
import { X, Calendar, Clock, MapPin, Loader2, RefreshCw } from 'lucide-react';

interface EventModalProps {
  groupId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EventModal({ groupId, onClose, onSuccess }: EventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    time: '',
    duration: '60',
    is_recurring: false,
    frequency: 'weekly' as 'weekly' | 'biweekly' | 'monthly',
    end_date: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSaving(true);
    setError(null);

    try {
      // Combine date + time
      const startTime = new Date(`${formData.date}T${formData.time}`);
      const endTime = new Date(startTime.getTime() + parseInt(formData.duration) * 60000);

      const payload: any = {
        title: formData.title,
        description: formData.description || null,
        location: formData.location || null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        event_type: 'group_meeting',
        group_id: groupId,
        is_recurring: formData.is_recurring,
      };

      if (formData.is_recurring && formData.end_date) {
        payload.recurrence_pattern = {
          frequency: formData.frequency,
          interval: 1,
          end_date: formData.end_date,
        };
      }

      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create event');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Create event error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setSaving(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-card-border px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-navy flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal" />
            Schedule Meeting
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-navy transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-error">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">
              Event Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="input w-full"
              placeholder="Weekly DNA Group Meeting"
              required
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-navy mb-2">
                Date <span className="text-error">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-2">
                Time <span className="text-error">*</span>
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="input w-full"
                required
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">Duration</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              className="input w-full"
            >
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="input w-full"
              placeholder="Coffee shop, church, online..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input w-full"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          {/* Recurring Toggle */}
          <div className="border-t border-card-border pt-4">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="is_recurring"
                checked={formData.is_recurring}
                onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
                className="w-4 h-4 text-gold focus:ring-gold border-gray-300 rounded"
              />
              <label htmlFor="is_recurring" className="text-sm font-medium text-navy flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Repeat weekly
              </label>
            </div>

            {formData.is_recurring && (
              <div className="ml-7 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-navy mb-2">Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))}
                    className="input w-full"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Every 2 weeks</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-2">
                    Repeat Until <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="input w-full"
                    required={formData.is_recurring}
                    min={formData.date}
                  />
                  <p className="text-xs text-foreground-muted mt-1">
                    Events will be created up to this date
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-card-border">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>Schedule Event</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
