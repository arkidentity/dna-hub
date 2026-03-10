import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession } from '@/lib/unified-auth';

// ============================================
// GET — List all active tools from the pathway library
// ============================================
export async function GET() {
  try {
    const session = await getUnifiedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('pathway_tools')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[ADMIN] Pathway tools GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
    }

    return NextResponse.json({ tools: data || [] });
  } catch (err) {
    console.error('[ADMIN] Pathway tools GET exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
