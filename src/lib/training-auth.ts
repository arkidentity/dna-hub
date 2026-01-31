/**
 * Unified Training Auth System
 *
 * Uses Supabase Auth for authentication with role-based access control.
 * Roles: dna_trainee → dna_leader → church_leader → admin
 *
 * This consolidates training and groups auth into one system.
 */

import { cookies } from 'next/headers';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Session cookie name (unified for all training/groups auth)
const SESSION_COOKIE_NAME = 'dna_training_session';

// Token expiry
const TOKEN_EXPIRY_HOURS = 24;
const SESSION_MAX_AGE_DAYS = 30;

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

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

// ============================================================================
// TOKEN GENERATION
// ============================================================================

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface TrainingUser {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  roles: string[];
  journey?: {
    current_stage: string;
    milestones: Record<string, { completed: boolean; completed_at?: string }>;
  };
}

export interface TrainingSession {
  user: TrainingUser;
  token: string;
}

// ============================================================================
// MAGIC LINK TOKENS TABLE
// ============================================================================

// We'll store magic link tokens in a dedicated table
// This needs to be created if it doesn't exist

async function ensureMagicLinksTable() {
  const supabase = getSupabaseAdmin();

  // Check if table exists by trying to query it
  const { error } = await supabase
    .from('training_magic_links')
    .select('id')
    .limit(1);

  // If table doesn't exist, we'll handle it gracefully
  // The table should be created via migration
  return !error;
}

// ============================================================================
// SIGNUP & LOGIN
// ============================================================================

/**
 * Create a new training user via Supabase Auth
 * Returns the user ID and sends a magic link
 */
