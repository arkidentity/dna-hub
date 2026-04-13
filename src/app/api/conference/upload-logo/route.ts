import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const BUCKET = 'church-logos';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const formData = await request.formData();

    const file = formData.get('file') as File;
    const churchId = formData.get('church_id') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!churchId) return NextResponse.json({ error: 'church_id is required' }, { status: 400 });

    // Verify church exists and was recently created (within last hour — prevents abuse)
    const { data: church } = await supabase
      .from('churches')
      .select('id, created_at')
      .eq('id', churchId)
      .single();

    if (!church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    const createdAt = new Date(church.created_at);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (createdAt < oneHourAgo) {
      return NextResponse.json(
        { error: 'Logo upload window has expired. Please use the dashboard to update your logo.' },
        { status: 403 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only PNG, JPG, and WebP images are allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    const ext = file.type === 'image/webp' ? 'webp'
      : file.type === 'image/png' ? 'png'
      : 'jpg';

    const filePath = `${churchId}/logo.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[Conference] Logo upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(uploadData.path);

    const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Update church record with logo
    await supabase
      .from('churches')
      .update({
        logo_url: logoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', churchId);

    // Also set header_style to 'logo' since they uploaded one
    await supabase
      .from('church_branding_settings')
      .update({
        header_style: 'logo',
        updated_at: new Date().toISOString(),
      })
      .eq('church_id', churchId);

    return NextResponse.json({ logo_url: logoUrl });
  } catch (error) {
    console.error('[Conference] Logo upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
