import { NextResponse } from 'next/server';
import { getUnifiedSession, isTrainingParticipant, isAdmin } from '@/lib/unified-auth';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/dna-manual-data';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

/**
 * GET /api/training/manual/sessions/[sessionId]/notes
 * Get user's notes for a session
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

    // Validate session exists
    const sessionData = getSession(sessionId);
    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get user's notes
    const { data: notes } = await supabase
      .from('user_session_notes')
      .select('*')
      .eq('user_id', session.userId)
      .eq('session_id', sessionId)
      .single();

    return NextResponse.json({
      notes: notes?.content || '',
      updatedAt: notes?.updated_at || null
    });
  } catch (error) {
    console.error('Error loading notes:', error);
    return NextResponse.json(
      { error: 'Failed to load notes' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/training/manual/sessions/[sessionId]/notes
 * Save or update user's notes for a session
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { sessionId: sessionIdStr } = await params;
    const sessionId = parseInt(sessionIdStr);
    const { content } = await request.json();

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

    // Validate content
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Content must be a string' }, { status: 400 });
    }

    // Limit content length (10,000 characters)
    if (content.length > 10000) {
      return NextResponse.json({ error: 'Notes too long (max 10,000 characters)' }, { status: 400 });
    }

    // Upsert notes
    const { data: notes, error } = await supabase
      .from('user_session_notes')
      .upsert({
        user_id: session.userId,
        session_id: sessionId,
        content,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,session_id' })
      .select()
      .single();

    if (error) {
      console.error('Error saving notes:', error);
      return NextResponse.json({ error: 'Failed to save notes' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notes: notes.content,
      updatedAt: notes.updated_at
    });
  } catch (error) {
    console.error('Error saving notes:', error);
    return NextResponse.json(
      { error: 'Failed to save notes' },
      { status: 500 }
    );
  }
}
