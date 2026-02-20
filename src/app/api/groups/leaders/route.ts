import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole } from '@/lib/unified-auth';

// GET /api/groups/leaders
// List available DNA leaders for co-leader selection
export async function GET(request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(hasRole(session, 'dna_leader') || hasRole(session, 'church_leader'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const supabase = getSupabaseAdmin();

    // Get current leader
    const { data: currentLeader } = await supabase
      .from('dna_leaders')
      .select('id, church_id')
      .eq('email', session.email)
      .single();

    if (!currentLeader) return NextResponse.json({ error: 'DNA leader not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const emailSearch = searchParams.get('email')?.toLowerCase().trim();

    // Independent leaders (no church_id) only get results when searching by email
    if (!currentLeader.church_id && !emailSearch) {
      return NextResponse.json({ leaders: [] });
    }

    let query = supabase
      .from('dna_leaders')
      .select('id, name, email, church_id')
      .eq('is_active', true)
      .neq('id', currentLeader.id)
      .not('activated_at', 'is', null)
      .order('name', { ascending: true });

    if (emailSearch) {
      // Email search: look up by exact email across the whole network
      query = query.ilike('email', emailSearch);
    } else {
      // Church leaders: default to same church
      query = query.eq('church_id', currentLeader.church_id);
    }

    const { data: leaders, error } = await query;

    if (error) {
      console.error('[Leaders] List error:', error);
      return NextResponse.json({ error: 'Failed to fetch leaders' }, { status: 500 });
    }

    return NextResponse.json({
      leaders: (leaders || []).map(l => ({
        id: l.id,
        name: l.name,
        email: l.email,
      })),
    });

  } catch (error) {
    console.error('[Leaders] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
