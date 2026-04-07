import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole, isAdmin, isDNACoach } from '@/lib/unified-auth';

// PATCH /api/cohort/posts/[id] — edit a feed post
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
    const { title, post_body, post_type, pinned } = body;

    // Fetch the post
    const { data: post } = await supabase
      .from('dna_cohort_posts')
      .select('id, cohort_id, author_id')
      .eq('id', id)
      .single();

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    // Check permission: admin, coach (for their church), post author, or trainer in same cohort
    if (!isAdmin(session) && !isDNACoach(session)) {
      const { data: leader } = await supabase
        .from('dna_leaders')
        .select('id')
        .eq('email', session.email)
        .single();

      if (!leader) return NextResponse.json({ error: 'Leader not found' }, { status: 404 });

      const isAuthor = leader.id === post.author_id;

      if (!isAuthor) {
        // Check if trainer in the same cohort
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

    // Build update object
    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title.trim();
    if (post_body !== undefined) updates.body = post_body.trim();
    if (post_type !== undefined) {
      const valid = ['announcement', 'update', 'resource'];
      if (valid.includes(post_type)) updates.post_type = post_type;
    }
    if (pinned !== undefined) updates.pinned = pinned;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from('dna_cohort_posts')
      .update(updates)
      .eq('id', id)
      .select('id, post_type, title, body, pinned, created_at, author_role, author:dna_leaders(id, name)')
      .single();

    if (error) {
      console.error('[COHORT POSTS] Update error:', error);
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    return NextResponse.json({
      post: {
        id: updated.id,
        post_type: updated.post_type,
        title: updated.title,
        body: updated.body,
        pinned: updated.pinned,
        author_name: (updated as any).author_role === 'coach'
          ? 'DNA Coach'
          : (updated.author as unknown as { name: string } | null)?.name || 'Trainer',
        author_id: (updated.author as unknown as { id: string } | null)?.id || null,
        author_role: (updated as any).author_role || 'trainer',
        created_at: updated.created_at,
      },
    });
  } catch (err) {
    console.error('[COHORT POSTS] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/cohort/posts/[id] — delete a feed post
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
      .from('dna_cohort_posts')
      .select('id, cohort_id, author_id')
      .eq('id', id)
      .single();

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    // Check permission
    if (!isAdmin(session)) {
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

    const { error } = await supabase
      .from('dna_cohort_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[COHORT POSTS] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[COHORT POSTS] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
