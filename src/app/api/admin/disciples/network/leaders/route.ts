import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';
import { getSupabaseAdmin } from '@/lib/auth';

// GET /api/admin/disciples/network/leaders?q=search
// Returns DNA leaders for the link-to-leader picker
export async function GET(request: NextRequest) {
  const session = await getUnifiedSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const q = request.nextUrl.searchParams.get('q')?.trim().toLowerCase() || '';

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('dna_leaders')
    .select('id, name, email, church_id, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(50);

  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching leaders:', error);
    return NextResponse.json({ error: 'Failed to fetch leaders' }, { status: 500 });
  }

  return NextResponse.json({ leaders: data || [] });
}
