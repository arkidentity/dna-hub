import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';

// ============================================
// GET — Fetch demo settings for a church
// ============================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ churchId: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { churchId } = await params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('church_demo_settings')
      .select('*')
      .eq('church_id', churchId)
      .maybeSingle();

    if (error) {
      console.error('[ADMIN] Demo settings fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch demo settings' }, { status: 500 });
    }

    return NextResponse.json({ settings: data ?? null });
  } catch (error) {
    console.error('[ADMIN] Demo GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST — Create or update demo settings
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ churchId: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { churchId } = await params;
    const body = await request.json();
    const { video_url, demo_enabled, default_temp } = body;

    // Validate temp value
    if (default_temp && !['cold', 'warm', 'hot'].includes(default_temp)) {
      return NextResponse.json({ error: 'Invalid default_temp value' }, { status: 400 });
    }

    // Normalize YouTube URL → embed URL if a watch URL is provided
    let normalizedVideoUrl = video_url ?? null;
    if (normalizedVideoUrl) {
      normalizedVideoUrl = normalizedVideoUrl.trim();
      // Store as-is — we extract the video ID on the demo page for maximum flexibility
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('church_demo_settings')
      .upsert(
        {
          church_id: churchId,
          video_url: normalizedVideoUrl,
          demo_enabled: demo_enabled ?? false,
          default_temp: default_temp ?? 'warm',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'church_id' }
      );

    if (error) {
      console.error('[ADMIN] Demo settings upsert error:', error);
      return NextResponse.json({ error: 'Failed to save demo settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] Demo POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
