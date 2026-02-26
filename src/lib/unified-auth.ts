/**
 * Unified Authentication System
 *
 * This module provides a single authentication system that supports multiple user roles:
 * - church_leader: Access to church implementation dashboard
 * - dna_leader: Access to DNA groups management
 * - training_participant: Access to DNA training
 * - admin: Full system access
 *
 * Users can have multiple roles and access multiple dashboards with one login.
 *
 * Auth is powered by Supabase Auth (email/password + Google OAuth).
 * The session lives in httpOnly cookies managed by @supabase/ssr middleware.
 * After reading the Supabase Auth user, we look up their roles in the
 * `users` + `user_roles` tables by email.
 */

import { getSupabaseAdmin } from './auth'
import { createServerSupabase } from './supabase-server'

// Lazy accessor for admin queries (bypasses RLS)
const adminDb = { from: (table: string) => getSupabaseAdmin().from(table) }

export interface UserRole {
  role: 'church_leader' | 'dna_leader' | 'training_participant' | 'admin' | 'dna_coach'
  churchId: string | null
}

export interface UserSession {
  userId: string
  email: string
  name: string | null
  roles: UserRole[]
}

// In-memory session cache keyed by email to avoid DB role lookups per request
const sessionCache = new Map<string, { session: UserSession; expiresAt: number }>()
const SESSION_CACHE_TTL = 2 * 60 * 1000 // 2 minutes

/**
 * Get the current user session from Supabase Auth cookies.
 * Falls back to legacy magic link cookie for existing sessions.
 * Uses an in-memory cache to avoid hitting the DB on every API call.
 * @returns UserSession or null if not authenticated
 */
export async function getUnifiedSession(): Promise<UserSession | null> {
  // --- Primary: Supabase Auth session ---
  try {
    const supabase = await createServerSupabase()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (authUser?.email) {
      return resolveSessionByEmail(authUser.email, authUser.user_metadata?.full_name || authUser.user_metadata?.name || null)
    }
  } catch {
    // createServerSupabase can fail outside of request context — fall through
  }

  // --- Fallback: legacy magic link cookie (for existing sessions) ---
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('user_session')?.value
    if (sessionToken) {
      return resolveLegacySession(sessionToken)
    }
  } catch {
    // cookies() can fail outside of request context
  }

  return null
}

/**
 * Resolve a UserSession from an email address.
 * Looks up the `users` + `user_roles` tables.
 * Uses in-memory cache to avoid DB hits.
 */
async function resolveSessionByEmail(email: string, nameHint: string | null): Promise<UserSession | null> {
  const normalizedEmail = email.toLowerCase()

  // Check cache
  const cached = sessionCache.get(normalizedEmail)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.session
  }

  // Look up user and roles
  const { data: user, error: userError } = await adminDb
    .from('users')
    .select(`
      id,
      email,
      name,
      user_roles (
        role,
        church_id
      )
    `)
    .eq('email', normalizedEmail)
    .single()

  if (userError || !user) {
    return null
  }

  const session: UserSession = {
    userId: user.id,
    email: user.email,
    name: user.name || nameHint,
    roles: user.user_roles.map((r: any) => ({
      role: r.role,
      churchId: r.church_id,
    })),
  }

  // Store in cache
  sessionCache.set(normalizedEmail, {
    session,
    expiresAt: Date.now() + SESSION_CACHE_TTL,
  })

  // Evict stale entries
  if (sessionCache.size > 100) {
    const now = Date.now()
    for (const [key, val] of sessionCache) {
      if (val.expiresAt <= now) sessionCache.delete(key)
    }
  }

  return session
}

/**
 * Resolve a UserSession from a legacy magic link token.
 * Kept for backward compatibility — existing logged-in users
 * with a `user_session` cookie will still work.
 */
async function resolveLegacySession(token: string): Promise<UserSession | null> {
  // Check cache
  const cached = sessionCache.get(`legacy:${token}`)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.session
  }

  const { data: tokenData, error: tokenError } = await adminDb
    .from('magic_link_tokens')
    .select('email, used')
    .eq('token', token)
    .single()

  // Token must exist and have been used (verified). Session duration is
  // governed by the cookie's own maxAge — not the token's expires_at.
  // expires_at only gates the initial magic link click, not re-verification.
  if (tokenError || !tokenData || !tokenData.used) {
    return null
  }

  const session = await resolveSessionByEmail(tokenData.email, null)
  if (session) {
    // Also cache under the legacy token key
    sessionCache.set(`legacy:${token}`, {
      session,
      expiresAt: Date.now() + SESSION_CACHE_TTL,
    })
  }

  return session
}

