import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin, isAdminOrCoach, isChurchLeader } from '@/lib/unified-auth';

// ============================================
// Auth helper: admin, coach, or church leader for this church
// ============================================
async function authorize(churchId: string) {
  const session = await getUnifiedSession();
  if (!session) return null;
  if (isAdmin(session) || isAdminOrCoach(session) || isChurchLeader(session, churchId)) {
    return session;
  }
  return null;
}

// ============================================
// GET — Fetch prayer wall posts for a church
// Query: ?church_id=UUID&status=pending|active|answered|all
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const churchId = searchParams.get('church_id');
    const statusFilter = searchParams.get('status') || 'all';

    if (!churchId) {
      return NextResponse.json({ error: 'church_id is required' }, { status: 400 });
    }

    const session = await authorize(churchId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Fetch settings
    const { data: settings } = await supabase
      .from('church_prayer_wall_settings')
      .select('requires_approval')
      .eq('church_id', churchId)
      .single();

    // Fetch posts
    let query = supabase
      .from('prayer_wall_posts')
      .select('id, user_id, is_anonymous, display_name, prayer_text, dimension, status, is_visible, testimony_text, answered_at, pray_count, created_at')
      .eq('church_id', churchId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('[ADMIN] Prayer wall fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    // Stats
    const allPosts = posts || [];
    const stats = {
      total: allPosts.length,
      active: allPosts.filter((p) => p.status === 'active').length,
      answered: allPosts.filter((p) => p.status === 'answered').length,
      pending: allPosts.filter((p) => p.status === 'pending').length,
      hidden: allPosts.filter((p) => !p.is_visible).length,
    };

    return NextResponse.json({
      posts: allPosts,
      settings: { requires_approval: settings?.requires_approval ?? false },
      stats,
    });
  } catch (err) {
    console.error('[ADMIN] Prayer wall GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PATCH — Update a post (approve, hide, unhide)
// Body: { postId, action: 'approve'|'hide'|'unhide', churchId }
// ============================================
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, action, churchId } = body;

    if (!postId || !action || !churchId) {
      return NextResponse.json({ error: 'postId, action, and churchId are required' }, { status: 400 });
    }

    const session = await authorize(churchId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    let update: Record<string, unknown> = {};

    switch (action) {
      case 'approve':
        update = { status: 'active', updated_at: new Date().toISOString() };
        break;
      case 'hide':
        update = { is_visible: false, updated_at: new Date().toISOString() };
        break;
      case 'unhide':
        update = { is_visible: true, updated_at: new Date().toISOString() };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { error } = await supabase
      .from('prayer_wall_posts')
      .update(update)
      .eq('id', postId);

    if (error) {
      console.error('[ADMIN] Prayer wall PATCH error:', error);
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[ADMIN] Prayer wall PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PUT — Update prayer wall settings
// Body: { churchId, requires_approval: boolean }
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { churchId, requires_approval } = body;

    if (!churchId || typeof requires_approval !== 'boolean') {
      return NextResponse.json({ error: 'churchId and requires_approval are required' }, { status: 400 });
    }

    const session = await authorize(churchId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('church_prayer_wall_settings')
      .upsert({
        church_id: churchId,
        requires_approval,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'church_id' });

    if (error) {
      console.error('[ADMIN] Prayer wall PUT error:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[ADMIN] Prayer wall PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
