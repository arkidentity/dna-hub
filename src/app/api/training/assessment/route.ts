import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedSession } from '@/lib/unified-auth';
import { supabase } from '@/lib/supabase';

// GET: Load existing draft or check for completed assessment
export async function GET() {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.userId;

    // Check for existing draft first
    const { data: draft } = await supabase
      .from('user_flow_assessments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (draft) {
      return NextResponse.json({
        assessment: {
          id: draft.id,
          roadblock_ratings: draft.roadblock_ratings,
          reflections: draft.reflections,
          top_roadblocks: draft.top_roadblocks,
          action_plan: draft.action_plan,
          accountability_partner: draft.accountability_partner,
          accountability_date: draft.accountability_date,
          is_draft: true
        }
      });
    }

    // Check for completed assessment (for retake check)
    const { data: completed } = await supabase
      .from('user_flow_assessments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
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
          previousAssessment: {
            id: completed.id,
            roadblock_ratings: completed.roadblock_ratings,
            completed_at: completed.completed_at
          },
          retakeAvailableAt: threeMonthsLater.toISOString()
        });
      }

      // Can retake - create new draft with previous assessment ID
      const { data: newDraft, error: createError } = await supabase
        .from('user_flow_assessments')
        .insert({
          user_id: userId,
          roadblock_ratings: {},
          reflections: {},
          status: 'draft',
          previous_assessment_id: completed.id
        })
        .select()
        .single();

      if (createError) {
        console.error('[Assessment API] Error creating new draft:', createError);
        return NextResponse.json({ error: 'Failed to start assessment' }, { status: 500 });
      }

      return NextResponse.json({
        assessment: {
          id: newDraft.id,
          roadblock_ratings: newDraft.roadblock_ratings,
          reflections: newDraft.reflections,
          is_draft: true
        },
        previousAssessment: {
          id: completed.id,
          roadblock_ratings: completed.roadblock_ratings,
          completed_at: completed.completed_at
        }
      });
    }

    // No existing assessment - create new draft
    const { data: newDraft, error: createError } = await supabase
      .from('user_flow_assessments')
      .insert({
        user_id: userId,
        roadblock_ratings: {},
        reflections: {},
        status: 'draft'
      })
      .select()
      .single();

    if (createError) {
      console.error('[Assessment API] Error creating draft:', createError);
      return NextResponse.json({ error: 'Failed to start assessment' }, { status: 500 });
    }

    return NextResponse.json({
      assessment: {
        id: newDraft.id,
        roadblock_ratings: newDraft.roadblock_ratings,
        reflections: newDraft.reflections,
        is_draft: true
      }
    });

  } catch (error) {
    console.error('[Assessment API] GET Error:', error);
    return NextResponse.json({ error: 'Failed to load assessment' }, { status: 500 });
  }
}

// PUT: Save progress (auto-save draft)
export async function PUT(request: NextRequest) {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assessmentId, data } = body;

    if (!assessmentId) {
      return NextResponse.json({ error: 'Assessment ID required' }, { status: 400 });
    }

    const userId = session.userId;

    // Verify ownership
    const { data: existing } = await supabase
      .from('user_flow_assessments')
      .select('id, user_id')
      .eq('id', assessmentId)
      .single();

    if (!existing || existing.user_id !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Update draft
    const { error: updateError } = await supabase
      .from('user_flow_assessments')
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
