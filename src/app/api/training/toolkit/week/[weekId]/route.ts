import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedSession } from '@/lib/unified-auth';
import { getSupabaseAdmin } from '@/lib/auth';

const supabase = getSupabaseAdmin();

/**
 * GET /api/training/toolkit/week/[weekId]
 * Returns single week progress for the authenticated leader.
 * weekId must be 1-12.
 */
export async function GET(
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

    // Get the specific week's progress
    const { data: progress, error } = await supabase
      .from('leader_toolkit_progress')
      .select('week_number, completed, completed_at')
      .eq('leader_id', leader.id)
      .eq('week_number', weekNumber)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (not an error, just incomplete)
      console.error('Error fetching week progress:', error);
      return NextResponse.json(
        { error: 'Failed to load week progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      weekNumber,
      completed: progress?.completed || false,
      completedAt: progress?.completed_at || null,
    });
  } catch (error) {
    console.error('Error loading week progress:', error);
    return NextResponse.json(
      { error: 'Failed to load week progress' },
      { status: 500 }
    );
  }
}
