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

// ============================================
// GET — Fetch guests for a church
// Query: ?church_id=UUID&status=all|active|merged
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const churchId = searchParams.get('church_id');
    const statusFilter = searchParams.get('status') || 'all';

    if (!churchId) {
      return NextResponse.json({ error: 'church_id is required' }, { status: 400 });
    }

    const session = await authorize(churchId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('church_guests')
      .select('id, name, email, phone, visit_count, first_visit_at, last_visit_at, merged_to_user_id, created_at')
      .eq('church_id', churchId)
      .order('last_visit_at', { ascending: false });

    if (statusFilter === 'active') {
      query = query.is('merged_to_user_id', null);
    } else if (statusFilter === 'merged') {
      query = query.not('merged_to_user_id', 'is', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Guests fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch guests' }, { status: 500 });
    }

    return NextResponse.json({ guests: data || [] });
  } catch (err) {
    console.error('Guests API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
