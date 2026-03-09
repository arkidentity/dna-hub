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
// GET — List services for a church
// Query: ?church_id=UUID&status=draft&include_templates=true&include_global=true
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const churchId = searchParams.get('church_id');
    const status = searchParams.get('status');
    const includeTemplates = searchParams.get('include_templates') === 'true';
    const includeGlobal = searchParams.get('include_global') === 'true';

    if (!churchId) {
      return NextResponse.json({ error: 'church_id is required' }, { status: 400 });
    }

    const session = await authorize(churchId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('interactive_services')
      .select('*, service_blocks(id)')
      .eq('church_id', churchId)
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (!includeTemplates) {
      query = query.eq('is_template', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ADMIN] Services GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }

    // Add block_count and strip nested blocks
    const services = (data || []).map((s) => ({
      ...s,
      block_count: s.service_blocks?.length || 0,
      service_blocks: undefined,
    }));

    // Fetch global templates from other churches if requested
    let globalTemplates: typeof services = [];
    if (includeGlobal) {
      const { data: globalData } = await supabase
        .from('interactive_services')
        .select('*, service_blocks(id)')
        .eq('is_template', true)
        .eq('is_global', true)
        .neq('church_id', churchId)
        .order('updated_at', { ascending: false });

      globalTemplates = (globalData || []).map((s) => ({
        ...s,
        block_count: s.service_blocks?.length || 0,
        service_blocks: undefined,
      }));
    }

    return NextResponse.json({ services, globalTemplates });
  } catch (err) {
    console.error('[ADMIN] Services GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST — Create a new service (or clone from existing)
// Body: { churchId, title, serviceDate?, isTemplate?, templateName?, cloneFromId? }
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { churchId, title, serviceDate, isTemplate, templateName, cloneFromId } = body;

    if (!churchId || !title) {
      return NextResponse.json({ error: 'churchId and title are required' }, { status: 400 });
    }

    const session = await authorize(churchId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Look up the user record for created_by FK
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.email)
      .maybeSingle();

    // Create the service
    const { data: service, error } = await supabase
      .from('interactive_services')
      .insert({
        church_id: churchId,
        title,
        service_date: serviceDate || null,
        created_by: user?.id || null,
        is_template: isTemplate || false,
        template_name: templateName || null,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('[ADMIN] Services POST error:', error);
      return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }

    // Clone blocks from source service if requested
    if (cloneFromId) {
      const { data: sourceBlocks } = await supabase
        .from('service_blocks')
        .select('block_type, config, sort_order')
        .eq('service_id', cloneFromId)
        .order('sort_order', { ascending: true });

      if (sourceBlocks && sourceBlocks.length > 0) {
        const clonedBlocks = sourceBlocks.map((b) => ({
          service_id: service.id,
          block_type: b.block_type,
          config: b.config,
          sort_order: b.sort_order,
        }));

        await supabase.from('service_blocks').insert(clonedBlocks);
      }
    }

    return NextResponse.json({ success: true, service });
  } catch (err) {
    console.error('[ADMIN] Services POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
