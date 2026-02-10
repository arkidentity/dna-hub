import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { id } = await params;

    const { name, description, file_url, resource_type, category, display_order, is_active } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (resource_type && !['pdf', 'video', 'link'].includes(resource_type)) {
      return NextResponse.json({ error: 'Valid resource_type is required (pdf, video, link)' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      name,
      description: description || null,
      resource_type: resource_type || 'pdf',
      category: category || null,
      display_order: display_order ?? 0,
      is_active: is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    // Only update file_url if provided
    if (file_url !== undefined) {
      updates.file_url = file_url || null;
    }

    const { data: resource, error } = await supabase
      .from('global_resources')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[ADMIN] Resource update error:', error);
      return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
    }

    return NextResponse.json({ resource });
  } catch (error) {
    console.error('[ADMIN] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { id } = await params;

    // Get the resource to check if there's a file to delete
    const { data: resource } = await supabase
      .from('global_resources')
      .select('file_url, resource_type')
      .eq('id', id)
      .single();

    // Delete the file from storage if it's a PDF
    if (resource?.file_url && resource.resource_type === 'pdf') {
      const urlParts = resource.file_url.split('/global-resources/');
      if (urlParts.length === 2) {
        const filePath = urlParts[1];
        await supabase.storage.from('global-resources').remove([filePath]);
      }
    }

    // Delete the resource record
    const { error } = await supabase
      .from('global_resources')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[ADMIN] Resource delete error:', error);
      return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