/**
 * Clear the session cache (call on logout)
 */
export function clearSessionCache(token?: string) {
  if (token) {
    sessionCache.delete(token)
    sessionCache.delete(`legacy:${token}`)
  } else {
    sessionCache.clear()
  }
}

/**
 * Check if the user has a specific role
 * @param session - The user session
 * @param role - The role to check for
 * @param churchId - Optional church ID to check for (role must be for this specific church)
 * @returns true if user has the role
 */
export function hasRole(
  session: UserSession | null,
  role: string,
  churchId?: string
): boolean {
  if (!session) return false

  return session.roles.some(r => {
    if (r.role !== role) return false
    if (churchId && r.churchId !== churchId) return false
    return true
  })
}

/**
 * Check if the user is an admin
 * @param session - The user session
 * @returns true if user is an admin
 */
export function isAdmin(session: UserSession | null): boolean {
  return hasRole(session, 'admin')
}

/**
 * Check if the user is a DNA coach
 * @param session - The user session
 * @returns true if user has the dna_coach role
 */
export function isDNACoach(session: UserSession | null): boolean {
  return hasRole(session, 'dna_coach')
}

/**
 * Check if the user is an admin OR a DNA coach
 * Both roles are permitted to access the admin panel (coaches see a scoped view)
 * @param session - The user session
 * @returns true if user is admin or dna_coach
 */
export function isAdminOrCoach(session: UserSession | null): boolean {
  return isAdmin(session) || isDNACoach(session)
}

/**
 * Get all church IDs the user has access to
 * @param session - The user session
 * @returns Array of church IDs
 */
export function getUserChurches(session: UserSession | null): string[] {
  if (!session) return []

  return session.roles
    .filter(r => r.churchId !== null)
    .map(r => r.churchId as string)
}

/**
 * Check if user is a church leader for a specific church
 * @param session - The user session
 * @param churchId - The church ID to check
 * @returns true if user is a church leader for this church
 */
export function isChurchLeader(session: UserSession | null, churchId: string): boolean {
  return hasRole(session, 'church_leader', churchId)
}

/**
 * Check if user is a DNA leader
 * @param session - The user session
 * @param churchId - Optional church ID to check for
 * @returns true if user is a DNA leader
 */
export function isDNALeader(session: UserSession | null, churchId?: string): boolean {
  return hasRole(session, 'dna_leader', churchId)
}

/**
 * Check if user is a training participant
 * @param session - The user session
 * @returns true if user is a training participant
 */
export function isTrainingParticipant(session: UserSession | null): boolean {
  return hasRole(session, 'training_participant')
}

/**
 * Get the user's primary church (first church they're associated with)
 * Useful for users who are only at one church
 * @param session - The user session
 * @returns Church ID or null
 */
export function getPrimaryChurch(session: UserSession | null): string | null {
  if (!session) return null

  const churchRole = session.roles.find(r => r.churchId !== null)
  return churchRole?.churchId || null
}

/**
 * Get all DNA leader churches (churches where user is a DNA leader)
 * @param session - The user session
 * @returns Array of church IDs
 */
export function getDNALeaderChurches(session: UserSession | null): string[] {
  if (!session) return []

  return session.roles
    .filter(r => r.role === 'dna_leader' && r.churchId !== null)
    .map(r => r.churchId as string)
}

// ============================================================================
// TRAINING HELPERS
// ============================================================================

export interface TrainingProgress {
  currentStage: string
  milestones: Record<string, { completed: boolean; completed_at?: string }>
}

export interface ContentUnlocks {
  flow_assessment: boolean
  manual_session_1: boolean
  manual_session_2: boolean
  manual_session_3: boolean
  manual_session_4: boolean
  manual_session_5: boolean
  manual_session_6: boolean
  launch_guide: boolean
  toolkit_90day: boolean
  [key: string]: boolean
}

export interface FlowAssessment {
  id: string
  roadblockRatings: Record<string, number>
  reflections: Record<string, Record<string, string>>
  topRoadblocks: string[]
  actionPlan: Record<string, { actions: string[]; deadline: string }>
  accountabilityPartner: string | null
  accountabilityDate: string | null
  status: 'draft' | 'completed'
  completedAt: string | null
  canRetake: boolean
  daysUntilRetake: number | null
}

