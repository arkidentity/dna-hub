import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin, isAdminOrCoach, isChurchLeader } from '@/lib/unified-auth';

async function authorize(churchId: string) {
  const session = await getUnifiedSession();
  if (!session) return null;
  if (isAdmin(session) || isAdminOrCoach(session) || isChurchLeader(session, churchId)) {
    return session;
  }
  return null;
}

// Helper: verify service exists and user has access
async function getServiceChurchId(serviceId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('interactive_services')
    .select('church_id')
    .eq('id', serviceId)
    .single();
  return data?.church_id || null;
}

// ============================================
// POST — Add a block to the service
// Body: { blockType, config?, sortOrder? }
// ============================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params;
    const churchId = await getServiceChurchId(serviceId);

    if (!churchId) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const session = await authorize(churchId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { blockType, config } = body;

    if (!blockType) {
      return NextResponse.json({ error: 'blockType is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get the next sort_order
    const { data: lastBlock } = await supabase
      .from('service_blocks')
      .select('sort_order')
      .eq('service_id', serviceId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (lastBlock?.sort_order ?? -1) + 1;

    const { data: block, error } = await supabase
      .from('service_blocks')
      .insert({
        service_id: serviceId,
        block_type: blockType,
        config: config || {},
        sort_order: body.sortOrder ?? nextOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('[ADMIN] Block POST error:', error);
      return NextResponse.json({ error: 'Failed to add block' }, { status: 500 });
    }

    return NextResponse.json({ success: true, block });
  } catch (err) {
    console.error('[ADMIN] Block POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PUT — Update a block's config
// Body: { blockId, config }
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params;
    const churchId = await getServiceChurchId(serviceId);

    if (!churchId) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const session = await authorize(churchId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { blockId, config } = body;

    if (!blockId || !config) {
      return NextResponse.json({ error: 'blockId and config are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('service_blocks')
      .update({ config })
      .eq('id', blockId)
      .eq('service_id', serviceId)
      .select()
      .single();

    if (error) {
      console.error('[ADMIN] Block PUT error:', error);
      return NextResponse.json({ error: 'Failed to update block' }, { status: 500 });
    }

    return NextResponse.json({ success: true, block: data });
  } catch (err) {
    console.error('[ADMIN] Block PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PATCH — Reorder blocks
// Body: { blocks: [{ id, sortOrder }] }
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params;
    const churchId = await getServiceChurchId(serviceId);

    if (!churchId) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const session = await authorize(churchId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { blocks } = body;

    if (!blocks || !Array.isArray(blocks)) {
      return NextResponse.json({ error: 'blocks array is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Update each block's sort_order
    const updates = blocks.map((b: { id: string; sortOrder: number }) =>
      supabase
        .from('service_blocks')
        .update({ sort_order: b.sortOrder })
        .eq('id', b.id)
        .eq('service_id', serviceId)
    );

    await Promise.all(updates);

    // Return updated block list
    const { data: updatedBlocks } = await supabase
      .from('service_blocks')
      .select('*')
      .eq('service_id', serviceId)
      .order('sort_order', { ascending: true });

    return NextResponse.json({ success: true, blocks: updatedBlocks || [] });
  } catch (err) {
    console.error('[ADMIN] Block PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// DELETE — Remove a block and renumber remaining
// Body: { blockId }
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params;
    const churchId = await getServiceChurchId(serviceId);

    if (!churchId) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const session = await authorize(churchId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { blockId } = body;

    if (!blockId) {
      return NextResponse.json({ error: 'blockId is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Delete the block
    const { error } = await supabase
      .from('service_blocks')
      .delete()
      .eq('id', blockId)
      .eq('service_id', serviceId);

    if (error) {
      console.error('[ADMIN] Block DELETE error:', error);
      return NextResponse.json({ error: 'Failed to delete block' }, { status: 500 });
    }

    // Renumber remaining blocks
    const { data: remaining } = await supabase
      .from('service_blocks')
      .select('id')
      .eq('service_id', serviceId)
      .order('sort_order', { ascending: true });

    if (remaining && remaining.length > 0) {
      const renumbers = remaining.map((b, i) =>
        supabase
          .from('service_blocks')
          .update({ sort_order: i })
          .eq('id', b.id)
      );
      await Promise.all(renumbers);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[ADMIN] Block DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
