import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole, isAdmin } from '@/lib/unified-auth';

// POST /api/cohort/posts
// Trainer (or admin) creates a feed post in a cohort.
// Admins must provide { cohort_id } in the body — no membership required.
export async function POST(request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasRole(session, 'dna_leader') && !hasRole(session, 'church_leader') && !isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { title, post_body, post_type, pinned, cohort_id: adminCohortId } = body;

    const validTypes = ['announcement', 'update', 'resource'];
    const resolvedType = validTypes.includes(post_type) ? post_type : 'announcement';

    if (!title?.trim() || !post_body?.trim()) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    // ── Admin bypass ──────────────────────────────────────────────────
    // Admin posts to a specific cohort by cohort_id, attributed to "DNA Coach".
    // Uses the first trainer in the cohort as the DB author_id (FK requirement).
    if (isAdmin(session)) {
      if (!adminCohortId) {
        return NextResponse.json({ error: 'cohort_id required for admin posts' }, { status: 400 });
      }

      // Find any trainer to satisfy the FK on author_id
      const { data: firstTrainer } = await supabase
        .from('dna_cohort_members')
        .select('leader_id')
        .eq('cohort_id', adminCohortId)
        .eq('role', 'trainer')
        .limit(1)
        .single();

      let authorId: string | null = firstTrainer?.leader_id || null;

      // Fallback: any member
      if (!authorId) {
        const { data: anyMember } = await supabase
          .from('dna_cohort_members')
          .select('leader_id')
          .eq('cohort_id', adminCohortId)
          .limit(1)
          .single();
        authorId = anyMember?.leader_id || null;
      }

      if (!authorId) {
        return NextResponse.json({ error: 'No cohort members found to attribute post' }, { status: 400 });
      }

      const { data: post, error } = await supabase
        .from('dna_cohort_posts')
        .insert({
          cohort_id: adminCohortId,
          author_id: authorId,
          post_type: resolvedType,
          author_role: 'trainer',
          title: title.trim(),
          body: post_body.trim(),
          pinned: pinned === true,
        })
        .select('id, post_type, title, body, pinned, created_at, author_role')
        .single();

      if (error) {
        console.error('[COHORT POSTS] Admin insert error:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
      }

      return NextResponse.json({ post: { ...post, author_name: 'DNA Coach' } });
    }

    // ── Regular trainer path ──────────────────────────────────────────
    const { data: leader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', session.email)
      .single();

    if (!leader) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('dna_cohort_members')
      .select('cohort_id, role')
      .eq('leader_id', leader.id)
      .eq('cohort_exempt', false)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a cohort member' }, { status: 403 });
    }

    if (membership.role !== 'trainer') {
      return NextResponse.json({ error: 'Only trainers can post to the feed' }, { status: 403 });
    }

    const { data: post, error } = await supabase
      .from('dna_cohort_posts')
      .insert({
        cohort_id: membership.cohort_id,
        author_id: leader.id,
        post_type: resolvedType,
        author_role: 'trainer',
        title: title.trim(),
        body: post_body.trim(),
        pinned: pinned === true,
      })
      .select('id, post_type, title, body, pinned, created_at, author_role')
      .single();

    if (error) {
      console.error('[COHORT POSTS] Insert error:', error);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    return NextResponse.json({
      post: {
        ...post,
        author_name: session.email,
      },
    });
  } catch (err) {
    console.error('[COHORT POSTS] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
