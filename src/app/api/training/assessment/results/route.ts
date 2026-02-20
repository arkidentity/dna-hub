import { NextResponse } from 'next/server';
import { getUnifiedSession } from '@/lib/unified-auth';
import { getSupabaseAdmin } from '@/lib/auth';

const supabase = getSupabaseAdmin();

// GET: Load completed assessment results
export async function GET() {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.userId;

    // Get latest completed assessment
    const { data: assessment } = await supabase
      .from('user_flow_assessments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (!assessment) {
      return NextResponse.json({ error: 'No completed assessment found' }, { status: 404 });
    }

    // If there's a previous assessment, load it for comparison
    let previousAssessment = null;
    if (assessment.previous_assessment_id) {
      const { data: prev } = await supabase
        .from('user_flow_assessments')
        .select('id, roadblock_ratings, completed_at')
        .eq('id', assessment.previous_assessment_id)
        .single();

      previousAssessment = prev;
    }

    return NextResponse.json({
      assessment: {
        id: assessment.id,
        roadblock_ratings: assessment.roadblock_ratings,
        reflections: assessment.reflections,
        top_roadblocks: assessment.top_roadblocks,
        action_plan: assessment.action_plan,
        accountability_partner: assessment.accountability_partner,
        accountability_date: assessment.accountability_date,
        completed_at: assessment.completed_at,
        previous_assessment_id: assessment.previous_assessment_id
      },
      previousAssessment
    });

  } catch (error) {
    console.error('[Assessment Results] Error:', error);
    return NextResponse.json({ error: 'Failed to load results' }, { status: 500 });
  }
}
