import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
const BUCKET = 'church-logos';

// logo type → storage filename + DB column
const LOGO_TYPE_MAP = {
  header: { filename: 'logo',        column: 'logo_url' },
  icon:   { filename: 'icon',        column: 'icon_url' },
  splash: { filename: 'splash_logo', column: 'splash_logo_url' },
} as const;

type LogoType = keyof typeof LOGO_TYPE_MAP;

export async function POST(request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const supabase = getSupabaseAdmin();
    const formData = await request.formData();

    const file = formData.get('file') as File;
    const churchId = formData.get('church_id') as string;
    const logoTypeRaw = (formData.get('logo_type') as string) || 'header';

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!churchId) return NextResponse.json({ error: 'church_id is required' }, { status: 400 });

    const logoType: LogoType = (logoTypeRaw in LOGO_TYPE_MAP)
      ? (logoTypeRaw as LogoType)
      : 'header';

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

    const { filename, column } = LOGO_TYPE_MAP[logoType];

    // Store as {church_id}/{filename}.{ext} — overwrites previous for same church + type
    const filePath = `${churchId}/${filename}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[ADMIN] Logo upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(uploadData.path);

    // Add cache-busting timestamp so browsers pick up the new image
    const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Update the appropriate column on churches
    const { error: updateError } = await supabase
      .from('churches')
      .update({ [column]: logoUrl, updated_at: new Date().toISOString() })
      .eq('id', churchId);

    if (updateError) {
      console.error('[ADMIN] Logo URL update error:', updateError);
      // Return the URL anyway so UI can still show preview
    }

    return NextResponse.json({ logo_url: logoUrl, logo_type: logoType, column });
  } catch (error) {
    console.error('[ADMIN] Logo upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
