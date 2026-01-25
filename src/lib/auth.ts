import { cookies } from 'next/headers';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Fallback admin emails (used if database query fails)
const FALLBACK_ADMIN_EMAILS = ['thearkidentity@gmail.com', 'travis@arkidentity.com'];

// Cache for admin status to avoid repeated DB queries
const adminCache = new Map<string, { isAdmin: boolean; role: string | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Synchronous check (uses cache or fallback)
export function isAdmin(email: string): boolean {
  const normalizedEmail = email.toLowerCase();
  const cached = adminCache.get(normalizedEmail);

  // Return cached value if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.isAdmin;
  }

  // Fallback to hardcoded list (async check will update cache)
  return FALLBACK_ADMIN_EMAILS.includes(normalizedEmail);
}

// Async check against database (updates cache)
export async function checkAdminStatus(email: string): Promise<{ isAdmin: boolean; role: string | null }> {
  const normalizedEmail = email.toLowerCase();

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('admin_users')
      .select('role, is_active')
      .eq('email', normalizedEmail)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      // Check fallback list
      const isFallbackAdmin = FALLBACK_ADMIN_EMAILS.includes(normalizedEmail);
      adminCache.set(normalizedEmail, {
        isAdmin: isFallbackAdmin,
        role: isFallbackAdmin ? 'super_admin' : null,
        timestamp: Date.now()
      });
      return { isAdmin: isFallbackAdmin, role: isFallbackAdmin ? 'super_admin' : null };
    }

    adminCache.set(normalizedEmail, {
      isAdmin: true,
      role: data.role,
      timestamp: Date.now()
    });
    return { isAdmin: true, role: data.role };
  } catch (err) {
    console.error('Error checking admin status:', err);
    // Fallback to hardcoded list
    const isFallbackAdmin = FALLBACK_ADMIN_EMAILS.includes(normalizedEmail);
    return { isAdmin: isFallbackAdmin, role: isFallbackAdmin ? 'super_admin' : null };
  }
}

// Get admin role (for RBAC - future use)
export async function getAdminRole(email: string): Promise<string | null> {
  const { role } = await checkAdminStatus(email);
  return role;
}

// Create client lazily to avoid build-time errors when env vars aren't set
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return _supabaseAdmin;
}

// Export for backward compatibility
export const supabaseAdmin = {
  from: (table: string) => getSupabaseAdmin().from(table),
};

// Generate a secure random token
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create a magic link token for a leader
export async function createMagicLinkToken(leaderId: string): Promise<string | null> {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

  const { error } = await supabaseAdmin.from('magic_link_tokens').insert({
    leader_id: leaderId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error('Failed to create magic link token:', error);
    return null;
  }

  return token;
}

// Verify a magic link token and get the leader
export async function verifyMagicLinkToken(token: string) {
  const { data, error } = await supabaseAdmin
    .from('magic_link_tokens')
    .select(`
      *,
      leader:church_leaders(
        *,
        church:churches(*)
      )
    `)
    .eq('token', token)
    .eq('used', false)
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid or expired token' };
  }

  // Check expiration
  if (new Date(data.expires_at) < new Date()) {
    return { valid: false, error: 'Token has expired' };
  }

  // Mark token as used
  await supabaseAdmin
    .from('magic_link_tokens')
    .update({ used: true })
    .eq('id', data.id);

  return {
    valid: true,
    leader: data.leader,
  };
}

// Session management using cookies
const SESSION_COOKIE_NAME = 'dna_session';

