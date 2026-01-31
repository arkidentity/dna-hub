'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/training/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Unable to connect. Please check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="training-page">
        <div className="training-container">
          <div className="training-card success-card">
            <div className="success-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1>Check Your Email</h1>
            <p className="success-message">
              We&apos;ve sent a login link to <strong>{email}</strong>
            </p>
            <p className="success-instructions">
              Click the link in the email to access your training dashboard and begin the Flow Assessment.
            </p>
            <div className="success-note">
              <p>Didn&apos;t receive it? Check your spam folder or <Link href="/login">request a new link</Link>.</p>
            </div>
          </div>
        </div>

        <style jsx>{`
          .training-page {
            min-height: 100vh;
            background: #1A2332;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }

          .training-container {
            width: 100%;
            max-width: 440px;
          }

          .training-card {
            background: #242D3D;
            border-radius: 16px;
            padding: 40px 32px;
          }

          .success-card {
            text-align: center;
          }

          .success-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 24px;
            color: #4A9E7F;
          }

          .success-icon svg {
            width: 100%;
            height: 100%;
          }

          h1 {
            color: #FFFFFF;
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 16px 0;
          }

          .success-message {
            color: #A0AEC0;
            font-size: 16px;
            margin: 0 0 8px 0;
          }

          .success-message strong {
            color: #D4A853;
          }

          .success-instructions {
            color: #718096;
            font-size: 14px;
            margin: 0 0 24px 0;
            line-height: 1.5;
          }

          .success-note {
            background: #1A2332;
            padding: 16px;
            border-radius: 8px;
          }

          .success-note p {
            color: #718096;
            font-size: 14px;
            margin: 0;
          }

          .success-note :global(a) {
            color: #D4A853;
            text-decoration: none;
          }

          .success-note :global(a:hover) {
            text-decoration: underline;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="training-page">
      <div className="training-container">
        <div className="training-header">
          <h1>DNA Training</h1>
          <p>Become a disciple who makes disciples</p>
        </div>

        <div className="training-card">
          <h2>Create Your Account</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Your Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                required
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
                autoComplete="email"
              />
            </div>

            {error && (
              <div className="error-message">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner" />
                  Creating Account...
                </>
              ) : (
                'Get Started'
              )}
            </button>
          </form>

          <div className="divider">
            <span>Already have an account?</span>
          </div>

          <Link href="/login" className="login-link">
            Log In
          </Link>
        </div>

        <div className="training-footer">
          <p>By signing up, you agree to receive emails about your DNA training journey.</p>
        </div>
      </div>

      <style jsx>{`
        .training-page {
          min-height: 100vh;
          background: #1A2332;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .training-container {
          width: 100%;
          max-width: 440px;
        }

        .training-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .training-header h1 {
          color: #D4A853;
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .training-header p {
          color: #A0AEC0;
          font-size: 16px;
          margin: 0;
        }

        .training-card {
          background: #242D3D;
          border-radius: 16px;
          padding: 32px;
        }

        .training-card h2 {
          color: #FFFFFF;
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 24px 0;
          text-align: center;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          color: #A0AEC0;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .form-group input {
          width: 100%;
          padding: 14px 16px;
          background: #1A2332;
          border: 2px solid #3D4A5C;
          border-radius: 8px;
          color: #FFFFFF;
          font-size: 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input::placeholder {
          color: #5A6577;
        }

        .form-group input:focus {
          outline: none;
          border-color: #D4A853;
          box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.1);
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #F87171;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .submit-btn {
          width: 100%;
          padding: 16px;
          background: #D4A853;
          border: none;
          border-radius: 8px;
          color: #1A2332;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .submit-btn:hover:not(:disabled) {
          background: #E5B964;
        }

        .submit-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid transparent;
          border-top-color: #1A2332;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .divider {
          display: flex;
          align-items: center;
          margin: 24px 0;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #3D4A5C;
        }

        .divider span {
          color: #5A6577;
          font-size: 14px;
          padding: 0 16px;
        }

        .login-link {
          display: block;
          width: 100%;
          padding: 14px;
          background: transparent;
          border: 2px solid #3D4A5C;
          border-radius: 8px;
          color: #A0AEC0;
          font-size: 16px;
          font-weight: 500;
          text-align: center;
          text-decoration: none;
          transition: border-color 0.2s, color 0.2s;
        }

        .login-link:hover {
          border-color: #D4A853;
          color: #D4A853;
        }

        .training-footer {
          text-align: center;
          margin-top: 24px;
        }

        .training-footer p {
          color: #5A6577;
          font-size: 12px;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
