import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { sendAssessmentNotification, send3StepsEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const supabaseAdmin = getSupabaseAdmin();

    // Combine name and role for contact_name
    const contactName = data.your_role
      ? `${data.your_name}, ${data.your_role}`
      : data.your_name;

    // Create church record first
    const { data: church, error: churchError } = await supabaseAdmin
      .from('churches')
      .insert({
        name: data.church_name,
        status: 'pending_assessment',
      })
      .select()
      .single();

    if (churchError) {
      console.error('Church insert error:', churchError);
      return NextResponse.json(
        { error: 'Failed to create church record' },
        { status: 500 }
      );
    }

    // Parse leader count from form field
    const parseLeaderCount = (val: string): number => {
      if (!val) return 0;
      if (val === '10_plus' || val === '10+') return 10;
      const match = val.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    };

    // Create assessment record linked to church
    const { error: assessmentError } = await supabaseAdmin
      .from('church_assessments')
      .insert({
        church_id: church.id,
        contact_name: contactName,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone || null,
        church_name: data.church_name,
        church_city: data.church_city,
        church_state: data.church_state,
        congregation_size: data.attendance_size,
        current_discipleship_approach: data.discipleship_culture,
        why_interested: data.why_now,
        identified_leaders: parseLeaderCount(data.potential_leaders_count),
        leaders_completed_dna: data.read_dna_manual === 'yes_fully' || data.read_dna_manual === 'yes_partially',
        pastor_commitment_level: data.pastor_commitment,
        desired_launch_timeline: data.launch_timeline,
        potential_barriers: data.what_would_make_you_say_no || null,
        first_year_goals: null,
        support_needed: null,
        how_heard_about_us: data.how_heard === 'other' ? data.how_heard_other : data.how_heard,
        additional_questions: data.biggest_question,
        call_already_booked: false,
      });

    if (assessmentError) {
      console.error('Assessment insert error:', assessmentError);
      // Cleanup: delete the church record if assessment fails
      await supabaseAdmin.from('churches').delete().eq('id', church.id);
      return NextResponse.json(
        { error: 'Failed to create assessment record' },
        { status: 500 }
      );
    }

    // Update church status to awaiting discovery call
    await supabaseAdmin
      .from('churches')
      .update({ status: 'awaiting_discovery' })
      .eq('id', church.id);

    // Create primary leader record
    await supabaseAdmin.from('church_leaders').insert({
      church_id: church.id,
      email: data.contact_email,
      name: data.your_name,
      role: data.your_role || null,
      is_primary_contact: true,
    });

    // Send notification email to Travis
    await sendAssessmentNotification(
      data.church_name,
      contactName,
      data.contact_email
    );

    // Calculate readiness level for 3 Steps email
    let readinessScore = 0;

    // Decision maker
    if (data.is_decision_maker === 'yes') readinessScore += 2;
    else if (data.is_decision_maker === 'partial') readinessScore += 1;

    // Pastor commitment (1-10 scale)
    const pastorCommitment = parseInt(data.pastor_commitment) || 0;
    if (pastorCommitment >= 9) readinessScore += 3;
    else if (pastorCommitment >= 7) readinessScore += 2;
    else if (pastorCommitment >= 5) readinessScore += 1;

    // Leadership buy-in
    if (data.leadership_buy_in === 'fully_supportive') readinessScore += 3;
    else if (data.leadership_buy_in === 'mostly_supportive') readinessScore += 2;
    else if (data.leadership_buy_in === 'exploring') readinessScore += 1;

    // Have read the manual
    if (data.read_dna_manual === 'yes_fully') readinessScore += 2;
    else if (data.read_dna_manual === 'yes_partially') readinessScore += 1;

    // Leaders identified
    const leaderCount = parseLeaderCount(data.potential_leaders_count);
    if (leaderCount >= 5) readinessScore += 2;
    else if (leaderCount >= 2) readinessScore += 1;

    // Timeline
    if (data.launch_timeline === '1_3_months') readinessScore += 2;
    else if (data.launch_timeline === '3_6_months') readinessScore += 1;

    // Determine readiness level
    let readinessLevel: 'ready' | 'building' | 'exploring' = 'exploring';
    if (readinessScore >= 10) readinessLevel = 'ready';
    else if (readinessScore >= 5) readinessLevel = 'building';

    // Send 3 Steps email to the church contact
    const firstName = data.your_name.split(' ')[0].trim();
    await send3StepsEmail(data.contact_email, firstName, readinessLevel);

    return NextResponse.json({
      success: true,
      churchId: church.id,
      readinessLevel,
    });
  } catch (error) {
    console.error('Assessment submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
