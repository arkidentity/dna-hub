/**
 * DNA HQ Church Utilities
 *
 * "Independent" DNA leaders don't exist — everyone belongs to a church.
 * Leaders with no specific church affiliation are assigned to the DNA
 * Discipleship HQ church so they get cohort access and group management.
 *
 * Resolution order:
 *   1. DNA_HQ_CHURCH_ID env var (fastest, set in .env.local / Vercel)
 *   2. DB lookup by name ILIKE 'DNA Discipleship%' (fallback for cold starts)
 */

import { getSupabaseAdmin } from './auth';

// Module-level cache — survives across requests in long-running servers / dev.
// In Vercel serverless, this resets per cold start, so env var is preferred.
let _cachedId: string | null | undefined = undefined;

export async function getDnaHqChurchId(): Promise<string | null> {
  // 1. Env var — set this in .env.local / Vercel dashboard
  if (process.env.DNA_HQ_CHURCH_ID) {
    return process.env.DNA_HQ_CHURCH_ID;
  }

  // 2. Return cached value from a prior DB lookup this session
  if (_cachedId !== undefined) {
    return _cachedId;
  }

  // 3. Look up by name
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('churches')
      .select('id')
      .ilike('name', 'DNA Discipleship%')
      .limit(1)
      .maybeSingle();

    _cachedId = data?.id ?? null;
  } catch {
    console.error('[DNA HQ] Failed to look up DNA HQ church ID');
    _cachedId = null;
  }

  return _cachedId ?? null;
}