/**
 * Get training progress for a user
 * @param userId - The user ID
 * @returns Training progress or null
 */
export async function getTrainingProgress(userId: string): Promise<TrainingProgress | null> {
  const { data, error } = await adminDb
    .from('user_training_progress')
    .select('current_stage, milestones')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null

  return {
    currentStage: data.current_stage,
    milestones: data.milestones || {}
  }
}

/**
 * Get content unlocks for a user
 * @param userId - The user ID
 * @returns Object with content unlock status
 */
export async function getContentUnlocks(userId: string): Promise<ContentUnlocks> {
  const { data } = await adminDb
    .from('user_content_unlocks')
    .select('content_type, unlocked')
    .eq('user_id', userId)

  const unlocks: ContentUnlocks = {
    flow_assessment: false,
    manual_session_1: false,
    manual_session_2: false,
    manual_session_3: false,
    manual_session_4: false,
    manual_session_5: false,
    manual_session_6: false,
    launch_guide: false,
    toolkit_90day: false
  }

  data?.forEach((item: any) => {
    unlocks[item.content_type] = item.unlocked
  })

  return unlocks
}

/**
 * Get flow assessment for a user
 * @param userId - The user ID
 * @returns Flow assessment or null
 */
export async function getFlowAssessment(userId: string): Promise<FlowAssessment | null> {
  const { data, error } = await adminDb
    .from('user_flow_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null

  // Calculate if user can retake (3 months since last completion)
  let canRetake = false
  let daysUntilRetake: number | null = null

  if (data.completed_at) {
    const completedDate = new Date(data.completed_at)
    const retakeDate = new Date(completedDate)
    retakeDate.setMonth(retakeDate.getMonth() + 3)
    const now = new Date()

    if (now >= retakeDate) {
      canRetake = true
    } else {
      daysUntilRetake = Math.ceil((retakeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }
  }

  return {
    id: data.id,
    roadblockRatings: data.roadblock_ratings || {},
    reflections: data.reflections || {},
    topRoadblocks: data.top_roadblocks || [],
    actionPlan: data.action_plan || {},
    accountabilityPartner: data.accountability_partner,
    accountabilityDate: data.accountability_date,
    status: data.status,
    completedAt: data.completed_at,
    canRetake,
    daysUntilRetake
  }
}

/**
 * Initialize training data for a new user
 * @param userId - The user ID
 */
export async function initializeTrainingUser(userId: string): Promise<void> {
  // Create training progress record
  await adminDb
    .from('user_training_progress')
    .upsert({
      user_id: userId,
      current_stage: 'onboarding',
      milestones: {}
    }, { onConflict: 'user_id' })

  // Unlock flow assessment (first step)
  await adminDb
    .from('user_content_unlocks')
    .upsert({
      user_id: userId,
      content_type: 'flow_assessment',
      unlocked: true,
      unlocked_at: new Date().toISOString(),
      unlock_trigger: 'signup'
    }, { onConflict: 'user_id,content_type' })
}

/**
 * Update a milestone in user's training progress
 * @param userId - The user ID
 * @param milestone - The milestone key
 * @param completed - Whether the milestone is completed
 */
export async function updateTrainingMilestone(
  userId: string,
  milestone: string,
  completed: boolean
): Promise<void> {
  // Get current milestones
  const { data: progress } = await adminDb
    .from('user_training_progress')
    .select('milestones')
    .eq('user_id', userId)
    .single()

  if (!progress) return

  const updatedMilestones = {
    ...progress.milestones,
    [milestone]: {
      completed,
      ...(completed ? { completed_at: new Date().toISOString() } : {})
    }
  }

  await adminDb
    .from('user_training_progress')
    .update({
      milestones: updatedMilestones,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
}

/**
 * Unlock content for a user
 * @param userId - The user ID
 * @param contentType - The content type to unlock
 * @param trigger - What triggered the unlock
 */
export async function unlockContent(
  userId: string,
  contentType: string,
  trigger: string
): Promise<void> {
  await adminDb
    .from('user_content_unlocks')
    .upsert({
      user_id: userId,
      content_type: contentType,
      unlocked: true,
      unlocked_at: new Date().toISOString(),
      unlock_trigger: trigger
    }, { onConflict: 'user_id,content_type' })
}
