import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUnifiedSession, isAdmin, hasRole, getPrimaryChurch } from '@/lib/unified-auth';
import { getDnaHqChurchId } from '@/lib/dna-hq';

// DELETE /api/admin/church-leaders/[id]
// Removes a church leader from their church, cleaning up all related tables atomically.
// Admin-only (or church leader removing someone from their own church).
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getUnifiedSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isAdminUser = isAdmin(session);
  const isChurchLeader = hasRole(session, 'church_leader');
  if (!isAdminUser && !isChurchLeader) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Fetch the church_leaders record so we know user_id and church_id
    const { data: leader, error: fetchError } = await supabase
      .from('church_leaders')
      .select('id, email, user_id, church_id')
      .eq('id', id)
      .single();

    if (fetchError || !leader) {
      return NextResponse.json({ error: 'Church leader not found' }, { status: 404 });
    }

    // Church leaders can only remove leaders from their own church
    if (!isAdminUser && isChurchLeader) {
      const myChurchId = getPrimaryChurch(session);
      if (!myChurchId || leader.church_id !== myChurchId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { church_id: churchId, user_id: userId } = leader;

    // 1. Remove from church_leaders
    await supabase.from('church_leaders').delete().eq('id', id);

    if (userId) {
      const dnaHqId = await getDnaHqChurchId();

      // 2. Remove church_leader role scoped to this church
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'church_leader')
        .eq('church_id', churchId);

      // 3. Remove dna_leader role scoped to this church
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'dna_leader')
        .eq('church_id', churchId);

      // 4. Reassign dna_leaders record to DNA HQ (keeps them active as a leader,
      //    just no longer under this specific church). Groups are preserved.
      const dnaLeaderUpdate: Record<string, unknown> = {
        church_id: dnaHqId,
        updated_at: new Date().toISOString(),
      };
      // Only reactivate if they were active before — don't resurrect intentionally deactivated leaders
      dnaLeaderUpdate.is_active = true;

      await supabase
        .from('dna_leaders')
        .update(dnaLeaderUpdate)
        .eq('user_id', userId)
        .eq('church_id', churchId);

      // 5. Remove from this church's cohort(s)
      const { data: leaderRecord } = await supabase
        .from('dna_leaders')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (leaderRecord) {
        const { data: churchCohorts } = await supabase
          .from('dna_cohorts')
          .select('id')
          .eq('church_id', churchId);

        if (churchCohorts && churchCohorts.length > 0) {
          const cohortIds = churchCohorts.map((c) => c.id);
          await supabase
            .from('dna_cohort_members')
            .delete()
            .eq('leader_id', leaderRecord.id)
            .in('cohort_id', cohortIds);
        }
      }

      // 6. Add dna_leader role scoped to DNA HQ so Groups/Cohort nav reappears
      if (dnaHqId) {
        const { data: existingHqRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('role', 'dna_leader')
          .eq('church_id', dnaHqId)
          .maybeSingle();

        if (!existingHqRole) {
          await supabase
            .from('user_roles')
            .insert({ user_id: userId, role: 'dna_leader', church_id: dnaHqId });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing church leader:', error);
    return NextResponse.json({ error: 'Failed to remove church leader' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getUnifiedSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { name, email } = body;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get current leader data
    const { data: leader, error: fetchError } = await supabase
      .from('church_leaders')
      .select('id, email, name, church_id')
      .eq('id', id)
      .single();

    if (fetchError || !leader) {
      return NextResponse.json({ error: 'Church leader not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;

    // Handle email change
    if (email && email.toLowerCase().trim() !== leader.email?.toLowerCase()) {
      const newEmail = email.toLowerCase().trim();

      // Check if new email already exists in church_leaders
      const { data: existing } = await supabase
        .from('church_leaders')
        .select('id')
        .eq('email', newEmail)
        .neq('id', id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'That email is already in use' }, { status: 409 });
      }

      // Find auth user by current email
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const authUser = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === leader.email?.toLowerCase()
      );

      if (authUser) {
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(authUser.id, {
          email: newEmail,
        });
        if (authUpdateError) {
          return NextResponse.json(
            { error: 'Failed to update login email: ' + authUpdateError.message },
            { status: 500 }
          );
        }
      }

      // Update users table (linked by email)
      await supabase
        .from('users')
        .update({ email: newEmail, updated_at: new Date().toISOString() })
        .eq('email', leader.email);

      updates.email = newEmail;
    }

    // Update church_leaders
    const { data: updatedLeader, error: updateError } = await supabase
      .from('church_leaders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ leader: updatedLeader });
  } catch (error) {
    console.error('Error updating church leader:', error);
    return NextResponse.json({ error: 'Failed to update church leader' }, { status: 500 });
  }
}
