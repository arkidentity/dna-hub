import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

/**
 * GET /api/admin/coaches
 * Returns all DNA coaches ordered by name.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('dna_coaches')
      .select('id, name, email, booking_embed, created_at')
      .order('name', { ascending: true });

    if (error) {
      console.error('[ADMIN] Coaches fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch coaches' }, { status: 500 });
    }

    return NextResponse.json({ coaches: data ?? [] });
  } catch (error) {
    console.error('[ADMIN] Coaches GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/coaches
 * Creates a new DNA coach.
 * Body: { name, email?, booking_embed? }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { name, email, booking_embed } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Coach name is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('dna_coaches')
      .insert({
        name: name.trim(),
        email: email?.trim() || null,
        booking_embed: booking_embed?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .select('id, name, email, booking_embed, created_at')
      .single();

    if (error) {
      console.error('[ADMIN] Coach create error:', error);
      return NextResponse.json({ error: 'Failed to create coach' }, { status: 500 });
    }

    return NextResponse.json({ coach: data }, { status: 201 });
  } catch (error) {
    console.error('[ADMIN] Coaches POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
