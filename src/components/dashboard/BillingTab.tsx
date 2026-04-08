'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  ExternalLink,
  Zap,
  ChevronRight,
  RefreshCw,
  Mail,
  Pencil,
} from 'lucide-react';

interface BillingStatus {
  church_id: string;
  status: 'free' | 'active' | 'past_due' | 'suspended' | 'canceled';
  plan_tier: string | null;
  monthly_amount_cents: number | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  suspended_at?: string | null;
  billing_email?: string | null;
}

interface BillingTabProps {
  churchId: string;
}

const TIERS = [
  {
    id: 'seed',
    name: 'Seed',
    price: 149,
    members: '1–250 members',
    description: 'Perfect for a growing church getting started with DNA.',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 299,
    members: '251–1,000 members',
    description: 'For a thriving church running regular live services.',
  },
  {
    id: 'thrive',
    name: 'Thrive',
    price: 599,
    members: '1,001–2,500 members',
    description: 'For a larger congregation with high engagement needs.',
  },
  {
    id: 'multiply',
    name: 'Multiply',
    price: 1099,
    members: '2,501–5,000 members',
    description: 'For a church movement reaching thousands every week.',
  },
];

const TIER_LABELS: Record<string, string> = {
  seed: 'DNA Seed',
  growth: 'DNA Growth',
  thrive: 'DNA Thrive',
  multiply: 'DNA Multiply',
  movement: 'DNA Movement',
  custom: 'Custom Plan',
};

