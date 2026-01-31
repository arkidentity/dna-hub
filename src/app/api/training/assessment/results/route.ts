import { NextResponse } from 'next/server';
import { getTrainingSession, getSupabaseAdmin } from '@/lib/training-auth';

// GET: Load completed assessment results
export async function GET() {
  try {
    const session = await getTrainingSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const userId = session.user.id;

    // Get latest completed assessment
    const { data: assessment } = await supabase
      .from('dna_flow_assessments')
      .select('*')
      .eq('user_id', userId)
      .eq('is_draft', false)
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
        .from('dna_flow_assessments')
        .select('id, roadblock_ratings, completed_at')
        .eq('id', assessment.previous_assessment_id)
        .single();

      previousAssessment = prev;
    }

    return NextResponse.json({
      assessment,
      previousAssessment
    });

  } catch (error) {
    console.error('[Assessment Results] Error:', error);
    return NextResponse.json({ error: 'Failed to load results' }, { status: 500 });
  }
}
