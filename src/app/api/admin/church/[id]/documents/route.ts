import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';
import { logDocumentUpload } from '@/lib/audit';

// GET - Get document version history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: churchId } = await params;
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow both admins and church leaders to view version history
    const isAdminUser = isAdmin(session);
    if (!isAdminUser && session.churchId !== churchId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('document_type');

    const supabase = getSupabaseAdmin();

    // Get the document
    let query = supabase
      .from('funnel_documents')
      .select('id, document_type, file_url, notes, current_version, uploaded_by, created_at, updated_at')
      .eq('church_id', churchId);

    if (documentType) {
      query = query.eq('document_type', documentType);
    }

    const { data: documents, error: docError } = await query;

    if (docError) {
      console.error('[ADMIN DOCUMENTS] GET docs error:', docError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    // For each document, get version history
    const documentsWithVersions = await Promise.all(
      (documents || []).map(async (doc) => {
        const { data: versions } = await supabase
          .from('document_versions')
          .select('id, version_number, file_url, file_name, file_size, uploaded_by, notes, created_at')
          .eq('document_id', doc.id)
          .order('version_number', { ascending: false });

        return {
          ...doc,
          versions: versions || [],
        };
      })
    );

    return NextResponse.json({ documents: documentsWithVersions });
  } catch (error) {
    console.error('[ADMIN DOCUMENTS] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save document notes
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: churchId } = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { document_type, notes } = await request.json();

    if (!document_type) {
      return NextResponse.json({ error: 'Document type required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Check if document exists
    const { data: existing } = await supabase
      .from('funnel_documents')
      .select('id')
      .eq('church_id', churchId)
      .eq('document_type', document_type)
      .single();

    if (existing) {
      // Update existing
      await supabase
        .from('funnel_documents')
        .update({
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Create new
      await supabase
        .from('funnel_documents')
        .insert({
          church_id: churchId,
          document_type,
          notes,
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN DOCUMENTS] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Upload document file
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: churchId } = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('document_type') as string;

    if (!file || !documentType) {
      return NextResponse.json({ error: 'File and document type required' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Upload to Supabase Storage
    const fileName = `${churchId}/${documentType}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('funnel-documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[ADMIN DOCUMENTS] Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('funnel-documents')
      .getPublicUrl(fileName);

    const fileUrl = urlData.publicUrl;

    // Check if document exists
    const { data: existing } = await supabase
      .from('funnel_documents')
      .select('id')
      .eq('church_id', churchId)
      .eq('document_type', documentType)
      .single();

    let documentId: string;

    if (existing) {
      // Update existing - the database trigger will archive the old version
      await supabase
        .from('funnel_documents')
        .update({
          file_url: fileUrl,
          uploaded_by: session.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      documentId = existing.id;
    } else {
      // Create new
      const { data: newDoc } = await supabase
        .from('funnel_documents')
        .insert({
          church_id: churchId,
          document_type: documentType,
          file_url: fileUrl,
          uploaded_by: session.email,
          current_version: 1,
        })
        .select('id')
        .single();
      documentId = newDoc?.id || churchId;
    }

    // Log the document upload
    await logDocumentUpload(
      session.email,
      documentId,
      churchId,
      documentType,
      file.name
    );

    return NextResponse.json({ success: true, file_url: fileUrl });
  } catch (error) {
    console.error('[ADMIN DOCUMENTS] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