export async function createTrainingUser(
  email: string,
  name: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const supabase = getSupabaseAdmin();
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if user already exists by listing users with email filter
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);

    if (existingUser) {
      return { success: false, error: 'An account with this email already exists. Please log in instead.' };
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true, // Auto-confirm since we're using magic links
      user_metadata: {
        name: name.trim(),
        signup_source: 'training_platform'
      }
    });

    if (authError || !authData.user) {
      console.error('[TrainingAuth] Error creating user:', authError);
      return { success: false, error: 'Failed to create account. Please try again.' };
    }

    // The trigger in migration 022 should auto-initialize:
    // - user_roles (dna_trainee)
    // - dna_leader_journeys
    // - dna_content_unlocks (flow_assessment unlocked)

    return { success: true, userId: authData.user.id };

  } catch (error) {
    console.error('[TrainingAuth] Signup error:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * Create a magic link token for login
 */
export async function createMagicLink(
  email: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const supabase = getSupabaseAdmin();
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Find user by email using listUsers
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const authUser = usersData?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);

    if (!authUser) {
      // Don't reveal if user exists or not (security)
      return { success: true }; // Pretend success but don't send email
    }

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    // Store token in database
    const { error: insertError } = await supabase
      .from('training_magic_links')
      .insert({
        user_id: authUser.id,
        token,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (insertError) {
      console.error('[TrainingAuth] Error storing magic link:', insertError);
      return { success: false, error: 'Failed to generate login link.' };
    }

    return { success: true, token };

  } catch (error) {
    console.error('[TrainingAuth] Magic link error:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * Verify a magic link token and create session
 */
export async function verifyMagicLink(
  token: string
): Promise<{ success: boolean; user?: TrainingUser; error?: string }> {
  const supabase = getSupabaseAdmin();

  try {
    // Find and validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('training_magic_links')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (tokenError || !tokenData) {
      return { success: false, error: 'Invalid or expired link. Please request a new one.' };
    }

    // Check expiration
    if (new Date(tokenData.expires_at) < new Date()) {
      return { success: false, error: 'This link has expired. Please request a new one.' };
    }

    // Mark token as used
    await supabase
      .from('training_magic_links')
      .update({ used: true })
      .eq('id', tokenData.id);

    // Get user data
    const user = await getTrainingUserById(tokenData.user_id);

    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    // Create session
    await createTrainingSession(user);

    return { success: true, user };

  } catch (error) {
    console.error('[TrainingAuth] Verify magic link error:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Create a session cookie for authenticated user
 */
export async function createTrainingSession(user: TrainingUser): Promise<string> {
  const sessionToken = generateToken();

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify({
    token: sessionToken,
    userId: user.id,
    email: user.email,
    createdAt: Date.now(),
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * SESSION_MAX_AGE_DAYS,
    path: '/',
  });

  return sessionToken;
}

/**
 * Get current training session
 */
export async function getTrainingSession(): Promise<TrainingSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie) {
      return null;
    }

    const session = JSON.parse(sessionCookie.value);

    // Get fresh user data
    const user = await getTrainingUserById(session.userId);

    if (!user) {
      return null;
    }

    return {
      user,
      token: session.token
    };

  } catch (error) {
    console.error('[TrainingAuth] Get session error:', error);
    return null;
  }
}

/**
 * Clear training session
 */
export async function clearTrainingSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// ============================================================================
// USER DATA
// ============================================================================

/**
 * Get training user by ID with roles and journey
 */
export async function getTrainingUserById(userId: string): Promise<TrainingUser | null> {
  const supabase = getSupabaseAdmin();

  try {
    // Get user from Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authError || !authData.user) {
      return null;
    }

    // Get roles
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const roles = rolesData?.map(r => r.role) || ['dna_trainee'];

    // Get journey
    const { data: journeyData } = await supabase
      .from('dna_leader_journeys')
      .select('current_stage, milestones')
      .eq('user_id', userId)
      .single();

    return {
      id: authData.user.id,
      email: authData.user.email || '',
      name: authData.user.user_metadata?.name || null,
      created_at: authData.user.created_at,
      roles,
      journey: journeyData ? {
        current_stage: journeyData.current_stage,
        milestones: journeyData.milestones
      } : undefined
    };

  } catch (error) {
    console.error('[TrainingAuth] Get user error:', error);
    return null;
  }
}

/**
 * Get training user by email
 */
export async function getTrainingUserByEmail(email: string): Promise<TrainingUser | null> {
  const supabase = getSupabaseAdmin();
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Use listUsers to find by email
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const authUser = usersData?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);

    if (!authUser) {
      return null;
    }

    return getTrainingUserById(authUser.id);

  } catch (error) {
    console.error('[TrainingAuth] Get user by email error:', error);
    return null;
  }
}

// ============================================================================
// ROLE CHECKS
// ============================================================================

/**
 * Check if user has a specific role
 */
export function hasRole(user: TrainingUser, role: string): boolean {
  return user.roles.includes(role);
}

/**
 * Check if user is admin
 */
export function isTrainingAdmin(user: TrainingUser): boolean {
  return hasRole(user, 'admin');
}

/**
 * Check if user is at least a DNA leader
 */
export function isDNALeader(user: TrainingUser): boolean {
  return hasRole(user, 'dna_leader') || hasRole(user, 'admin');
}

/**
 * Check if user is a church leader
 */
export function isChurchLeader(user: TrainingUser): boolean {
  return hasRole(user, 'church_leader') || hasRole(user, 'admin');
}

// ============================================================================
// CONTENT UNLOCKS
// ============================================================================

/**
 * Check if content is unlocked for user
 */
export async function isContentUnlocked(userId: string, contentType: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from('dna_content_unlocks')
    .select('unlocked')
    .eq('user_id', userId)
    .eq('content_type', contentType)
    .single();

  return data?.unlocked || false;
}

/**
 * Unlock content for user
 */
export async function unlockContent(
  userId: string,
  contentType: string,
  trigger: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('dna_content_unlocks')
    .upsert({
      user_id: userId,
      content_type: contentType,
      unlocked: true,
      unlocked_at: new Date().toISOString(),
      unlock_trigger: trigger
    }, {
      onConflict: 'user_id,content_type'
    });

  return !error;
}

/**
 * Get all content unlocks for user
 */
export async function getContentUnlocks(userId: string): Promise<Record<string, boolean>> {
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from('dna_content_unlocks')
    .select('content_type, unlocked')
    .eq('user_id', userId);

  const unlocks: Record<string, boolean> = {};
  data?.forEach(item => {
    unlocks[item.content_type] = item.unlocked;
  });

  return unlocks;
}

// ============================================================================
// JOURNEY UPDATES
// ============================================================================

/**
 * Update milestone in user's journey
 */
export async function updateMilestone(
  userId: string,
  milestone: string,
  completed: boolean
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  // Get current milestones
  const { data: journey } = await supabase
    .from('dna_leader_journeys')
    .select('milestones')
    .eq('user_id', userId)
    .single();

  if (!journey) {
    return false;
  }

  // Update milestone
  const updatedMilestones = {
    ...journey.milestones,
    [milestone]: {
      completed,
      ...(completed ? { completed_at: new Date().toISOString() } : {})
    }
  };

  const { error } = await supabase
    .from('dna_leader_journeys')
    .update({
      milestones: updatedMilestones,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  return !error;
}
