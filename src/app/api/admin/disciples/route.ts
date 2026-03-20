import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedSession, hasRole, isAdmin, getPrimaryChurch } from '@/lib/unified-auth';
import { getSupabaseAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getUnifiedSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isAdminUser = isAdmin(session);
  const isChurchLeader = hasRole(session, 'church_leader');
  if (!isAdminUser && !isChurchLeader) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const churchId = request.nextUrl.searchParams.get('church_id');
  if (!churchId) {
    return NextResponse.json({ error: 'church_id required' }, { status: 400 });
  }

  // Church leaders can only view their own church
  if (!isAdminUser) {
    const myChurchId = getPrimaryChurch(session);
    if (myChurchId !== churchId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('get_church_disciples', {
      p_church_id: churchId,
    });

    if (error) throw error;

    return NextResponse.json({ disciples: data || [] });
  } catch (error) {
    console.error('Error fetching church disciples:', error);
    return NextResponse.json({ error: 'Failed to fetch disciples' }, { status: 500 });
  }
}
