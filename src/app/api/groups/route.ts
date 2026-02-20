import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole } from '@/lib/unified-auth';

// POST /api/groups
// Create a new DNA group
export async function POST(request: NextRequest) {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a DNA leader
    if (!(hasRole(session, 'dna_leader') || hasRole(session, 'church_leader'))) {
      return NextResponse.json(
        { error: 'Forbidden - DNA leader access required' },
        { status: 403 }
      );
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

    // Get DNA leader record
    const { data: dnaLeader } = await supabase
      .from('dna_leaders')
      .select('id, church_id')
      .eq('email', session.email)
      .single();

    if (!dnaLeader) {
      return NextResponse.json(
        { error: 'DNA leader not found' },
        { status: 404 }
      );
    }

    // Create the group
    const { data: newGroup, error: insertError } = await supabase
      .from('dna_groups')
      .insert({
        group_name: group_name.trim(),
        leader_id: dnaLeader.id,
        church_id: dnaLeader.church_id || null,
        start_date,
        multiplication_target_date: multiplication_target_date || null,
        current_phase: 'pre-launch',
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Groups] Insert error:', insertError.code, insertError.message, insertError.details, insertError.hint);
      return NextResponse.json(
        { error: `Failed to create group: ${insertError.message}` },
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
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a DNA leader
    if (!(hasRole(session, 'dna_leader') || hasRole(session, 'church_leader'))) {
      return NextResponse.json(
        { error: 'Forbidden - DNA leader access required' },
        { status: 403 }
      );
    }

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
