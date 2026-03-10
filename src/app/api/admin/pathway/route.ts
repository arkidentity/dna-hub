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
// GET — Fetch pathway for a church + phase
// Query: ?church_id=UUID&phase=1
// Returns the church's custom pathway, or ARK default if none exists.
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const churchId = searchParams.get('church_id');
    const phase = parseInt(searchParams.get('phase') || '1', 10);

    if (!churchId) {
      return NextResponse.json({ error: 'church_id is required' }, { status: 400 });
    }

    const session = await authorize(churchId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Try church-specific pathway first
    let { data: pathway } = await supabase
      .from('church_pathways')
      .select('*')
      .eq('church_id', churchId)
      .eq('phase', phase)
      .single();

    let isDefault = false;

    // Fall back to ARK default
    if (!pathway) {
      const { data: defaultPathway } = await supabase
        .from('church_pathways')
        .select('*')
        .is('church_id', null)
        .eq('phase', phase)
        .single();

      pathway = defaultPathway;
      isDefault = true;
    }

    if (!pathway) {
      return NextResponse.json({ pathway: null, items: [], isDefault: true });
    }

    // Fetch items with tool details
    const { data: items, error: itemsError } = await supabase
      .from('church_pathway_items')
      .select('*, pathway_tools(*)')
      .eq('pathway_id', pathway.id)
      .order('week_number', { ascending: true });

    if (itemsError) {
      console.error('[ADMIN] Pathway items GET error:', itemsError);
      return NextResponse.json({ error: 'Failed to fetch pathway items' }, { status: 500 });
    }

    return NextResponse.json({
      pathway,
      items: items || [],
      isDefault,
    });
  } catch (err) {
    console.error('[ADMIN] Pathway GET exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PUT — Save an entire pathway for a church + phase
// Body: { churchId, phase, weekCount, items: [{ weekNumber, toolId }] }
// Upserts church_pathways, replaces all church_pathway_items.
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { churchId, phase, weekCount, items } = body;

    if (!churchId || !phase || !weekCount || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const session = await authorize(churchId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Upsert the church pathway
    const { data: pathway, error: pathwayError } = await supabase
      .from('church_pathways')
      .upsert(
        {
          church_id: churchId,
          phase,
          week_count: weekCount,
          is_customized: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'church_id,phase' }
      )
      .select()
      .single();

    if (pathwayError || !pathway) {
      console.error('[ADMIN] Pathway upsert error:', pathwayError);
      return NextResponse.json({ error: 'Failed to save pathway' }, { status: 500 });
    }

    // Delete existing items
    const { error: deleteError } = await supabase
      .from('church_pathway_items')
      .delete()
      .eq('pathway_id', pathway.id);

    if (deleteError) {
      console.error('[ADMIN] Pathway items delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to clear existing items' }, { status: 500 });
    }

    // Insert new items
    if (items.length > 0) {
      const insertItems = items.map((item: { weekNumber: number; toolId: number }) => ({
        pathway_id: pathway.id,
        week_number: item.weekNumber,
        tool_id: item.toolId,
      }));

      const { error: insertError } = await supabase
        .from('church_pathway_items')
        .insert(insertItems);

      if (insertError) {
        console.error('[ADMIN] Pathway items insert error:', insertError);
        return NextResponse.json({ error: 'Failed to save pathway items' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, pathway });
  } catch (err) {
    console.error('[ADMIN] Pathway PUT exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// DELETE — Reset pathway to ARK default
// Query: ?church_id=UUID&phase=1
// Deletes the church_pathways row (cascade deletes items).
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const churchId = searchParams.get('church_id');
    const phase = parseInt(searchParams.get('phase') || '1', 10);

    if (!churchId) {
      return NextResponse.json({ error: 'church_id is required' }, { status: 400 });
    }

    const session = await authorize(churchId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('church_pathways')
      .delete()
      .eq('church_id', churchId)
      .eq('phase', phase);

    if (error) {
      console.error('[ADMIN] Pathway DELETE error:', error);
      return NextResponse.json({ error: 'Failed to reset pathway' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[ADMIN] Pathway DELETE exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