function formatAmount(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function BillingTab({ churchId }: BillingTabProps) {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('seed');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // Post-checkout success state
  const [justUpgraded, setJustUpgraded] = useState(false);

  // Billing contact editing
  const [editingContact, setEditingContact] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState('');

  const fetchBilling = useCallback(async () => {
    try {
      setError('');
      const res = await fetch(`/api/billing/status?church_id=${churchId}`);
      if (!res.ok) throw new Error('Failed to load billing info');
      const { data } = await res.json();
      setBilling(data);
      setContactEmail(data.billing_email ?? '');
    } catch {
      setError('Could not load billing information.');
    } finally {
      setLoading(false);
    }
  }, [churchId]);

  useEffect(() => {
    fetchBilling();

    // Check for post-checkout redirect params
    const params = new URLSearchParams(window.location.search);
    if (params.get('billing') === 'success') {
      setJustUpgraded(true);
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('billing');
      window.history.replaceState({}, '', url.toString());
    }
  }, [fetchBilling]);

  const startCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ church_id: churchId, tier: selectedTier }),
      });
      const { url, error: apiError } = await res.json();
      if (apiError || !url) throw new Error(apiError || 'No checkout URL');
      window.location.href = url;
    } catch (e) {
      setCheckoutLoading(false);
      setError('Could not start checkout. Please try again.');
    }
  };

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch(`/api/billing/portal-session?church_id=${churchId}`);
      const { url, error: apiError } = await res.json();
      if (apiError || !url) throw new Error(apiError || 'No portal URL');
      window.location.href = url;
    } catch {
      setPortalLoading(false);
      setError('Could not open billing portal. Please try again.');
    }
  };

  const saveContact = async () => {
    setContactSaving(true);
    setContactError('');
    try {
      const res = await fetch('/api/billing/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ church_id: churchId, billing_email: contactEmail }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setBilling(prev => prev ? { ...prev, billing_email: contactEmail || null } : prev);
      setEditingContact(false);
    } catch {
      setContactError('Could not save. Please try again.');
    } finally {
      setContactSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  if (error && !billing) {
    return (
      <div className="max-w-lg">
        <div className="flex items-center gap-3 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button onClick={() => { setLoading(true); fetchBilling(); }} className="ml-auto text-sm underline flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const status = billing?.status || 'free';

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Post-upgrade success banner */}
      {justUpgraded && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-800">You're live!</p>
            <p className="text-sm text-green-700 mt-0.5">
              Your subscription is active. Live Service Mode is now enabled for your congregation.
            </p>
          </div>
        </div>
      )}

      {/* Past Due Warning */}
      {status === 'past_due' && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-300 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Payment failed</p>
            <p className="text-sm text-yellow-700 mt-0.5">
              We couldn't process your last payment. Update your payment method to keep your service active.
              Your access will continue during the grace period.
            </p>
          </div>
        </div>
      )}

      {/* Suspended Warning */}
      {status === 'suspended' && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Account suspended</p>
            <p className="text-sm text-red-700 mt-0.5">
              Your Live Service Mode has been paused. Update your payment method to restore full access immediately.
            </p>
          </div>
        </div>
      )}

      {/* Canceled */}
      {status === 'canceled' && (
        <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-700">Subscription ended</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Your subscription has been canceled. Select a plan below to reactivate.
            </p>
          </div>
        </div>
      )}

      {/* Free state — upgrade CTA */}
      {(status === 'free' || status === 'canceled') && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-navy">
                  {status === 'canceled' ? 'Reactivate your subscription' : 'Activate Live Service Mode'}
                </h2>
                <p className="text-sm text-foreground-muted mt-1">
                  Upgrade to run interactive live services with real-time polls, testimonies, creed pushes,
                  and a full congregation experience — all through Daily DNA.
                </p>
                <ul className="mt-3 space-y-1">
                  {['Live interactive services with real-time engagement', 'Prayer wall, testimony sharing, creed pushes', 'Guest QR entry — no app required', 'Display mode for projection screens'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground-muted">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Tier selector */}
          <div>
            <h3 className="text-sm font-semibold text-navy mb-3">Select your plan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TIERS.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    selectedTier === tier.id
                      ? 'border-gold bg-gold/5'
                      : 'border-card-border hover:border-gold/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-navy text-sm">{tier.name}</span>
                    {selectedTier === tier.id && (
                      <CheckCircle className="w-4 h-4 text-gold" />
                    )}
                  </div>
                  <div className="text-lg font-bold text-navy">${tier.price}<span className="text-sm font-normal text-foreground-muted">/mo</span></div>
                  <div className="text-xs text-foreground-muted mt-1">{tier.members}</div>
                  <div className="text-xs text-foreground-muted mt-1">{tier.description}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-foreground-muted mt-2">
              Not sure which tier? Pick the one that matches your current congregation size.
              Upgrades are easy — just reach out.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            onClick={startCheckout}
            disabled={checkoutLoading}
            className="btn-primary flex items-center gap-2"
          >
            {checkoutLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Starting checkout…</>
            ) : (
              <>Upgrade to {TIERS.find(t => t.id === selectedTier)?.name} <ChevronRight className="w-4 h-4" /></>
            )}
          </button>

          <p className="text-xs text-foreground-muted">
            Secure checkout via Stripe. Monthly billing, no annual commitment.
            Sales tax calculated automatically at checkout.
          </p>
        </div>
      )}

      {/* Active / Past Due / Suspended — show plan details */}
      {(status === 'active' || status === 'past_due' || status === 'suspended') && billing && (
        <div className="space-y-4">
          {/* Current plan card */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-foreground-muted" />
                  <span className="text-sm text-foreground-muted">Current Plan</span>
                </div>
                <h2 className="text-xl font-bold text-navy">
                  {billing.plan_tier ? TIER_LABELS[billing.plan_tier] ?? billing.plan_tier : 'Active Plan'}
                </h2>
                {billing.monthly_amount_cents != null && (
                  <p className="text-foreground-muted text-sm mt-0.5">
                    {formatAmount(billing.monthly_amount_cents)} / month
                  </p>
                )}
              </div>

              {/* Status badge */}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : status === 'past_due'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {status === 'active' && <CheckCircle className="w-3.5 h-3.5" />}
                {status === 'past_due' && <AlertTriangle className="w-3.5 h-3.5" />}
                {status === 'suspended' && <XCircle className="w-3.5 h-3.5" />}
                {status === 'active' ? 'Active' : status === 'past_due' ? 'Past Due' : 'Suspended'}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-card-border space-y-2">
              {billing.current_period_end && (
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">
                    {billing.cancel_at_period_end ? 'Cancels on' : 'Next billing'}
                  </span>
                  <span className={`font-medium ${billing.cancel_at_period_end ? 'text-red-600' : 'text-navy'}`}>
                    {formatDate(billing.current_period_end)}
                  </span>
                </div>
              )}
              {billing.cancel_at_period_end && (
                <p className="text-xs text-red-500">
                  Your subscription will not renew. Access continues until the date above.
                </p>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {/* Manage billing button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className={`flex items-center gap-2 ${
                status === 'active' ? 'btn-secondary' : 'btn-primary'
              }`}
            >
              {portalLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Opening…</>
              ) : (
                <>{status === 'active' ? 'Manage Billing' : 'Update Payment Method'} <ExternalLink className="w-4 h-4" /></>
              )}
            </button>
          </div>

          <p className="text-xs text-foreground-muted">
            Update your payment method, download invoices, and manage your billing details
            in the secure Stripe portal.
            To change your plan or cancel, reach out to{' '}
            <a href="mailto:info@dnadiscipleship.com" className="text-teal hover:underline">
              info@dnadiscipleship.com
            </a>.
          </p>
        </div>
      )}

      {/* Billing contact — shown for all states once billing row exists (or always for free too) */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-foreground-muted" />
            <span className="text-sm font-medium text-navy">Billing Contact</span>
          </div>
          {!editingContact && (
            <button
              onClick={() => { setEditingContact(true); setContactError(''); }}
              className="text-xs text-teal hover:underline flex items-center gap-1"
            >
              <Pencil className="w-3 h-3" />
              {billing?.billing_email ? 'Edit' : 'Add'}
            </button>
          )}
        </div>
        <p className="text-xs text-foreground-muted mb-3">
          Billing notifications (payment failures, renewal reminders) go to this address.
          Leave blank to use your account email.
        </p>

        {editingContact ? (
          <div className="space-y-2">
            <input
              type="email"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              placeholder="finance@yourchurch.com"
              className="w-full border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
            {contactError && <p className="text-xs text-red-600">{contactError}</p>}
            <div className="flex gap-2">
              <button
                onClick={saveContact}
                disabled={contactSaving}
                className="btn-primary text-sm py-1.5 flex items-center gap-1.5"
              >
                {contactSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save
              </button>
              <button
                onClick={() => { setEditingContact(false); setContactEmail(billing?.billing_email ?? ''); setContactError(''); }}
                className="btn-secondary text-sm py-1.5"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-navy">
            {billing?.billing_email ?? <span className="text-foreground-muted italic">Not set — using account email</span>}
          </p>
        )}
      </div>
    </div>
  );
}
