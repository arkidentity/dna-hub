import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole } from '@/lib/unified-auth';

// Helper: verify DNA leader owns this group and disciple is in it
async function verifyAccess(session: { email: string }, groupId: string, discipleId: string) {
  const supabase = getSupabaseAdmin();

  // Get DNA leader record
  const { data: dnaLeader } = await supabase
    .from('dna_leaders')
    .select('id, name')
    .eq('email', session.email)
    .single();

  if (!dnaLeader) return { error: 'DNA leader not found', status: 404 };

  // Verify group ownership
  const { data: group } = await supabase
    .from('dna_groups')
    .select('id, leader_id, co_leader_id')
    .eq('id', groupId)
    .single();

  if (!group) return { error: 'Group not found', status: 404 };
  if (group.leader_id !== dnaLeader.id && group.co_leader_id !== dnaLeader.id) {
    return { error: 'Not authorized to access this group', status: 403 };
  }

  // Verify disciple is in this group
  const { data: membership } = await supabase
    .from('group_disciples')
    .select('id')
    .eq('group_id', groupId)
    .eq('disciple_id', discipleId)
    .single();

  if (!membership) return { error: 'Disciple not found in this group', status: 404 };

  return { dnaLeader, supabase };
}

// GET /api/groups/[id]/disciples/[discipleId]/log
// Fetch discipleship log entries for a disciple
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; discipleId: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(hasRole(session, 'dna_leader') || hasRole(session, 'church_leader'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: groupId, discipleId } = await params;
    const access = await verifyAccess(session, groupId, discipleId);
    if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status });

    const { supabase } = access;

    // Optional type filter
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type');

    let query = supabase
      .from('discipleship_log')
      .select('*')
      .eq('group_id', groupId)
      .eq('disciple_id', discipleId)
      .order('created_at', { ascending: false });

    if (typeFilter && ['note', 'prayer', 'milestone'].includes(typeFilter)) {
      query = query.eq('entry_type', typeFilter);
    }

    const { data: entries, error } = await query;

    if (error) {
      console.error('[Discipleship Log] Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch log entries' }, { status: 500 });
    }

    return NextResponse.json({ entries: entries || [] });

  } catch (error) {
    console.error('[Discipleship Log] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/groups/[id]/disciples/[discipleId]/log
// Create a new log entry (note or prayer request)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; discipleId: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(hasRole(session, 'dna_leader') || hasRole(session, 'church_leader'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: groupId, discipleId } = await params;
    const access = await verifyAccess(session, groupId, discipleId);
    if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status });

    const { dnaLeader, supabase } = access;

    const body = await request.json();
    const { entry_type, content } = body;

    // Validate
    if (!entry_type || !['note', 'prayer', 'milestone'].includes(entry_type)) {
      return NextResponse.json({ error: 'Invalid entry_type. Must be note, prayer, or milestone.' }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const { data: entry, error } = await supabase
      .from('discipleship_log')
      .insert({
        group_id: groupId,
        disciple_id: discipleId,
        created_by_leader_id: dnaLeader.id,
        created_by_name: dnaLeader.name,
        entry_type,
        content: content.trim(),
        is_private: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[Discipleship Log] Insert error:', error);
      return NextResponse.json({ error: 'Failed to create log entry' }, { status: 500 });
    }

    return NextResponse.json({ entry });

  } catch (error) {
    console.error('[Discipleship Log] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
