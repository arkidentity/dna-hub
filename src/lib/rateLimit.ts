/**
 * Simple in-memory rate limiter for API routes.
 *
 * Usage in any API route:
 *   import { rateLimit } from '@/lib/rateLimit'
 *
 *   export async function POST(request: NextRequest) {
 *     const limited = rateLimit(request, { maxRequests: 10, windowMs: 60_000 })
 *     if (limited) return limited
 *     // ... handler logic
 *   }
 *
 * Limitations: in-memory only — resets on cold start, not shared across
 * Vercel serverless instances. Good enough to stop casual abuse.
 * For production-grade limiting, swap to Upstash Redis.
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Cleanup stale entries every 60s to prevent memory leaks
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

function getKey(request: NextRequest, prefix: string): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  return `${prefix}:${ip}`;
}

/**
 * Returns a 429 response if rate limit is exceeded, or null if OK.
 */
export function rateLimit(
  request: NextRequest,
  options: RateLimitOptions = { maxRequests: 30, windowMs: 60_000 }
): NextResponse | null {
  cleanup();

  const path = new URL(request.url).pathname;
  const key = getKey(request, path);
  const now = Date.now();

  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  existing.count++;

  if (existing.count > options.maxRequests) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    );
  }

  return null;
}
