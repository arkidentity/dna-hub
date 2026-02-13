import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/spiritual-gifts/provision-team-member
 *
 * Called by Daily DNA when a user takes the gifts test via a church-scoped link
 * (?church=<church_id>). Silently provisions the user as a dna_leader for that
 * church so the pastor can see their results — they have no idea they're in the
 * dashboard until explicitly invited into a DNA group later.
 *
 * Body: { church_id, email, name }
 * Returns: { success, alreadyProvisioned }
 */
export async function POST(request: NextRequest) {
  try {
    const { church_id, email, name } = await request.json();

    if (!church_id || !email) {
      return NextResponse.json({ error: 'church_id and email are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify church exists
    const { data: church, error: churchError } = await supabase
      .from('churches')
      .select('id, name')
      .eq('id', church_id)
      .single();

    if (churchError || !church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    // Create or find user
    let userId: string;
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({ email: normalizedEmail, name: name || null })
        .select('id')
        .single();

      if (userError || !newUser) {
        console.error('[Provision] User insert error:', userError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
      userId = newUser.id;
    }

    // Check if already provisioned as dna_leader for this church
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'dna_leader')
      .eq('church_id', church_id)
      .maybeSingle();

    if (existingRole) {
      return NextResponse.json({ success: true, alreadyProvisioned: true });
    }

    // Assign dna_leader role (silent — no Hub access, no email)
    await supabase.from('user_roles').insert({
      user_id: userId,
      role: 'dna_leader',
      church_id,
    });

    // Create dna_leaders record (pre-activated, no invitation email)
    const { data: existingDNALeader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!existingDNALeader) {
      await supabase.from('dna_leaders').insert({
        email: normalizedEmail,
        name: name || null,
        church_id,
        user_id: userId,
        is_active: true,
        activated_at: new Date().toISOString(),
      });
    }

    console.log(`[Provision] Silently provisioned ${normalizedEmail} as dna_leader for church ${church.name}`);

    return NextResponse.json({ success: true, alreadyProvisioned: false });
  } catch (error) {
    console.error('[Provision] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
