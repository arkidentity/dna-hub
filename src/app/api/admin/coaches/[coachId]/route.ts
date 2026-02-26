import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';
import { ensureCoachAccount } from '@/lib/coachAuth';

/**
 * PATCH /api/admin/coaches/[coachId]
 * Updates an existing DNA coach. Admin-only.
 * Body: { name?, email?, phone?, booking_embed? }
 * If email is set, re-provisions the login account (fire-and-forget).
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
    const { name, email, phone, booking_embed } = body;

    if (name !== undefined && !name?.trim()) {
      return NextResponse.json({ error: 'Coach name cannot be empty' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) updates.email = email?.trim() || null;
    if (phone !== undefined) updates.phone = phone?.trim() || null;
    if (booking_embed !== undefined) updates.booking_embed = booking_embed?.trim() || null;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('dna_coaches')
      .update(updates)
      .eq('id', coachId)
      .select('id, name, email, phone, booking_embed, user_id, created_at')
      .single();

    if (error) {
      console.error('[ADMIN] Coach update error:', error);
      return NextResponse.json({ error: 'Failed to update coach' }, { status: 500 });
    }

    // Re-provision login account if coach has an email (fire-and-forget)
    const resolvedEmail = data.email;
    const resolvedName = data.name;
    if (resolvedEmail) {
      void (async () => {
        await ensureCoachAccount(coachId, resolvedEmail, resolvedName);
      })();
    }

    return NextResponse.json({ coach: data });
  } catch (error) {
    console.error('[ADMIN] Coach PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/coaches/[coachId]
 * Deletes a DNA coach. Admin-only.
 * FK cascades:
 *   - churches.coach_id → SET NULL (unassigns from churches)
 *   - church_demo_settings.coach_id → SET NULL (unassigns from demo settings)
 * NOTE: The linked user account and dna_coach role row are NOT deleted automatically.
 *       Remove manually in Supabase Auth if needed.
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
