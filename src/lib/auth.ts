import { cookies } from 'next/headers';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Admin email addresses - these users get edit access to dates and notes
const ADMIN_EMAILS = ['thearkidentity@gmail.com', 'travis@arkidentity.com'];

// Check if an email is an admin
export function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
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
