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

    // Normalize email up front — needed for the pre-existence check
    const normalizedEmail = data.contact_email.toLowerCase().trim();

    // Parse leader count from form field
    const parseLeaderCount = (val: string): number => {
      if (!val) return 0;
      if (val === '10_plus' || val === '10+') return 10;
      const match = val.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    };

    // ─── Pre-existence check ────────────────────────────────────────────────
    // If an admin already added this person as a church leader (prospect/demo),
    // we must NOT create a second church. Instead, link the assessment to the
    // existing church so we avoid duplicate church records + orphaned roles.
    const { data: existingLeaderRecord } = await supabaseAdmin
      .from('church_leaders')
      .select('church_id, user_id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    const preExistingChurchId: string | null = existingLeaderRecord?.church_id || null;
    const preExistingUserId: string | null = existingLeaderRecord?.user_id || null;

    let churchId: string;
    let userId: string = '';

    if (preExistingChurchId) {
      // ── Path A: admin-created church — reuse existing records ──────────────
      console.log('[Assessment] Pre-existing church found for', normalizedEmail, '→ church', preExistingChurchId);
      churchId = preExistingChurchId;
      userId = preExistingUserId || '';

      // Update the church name in case admin used a placeholder
      await supabaseAdmin
        .from('churches')
        .update({ name: data.church_name })
        .eq('id', churchId);

      // Upsert the assessment record (update existing stub or insert full record)
      const { data: existingAssessment } = await supabaseAdmin
        .from('church_assessments')
        .select('id')
        .eq('church_id', churchId)
        .maybeSingle();

      const assessmentPayload = {
        church_id: churchId,
        contact_name: contactName,
        contact_email: normalizedEmail,
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
      };

      if (existingAssessment) {
        await supabaseAdmin
          .from('church_assessments')
          .update(assessmentPayload)
          .eq('id', existingAssessment.id);
      } else {
        await supabaseAdmin.from('church_assessments').insert(assessmentPayload);
      }

      // Advance church status to awaiting_discovery (was prospect/demo/pending_assessment)
      await supabaseAdmin
        .from('churches')
        .update({ status: 'awaiting_discovery' })
        .eq('id', churchId);

      // Update the church_leaders record with any new info from the form
      await supabaseAdmin
        .from('church_leaders')
        .update({
          name: data.your_name,
          role: data.your_role || null,
        })
        .eq('church_id', churchId)
        .eq('email', normalizedEmail);

    } else {
      // ── Path B: brand-new church — create all records fresh ────────────────

      // Create church record
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

      churchId = church.id;

      // Create assessment record linked to church
      const { error: assessmentError } = await supabaseAdmin
        .from('church_assessments')
        .insert({
          church_id: churchId,
          contact_name: contactName,
          contact_email: normalizedEmail,
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
        await supabaseAdmin.from('churches').delete().eq('id', churchId);
        return NextResponse.json(
          { error: 'Failed to create assessment record' },
          { status: 500 }
        );
      }

      // Update church status to awaiting discovery call
      await supabaseAdmin
        .from('churches')
        .update({ status: 'awaiting_discovery' })
        .eq('id', churchId);

      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .single();

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create new user
        const { data: newUser, error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            email: normalizedEmail,
            name: data.your_name,
          })
          .select('id')
          .single();

        if (userError) {
          console.error('User insert error:', userError);
          // Continue without user — they can be added later
        } else {
          userId = newUser?.id || '';
        }
      }

      // Add roles for the user (church_leader + dna_leader)
      if (userId) {
        // Add church_leader role (check first — partial index means upsert isn't reliable)
        const { data: existingChurchLeaderRole } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('role', 'church_leader')
          .eq('church_id', churchId)
          .maybeSingle();

        if (!existingChurchLeaderRole) {
          const { error: clRoleError } = await supabaseAdmin.from('user_roles').insert({
            user_id: userId,
            role: 'church_leader',
            church_id: churchId,
          });
          if (clRoleError) console.error('[Assessment] Failed to insert church_leader role:', clRoleError);
        }

        // Add dna_leader role
        const { data: existingDnaLeaderRole } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('role', 'dna_leader')
          .eq('church_id', churchId)
          .maybeSingle();

        if (!existingDnaLeaderRole) {
          const { error: dlRoleError } = await supabaseAdmin.from('user_roles').insert({
            user_id: userId,
            role: 'dna_leader',
            church_id: churchId,
          });
          if (dlRoleError) console.error('[Assessment] Failed to insert dna_leader role:', dlRoleError);
        }

        // Create dna_leaders record (ignore if already exists)
        await supabaseAdmin.from('dna_leaders').upsert({
          email: normalizedEmail,
          name: data.your_name,
          church_id: churchId,
          user_id: userId,
          is_active: true,
          activated_at: new Date().toISOString(),
        }, { onConflict: 'email', ignoreDuplicates: true });
      }

      // Create primary leader record
      await supabaseAdmin.from('church_leaders').insert({
        church_id: churchId,
        email: normalizedEmail,
        name: data.your_name,
        role: data.your_role || null,
        is_primary_contact: true,
        user_id: userId || null,
      });
    }

    // Send notification email to Travis (with churchId for logging)
    await sendAssessmentNotification(
      data.church_name,
      contactName,
      data.contact_email,
      churchId
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

    // Leaders identified (matches frontend: 6_plus = 2pts, 3_5 = 1pt)
    if (data.potential_leaders_count === '6_plus') readinessScore += 2;
    else if (data.potential_leaders_count === '3_5') readinessScore += 1;

    // Timeline (matches frontend: within_3_months = 2pts, 3_6_months = 1pt)
    if (data.launch_timeline === 'within_3_months') readinessScore += 2;
    else if (data.launch_timeline === '3_6_months') readinessScore += 1;

    // Discipleship culture (matches frontend)
    if (data.discipleship_culture === 'active') readinessScore += 2;
    else if (data.discipleship_culture === 'inconsistent') readinessScore += 1;

    // Determine readiness level (thresholds must match /src/app/assessment/page.tsx)
    let readinessLevel: 'ready' | 'building' | 'exploring' = 'exploring';
    if (readinessScore >= 10) readinessLevel = 'ready';
    else if (readinessScore >= 5) readinessLevel = 'building';

    // Send 3 Steps email to the church contact (with churchId for logging)
    const firstName = data.your_name.split(' ')[0].trim();
    await send3StepsEmail(data.contact_email, firstName, readinessLevel, churchId);

    return NextResponse.json({
      success: true,
      churchId,
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
