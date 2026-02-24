import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getUnifiedSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
      .select('id, email, name')
      .eq('id', id)
      .single();

    if (fetchError || !leader) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone || null;
    // church_id: empty string means "make independent"
    if ('church_id' in body) updates.church_id = church_id || null;

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

    return NextResponse.json({ leader: updatedLeader });
  } catch (error) {
    console.error('Error updating DNA leader:', error);
    return NextResponse.json({ error: 'Failed to update leader' }, { status: 500 });
  }
}
