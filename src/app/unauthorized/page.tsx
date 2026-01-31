'use client';

import Link from 'next/link';
import { ShieldX } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-navy mb-2">
          Access Denied
        </h1>

        <p className="text-foreground-muted mb-6">
          You don&apos;t have permission to access this page. This might be because:
        </p>

        <ul className="text-left text-foreground-muted mb-8 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-gold">•</span>
            <span>You&apos;re not logged in</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold">•</span>
            <span>Your account doesn&apos;t have the required role</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold">•</span>
            <span>You&apos;re trying to access a resource from another church</span>
          </li>
        </ul>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="btn-primary"
          >
            Log In
          </Link>
          <Link
            href="/"
            className="btn-secondary"
          >
            Go Home
          </Link>
        </div>

        <p className="mt-8 text-sm text-foreground-muted">
          If you believe this is an error, please{' '}
          <a href="mailto:travis@arkidentity.com" className="text-teal hover:text-teal-light">
            contact support
          </a>
          .
        </p>
      </div>
    </div>
  );
}
