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
// GET — Fetch all actionable service responses for a church
// (next steps, announcement signups, connect cards)
// Query: ?church_id=UUID
// Optional: &session_id=UUID (filter to one service)
// Optional: &limit=500&offset=0
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const churchId = searchParams.get('church_id');
    const sessionId = searchParams.get('session_id');
    const limit = parseInt(searchParams.get('limit') || '500', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!churchId) {
      return NextResponse.json({ error: 'church_id is required' }, { status: 400 });
    }

    const session = await authorize(churchId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    if (sessionId) {
      const { data, error } = await supabase.rpc('get_service_responses_for_session', {
        p_session_id: sessionId,
      });

      if (error) {
        console.error('Service responses session fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
      }

      return NextResponse.json({ responses: data || [] });
    } else {
      const { data, error } = await supabase.rpc('get_service_responses_for_church', {
        p_church_id: churchId,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('Service responses church fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
      }

      return NextResponse.json({ responses: data || [] });
    }
  } catch (err) {
    console.error('Service responses API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
