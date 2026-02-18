import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole, isAdmin } from '@/lib/unified-auth';

// POST /api/cohort/posts
// Trainer creates a feed post in their cohort
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

    // Get the author's dna_leaders record
    const { data: leader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', session.email)
      .single();

    if (!leader) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
    }

    // Verify they are a trainer in a cohort
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

    const body = await request.json();
    const { title, post_body, post_type, pinned } = body;

    if (!title?.trim() || !post_body?.trim()) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    const validTypes = ['announcement', 'update', 'resource'];
    const resolvedType = validTypes.includes(post_type) ? post_type : 'announcement';

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
