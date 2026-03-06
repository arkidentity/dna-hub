import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin, isAdminOrCoach, isChurchLeader } from '@/lib/unified-auth';

// ============================================
// Auth helper: admin, coach, or church leader
// ============================================
async function authorize(churchId: string) {
  const session = await getUnifiedSession();
  if (!session) return null;
  if (isAdmin(session) || isAdminOrCoach(session) || isChurchLeader(session, churchId)) {
    return session;
  }
  return null;
}

// ============================================
// GET — Fetch active creed push + history for a church
// Query: ?church_id=UUID
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const churchId = searchParams.get('church_id');

    if (!churchId) {
      return NextResponse.json({ error: 'church_id is required' }, { status: 400 });
    }

    const session = await authorize(churchId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Active push (not expired)
    const { data: activePushes } = await supabase
      .from('church_creed_pushes')
      .select('id, card_id, pushed_by, pushed_at, expires_at')
      .eq('church_id', churchId)
      .gt('expires_at', new Date().toISOString())
      .order('pushed_at', { ascending: false })
      .limit(1);

    // Push history (last 10)
    const { data: history } = await supabase
      .from('church_creed_pushes')
      .select('id, card_id, pushed_by, pushed_at, expires_at')
      .eq('church_id', churchId)
      .order('pushed_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      activePush: activePushes?.[0] || null,
      history: history || [],
    });
  } catch (err) {
    console.error('[ADMIN] Creed push GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST — Push a creed card to the church
// Body: { churchId, cardId }
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { churchId, cardId } = body;

    if (!churchId || !cardId) {
      return NextResponse.json({ error: 'churchId and cardId are required' }, { status: 400 });
    }

    if (typeof cardId !== 'number' || cardId < 1 || cardId > 50) {
      return NextResponse.json({ error: 'cardId must be between 1 and 50' }, { status: 400 });
    }

    const session = await authorize(churchId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('church_creed_pushes')
      .insert({
        church_id: churchId,
        card_id: cardId,
        pushed_by: session.userId,
      })
      .select('id, card_id, pushed_at, expires_at')
      .single();

    if (error) {
      console.error('[ADMIN] Creed push POST error:', error);
      return NextResponse.json({ error: 'Failed to push creed card' }, { status: 500 });
    }

    return NextResponse.json({ success: true, push: data });
  } catch (err) {
    console.error('[ADMIN] Creed push POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
