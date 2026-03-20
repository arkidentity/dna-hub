import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUnifiedSession, isAdmin, isChurchLeader } from '@/lib/unified-auth';

// PATCH: Update a DNA leader's name, email, or phone
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ churchId: string; leaderId: string }> }
) {
  const session = await getUnifiedSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { churchId, leaderId } = await params;
  const admin = isAdmin(session);

  // Only admins or church leaders of this church can edit
  if (!admin && !isChurchLeader(session, churchId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, phone } = body;

  if (!name && !email && !phone) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  if (name !== undefined && typeof name === 'string' && name.trim() === '') {
    return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
  }

  if (email !== undefined && typeof email === 'string' && email.trim() === '') {
    return NextResponse.json({ error: 'Email cannot be empty' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify this leader belongs to the specified church
  const { data: existing, error: fetchError } = await supabase
    .from('dna_leaders')
    .select('id, email, name, phone, church_id')
    .eq('id', leaderId)
    .eq('church_id', churchId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
  }

  // If email is changing, check it isn't already taken
  if (email && email !== existing.email) {
    const { data: conflict } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', email)
      .neq('id', leaderId)
      .maybeSingle();

    if (conflict) {
      return NextResponse.json(
        { error: 'That email is already in use by another leader' },
        { status: 409 }
      );
    }
  }

  // Handle email change — must update Supabase Auth first
  const newEmail = email?.trim().toLowerCase();
  if (newEmail && newEmail !== existing.email.toLowerCase()) {
    // Update Supabase Auth (the actual login email)
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const authUser = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === existing.email.toLowerCase()
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

    // Update users table
    await supabase
      .from('users')
      .update({ email: newEmail, updated_at: new Date().toISOString() })
      .eq('email', existing.email);

    // Update disciple_app_accounts if they also have an app account
    await supabase
      .from('disciple_app_accounts')
      .update({ email: newEmail, updated_at: new Date().toISOString() })
      .eq('email', existing.email);
  }

  // Build update payload for dna_leaders
  const leaderUpdate: Record<string, string | null> = {};
  if (name !== undefined) leaderUpdate.name = name.trim();
  if (newEmail) leaderUpdate.email = newEmail;
  if (phone !== undefined) leaderUpdate.phone = phone.trim() || null;

  // Update dna_leaders
  const { data: updated, error: updateError } = await supabase
    .from('dna_leaders')
    .update({ ...leaderUpdate, updated_at: new Date().toISOString() })
    .eq('id', leaderId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating dna_leaders:', updateError);
    return NextResponse.json({ error: 'Failed to update leader' }, { status: 500 });
  }

  // Keep users table name in sync (email already handled above)
  if (name !== undefined) {
    await supabase
      .from('users')
      .update({ name: name.trim(), updated_at: new Date().toISOString() })
      .eq('email', updated.email);
  }

  return NextResponse.json({ leader: updated });
}
