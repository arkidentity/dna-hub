'use client';

import { useState, useEffect } from 'react';
import {
  UserCircle,
  UserPlus,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  AlertCircle,
  Building2,
  PlayCircle,
  Mail,
  Phone,
  Link as LinkIcon,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';

interface Coach {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  booking_embed: string | null;
  user_id: string | null;
  church_count: number;
  demo_count: number;
  created_at: string;
}

type EditForm = {
  name: string;
  email: string;
  phone: string;
  booking_embed: string;
};

const emptyForm: EditForm = { name: '', email: '', phone: '', booking_embed: '' };

export default function CoachesTab() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add coach form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<EditForm>(emptyForm);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit state: coachId → current edit values
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(emptyForm);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCoaches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/coaches');
      if (!res.ok) throw new Error('Failed to load coaches');
      const data = await res.json();
      setCoaches(data.coaches ?? []);
    } catch {
      setError('Failed to load coaches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoaches();
  }, []);

  // ── Add ──────────────────────────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch('/api/admin/coaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name.trim(),
          email: addForm.email.trim() || null,
          phone: addForm.phone.trim() || null,
          booking_embed: addForm.booking_embed.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to create coach');
      }
      setAddForm(emptyForm);
      setShowAdd(false);
      await fetchCoaches();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to create coach');
    } finally {
      setAddLoading(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────────
  const startEdit = (coach: Coach) => {
    setEditingId(coach.id);
    setEditForm({
      name: coach.name,
      email: coach.email ?? '',
      phone: coach.phone ?? '',
      booking_embed: coach.booking_embed ?? '',
    });
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
    setEditError(null);
  };

  const handleSaveEdit = async (coachId: string) => {
    if (!editForm.name.trim()) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/coaches/${coachId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim() || null,
          phone: editForm.phone.trim() || null,
          booking_embed: editForm.booking_embed.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to update coach');
      }
      setEditingId(null);
      await fetchCoaches();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update coach');
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (coachId: string) => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/coaches/${coachId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete coach');
      setDeletingId(null);
      await fetchCoaches();
    } catch {
      // Keep confirmation open on error — user can try again
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-navy opacity-50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 py-8">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy">DNA Coaches</h2>
          <p className="text-sm text-foreground-muted mt-0.5">
            {coaches.length} {coaches.length === 1 ? 'coach' : 'coaches'} — manage contact info, booking links, and church assignments
          </p>
        </div>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy/90 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Coach
          </button>
        )}
      </div>

      {/* Add Coach Form */}
      {showAdd && (
        <div className="border border-gold/30 rounded-xl bg-gold/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-navy text-sm">New Coach</h3>
            <button onClick={() => { setShowAdd(false); setAddForm(emptyForm); setAddError(null); }}>
              <X className="w-4 h-4 text-foreground-muted hover:text-navy" />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Name *</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Coach name"
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-navy bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="coach@example.com"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-navy bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Phone</label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-navy bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1">Booking Embed / URL</label>
                <input
                  type="text"
                  value={addForm.booking_embed}
                  onChange={e => setAddForm(f => ({ ...f, booking_embed: e.target.value }))}
                  placeholder="Calendly URL or iframe code"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-navy bg-white"
                />
              </div>
            </div>
            {addForm.email && (
              <p className="text-xs text-teal bg-teal/5 border border-teal/20 rounded-lg px-3 py-2">
                A login account will be automatically created for this email address.
              </p>
            )}
            {addError && (
              <p className="text-xs text-red-600">{addError}</p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={addLoading || !addForm.name.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {addLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Create Coach
              </button>
              <button
                type="button"
                onClick={() => { setShowAdd(false); setAddForm(emptyForm); setAddError(null); }}
                className="px-4 py-2 text-sm text-foreground-muted hover:text-navy transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coach Cards */}
      {coaches.length === 0 ? (
        <div className="text-center py-12 text-foreground-muted">
          <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No coaches yet. Add your first DNA coach above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {coaches.map(coach => (
            <CoachCard
              key={coach.id}
              coach={coach}
              isEditing={editingId === coach.id}
              editForm={editForm}
              editLoading={editLoading}
              editError={editError}
              isDeleting={deletingId === coach.id}
              deleteLoading={deleteLoading}
              onStartEdit={() => startEdit(coach)}
              onCancelEdit={cancelEdit}
              onEditFormChange={setEditForm}
              onSaveEdit={() => handleSaveEdit(coach.id)}
              onStartDelete={() => setDeletingId(coach.id)}
              onCancelDelete={() => setDeletingId(null)}
              onConfirmDelete={() => handleDelete(coach.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Coach Card ──────────────────────────────────────────────────────────────────

interface CoachCardProps {
  coach: Coach;
  isEditing: boolean;
  editForm: EditForm;
  editLoading: boolean;
  editError: string | null;
  isDeleting: boolean;
  deleteLoading: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onEditFormChange: (form: EditForm) => void;
  onSaveEdit: () => void;
  onStartDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

function CoachCard({
  coach,
  isEditing,
  editForm,
  editLoading,
  editError,
  isDeleting,
  deleteLoading,
  onStartEdit,
  onCancelEdit,
  onEditFormChange,
  onSaveEdit,
  onStartDelete,
  onCancelDelete,
  onConfirmDelete,
}: CoachCardProps) {
  const isLinked = !!coach.user_id;

  if (isEditing) {
    return (
      <div className="border border-navy/20 rounded-xl bg-navy/3 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-navy">Editing: {coach.name}</span>
          <button onClick={onCancelEdit}>
            <X className="w-4 h-4 text-foreground-muted hover:text-navy" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-navy mb-1">Name *</label>
            <input
              type="text"
              value={editForm.name}
              onChange={e => onEditFormChange({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-navy bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy mb-1">Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={e => onEditFormChange({ ...editForm, email: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-navy bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy mb-1">Phone</label>
            <input
              type="tel"
              value={editForm.phone}
              onChange={e => onEditFormChange({ ...editForm, phone: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-navy bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy mb-1">Booking Embed / URL</label>
            <input
              type="text"
              value={editForm.booking_embed}
              onChange={e => onEditFormChange({ ...editForm, booking_embed: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-navy bg-white"
            />
          </div>
        </div>
        {editError && <p className="text-xs text-red-600">{editError}</p>}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onSaveEdit}
            disabled={editLoading || !editForm.name.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-navy text-white text-xs font-medium rounded-lg hover:bg-navy/90 disabled:opacity-50 transition-colors"
          >
            {editLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Save
          </button>
          <button
            onClick={onCancelEdit}
            className="px-3 py-1.5 text-xs text-foreground-muted hover:text-navy transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (isDeleting) {
    return (
      <div className="border border-red-200 rounded-xl bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-700 mb-1">Delete {coach.name}?</p>
        <p className="text-xs text-red-600 mb-3">
          This will unassign this coach from{' '}
          <strong>{coach.church_count} {coach.church_count === 1 ? 'church' : 'churches'}</strong>.
          Their login account will not be deleted.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirmDelete}
            disabled={deleteLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleteLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Delete
          </button>
          <button
            onClick={onCancelDelete}
            className="px-3 py-1.5 text-xs text-foreground-muted hover:text-navy transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-100 rounded-xl bg-white p-4 hover:border-navy/20 transition-colors">
      {/* Card header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
            <UserCircle className="w-5 h-5 text-navy/60" />
          </div>
          <div>
            <p className="font-semibold text-navy text-sm">{coach.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isLinked ? (
                <span className="flex items-center gap-1 text-xs text-teal">
                  <ShieldCheck className="w-3 h-3" />
                  Account linked
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <ShieldOff className="w-3 h-3" />
                  No account
                  {coach.email && <span className="text-foreground-muted"> — save to create</span>}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onStartEdit}
            className="p-1.5 rounded-lg text-foreground-muted hover:text-navy hover:bg-gray-50 transition-colors"
            title="Edit coach"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onStartDelete}
            className="p-1.5 rounded-lg text-foreground-muted hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete coach"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Contact info */}
      <div className="mt-3 space-y-1.5">
        {coach.email && (
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            <a href={`mailto:${coach.email}`} className="hover:text-navy transition-colors truncate">
              {coach.email}
            </a>
          </div>
        )}
        {coach.phone && (
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
            <a href={`tel:${coach.phone}`} className="hover:text-navy transition-colors">
              {coach.phone}
            </a>
          </div>
        )}
        {coach.booking_embed && (
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate" title={coach.booking_embed}>
              {coach.booking_embed.startsWith('<') ? 'Booking embed (iframe)' : coach.booking_embed}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs">
          <Building2 className="w-3.5 h-3.5 text-navy/50" />
          <span className="font-semibold text-navy">{coach.church_count}</span>
          <span className="text-foreground-muted">{coach.church_count === 1 ? 'church' : 'churches'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <PlayCircle className="w-3.5 h-3.5 text-gold/70" />
          <span className="font-semibold text-navy">{coach.demo_count}</span>
          <span className="text-foreground-muted">{coach.demo_count === 1 ? 'demo enabled' : 'demos enabled'}</span>
        </div>
      </div>
    </div>
  );
}
