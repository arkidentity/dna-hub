import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

// POST - Schedule a new call
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: churchId } = await params;
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { call_type, scheduled_at } = await request.json();

    if (!call_type || !scheduled_at) {
      return NextResponse.json({ error: 'Call type and scheduled_at required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('scheduled_calls')
      .insert({
        church_id: churchId,
        call_type,
        scheduled_at,
        completed: false,
      });

    if (error) {
      console.error('[ADMIN CALLS] Insert error:', error);
      return NextResponse.json({ error: 'Failed to schedule call' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN CALLS] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update call (mark complete, add notes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: churchId } = await params;
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { call_id, completed, notes } = await request.json();

    if (!call_id) {
      return NextResponse.json({ error: 'Call ID required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof completed === 'boolean') {
      updates.completed = completed;
    }
    if (notes !== undefined) {
      updates.notes = notes;
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('scheduled_calls')
      .update(updates)
      .eq('id', call_id)
      .eq('church_id', churchId);

    if (error) {
      console.error('[ADMIN CALLS] Update error:', error);
      return NextResponse.json({ error: 'Failed to update call' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN CALLS] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove scheduled call
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: churchId } = await params;
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('call_id');

    if (!callId) {
      return NextResponse.json({ error: 'Call ID required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('scheduled_calls')
      .delete()
      .eq('id', callId)
      .eq('church_id', churchId);

    if (error) {
      console.error('[ADMIN CALLS] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete call' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN CALLS] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
