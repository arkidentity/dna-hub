import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedSession } from '@/lib/unified-auth';
import { getSupabaseAdmin } from '@/lib/auth';

const supabase = getSupabaseAdmin();

/**
 * POST /api/training/toolkit/week/[weekId]/complete
 * Marks a toolkit week as complete for the authenticated leader.
 * Upserts into leader_toolkit_progress with completed=true, completed_at=now().
 * weekId must be 1-12.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ weekId: string }> }
) {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { weekId } = await params;
    const weekNumber = parseInt(weekId);

    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 12) {
      return NextResponse.json(
        { error: 'Invalid week number. Must be 1-12.' },
        { status: 400 }
      );
    }

    // Find the DNA leader record by email
    const { data: leader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', session.email)
      .single();

    if (!leader) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Upsert the week completion (UNIQUE constraint on leader_id, week_number)
    const { data: result, error } = await supabase
      .from('leader_toolkit_progress')
      .upsert(
        {
          leader_id: leader.id,
          week_number: weekNumber,
          completed: true,
          completed_at: now,
          updated_at: now,
        },
        { onConflict: 'leader_id,week_number' }
      )
      .select('completed_at')
      .single();

    if (error) {
      console.error('Error completing toolkit week:', error);
      return NextResponse.json(
        { error: 'Failed to mark week as complete' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      weekNumber,
      completedAt: result.completed_at,
    });
  } catch (error) {
    console.error('Error completing toolkit week:', error);
    return NextResponse.json(
      { error: 'Failed to mark week as complete' },
      { status: 500 }
    );
  }
}
