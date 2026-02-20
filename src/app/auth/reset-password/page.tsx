'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { createClientSupabase } from '@/lib/supabase';

function ResetPasswordContent() {
  const router = useRouter();
  const supabase = createClientSupabase();

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.replace('/dashboard'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-6">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-navy mb-4">Password Updated</h1>
          <p className="text-foreground-muted">
            Your password has been updated. Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="card">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-4">
            <Lock className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-2xl font-bold text-navy mb-2">Set New Password</h1>
          <p className="text-foreground-muted">
            Enter your new password below.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="password" className="block text-navy font-medium mb-2 text-sm">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={6}
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
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
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
          <ResetPasswordContent />
        </Suspense>
      </main>
    </div>
  );
}
