import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin, isAdminOrCoach, isChurchLeader } from '@/lib/unified-auth';

// ============================================
// Auth helper: admin, coach, or church leader
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
// GET — Fetch testimony submissions for a church
// Query: ?church_id=UUID&status=pending|approved|rejected|all
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

    let query = supabase
      .from('testimony_church_submissions')
      .select('id, testimony_id, user_id, display_name, title, testimony_type, struggle, turning_point, outcome, reflection, your_invitation, status, admin_notes, reviewed_at, created_at')
      .eq('church_id', churchId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error('[ADMIN] Testimony submissions fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    const all = submissions || [];
    const stats = {
      total: all.length,
      pending: all.filter((s) => s.status === 'pending').length,
      approved: all.filter((s) => s.status === 'approved').length,
      rejected: all.filter((s) => s.status === 'rejected').length,
    };

    return NextResponse.json({ submissions: all, stats });
  } catch (err) {
    console.error('[ADMIN] Testimony submissions GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PATCH — Approve, reject, or archive a submission
// Body: { submissionId, action: 'approve'|'reject'|'archive', churchId, admin_notes? }
// ============================================
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId, action, churchId, admin_notes } = body;

    if (!submissionId || !action || !churchId) {
      return NextResponse.json({ error: 'submissionId, action, and churchId are required' }, { status: 400 });
    }

    const session = await authorize(churchId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    let newStatus: string;
    switch (action) {
      case 'approve':
        newStatus = 'approved';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'archive':
        newStatus = 'archived';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const update: Record<string, unknown> = {
      status: newStatus,
      reviewed_at: now,
      reviewed_by: session.userId,
      updated_at: now,
    };

    if (admin_notes !== undefined) {
      update.admin_notes = admin_notes;
    }

    const { error } = await supabase
      .from('testimony_church_submissions')
      .update(update)
      .eq('id', submissionId);

    if (error) {
      console.error('[ADMIN] Testimony submission PATCH error:', error);
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[ADMIN] Testimony submission PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
