import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
const BUCKET = 'church-logos';

export async function POST(request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    const formData = await request.formData();

    const file = formData.get('file') as File;
    const churchId = formData.get('church_id') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!churchId) return NextResponse.json({ error: 'church_id is required' }, { status: 400 });

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only PNG, JPG, SVG, and WebP images are allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Determine file extension
    const ext = file.type === 'image/svg+xml' ? 'svg'
      : file.type === 'image/webp' ? 'webp'
      : file.type === 'image/png' ? 'png'
      : 'jpg';

    // Store as {church_id}/logo.{ext} — overwrites previous logo for same church
    const filePath = `${churchId}/logo.${ext}`;

    // Upload to Supabase Storage (church-logos bucket, public)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true, // Overwrite existing logo
      });

    if (uploadError) {
      console.error('[ADMIN] Logo upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(uploadData.path);

    // Add cache-busting timestamp so browsers pick up the new logo
    const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Immediately update churches.logo_url
    const { error: updateError } = await supabase
      .from('churches')
      .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
      .eq('id', churchId);

    if (updateError) {
      console.error('[ADMIN] Logo URL update error:', updateError);
      // Return the URL anyway so UI can still show preview
    }

    return NextResponse.json({ logo_url: logoUrl });
  } catch (error) {
    console.error('[ADMIN] Logo upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
