import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';
import { getSupabaseAdmin } from '@/lib/auth';

// PATCH /api/admin/disciples/network/[id]
// Admin actions: assign church, promote to dna_leader
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getUnifiedSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });

  const { id: accountId } = await params;
  const body = await request.json();
  const { action } = body;

  const supabase = getSupabaseAdmin();

  // Verify the account exists
  const { data: account, error: accountError } = await supabase
    .from('disciple_app_accounts')
    .select('id, email, display_name, role, church_id, disciple_id')
    .eq('id', accountId)
    .single();

  if (accountError || !account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  try {
    // ── ACTION: Assign church ──
    if (action === 'assign_church') {
      const { church_id } = body;
      if (!church_id) {
        return NextResponse.json({ error: 'church_id required' }, { status: 400 });
      }

      // Verify church exists
      const { data: church } = await supabase
        .from('churches')
        .select('id, name')
        .eq('id', church_id)
        .single();

      if (!church) {
        return NextResponse.json({ error: 'Church not found' }, { status: 404 });
      }

      const oldChurchId = account.church_id;

      // 1. Update disciple_app_accounts
      const { error: updateError } = await supabase
        .from('disciple_app_accounts')
        .update({ church_id })
        .eq('id', accountId);

      if (updateError) throw updateError;

      // 2. Sync dna_leaders if this account has a leader record
      const email = account.email.toLowerCase();
      const { data: leaderRecord } = await supabase
        .from('dna_leaders')
        .select('id, user_id, church_id')
        .ilike('email', email)
        .maybeSingle();

      if (leaderRecord) {
        await supabase
          .from('dna_leaders')
          .update({ church_id, updated_at: new Date().toISOString() })
          .eq('id', leaderRecord.id);

        // 3. Sync user_roles if they have a linked user record
        const userId = leaderRecord.user_id;
        if (userId) {
          // Remove dna_leader role for old church
          if (oldChurchId) {
            await supabase
              .from('user_roles')
              .delete()
              .eq('user_id', userId)
              .eq('role', 'dna_leader')
              .eq('church_id', oldChurchId);

            await supabase
              .from('user_roles')
              .delete()
              .eq('user_id', userId)
              .eq('role', 'church_leader')
              .eq('church_id', oldChurchId);
          }

          // Add dna_leader role for new church (if not already present)
          const { data: existingRole } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', userId)
            .eq('role', 'dna_leader')
            .eq('church_id', church_id)
            .maybeSingle();

          if (!existingRole) {
            await supabase
              .from('user_roles')
              .insert({ user_id: userId, role: 'dna_leader', church_id });
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `${account.display_name || account.email} assigned to ${church.name}`,
      });
    }

    // ── ACTION: Promote to DNA leader ──
    if (action === 'promote_to_leader') {
      const email = account.email.toLowerCase();

      // 1. Ensure users record exists
      let userId: string;
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .ilike('email', email)
        .maybeSingle();

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({ email, name: account.display_name || email })
          .select('id')
          .single();
        if (userError || !newUser) throw userError || new Error('Failed to create user');
        userId = newUser.id;
      }

      // 2. Ensure dna_leader role in user_roles
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'dna_leader')
        .maybeSingle();

      if (!existingRole) {
        await supabase.from('user_roles').insert({
          user_id: userId,
          role: 'dna_leader',
          church_id: account.church_id || null,
        });
      }

      // 3. Ensure dna_leaders record exists
      const { data: existingLeader } = await supabase
        .from('dna_leaders')
        .select('id')
        .ilike('email', email)
        .maybeSingle();

      if (!existingLeader) {
        await supabase.from('dna_leaders').insert({
          email,
          name: account.display_name || email,
          user_id: userId,
          church_id: account.church_id || null,
          is_active: true,
          activated_at: new Date().toISOString(),
        });
      } else {
        // Make sure it's active and linked
        await supabase
          .from('dna_leaders')
          .update({ is_active: true, user_id: userId, activated_at: new Date().toISOString() })
          .eq('id', existingLeader.id);
      }

      // 4. Update disciple_app_accounts.role
      const { error: updateError } = await supabase
        .from('disciple_app_accounts')
        .update({ role: 'dna_leader' })
        .eq('id', accountId);

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        message: `${account.display_name || account.email} promoted to DNA Leader`,
      });
    }

    // ── ACTION: Remove leader role (demote back to disciple) ──
    if (action === 'remove_leader_role') {
      const { error: updateError } = await supabase
        .from('disciple_app_accounts')
        .update({ role: null })
        .eq('id', accountId);

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        message: `${account.display_name || account.email} role removed`,
      });
    }

    // ── ACTION: Link app account to existing DNA leader ──
    // When someone logged into Daily DNA with a different email than their
    // leader invite, this links the two identities: sets the role, church_id,
    // and connects the dna_leaders record — preserving all app activity.
    if (action === 'link_to_leader') {
      const { leader_id } = body;
      if (!leader_id) {
        return NextResponse.json({ error: 'leader_id required' }, { status: 400 });
      }

      // Fetch the leader record
      const { data: leader, error: leaderError } = await supabase
        .from('dna_leaders')
        .select('id, email, name, user_id, church_id')
        .eq('id', leader_id)
        .single();

      if (leaderError || !leader) {
        return NextResponse.json({ error: 'DNA leader not found' }, { status: 404 });
      }

      // 1. Update disciple_app_accounts: set role + church
      const updates: Record<string, unknown> = {
        role: 'dna_leader',
      };
      if (!account.church_id && leader.church_id) {
        updates.church_id = leader.church_id;
      }

      const { error: updateError } = await supabase
        .from('disciple_app_accounts')
        .update(updates)
        .eq('id', accountId);

      if (updateError) throw updateError;

      // 2. Ensure the leader has a users record + user_roles entry
      //    so future syncs keep working
      const leaderEmail = leader.email.toLowerCase();
      let userId = leader.user_id;

      if (!userId) {
        // Try to find or create a users record
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .ilike('email', leaderEmail)
          .maybeSingle();

        if (existingUser) {
          userId = existingUser.id;
        } else {
          const { data: newUser } = await supabase
            .from('users')
            .insert({ email: leaderEmail, name: leader.name || leaderEmail })
            .select('id')
            .single();
          userId = newUser?.id || null;
        }

        // Link user_id back to dna_leaders
        if (userId) {
          await supabase
            .from('dna_leaders')
            .update({ user_id: userId })
            .eq('id', leader_id);
        }
      }

      // Ensure dna_leader role exists in user_roles
      if (userId) {
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('role', 'dna_leader')
          .maybeSingle();

        if (!existingRole) {
          await supabase.from('user_roles').insert({
            user_id: userId,
            role: 'dna_leader',
            church_id: leader.church_id || null,
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `${account.display_name || account.email} linked to leader ${leader.name || leader.email}`,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error(`[Admin Disciples] ${action} error:`, error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
