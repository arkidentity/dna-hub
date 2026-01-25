'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [devLink, setDevLink] = useState('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'invalid') {
      setError('Invalid login link. Please request a new one.');
    } else if (errorParam === 'expired') {
      setError('Your login link has expired. Please request a new one.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send login link');
      }

      setSent(true);

      // In development, show the link directly
      if (data.devLink) {
        setDevLink(data.devLink);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {sent ? (
        // Success state
        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-6">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-navy mb-4">Check Your Email</h1>
          <p className="text-foreground-muted mb-6">
            We&apos;ve sent a login link to <strong>{email}</strong>. Click the link to access your dashboard.
          </p>
          <p className="text-sm text-foreground-muted">
            Link expires in 7 days. Didn&apos;t receive it?{' '}
            <button
              onClick={() => setSent(false)}
              className="text-teal hover:text-teal-light"
            >
              Try again
            </button>
          </p>

          {/* Development only - show link directly */}
          {devLink && (
            <div className="mt-6 p-4 bg-background-secondary rounded-lg">
              <p className="text-sm text-foreground-muted mb-2">Development mode - direct link:</p>
              <a
                href={devLink}
                className="text-teal hover:text-teal-light break-all text-sm"
              >
                Click here to login
              </a>
            </div>
          )}
        </div>
      ) : (
        // Login form
        <div className="card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-4">
              <Mail className="w-8 h-8 text-gold" />
            </div>
            <h1 className="text-2xl font-bold text-navy mb-2">Dashboard Login</h1>
            <p className="text-foreground-muted">
              Enter your email to receive a secure login link.
            </p>
            <p className="text-xs text-foreground-muted mt-2">
              Works for church leaders and DNA group leaders.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-navy font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@yourchurch.org"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Login Link'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-foreground-muted mt-6">
            Don&apos;t have access?{' '}
            <Link href="/onboarding" className="text-teal hover:text-teal-light">
              Start your church assessment
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-md mx-auto">
          <p className="text-gold font-medium text-sm tracking-wide">DNA HUB</p>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Suspense fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        }>
          <LoginContent />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="text-center text-foreground-muted py-6 border-t border-card-border">
        <p className="text-sm">
          Questions? Email{' '}
          <a href="mailto:travis@arkidentity.com" className="text-teal hover:text-teal-light">
            travis@arkidentity.com
          </a>
        </p>
      </footer>
    </div>
  );
}
