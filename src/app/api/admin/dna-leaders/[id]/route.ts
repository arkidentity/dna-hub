import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUnifiedSession, isAdmin, hasRole, getPrimaryChurch } from '@/lib/unified-auth';

export async function PATCH(
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
  const body = await request.json();
  const { name, email, phone, church_id } = body;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get current leader data
    const { data: leader, error: fetchError } = await supabase
      .from('dna_leaders')
      .select('id, email, name, church_id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !leader) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
    }

    // Church leaders can only edit leaders in their own church
    if (!isAdminUser && isChurchLeader) {
      const myChurchId = getPrimaryChurch(session);
      if (!myChurchId || leader.church_id !== myChurchId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // Church leaders cannot reassign leaders to a different church
      if ('church_id' in body && church_id !== myChurchId) {
        return NextResponse.json({ error: 'Cannot reassign leader to a different church' }, { status: 403 });
      }
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone || null;
    // church_id: empty string means "make independent"
    const churchIdChanging = 'church_id' in body;
    if (churchIdChanging) updates.church_id = church_id || null;

    // Handle email change
    if (email && email.toLowerCase().trim() !== leader.email.toLowerCase()) {
      const newEmail = email.toLowerCase().trim();

      // Check if new email is already in use
      const { data: existing } = await supabase
        .from('dna_leaders')
        .select('id')
        .eq('email', newEmail)
        .neq('id', id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'That email is already in use by another leader' }, { status: 409 });
      }

      // Find auth user by current email
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const authUser = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === leader.email.toLowerCase()
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

      // Update disciple_app_accounts if they also have an app account
      await supabase
        .from('disciple_app_accounts')
        .update({ email: newEmail, updated_at: new Date().toISOString() })
        .eq('email', leader.email);

      updates.email = newEmail;
    }

    // Update dna_leaders
    const { data: updatedLeader, error: updateError } = await supabase
      .from('dna_leaders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // When church_id changes, sync user_roles so RLS and dashboard access
    // reflect the new affiliation. Without this, the leader retains access to
    // the old church's dashboard.
    if (churchIdChanging && leader.user_id) {
      const oldChurchId = leader.church_id;
      const newChurchId = (church_id as string) || null;

      // Remove dna_leader role for old church (if any)
      if (oldChurchId) {
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', leader.user_id)
          .eq('role', 'dna_leader')
          .eq('church_id', oldChurchId);

        // Also remove church_leader role for old church — if someone was a full
        // church leader and is being reassigned, revoke that access too.
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', leader.user_id)
          .eq('role', 'church_leader')
          .eq('church_id', oldChurchId);

        // Remove from church_leaders table for old church
        await supabase
          .from('church_leaders')
          .delete()
          .eq('user_id', leader.user_id)
          .eq('church_id', oldChurchId);
      }

      // Add dna_leader role for new church (if any)
      if (newChurchId) {
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', leader.user_id)
          .eq('role', 'dna_leader')
          .eq('church_id', newChurchId)
          .maybeSingle();

        if (!existingRole) {
          await supabase
            .from('user_roles')
            .insert({ user_id: leader.user_id, role: 'dna_leader', church_id: newChurchId });
        }
      }
    }

    return NextResponse.json({ leader: updatedLeader });
  } catch (error) {
    console.error('Error updating DNA leader:', error);
    return NextResponse.json({ error: 'Failed to update leader' }, { status: 500 });
  }
}
