import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';
import { getDnaHqChurchId } from '@/lib/dna-hq';

const VALID_ROLES = ['church_leader', 'dna_leader', 'training_participant', 'admin'] as const;
type ValidRole = (typeof VALID_ROLES)[number];

// Roles that REQUIRE a church_id — dna_leader is intentionally excluded because
// independent DNA leaders (no church affiliation) also hold this role with church_id = null.
const CHURCH_REQUIRED_ROLES: ValidRole[] = ['church_leader'];

// PATCH /api/admin/users/[id]/roles
// Toggle a role on or off for a user.
// Body: { role, action: 'add' | 'remove', church_id?: string }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: userId } = await params;
    const body = await request.json();
    const { role, action, church_id = null } = body as {
      role: string;
      action: string;
      church_id?: string | null;
    };

    if (!VALID_ROLES.includes(role as ValidRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (action !== 'add' && action !== 'remove') {
      return NextResponse.json(
        { error: 'Invalid action. Use "add" or "remove"' },
        { status: 400 }
      );
    }

    // Only church_leader strictly requires a church_id
    if (CHURCH_REQUIRED_ROLES.includes(role as ValidRole) && !church_id) {
      return NextResponse.json(
        { error: `Role "${role}" requires a church_id` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify user exists
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', userId)
      .single();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (action === 'add') {
      // For dna_leader with no church_id, default to the DNA HQ church so the
      // leader gets cohort and group access under the DNA Discipleship umbrella.
      let effectiveChurchId = church_id || null;
      if (role === 'dna_leader' && !effectiveChurchId) {
        effectiveChurchId = await getDnaHqChurchId();
      }

      // Check-then-insert — avoids requiring a named unique constraint.
      // Handle null church_id explicitly (.eq doesn't match NULL rows).
      const existingQuery = supabase
        .from('user_roles')
        .select('user_id')
        .eq('user_id', userId)
        .eq('role', role);

      const { data: existing } = effectiveChurchId
        ? await existingQuery.eq('church_id', effectiveChurchId).maybeSingle()
        : await existingQuery.is('church_id', null).maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role, church_id: effectiveChurchId });
        if (error && error.code !== '23505') {
          // 23505 = unique violation (race condition) — treat as success
          console.error('[ROLES] Add error:', error);
          return NextResponse.json({ error: error.message || 'Failed to add role' }, { status: 500 });
        }
      }

      // When adding dna_leader, also ensure a dna_leaders record exists
      // and update it to reflect the resolved church (DNA HQ for independents).
      if (role === 'dna_leader') {
        await supabase.from('dna_leaders').upsert(
          {
            email: user.email,
            name: user.name,
            church_id: effectiveChurchId,
            user_id: userId,
            is_active: true,
            activated_at: new Date().toISOString(),
            invited_by_type: 'super_admin',
          },
          { onConflict: 'email' }
        );
      }
    } else {
      // Remove — use .is() for null church_id, .eq() for non-null
      const { error } = church_id
        ? await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userId)
            .eq('role', role)
            .eq('church_id', church_id)
        : await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userId)
            .eq('role', role)
            .is('church_id', null);

      if (error) {
        console.error('[ROLES] Remove error:', error);
        return NextResponse.json({ error: 'Failed to remove role' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[ROLES] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
