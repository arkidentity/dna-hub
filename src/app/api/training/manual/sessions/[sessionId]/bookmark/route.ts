import { NextResponse } from 'next/server';
import { getUnifiedSession, isTrainingParticipant, isAdmin } from '@/lib/unified-auth';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/dna-manual-data';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

/**
 * GET /api/training/manual/sessions/[sessionId]/bookmark
 * Get user's bookmark for a session
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { sessionId: sessionIdStr } = await params;
    const sessionId = parseInt(sessionIdStr);

    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isTrainingParticipant(session) && !isAdmin(session)) {
      return NextResponse.json({ error: 'Not a training participant' }, { status: 403 });
    }

    // Get user's bookmark
    const { data: bookmark } = await supabase
      .from('user_bookmarks')
      .select('*')
      .eq('user_id', session.userId)
      .eq('content_type', 'manual_session')
      .eq('content_id', sessionId.toString())
      .single();

    return NextResponse.json({
      bookmark: bookmark || null
    });
  } catch (error) {
    console.error('Error loading bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to load bookmark' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/training/manual/sessions/[sessionId]/bookmark
 * Save or update user's bookmark for a session
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { sessionId: sessionIdStr } = await params;
    const sessionId = parseInt(sessionIdStr);
    const { lessonId, position, label } = await request.json();

    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isTrainingParticipant(session) && !isAdmin(session)) {
      return NextResponse.json({ error: 'Not a training participant' }, { status: 403 });
    }

    // Validate session exists
    const sessionData = getSession(sessionId);
    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Upsert bookmark
    const { data: bookmark, error } = await supabase
      .from('user_bookmarks')
      .upsert({
        user_id: session.userId,
        content_type: 'manual_session',
        content_id: sessionId.toString(),
        lesson_id: lessonId || null,
        position: position || null,
        label: label || null,
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id,content_type,content_id' })
      .select()
      .single();

    if (error) {
      console.error('Error saving bookmark:', error);
      return NextResponse.json({ error: 'Failed to save bookmark' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      bookmark
    });
  } catch (error) {
    console.error('Error saving bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to save bookmark' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/training/manual/sessions/[sessionId]/bookmark
 * Remove user's bookmark for a session
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { sessionId: sessionIdStr } = await params;
    const sessionId = parseInt(sessionIdStr);

    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isTrainingParticipant(session) && !isAdmin(session)) {
      return NextResponse.json({ error: 'Not a training participant' }, { status: 403 });
    }

    // Delete bookmark
    await supabase
      .from('user_bookmarks')
      .delete()
      .eq('user_id', session.userId)
      .eq('content_type', 'manual_session')
      .eq('content_id', sessionId.toString());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    );
  }
}
