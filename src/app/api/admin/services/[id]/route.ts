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

// Helper: get service and verify church access
async function getServiceWithAuth(serviceId: string) {
  const supabase = getSupabaseAdmin();
  const { data: service } = await supabase
    .from('interactive_services')
    .select('*')
    .eq('id', serviceId)
    .single();

  if (!service) return { service: null, session: null };

  const session = await authorize(service.church_id);
  return { service, session };
}

// ============================================
// GET — Single service with all blocks
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params;
    const { service, session } = await getServiceWithAuth(serviceId);

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: blocks } = await supabase
      .from('service_blocks')
      .select('*')
      .eq('service_id', serviceId)
      .order('sort_order', { ascending: true });

    return NextResponse.json({ service, blocks: blocks || [] });
  } catch (err) {
    console.error('[ADMIN] Service GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PUT — Update service metadata
// Body: { title?, serviceDate?, templateName? }
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params;
    const { service, session } = await getServiceWithAuth(serviceId);

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.title !== undefined) update.title = body.title;
    if (body.serviceDate !== undefined) update.service_date = body.serviceDate || null;
    if (body.templateName !== undefined) update.template_name = body.templateName || null;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('interactive_services')
      .update(update)
      .eq('id', serviceId)
      .select()
      .single();

    if (error) {
      console.error('[ADMIN] Service PUT error:', error);
      return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }

    return NextResponse.json({ success: true, service: data });
  } catch (err) {
    console.error('[ADMIN] Service PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PATCH — Status/action operations
// Body: { action, churchId }
// Actions: publish, unpublish, archive, duplicate, save_as_template
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params;
    const body = await request.json();
    const { action } = body;

    const { service, session } = await getServiceWithAuth(serviceId);
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Status change actions
    if (action === 'publish' || action === 'unpublish' || action === 'archive') {
      const statusMap: Record<string, string> = {
        publish: 'published',
        unpublish: 'draft',
        archive: 'archived',
      };

      const { data, error } = await supabase
        .from('interactive_services')
        .update({ status: statusMap[action], updated_at: new Date().toISOString() })
        .eq('id', serviceId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
      }

      return NextResponse.json({ success: true, service: data });
    }

    // Clone actions (duplicate or save_as_template)
    if (action === 'duplicate' || action === 'save_as_template') {
      const isTemplate = action === 'save_as_template';

      // Look up user for created_by
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', session.email)
        .maybeSingle();

      // Clone the service
      const { data: newService, error: cloneError } = await supabase
        .from('interactive_services')
        .insert({
          church_id: service.church_id,
          title: isTemplate ? service.title : `${service.title} (Copy)`,
          service_date: isTemplate ? null : service.service_date,
          created_by: user?.id || null,
          status: 'draft',
          is_template: isTemplate,
          template_name: isTemplate ? (body.templateName || service.title) : null,
        })
        .select()
        .single();

      if (cloneError) {
        return NextResponse.json({ error: 'Failed to clone service' }, { status: 500 });
      }

      // Clone blocks
      const { data: sourceBlocks } = await supabase
        .from('service_blocks')
        .select('block_type, config, sort_order')
        .eq('service_id', serviceId)
        .order('sort_order', { ascending: true });

      if (sourceBlocks && sourceBlocks.length > 0) {
        await supabase.from('service_blocks').insert(
          sourceBlocks.map((b) => ({
            service_id: newService.id,
            block_type: b.block_type,
            config: b.config,
            sort_order: b.sort_order,
          }))
        );
      }

      return NextResponse.json({ success: true, service: newService });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[ADMIN] Service PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// DELETE — Delete a service (CASCADE deletes blocks)
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params;
    const { service, session } = await getServiceWithAuth(serviceId);

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('interactive_services')
      .delete()
      .eq('id', serviceId);

    if (error) {
      console.error('[ADMIN] Service DELETE error:', error);
      return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[ADMIN] Service DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
