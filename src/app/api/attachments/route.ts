import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin, getPrimaryChurch } from '@/lib/unified-auth';

// POST - Upload a file attachment
export async function POST(request: NextRequest) {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const churchId = getPrimaryChurch(session);
    const leaderId = session.userId;

    if (!churchId) {
      return NextResponse.json(
        { error: 'No church associated with session' },
        { status: 400 }
      );
    }

    // Only admins can upload attachments
    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: 'Only admins can upload attachments' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const milestoneId = formData.get('milestoneId') as string;

    if (!file || !milestoneId) {
      return NextResponse.json(
        { error: 'File and milestoneId are required' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Allowed: PDF, PNG, JPG, GIF, DOC, DOCX' },
        { status: 400 }
      );
    }

    // Create unique file path: church_id/milestone_id/filename
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${churchId}/${milestoneId}/${timestamp}-${sanitizedName}`;

    // Upload to Supabase Storage
    const supabase = getSupabaseAdmin();
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('milestone-attachments')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('milestone-attachments')
      .getPublicUrl(filePath);

    // Save attachment record to database
    const { data: attachment, error: dbError } = await supabaseAdmin
      .from('milestone_attachments')
      .insert({
        church_id: churchId,
        milestone_id: milestoneId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: leaderId,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to delete the uploaded file
      await supabase.storage.from('milestone-attachments').remove([filePath]);
      return NextResponse.json(
        { error: 'Failed to save attachment record' },
        { status: 500 }
      );
    }

    return NextResponse.json({ attachment });
  } catch (error) {
    console.error('Attachment upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a file attachment
export async function DELETE(request: NextRequest) {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const churchId = getPrimaryChurch(session);

    if (!churchId) {
      return NextResponse.json(
        { error: 'No church associated with session' },
        { status: 400 }
      );
    }

    // Only admins can delete attachments
    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: 'Only admins can delete attachments' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('id');

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'Attachment ID is required' },
        { status: 400 }
      );
    }

    // Get attachment record
    const { data: attachment, error: fetchError } = await supabaseAdmin
      .from('milestone_attachments')
      .select('*')
      .eq('id', attachmentId)
      .eq('church_id', churchId)
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Extract file path from URL
    const supabase = getSupabaseAdmin();
    const urlParts = attachment.file_url.split('/milestone-attachments/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      // Delete from storage
      await supabase.storage.from('milestone-attachments').remove([filePath]);
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('milestone_attachments')
      .delete()
      .eq('id', attachmentId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete attachment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Attachment delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
