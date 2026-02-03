import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

// GET: Fetch scheduled calls with optional filters
export async function GET(request: Request) {
  try {
    const session = await getUnifiedSession();
    if (!session || !isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const churchId = searchParams.get('churchId');
    const callType = searchParams.get('callType');
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('scheduled_calls')
      .select(`
        *,
        church:church_id (id, name),
        milestone:milestone_id (id, title)
      `)
      .order('scheduled_at', { ascending: false })
      .limit(limit);

    if (churchId) {
      query = query.eq('church_id', churchId);
    }

    if (callType) {
      query = query.eq('call_type', callType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[CALLS] Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
    }

    return NextResponse.json({ calls: data || [] });
  } catch (error) {
    console.error('[CALLS] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH: Update a scheduled call (reassign church, change type, link to milestone)
export async function PATCH(request: Request) {
  try {
    const session = await getUnifiedSession();
    if (!session || !isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { callId, churchId, callType, milestoneId, completed, notes } = body;

    if (!callId) {
      return NextResponse.json({ error: 'callId is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};
    if (churchId !== undefined) updates.church_id = churchId;
    if (callType !== undefined) updates.call_type = callType;
    if (milestoneId !== undefined) updates.milestone_id = milestoneId;
    if (completed !== undefined) updates.completed = completed;
    if (notes !== undefined) updates.notes = notes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('scheduled_calls')
      .update(updates)
      .eq('id', callId)
      .select(`
        *,
        church:church_id (id, name),
        milestone:milestone_id (id, title)
      `)
      .single();

    if (error) {
      console.error('[CALLS] Update error:', error);
      return NextResponse.json({ error: 'Failed to update call' }, { status: 500 });
    }

    return NextResponse.json({ success: true, call: data });
  } catch (error) {
    console.error('[CALLS] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE: Remove a scheduled call (unlink from system, keeps in Google Calendar)
export async function DELETE(request: Request) {
  try {
    const session = await getUnifiedSession();
    if (!session || !isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('id');

    if (!callId) {
      return NextResponse.json({ error: 'Call ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('scheduled_calls')
      .delete()
      .eq('id', callId);

    if (error) {
      console.error('[CALLS] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete call' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CALLS] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
