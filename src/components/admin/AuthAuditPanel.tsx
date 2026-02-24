'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Wrench,
  Users,
  Mail,
} from 'lucide-react';

interface AuditUser {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
  created_at: string;
  hasAuthAccount: boolean;
  authEmailConfirmed: boolean;
}

interface AuditResult {
  summary: {
    totalUsers: number;
    withAuthAccount: number;
    missingAuthAccount: number;
    withoutRoles: number;
    unconfirmedEmail: number;
  };
  missingAuth: AuditUser[];
  noRoles: AuditUser[];
  unconfirmed: AuditUser[];
}

interface FixResult {
  fixed: number;
  failed: number;
  details: Array<{ email: string; status: 'fixed' | 'failed'; error?: string }>;
  recoveryLinks: Record<string, string>;
}

export default function AuthAuditPanel() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [fixResult, setFixResult] = useState<FixResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setFixResult(null);

    try {
      const res = await fetch('/api/admin/auth-audit');
      if (!res.ok) throw new Error('Audit failed');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audit failed');
    } finally {
      setLoading(false);
    }
  };

  const fixMissing = async (emails?: string[]) => {
    setFixing(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix_missing', emails }),
      });
      if (!res.ok) throw new Error('Fix failed');
      const data = await res.json();
      setFixResult(data);
      // Re-run audit to show updated state
      await runAudit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fix failed');
    } finally {
      setFixing(false);
    }
  };

  const allGood =
    result &&
    result.summary.missingAuthAccount === 0 &&
    result.summary.unconfirmedEmail === 0;

  const formatDate = (str: string) =>
    new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      {/* Trigger button — sits in admin header */}
      <button
        onClick={() => {
          setOpen(true);
          runAudit();
        }}
        className="p-2 text-gray-300 hover:text-white transition-colors"
        title="Auth Audit — check all users can log in"
      >
        <ShieldCheck className="w-5 h-5" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 pt-16 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-card-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-navy/10 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-navy" />
                </div>
                <div>
                  <h2 className="font-semibold text-navy">Auth Access Audit</h2>
                  <p className="text-xs text-foreground-muted">
                    Cross-checks every user against Supabase auth
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={runAudit}
                  disabled={loading}
                  className="p-1.5 text-foreground-muted hover:text-navy rounded transition-colors"
                  title="Re-run audit"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => { setOpen(false); setResult(null); setFixResult(null); }}
                  className="p-1.5 text-foreground-muted hover:text-navy rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center py-12 gap-3 text-foreground-muted">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Running audit…</span>
                </div>
              )}

              {/* Error */}
              {error && !loading && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Fix result banner */}
              {fixResult && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Fixed {fixResult.fixed} account{fixResult.fixed !== 1 ? 's' : ''}
                      {fixResult.failed > 0 && `, ${fixResult.failed} failed`}
                    </span>
                  </div>
                  {Object.keys(fixResult.recoveryLinks).length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-green-700 font-medium">
                        Password setup links (share these directly or send via email):
                      </p>
                      {Object.entries(fixResult.recoveryLinks).map(([email, link]) => (
                        <div key={email} className="text-xs bg-white border border-green-200 rounded p-2">
                          <p className="font-medium text-navy mb-1">{email}</p>
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal break-all hover:underline"
                          >
                            {link}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {result && !loading && (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-background-secondary rounded-lg">
                      <p className="text-2xl font-bold text-navy">{result.summary.totalUsers}</p>
                      <p className="text-xs text-foreground-muted mt-0.5">Total Users</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">{result.summary.withAuthAccount}</p>
                      <p className="text-xs text-foreground-muted mt-0.5">Have Login</p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${result.summary.missingAuthAccount > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                      <p className={`text-2xl font-bold ${result.summary.missingAuthAccount > 0 ? 'text-red-600' : 'text-green-700'}`}>
                        {result.summary.missingAuthAccount}
                      </p>
                      <p className="text-xs text-foreground-muted mt-0.5">No Login</p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${result.summary.unconfirmedEmail > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                      <p className={`text-2xl font-bold ${result.summary.unconfirmedEmail > 0 ? 'text-amber-600' : 'text-green-700'}`}>
                        {result.summary.unconfirmedEmail}
                      </p>
                      <p className="text-xs text-foreground-muted mt-0.5">Unconfirmed</p>
                    </div>
                  </div>

                  {/* All good */}
                  {allGood && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                      <p className="text-sm text-green-800 font-medium">
                        All {result.summary.totalUsers} users have valid Supabase auth accounts. Everyone can log in.
                      </p>
                    </div>
                  )}

                  {/* Missing auth accounts — critical */}
                  {result.missingAuth.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-red-500" />
                          <h3 className="font-medium text-navy text-sm">
                            No Auth Account ({result.missingAuth.length})
                          </h3>
                        </div>
                        <button
                          onClick={() => fixMissing()}
                          disabled={fixing}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {fixing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Wrench className="w-3 h-3" />
                          )}
                          Fix All
                        </button>
                      </div>
                      <p className="text-xs text-foreground-muted">
                        These users exist in your database but have no Supabase auth account — they cannot log in at all.
                        Click "Fix All" to create their accounts and generate password setup links.
                      </p>
                      <div className="divide-y divide-card-border border border-red-200 rounded-lg overflow-hidden">
                        {result.missingAuth.map((user) => (
                          <div key={user.id} className="flex items-center justify-between px-4 py-3 bg-red-50/50">
                            <div>
                              <p className="text-sm font-medium text-navy">{user.name || '(no name)'}</p>
                              <p className="text-xs text-foreground-muted flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </p>
                              {user.roles.length > 0 && (
                                <p className="text-xs text-foreground-muted mt-0.5">
                                  Roles: {user.roles.join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-foreground-muted">{formatDate(user.created_at)}</span>
                              <button
                                onClick={() => fixMissing([user.email])}
                                disabled={fixing}
                                className="text-xs px-2 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                Fix
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unconfirmed emails — warning */}
                  {result.unconfirmed.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <h3 className="font-medium text-navy text-sm">
                          Email Not Confirmed ({result.unconfirmed.length})
                        </h3>
                      </div>
                      <p className="text-xs text-foreground-muted">
                        These accounts exist in Supabase auth but the email isn't confirmed — password login won't work
                        until confirmed. Use "Send Login Link" to send them an OTP link that bypasses this.
                      </p>
                      <div className="divide-y divide-card-border border border-amber-200 rounded-lg overflow-hidden">
                        {result.unconfirmed.map((user) => (
                          <div key={user.id} className="flex items-center justify-between px-4 py-3 bg-amber-50/50">
                            <div>
                              <p className="text-sm font-medium text-navy">{user.name || '(no name)'}</p>
                              <p className="text-xs text-foreground-muted flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </p>
                            </div>
                            <span className="text-xs text-foreground-muted">{formatDate(user.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No roles — informational */}
                  {result.noRoles.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-foreground-muted" />
                        <h3 className="font-medium text-navy text-sm">
                          No Roles Assigned ({result.noRoles.length})
                        </h3>
                      </div>
                      <p className="text-xs text-foreground-muted">
                        These users can log in but won't see anything — they have no roles in user_roles.
                        Invite them as a church leader or DNA leader to give them access.
                      </p>
                      <div className="divide-y divide-card-border border border-card-border rounded-lg overflow-hidden">
                        {result.noRoles.map((user) => (
                          <div key={user.id} className="flex items-center justify-between px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-navy">{user.name || '(no name)'}</p>
                              <p className="text-xs text-foreground-muted flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </p>
                            </div>
                            <span className="text-xs text-foreground-muted">{formatDate(user.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
