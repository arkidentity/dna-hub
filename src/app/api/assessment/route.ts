import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth';
import { sendAssessmentNotification, send3StepsEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

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

    // Create assessment record linked to church
    const { error: assessmentError } = await supabaseAdmin
      .from('church_assessments')
      .insert({
        church_id: church.id,
        contact_name: data.your_name_role,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone || null,
        church_name: data.church_name,
        church_city: data.church_city,
        church_state: data.church_state,
        congregation_size: data.attendance_size,
        current_discipleship_approach: data.discipleship_culture === 'other'
          ? data.discipleship_culture_other
          : data.discipleship_culture,
        why_interested: data.driving_interest,
        identified_leaders: data.potential_leaders_count === '10_plus'
          ? 10
          : parseInt(data.potential_leaders_count?.split('_')[0]) || 0,
        leaders_completed_dna: data.leaders_experienced === 'yes_many' || data.leaders_experienced === 'a_few',
        pastor_commitment_level: data.leadership_buy_in,
        desired_launch_timeline: data.launch_timeline,
        potential_barriers: JSON.stringify(data.potential_barriers || []),
        first_year_goals: data.success_vision,
        support_needed: JSON.stringify(data.support_needed || []),
        how_heard_about_us: null, // Not in current form
        additional_questions: data.additional_notes,
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
      name: data.your_name_role.split(',')[0].trim(), // Get just the name part
      role: data.your_name_role.includes(',')
        ? data.your_name_role.split(',').slice(1).join(',').trim()
        : null,
      is_primary_contact: true,
    });

    // Send notification email to Travis
    await sendAssessmentNotification(
      data.church_name,
      data.your_name_role,
      data.contact_email
    );

    // Calculate readiness level for 3 Steps email
    let readinessScore = 0;

    // Decision maker (from leadership_buy_in)
    if (data.leadership_buy_in === 'fully_committed') readinessScore += 3;
    else if (data.leadership_buy_in === 'exploring') readinessScore += 1;

    // Pastor commitment (from pastor_commitment - if different field exists)
    if (data.pastor_commitment >= 8) readinessScore += 3;
    else if (data.pastor_commitment >= 5) readinessScore += 1;

    // Leaders identified
    const leaderCount = data.potential_leaders_count === '10_plus' ? 10 :
      parseInt(data.potential_leaders_count?.split('_')[0]) || 0;
    if (leaderCount >= 5) readinessScore += 2;
    else if (leaderCount >= 2) readinessScore += 1;

    // Manual reading
    if (data.leaders_experienced === 'yes_many') readinessScore += 2;
    else if (data.leaders_experienced === 'a_few') readinessScore += 1;

    // Timeline
    if (data.launch_timeline === '1_3_months') readinessScore += 2;
    else if (data.launch_timeline === '3_6_months') readinessScore += 1;

    // Determine readiness level
    let readinessLevel: 'ready' | 'building' | 'exploring' = 'exploring';
    if (readinessScore >= 10) readinessLevel = 'ready';
    else if (readinessScore >= 5) readinessLevel = 'building';

    // Send 3 Steps email to the church contact
    const firstName = data.your_name_role.split(',')[0].split(' ')[0].trim();
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
