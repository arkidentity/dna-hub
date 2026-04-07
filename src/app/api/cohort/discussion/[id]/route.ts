import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole, isAdmin, isDNACoach } from '@/lib/unified-auth';

// PATCH /api/cohort/discussion/[id] — edit a discussion post
// Allowed: post author, any trainer in the cohort, or admin
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(session, 'dna_leader') && !hasRole(session, 'church_leader') && !isAdmin(session) && !isDNACoach(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { post_body } = body;

    if (!post_body?.trim()) {
      return NextResponse.json({ error: 'Post body is required' }, { status: 400 });
    }

    // Fetch the post
    const { data: post } = await supabase
      .from('dna_cohort_discussion')
      .select('id, cohort_id, author_id')
      .eq('id', id)
      .single();

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    // Check permission
    if (!isAdmin(session) && !isDNACoach(session)) {
      const { data: leader } = await supabase
        .from('dna_leaders')
        .select('id')
        .eq('email', session.email)
        .single();

      if (!leader) return NextResponse.json({ error: 'Leader not found' }, { status: 404 });

      const isAuthor = leader.id === post.author_id;

      if (!isAuthor) {
        const { data: membership } = await supabase
          .from('dna_cohort_members')
          .select('role')
          .eq('leader_id', leader.id)
          .eq('cohort_id', post.cohort_id)
          .eq('cohort_exempt', false)
          .single();

        if (!membership || membership.role !== 'trainer') {
          return NextResponse.json({ error: 'Only the author or a trainer can edit this post' }, { status: 403 });
        }
      }
    }

    const { data: updated, error } = await supabase
      .from('dna_cohort_discussion')
      .update({ body: post_body.trim() })
      .eq('id', id)
      .select('id, body, created_at, is_coach_post, author:dna_leaders(id, name)')
      .single();

    if (error) {
      console.error('[COHORT DISCUSSION] Update error:', error);
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    return NextResponse.json({
      post: {
        id: updated.id,
        body: updated.body,
        author_name: (updated as any).is_coach_post
          ? 'DNA Coach'
          : (updated.author as unknown as { name: string } | null)?.name || 'Leader',
        author_id: (updated.author as unknown as { id: string } | null)?.id || null,
        created_at: updated.created_at,
      },
    });
  } catch (err) {
    console.error('[COHORT DISCUSSION] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/cohort/discussion/[id] — delete a discussion post and its replies
// Allowed: post author, any trainer in the cohort, or admin
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(session, 'dna_leader') && !hasRole(session, 'church_leader') && !isAdmin(session) && !isDNACoach(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // Fetch the post
    const { data: post } = await supabase
      .from('dna_cohort_discussion')
      .select('id, cohort_id, author_id, parent_id')
      .eq('id', id)
      .single();

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    // Check permission
    if (!isAdmin(session) && !isDNACoach(session)) {
      const { data: leader } = await supabase
        .from('dna_leaders')
        .select('id')
        .eq('email', session.email)
        .single();

      if (!leader) return NextResponse.json({ error: 'Leader not found' }, { status: 404 });

      const isAuthor = leader.id === post.author_id;

      if (!isAuthor) {
        const { data: membership } = await supabase
          .from('dna_cohort_members')
          .select('role')
          .eq('leader_id', leader.id)
          .eq('cohort_id', post.cohort_id)
          .eq('cohort_exempt', false)
          .single();

        if (!membership || membership.role !== 'trainer') {
          return NextResponse.json({ error: 'Only the author or a trainer can delete this post' }, { status: 403 });
        }
      }
    }

    // If it's a parent thread, delete replies first
    if (!post.parent_id) {
      await supabase
        .from('dna_cohort_discussion')
        .delete()
        .eq('parent_id', id);
    }

    const { error } = await supabase
      .from('dna_cohort_discussion')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[COHORT DISCUSSION] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[COHORT DISCUSSION] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
