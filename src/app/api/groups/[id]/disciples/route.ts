import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole } from '@/lib/unified-auth';
import { sendDailyDNAInvitationEmail } from '@/lib/email';

// POST /api/groups/[id]/disciples
// Add a disciple to a group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a DNA leader
    if (!hasRole(session, 'dna_leader')) {
      return NextResponse.json(
        { error: 'Forbidden - DNA leader access required' },
        { status: 403 }
      );
    }

    const { id: groupId } = await params;
    const supabase = getSupabaseAdmin();

    // Get DNA leader record
    const { data: dnaLeader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', session.email)
      .single();

    if (!dnaLeader) {
      return NextResponse.json(
        { error: 'DNA leader not found' },
        { status: 404 }
      );
    }

    const leaderId = dnaLeader.id;

    // Verify ownership of the group
    const { data: group, error: groupError } = await supabase
      .from('dna_groups')
      .select('id, group_name, leader_id, co_leader_id')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.leader_id !== leaderId && group.co_leader_id !== leaderId) {
      return NextResponse.json({ error: 'Not authorized to add disciples to this group' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if disciple already exists
    let discipleId: string;

    const { data: existingDisciple } = await supabase
      .from('disciples')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingDisciple) {
      discipleId = existingDisciple.id;

      // Check if they're already in this group
      const { data: existingMembership } = await supabase
        .from('group_disciples')
        .select('id')
        .eq('group_id', groupId)
        .eq('disciple_id', discipleId)
        .single();

      if (existingMembership) {
        return NextResponse.json(
          { error: 'This person is already in this group' },
          { status: 400 }
        );
      }
    } else {
      // Create new disciple
      const { data: newDisciple, error: createError } = await supabase
        .from('disciples')
        .insert({
          email: normalizedEmail,
          name: name.trim(),
          phone: phone?.trim() || null,
        })
        .select()
        .single();

      if (createError) {
        console.error('[Disciples] Create error:', createError);
        return NextResponse.json({ error: 'Failed to create disciple' }, { status: 500 });
      }

      discipleId = newDisciple.id;
    }

    // Add disciple to group
    const { data: membership, error: membershipError } = await supabase
      .from('group_disciples')
      .insert({
        group_id: groupId,
        disciple_id: discipleId,
        joined_date: new Date().toISOString().split('T')[0],
        current_status: 'active',
      })
      .select()
      .single();

    if (membershipError) {
      console.error('[Disciples] Membership error:', membershipError);
      return NextResponse.json({ error: 'Failed to add disciple to group' }, { status: 500 });
    }

    // Send Daily DNA app invitation email (fire-and-forget)
    sendDailyDNAInvitationEmail(
      normalizedEmail,
      name.trim(),
      session.name || 'Your DNA Leader',
      group.group_name
    ).catch(err => console.error('[Disciples] Email send error:', err));

    return NextResponse.json({
      success: true,
      disciple: {
        id: discipleId,
        membership_id: membership.id,
      },
    });

  } catch (error) {
    console.error('[Disciples] Add error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/groups/[id]/disciples
// List disciples in a group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a DNA leader
    if (!hasRole(session, 'dna_leader')) {
      return NextResponse.json(
        { error: 'Forbidden - DNA leader access required' },
        { status: 403 }
      );
    }

    const { id: groupId } = await params;
    const supabase = getSupabaseAdmin();

    // Get DNA leader record
    const { data: dnaLeader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', session.email)
      .single();

    if (!dnaLeader) {
      return NextResponse.json(
        { error: 'DNA leader not found' },
        { status: 404 }
      );
    }

    const leaderId = dnaLeader.id;

    // Verify ownership
    const { data: group } = await supabase
      .from('dna_groups')
      .select('leader_id, co_leader_id')
      .eq('id', groupId)
      .single();

    if (!group || (group.leader_id !== leaderId && group.co_leader_id !== leaderId)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get disciples
    const { data: groupDisciples, error } = await supabase
      .from('group_disciples')
      .select(`
        id,
        joined_date,
        current_status,
        disciple:disciples(
          id,
          name,
          email,
          phone
        )
      `)
      .eq('group_id', groupId)
      .order('joined_date', { ascending: true });

    if (error) {
      console.error('[Disciples] List error:', error);
      return NextResponse.json({ error: 'Failed to fetch disciples' }, { status: 500 });
    }

    const disciples = (groupDisciples || [])
      .filter(gd => gd.disciple)
      .map(gd => {
        const disciple = gd.disciple as unknown as { id: string; name: string; email: string; phone?: string };
        return {
          id: disciple.id,
          name: disciple.name,
          email: disciple.email,
          phone: disciple.phone,
          joined_date: gd.joined_date,
          current_status: gd.current_status,
        };
      });

    return NextResponse.json({ disciples });

  } catch (error) {
    console.error('[Disciples] List error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
