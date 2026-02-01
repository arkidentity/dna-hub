import { NextRequest, NextResponse } from 'next/server';
import {
  getUnifiedSession,
  isTrainingParticipant,
  isAdmin,
  updateTrainingMilestone,
  unlockContent
} from '@/lib/unified-auth';
import { supabase } from '@/lib/supabase';
import { sendAssessmentCompleteEmail } from '@/lib/email';

// POST: Complete the assessment
export async function POST(request: NextRequest) {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isTrainingParticipant(session) && !isAdmin(session)) {
      return NextResponse.json({ error: 'Not a training participant' }, { status: 403 });
    }

    const body = await request.json();
    const { assessmentId, data } = body;

    if (!assessmentId) {
      return NextResponse.json({ error: 'Assessment ID required' }, { status: 400 });
    }

    const userId = session.userId;

    // Verify ownership and that it's still a draft
    const { data: existing } = await supabase
      .from('user_flow_assessments')
      .select('id, user_id, status')
      .eq('id', assessmentId)
      .single();

    if (!existing || existing.user_id !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (existing.status !== 'draft') {
      return NextResponse.json({ error: 'Assessment already completed' }, { status: 400 });
    }

    // Validate required data
    if (!data.roadblock_ratings || Object.keys(data.roadblock_ratings).length < 7) {
      return NextResponse.json({ error: 'Please rate all roadblocks' }, { status: 400 });
    }

    // Complete the assessment
    const completedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('user_flow_assessments')
      .update({
        roadblock_ratings: data.roadblock_ratings,
        reflections: data.reflections,
        top_roadblocks: data.top_roadblocks,
        action_plan: data.action_plan,
        accountability_partner: data.accountability_partner,
        accountability_date: data.accountability_date,
        status: 'completed',
        completed_at: completedAt,
        updated_at: completedAt
      })
      .eq('id', assessmentId);

    if (updateError) {
      console.error('[Assessment Complete] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to complete assessment' }, { status: 500 });
    }

    // Update user's journey milestone
    await updateTrainingMilestone(userId, 'flow_assessment_complete', true);

    // Unlock DNA Manual (Session 1)
    await unlockContent(userId, 'manual_session_1', 'flow_assessment_complete');

    // Send completion email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const dashboardLink = `${baseUrl}/training`;

    await sendAssessmentCompleteEmail(
      session.email,
      session.name || 'there',
      dashboardLink,
      data.top_roadblocks || []
    );

    return NextResponse.json({
      success: true,
      message: 'Assessment completed! DNA Manual is now unlocked.'
    });

  } catch (error) {
    console.error('[Assessment Complete] Error:', error);
    return NextResponse.json({ error: 'Failed to complete assessment' }, { status: 500 });
  }
}
