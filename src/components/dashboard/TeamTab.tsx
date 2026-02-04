'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
  Mail,
  CheckCircle,
  Send,
  Shield,
  GraduationCap,
} from 'lucide-react';

interface ChurchLeader {
  id: string;
  email: string;
  name: string | null;
  church_id: string;
  created_at: string;
  user_id: string | null;
}

interface TeamTabProps {
  churchId: string;
  churchName: string;
}

export default function TeamTab({ churchId, churchName }: TeamTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaders, setLeaders] = useState<ChurchLeader[]>([]);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Resend magic link state
  const [sendingLink, setSendingLink] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaders();
  }, [churchId]);

  const fetchLeaders = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/church-leaders/invite?church_id=${churchId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }

      const data = await response.json();
      setLeaders(data.leaders || []);
    } catch (err) {
      console.error('Error fetching team:', err);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);

    try {
      const response = await fetch('/api/admin/church-leaders/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inviteForm.name || undefined,
          email: inviteForm.email,
          church_id: churchId,
          message: inviteForm.message || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send invitation');
      }

      setInviteSuccess(true);
      setInviteForm({ name: '', email: '', message: '' });

      // Refresh data after a short delay
      setTimeout(() => {
        fetchLeaders();
        setShowInviteModal(false);
        setInviteSuccess(false);
      }, 2000);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleSendMagicLink = async (email: string) => {
    setSendingLink(email);
    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to send magic link');
      }

      alert(`Login link sent to ${email}`);
    } catch (error) {
      console.error('Magic link error:', error);
      alert('Failed to send login link');
    } finally {
      setSendingLink(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
        <p className="text-foreground-muted mb-4">{error}</p>
        <button
          onClick={fetchLeaders}
          className="btn-primary inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy flex items-center gap-2">
            <Users className="w-5 h-5 text-gold" />
            Your Team
          </h2>
          <p className="text-sm text-foreground-muted mt-1">
            {leaders.length} leader{leaders.length !== 1 ? 's' : ''} at {churchName}
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Invite Leader
        </button>
      </div>

      {/* Leaders List */}
      <div className="card">
        {leaders.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-foreground-muted">No team members yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Invite other leaders to help with DNA implementation
            </p>
          </div>
        ) : (
          <div className="divide-y divide-card-border">
            {leaders.map((leader) => (
              <div
                key={leader.id}
                className="py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center">
                    <span className="text-gold font-medium">
                      {(leader.name || leader.email)[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-navy">
                      {leader.name || 'Name not provided'}
                    </p>
                    <p className="text-sm text-foreground-muted flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {leader.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-foreground-muted">
                    Added {formatDate(leader.created_at)}
                  </span>
                  <button
                    onClick={() => handleSendMagicLink(leader.email)}
                    disabled={sendingLink === leader.email}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-teal hover:bg-teal/10 rounded transition-colors"
                    title="Send login link"
                  >
                    {sendingLink === leader.email ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    Send Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card bg-gold/5 border-gold/20">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-navy mb-1">What Leaders Can Do</h4>
              <ul className="text-sm text-foreground-muted space-y-1">
                <li>• Track DNA implementation progress</li>
                <li>• Access DNA Training materials</li>
                <li>• Create and manage DNA Groups</li>
                <li>• Invite additional church leaders</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="card bg-teal/5 border-teal/20">
          <div className="flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-navy mb-1">Invite DNA Group Leaders</h4>
              <p className="text-sm text-foreground-muted">
                Need to invite someone to just lead a DNA group? Use the DNA Groups tab to invite DNA leaders who don't need dashboard access.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-card-border">
              <h3 className="font-semibold text-navy">Invite Church Leader</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteError(null);
                  setInviteSuccess(false);
                  setInviteForm({ name: '', email: '', message: '' });
                }}
                className="p-1 text-foreground-muted hover:text-navy rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="p-6 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
                <h4 className="font-semibold text-navy mb-2">Invitation Sent!</h4>
                <p className="text-foreground-muted">
                  They'll receive an email with a link to log in and access the dashboard.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="p-4 space-y-4">
                <p className="text-sm text-foreground-muted">
                  Invite another leader to help manage DNA implementation at {churchName}.
                  They'll get full access to the dashboard, training, and groups.
                </p>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-input-border rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold"
                    placeholder="pastor@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-input-border rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold"
                    placeholder="Pastor John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">
                    Personal Message (optional)
                  </label>
                  <textarea
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                    className="w-full px-3 py-2 border border-input-border rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold resize-none"
                    placeholder="Looking forward to having you on the team!"
                    rows={3}
                  />
                </div>

                {inviteError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{inviteError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteError(null);
                      setInviteForm({ name: '', email: '', message: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-card-border text-foreground-muted rounded-lg hover:bg-background-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting || !inviteForm.email}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {inviting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Send Invite
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
