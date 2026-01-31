import { NextRequest, NextResponse } from 'next/server';
import { getTrainingSession, getSupabaseAdmin, updateMilestone, unlockContent } from '@/lib/training-auth';

// GET: Load existing draft or check for completed assessment
export async function GET() {
  try {
    const session = await getTrainingSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const userId = session.user.id;

    // Check for existing draft first
    const { data: draft } = await supabase
      .from('dna_flow_assessments')
      .select('*')
      .eq('user_id', userId)
      .eq('is_draft', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (draft) {
      return NextResponse.json({ assessment: draft });
    }

    // Check for completed assessment (for retake check)
    const { data: completed } = await supabase
      .from('dna_flow_assessments')
      .select('*')
      .eq('user_id', userId)
      .eq('is_draft', false)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (completed) {
      // Check if 3 months have passed
      const completedDate = new Date(completed.completed_at);
      const threeMonthsLater = new Date(completedDate);
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

      if (new Date() < threeMonthsLater) {
        // Cannot retake yet
        return NextResponse.json({
          canRetake: false,
          previousAssessment: completed,
          retakeAvailableAt: threeMonthsLater.toISOString()
        });
      }

      // Can retake - create new draft with previous assessment ID
      const { data: newDraft, error: createError } = await supabase
        .from('dna_flow_assessments')
        .insert({
          user_id: userId,
          roadblock_ratings: {},
          reflections: {},
          is_draft: true,
          previous_assessment_id: completed.id
        })
        .select()
        .single();

      if (createError) {
        console.error('[Assessment API] Error creating new draft:', createError);
        return NextResponse.json({ error: 'Failed to start assessment' }, { status: 500 });
      }

      return NextResponse.json({
        assessment: newDraft,
        previousAssessment: completed
      });
    }

    // No existing assessment - create new draft
    const { data: newDraft, error: createError } = await supabase
      .from('dna_flow_assessments')
      .insert({
        user_id: userId,
        roadblock_ratings: {},
        reflections: {},
        is_draft: true
      })
      .select()
      .single();

    if (createError) {
      console.error('[Assessment API] Error creating draft:', createError);
      return NextResponse.json({ error: 'Failed to start assessment' }, { status: 500 });
    }

    return NextResponse.json({ assessment: newDraft });

  } catch (error) {
    console.error('[Assessment API] GET Error:', error);
    return NextResponse.json({ error: 'Failed to load assessment' }, { status: 500 });
  }
}

// PUT: Save progress (auto-save draft)
export async function PUT(request: NextRequest) {
  try {
    const session = await getTrainingSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assessmentId, data } = body;

    if (!assessmentId) {
      return NextResponse.json({ error: 'Assessment ID required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const userId = session.user.id;

    // Verify ownership
    const { data: existing } = await supabase
      .from('dna_flow_assessments')
      .select('id, user_id')
      .eq('id', assessmentId)
      .single();

    if (!existing || existing.user_id !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Update draft
    const { error: updateError } = await supabase
      .from('dna_flow_assessments')
      .update({
        roadblock_ratings: data.roadblock_ratings,
        reflections: data.reflections,
        top_roadblocks: data.top_roadblocks,
        action_plan: data.action_plan,
        accountability_partner: data.accountability_partner,
        accountability_date: data.accountability_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', assessmentId);

    if (updateError) {
      console.error('[Assessment API] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Assessment API] PUT Error:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}