export async function createSession(leaderId: string, churchId: string) {
  const sessionToken = generateToken();

  // Store session in cookie (httpOnly for security)
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify({
    token: sessionToken,
    leaderId,
    churchId,
    createdAt: Date.now(),
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return sessionToken;
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie) {
      return null;
    }

    const session = JSON.parse(sessionCookie.value);

    // Verify the leader still exists and is associated with the church
    const { data: leader } = await supabaseAdmin
      .from('church_leaders')
      .select(`
        *,
        church:churches(*)
      `)
      .eq('id', session.leaderId)
      .single();

    if (!leader) {
      return null;
    }

    return {
      leader,
      church: leader.church,
    };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Get leader by email
export async function getLeaderByEmail(email: string) {
  console.log('[AUTH] getLeaderByEmail called with:', email.toLowerCase());

  const { data, error } = await supabaseAdmin
    .from('church_leaders')
    .select(`
      *,
      church:churches(*)
    `)
    .eq('email', email.toLowerCase())
    .single();

  if (error) {
    console.error('[AUTH] Supabase error in getLeaderByEmail:', JSON.stringify(error));
    return null;
  }

  console.log('[AUTH] Found leader:', data?.name, '| Church:', data?.church?.name);
  return data;
}

// ============================================================================
// DNA LEADER SESSION MANAGEMENT
// ============================================================================

const DNA_LEADER_SESSION_COOKIE_NAME = 'dna_leader_session';

// Create session for DNA leader
export async function createDNALeaderSession(leaderId: string, churchId: string | null) {
  const sessionToken = generateToken();

  const cookieStore = await cookies();
  cookieStore.set(DNA_LEADER_SESSION_COOKIE_NAME, JSON.stringify({
    token: sessionToken,
    leaderId,
    churchId,
    createdAt: Date.now(),
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return sessionToken;
}

// Get DNA leader session
export async function getDNALeaderSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(DNA_LEADER_SESSION_COOKIE_NAME);

    if (!sessionCookie) {
      return null;
    }

    const session = JSON.parse(sessionCookie.value);

    // Verify the DNA leader still exists and is active
    const { data: leader } = await supabaseAdmin
      .from('dna_leaders')
      .select(`
        *,
        church:churches(id, name, logo_url)
      `)
      .eq('id', session.leaderId)
      .eq('is_active', true)
      .single();

    if (!leader || !leader.activated_at) {
      return null;
    }

    return {
      leader,
      church: leader.church,
    };
  } catch {
    return null;
  }
}

// Clear DNA leader session
export async function clearDNALeaderSession() {
  const cookieStore = await cookies();
  cookieStore.delete(DNA_LEADER_SESSION_COOKIE_NAME);
}

// Get DNA leader by email
export async function getDNALeaderByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('dna_leaders')
    .select(`
      *,
      church:churches(id, name, logo_url)
    `)
    .eq('email', email.toLowerCase())
    .eq('is_active', true)
    .single();

  if (error) {
    return null;
  }

  return data;
}

// Create magic link token for DNA leader (for re-authentication)
export async function createDNALeaderMagicLinkToken(leaderId: string): Promise<string | null> {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

  // Store in dna_leaders table temporarily using signup_token field
  // (We could create a separate magic_link_tokens table for DNA leaders later)
  const { error } = await supabaseAdmin
    .from('dna_leaders')
    .update({
      signup_token: token,
      signup_token_expires_at: expiresAt.toISOString(),
    })
    .eq('id', leaderId);

  if (error) {
    console.error('Failed to create DNA leader magic link token:', error);
    return null;
  }

  return token;
}

// Verify DNA leader magic link token
export async function verifyDNALeaderMagicLinkToken(token: string) {
  const { data: leader, error } = await supabaseAdmin
    .from('dna_leaders')
    .select(`
      *,
      church:churches(id, name, logo_url)
    `)
    .eq('signup_token', token)
    .eq('is_active', true)
    .single();

  if (error || !leader) {
    return { valid: false, error: 'Invalid or expired token' };
  }

  // Check if activated (must have activated_at to log in)
  if (!leader.activated_at) {
    return { valid: false, error: 'Account not activated' };
  }

  // Check expiration
  if (leader.signup_token_expires_at && new Date(leader.signup_token_expires_at) < new Date()) {
    return { valid: false, error: 'Token has expired' };
  }

  // Clear the token after use
  await supabaseAdmin
    .from('dna_leaders')
    .update({
      signup_token: null,
      signup_token_expires_at: null,
    })
    .eq('id', leader.id);

  return {
    valid: true,
    leader,
  };
}
