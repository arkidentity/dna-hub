import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

/**
 * PATCH /api/admin/coaches/[coachId]
 * Updates an existing DNA coach.
 * Body: { name?, email?, booking_embed? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { coachId } = await params;
    const body = await request.json();
    const { name, email, booking_embed } = body;

    if (name !== undefined && !name?.trim()) {
      return NextResponse.json({ error: 'Coach name cannot be empty' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) updates.email = email?.trim() || null;
    if (booking_embed !== undefined) updates.booking_embed = booking_embed?.trim() || null;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('dna_coaches')
      .update(updates)
      .eq('id', coachId)
      .select('id, name, email, booking_embed, created_at')
      .single();

    if (error) {
      console.error('[ADMIN] Coach update error:', error);
      return NextResponse.json({ error: 'Failed to update coach' }, { status: 500 });
    }

    return NextResponse.json({ coach: data });
  } catch (error) {
    console.error('[ADMIN] Coach PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/coaches/[coachId]
 * Deletes a DNA coach. church_demo_settings.coach_id will be SET NULL via FK cascade.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { coachId } = await params;
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('dna_coaches')
      .delete()
      .eq('id', coachId);

    if (error) {
      console.error('[ADMIN] Coach delete error:', error);
      return NextResponse.json({ error: 'Failed to delete coach' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] Coach DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
