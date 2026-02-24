import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

const VALID_ROLES = ['church_leader', 'dna_leader', 'training_participant', 'admin'] as const;
type ValidRole = (typeof VALID_ROLES)[number];

// Roles that are scoped to a church_id
const CHURCH_SCOPED_ROLES: ValidRole[] = ['church_leader', 'dna_leader'];

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

    // Church-scoped roles require a church_id
    if (CHURCH_SCOPED_ROLES.includes(role as ValidRole) && !church_id) {
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
      // Upsert — ignoreDuplicates means this is safe to call repeatedly
      const { error } = await supabase.from('user_roles').upsert(
        { user_id: userId, role, church_id: church_id || null },
        { onConflict: 'user_id,role,church_id', ignoreDuplicates: true }
      );
      if (error) {
        console.error('[ROLES] Add error:', error);
        return NextResponse.json({ error: 'Failed to add role' }, { status: 500 });
      }

      // When adding dna_leader, also ensure a dna_leaders record exists
      if (role === 'dna_leader' && church_id) {
        await supabase.from('dna_leaders').upsert(
          {
            email: user.email,
            name: user.name,
            church_id,
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
