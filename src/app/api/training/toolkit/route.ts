import { NextResponse } from 'next/server';
import { getUnifiedSession } from '@/lib/unified-auth';
import { getSupabaseAdmin } from '@/lib/auth';

const supabase = getSupabaseAdmin();

const TOTAL_WEEKS = 12;

/**
 * GET /api/training/toolkit
 * Returns the 90-Day Toolkit progress summary for the authenticated leader.
 */
export async function GET() {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get all toolkit progress rows for this leader
    const { data: progress, error } = await supabase
      .from('leader_toolkit_progress')
      .select('week_number, completed, completed_at')
      .eq('leader_id', leader.id)
      .order('week_number', { ascending: true });

    if (error) {
      console.error('Error fetching toolkit progress:', error);
      return NextResponse.json(
        { error: 'Failed to load toolkit progress' },
        { status: 500 }
      );
    }

    // Build the full weeks array (1-12), filling in missing weeks as incomplete
    const progressMap = new Map(
      (progress || []).map((p) => [p.week_number, p])
    );

    const weeks = [];
    let completedCount = 0;

    for (let i = 1; i <= TOTAL_WEEKS; i++) {
      const entry = progressMap.get(i);
      const completed = entry?.completed || false;

      weeks.push({
        week_number: i,
        completed,
        completed_at: completed ? entry?.completed_at : null,
      });

      if (completed) {
        completedCount++;
      }
    }

    return NextResponse.json({
      weeks,
      completedCount,
      totalWeeks: TOTAL_WEEKS,
    });
  } catch (error) {
    console.error('Error loading toolkit progress:', error);
    return NextResponse.json(
      { error: 'Failed to load toolkit progress' },
      { status: 500 }
    );
  }
}
