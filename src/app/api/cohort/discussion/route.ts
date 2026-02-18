import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole, isAdmin } from '@/lib/unified-auth';

// POST /api/cohort/discussion
// Any cohort member posts a new discussion thread (parent_id = null).
// Admins can post by providing { cohort_id } in the body — no membership required.
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
    const { post_body, cohort_id: adminCohortId } = body;

    if (!post_body?.trim()) {
      return NextResponse.json({ error: 'Post body is required' }, { status: 400 });
    }

    // ── Admin bypass ──────────────────────────────────────────────────
    // Admin posts to a specific cohort by cohort_id, attributed to "DNA Coach".
    // Uses the first trainer's leader_id to satisfy the FK on author_id.
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
        .from('dna_cohort_discussion')
        .insert({
          cohort_id: adminCohortId,
          author_id: authorId,
          body: post_body.trim(),
          parent_id: null,
        })
        .select('id, body, created_at')
        .single();

      if (error) {
        console.error('[COHORT DISCUSSION] Admin insert error:', error);
        return NextResponse.json({ error: 'Failed to post' }, { status: 500 });
      }

      return NextResponse.json({
        post: {
          id: post.id,
          body: post.body,
          author_name: 'DNA Coach',
          author_role: 'trainer',
          reply_count: 0,
          created_at: post.created_at,
        },
      });
    }

    // ── Regular member path ───────────────────────────────────────────
    const { data: leader } = await supabase
      .from('dna_leaders')
      .select('id, name')
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

    const { data: post, error } = await supabase
      .from('dna_cohort_discussion')
      .insert({
        cohort_id: membership.cohort_id,
        author_id: leader.id,
        body: post_body.trim(),
        parent_id: null,
      })
      .select('id, body, created_at')
      .single();

    if (error) {
      console.error('[COHORT DISCUSSION] Insert error:', error);
      return NextResponse.json({ error: 'Failed to post' }, { status: 500 });
    }

    return NextResponse.json({
      post: {
        id: post.id,
        body: post.body,
        author_name: leader.name,
        author_role: membership.role,
        reply_count: 0,
        created_at: post.created_at,
      },
    });
  } catch (err) {
    console.error('[COHORT DISCUSSION] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
