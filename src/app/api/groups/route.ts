import { NextRequest, NextResponse } from 'next/server';
import { getDNALeaderSession, getSupabaseAdmin } from '@/lib/auth';

// POST /api/groups
// Create a new DNA group
export async function POST(request: NextRequest) {
  try {
    const session = await getDNALeaderSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { group_name, start_date, multiplication_target_date } = body;

    // Validate required fields
    if (!group_name || !group_name.trim()) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    if (!start_date) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Create the group
    const { data: newGroup, error: insertError } = await supabase
      .from('dna_groups')
      .insert({
        group_name: group_name.trim(),
        leader_id: session.leader.id,
        church_id: session.leader.church_id || null,
        start_date,
        multiplication_target_date: multiplication_target_date || null,
        current_phase: 'pre-launch',
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Groups] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create group' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      group: newGroup,
    });

  } catch (error) {
    console.error('[Groups] Create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/groups
// List all groups for the current DNA leader
export async function GET() {
  try {
    const session = await getDNALeaderSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const leaderId = session.leader.id;

    // Get all groups where this person is leader or co-leader
    const { data: groups, error } = await supabase
      .from('dna_groups')
      .select(`
        id,
        group_name,
        current_phase,
        start_date,
        multiplication_target_date,
        is_active,
        leader_id,
        co_leader_id,
        created_at
      `)
      .or(`leader_id.eq.${leaderId},co_leader_id.eq.${leaderId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Groups] List error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch groups' },
        { status: 500 }
      );
    }

    return NextResponse.json({ groups: groups || [] });

  } catch (error) {
    console.error('[Groups] List error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
