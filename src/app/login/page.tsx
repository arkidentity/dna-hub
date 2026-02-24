'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { createClientSupabase } from '@/lib/supabase';

type Mode = 'signin' | 'setup' | 'reset';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientSupabase();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace('/dashboard');
      } else {
        setCheckingSession(false);
      }
    });
  }, [supabase, router]);

  // Handle URL error params (from old magic link redirects)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'invalid' || errorParam === 'expired' || errorParam === 'used') {
      setError('Your login link has expired. Please sign in with your password or Google account.');
    }
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        // If user doesn't exist in auth, guide them
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. If this is your first time, click "Set up password" below.');
        } else {
          setError(error.message);
        }
        return;
      }

      // Stamp last_login_at (fire and forget — don't block redirect)
      fetch('/api/auth/session-start', { method: 'POST' }).catch(() => {});

      // Success — redirect based on roles
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      // All leader accounts are pre-created by admins (email_confirm: true).
      // Do NOT call signUp() — it triggers a Supabase confirmation email loop
      // for already-existing accounts. Use resetPasswordForEmail() instead:
      // it sends a "set your password" link to /auth/reset-password, no confirmation needed.
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        { redirectTo: `${window.location.origin}/auth/reset-password` }
      );

      if (error) {
        setError(error.message);
        return;
      }

      setMessage("We've sent you a password setup link. Check your email and click the link to create your password.");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        { redirectTo: `${window.location.origin}/auth/reset-password` }
      );

      if (error) {
        setError(error.message);
        return;
      }

      setMessage('Check your email for a password reset link.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setError(error.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="card">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-4">
            {mode === 'setup' ? (
              <UserPlus className="w-8 h-8 text-gold" />
            ) : (
              <LogIn className="w-8 h-8 text-gold" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-navy mb-2">
            {mode === 'signin' && 'Sign In'}
            {mode === 'setup' && 'Set Up Your Password'}
            {mode === 'reset' && 'Reset Password'}
          </h1>
          <p className="text-foreground-muted">
            {mode === 'signin' && 'Sign in with your email and password, or use Google.'}
            {mode === 'setup' && "Enter your email and we'll send you a link to create your password."}
            {mode === 'reset' && 'Enter your email to receive a password reset link.'}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        {message && (
          <div className="flex items-start gap-3 bg-success/10 border border-success text-success px-4 py-3 rounded-lg mb-6">
            <p className="text-sm">{message}</p>
          </div>
        )}

        {/* Google OAuth — always visible in signin and setup modes */}
        {mode !== 'reset' && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 border border-card-border rounded-lg py-3 px-4 text-navy font-medium hover:bg-background-secondary transition-colors mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 border-t border-card-border" />
              <span className="text-xs text-foreground-muted uppercase tracking-wider">or</span>
              <div className="flex-1 border-t border-card-border" />
            </div>
          </>
        )}

        {/* Email/Password form */}
        <form onSubmit={
          mode === 'signin' ? handleSignIn :
          mode === 'setup' ? handleSetupPassword :
          handleResetPassword
        }>
          <div className="mb-4">
            <label htmlFor="email" className="block text-navy font-medium mb-2 text-sm">
              Email
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

          {mode === 'signin' && (
            <div className="mb-6">
              <label htmlFor="password" className="block text-navy font-medium mb-2 text-sm">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Please wait...
              </>
            ) : (
              mode === 'signin' ? 'Sign In' :
              mode === 'setup' ? 'Send Setup Link' :
              'Send Reset Link'
            )}
          </button>
        </form>

        {/* Mode toggles */}
        <div className="mt-5 text-center text-sm space-y-2">
          {mode === 'signin' && (
            <>
              <div>
                <button
                  onClick={() => { setMode('setup'); setError(''); setMessage(''); }}
                  className="text-teal hover:text-teal-light"
                >
                  First time? Set up your password
                </button>
              </div>
              <div>
                <button
                  onClick={() => { setMode('reset'); setError(''); setMessage(''); }}
                  className="text-foreground-muted hover:text-navy"
                >
                  Forgot password?
                </button>
              </div>
            </>
          )}
          {mode === 'setup' && (
            <div>
              <button
                onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
                className="text-foreground-muted hover:text-navy"
              >
                Already have a password? Sign in
              </button>
            </div>
          )}
          {mode === 'reset' && (
            <div>
              <button
                onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
                className="text-foreground-muted hover:text-navy"
              >
                Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-sm text-foreground-muted mt-6">
        Don&apos;t have access?{' '}
        <Link href="/onboarding" className="text-teal hover:text-teal-light">
          Start your church assessment
        </Link>
      </p>
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
          <a href="mailto:info@dnadiscipleship.com" className="text-teal hover:text-teal-light">
            info@dnadiscipleship.com
          </a>
        </p>
      </footer>
    </div>
  );
}
