// Church Notes API Endpoint
// Allows churches to add/edit their own notes on milestones

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUnifiedSession, getPrimaryChurch } from '@/lib/unified-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/church/progress/notes
 *
 * Updates church_notes field in church_progress table
 *
 * Body:
 * {
 *   milestoneId: string;
 *   churchNotes: string;
 * }
 */
export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get session
    const session = await getUnifiedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { milestoneId, churchNotes } = await request.json();

    if (!milestoneId || typeof churchNotes !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid milestoneId or churchNotes' },
        { status: 400 }
      );
    }

    // Get church ID from session
    const churchId = getPrimaryChurch(session);
    if (!churchId) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    // Check if progress record exists
    const { data: existingProgress } = await supabase
      .from('church_progress')
      .select('id')
      .eq('church_id', churchId)
      .eq('milestone_id', milestoneId)
      .single();

    if (existingProgress) {
      // Update existing progress record
      const { error } = await supabase
        .from('church_progress')
        .update({ church_notes: churchNotes })
        .eq('id', existingProgress.id);

      if (error) {
        console.error('Error updating church notes:', error);
        return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
      }
    } else {
      // Create new progress record with church notes
      const { error } = await supabase
        .from('church_progress')
        .insert({
          church_id: churchId,
          milestone_id: milestoneId,
          church_notes: churchNotes,
          completed: false,
        });

      if (error) {
        console.error('Error creating church notes:', error);
        return NextResponse.json({ error: 'Failed to save notes' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Church notes API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
