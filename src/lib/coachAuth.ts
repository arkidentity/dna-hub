/**
 * Coach Account Provisioning
 *
 * Ensures a DNA coach has a login account linked to their coach profile.
 * Called fire-and-forget from the coaches API routes whenever an email is saved.
 * All operations are idempotent — safe to call multiple times.
 *
 * Usage (per Supabase PromiseLike gotcha — no .catch()):
 *   void (async () => { await ensureCoachAccount(coachId, email, name) })()
 */

import { getSupabaseAdmin } from './auth'

/**
 * Ensure a DNA coach has a login account (Supabase Auth + users + user_roles).
 * Links the user record back to the coach's dna_coaches row via user_id.
 */
export async function ensureCoachAccount(
  coachId: string,
  email: string,
  name: string
): Promise<void> {
  const supabase = getSupabaseAdmin()
  const normalizedEmail = email.trim().toLowerCase()

  // ── 1. Create Supabase Auth account (idempotent) ───────────────────────────
  const { error: authError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    user_metadata: { name, signup_source: 'coach_provisioned' },
  })
  if (
    authError &&
    !authError.message?.includes('already been registered') &&
    !authError.message?.includes('already exists') &&
    !authError.message?.includes('already registered')
  ) {
    console.error('[COACH AUTH] Auth create error:', authError.message)
    // Non-fatal — continue to ensure the users table record exists
  }

  // ── 2. Upsert users record ─────────────────────────────────────────────────
  let userId: string | null = null

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .single()

  if (existingUser) {
    userId = existingUser.id
  } else {
    const { data: newUser } = await supabase
      .from('users')
      .insert({ email: normalizedEmail, name })
      .select('id')
      .single()
    if (newUser) userId = newUser.id
  }

  if (!userId) {
    console.error('[COACH AUTH] Could not resolve user ID for', normalizedEmail)
    return
  }

  // ── 3. Grant dna_coach role (global — no church_id) ───────────────────────
  await supabase
    .from('user_roles')
    .upsert(
      { user_id: userId, role: 'dna_coach', church_id: null },
      { onConflict: 'user_id,role', ignoreDuplicates: true }
    )

  // ── 4. Link user_id back to the dna_coaches record ────────────────────────
  await supabase
    .from('dna_coaches')
    .update({ user_id: userId, updated_at: new Date().toISOString() })
    .eq('id', coachId)

  // ── 5. Generate a setup/login link and log it ─────────────────────────────
  // TODO: Send a coach welcome email using Resend when email templates are ready
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dnadiscipleship.com'
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: { redirectTo: `${baseUrl}/auth/reset-password` },
    })
    const setupUrl = linkData?.properties?.action_link ?? `${baseUrl}/login`
    console.log('[COACH AUTH] Setup link for', normalizedEmail, '→', setupUrl)
  } catch (err) {
    console.error('[COACH AUTH] Failed to generate setup link:', err)
  }
}
