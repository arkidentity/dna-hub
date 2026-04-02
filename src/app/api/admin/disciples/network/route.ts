import { NextResponse } from 'next/server';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';
import { getSupabaseAdmin } from '@/lib/auth';

// GET /api/admin/disciples/network
// Returns all app users across all churches (admin only)
export async function GET() {
  const session = await getUnifiedSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('get_all_disciples');

    if (error) throw error;

    return NextResponse.json({ disciples: data || [] });
  } catch (error) {
    console.error('Error fetching network disciples:', error);
    return NextResponse.json({ error: 'Failed to fetch disciples' }, { status: 500 });
  }
}
