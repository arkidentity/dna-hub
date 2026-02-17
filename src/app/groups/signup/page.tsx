'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface InvitationData {
  id: string;
  name: string;
  email: string;
  church?: {
    id: string;
    name: string;
  } | null;
}

function DNALeaderSignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. Please check your email for the correct link.');
      setLoading(false);
      return;
    }

    async function verifyToken() {
      try {
        const response = await fetch(`/api/dna-leaders/verify-token?token=${token}`);
        const data = await response.json();

        if (!response.ok || data.error) {
          setError(data.error || 'Invalid or expired invitation');
          setLoading(false);
          return;
        }

        setInvitation(data.invitation);
        setName(data.invitation.name || '');
        setLoading(false);
      } catch (err) {
        console.error('Token verification error:', err);
        setError('Failed to verify invitation. Please try again.');
        setLoading(false);
      }
    }

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !invitation) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/dna-leaders/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: name.trim(),
          phone: phone.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || 'Failed to complete signup');
        setSubmitting(false);
        return;
      }

      // Redirect to DNA leader dashboard
      router.push('/groups?welcome=true');
    } catch (err) {
      console.error('Activation error:', err);
      setError('Failed to complete signup. Please try again.');
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
          <p className="mt-4 text-navy">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact the person who invited you or email{' '}
            <a href="mailto:info@dnadiscipleship.com" className="text-teal hover:underline">
              info@dnadiscipleship.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Signup form
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">Welcome to DNA</h1>
          <p className="text-gray-600">Complete your signup to start leading discipleship groups</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Church affiliation badge */}
          {invitation?.church && (
            <div className="bg-navy/5 rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-gray-600">You&apos;re joining as a DNA leader at</p>
              <p className="text-lg font-semibold text-navy">{invitation.church.name}</p>
            </div>
          )}

          {!invitation?.church && (
            <div className="bg-teal/10 rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-teal">You&apos;re joining as an independent DNA leader</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-700 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-navy mb-2">
                Your Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                placeholder="John Smith"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={invitation?.email || ''}
                readOnly
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">This is the email your invitation was sent to</p>
            </div>

            {/* Phone (optional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-navy mb-2">
                Phone Number <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                placeholder="(555) 123-4567"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full bg-gold hover:bg-gold/90 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Setting up your account...' : 'Complete Signup'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            By signing up, you agree to lead with integrity and follow the DNA discipleship principles.
          </p>
        </div>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function SignupLoading() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
        <p className="mt-4 text-navy">Loading...</p>
      </div>
    </div>
  );
}

// Main export wrapped in Suspense
export default function DNALeaderSignupPage() {
  return (
    <Suspense fallback={<SignupLoading />}>
      <DNALeaderSignupContent />
    </Suspense>
  );
}
