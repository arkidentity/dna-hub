import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole, isAdmin } from '@/lib/unified-auth';

// GET /api/groups/[id]/phase
// Get current group phase state
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(hasRole(session, 'dna_leader') || hasRole(session, 'church_leader') || isAdmin(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: groupId } = await params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('group_phase_state')
      .select('*')
      .eq('group_id', groupId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[GROUPS] Phase GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch phase state' }, { status: 500 });
    }

    // Default to phase 1 if no row exists
    return NextResponse.json({
      phase_state: data || {
        group_id: groupId,
        current_phase: 1,
        phase_2_unlocked_at: null,
      },
    });
  } catch (err) {
    console.error('[GROUPS] Phase GET exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/groups/[id]/phase
// Advance group to Phase 2
// Body: { phase: 2 }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(hasRole(session, 'dna_leader') || hasRole(session, 'church_leader') || isAdmin(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: groupId } = await params;
    const body = await request.json();
    const { phase } = body;

    if (phase !== 2) {
      return NextResponse.json({ error: 'Can only advance to phase 2' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Upsert group phase state
    const { data, error } = await supabase
      .from('group_phase_state')
      .upsert(
        {
          group_id: groupId,
          current_phase: 2,
          phase_2_unlocked_at: new Date().toISOString(),
          unlocked_by: session.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'group_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('[GROUPS] Phase POST error:', error);
      return NextResponse.json({ error: 'Failed to advance phase' }, { status: 500 });
    }

    return NextResponse.json({ phase_state: data });
  } catch (err) {
    console.error('[GROUPS] Phase POST exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
