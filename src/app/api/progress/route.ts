import { NextRequest, NextResponse } from 'next/server';
import { getSession, supabaseAdmin } from '@/lib/auth';
import { sendMilestoneNotification, sendPhaseCompletionNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { milestoneId, completed, notes, targetDate } = await request.json();
    const { church, leader } = session;

    // Check if progress record exists
    const { data: existing } = await supabaseAdmin
      .from('church_progress')
      .select('id')
      .eq('church_id', church.id)
      .eq('milestone_id', milestoneId)
      .single();

    if (existing) {
      // Update existing record
      const updateData: Record<string, unknown> = {};

      // Only update fields that were provided
      if (completed !== undefined) {
        updateData.completed = completed;
        updateData.completed_at = completed ? new Date().toISOString() : null;
        updateData.completed_by = completed ? leader.id : null;
      }
      if (notes !== undefined) updateData.notes = notes;
      if (targetDate !== undefined) updateData.target_date = targetDate;

      const { error } = await supabaseAdmin
        .from('church_progress')
        .update(updateData)
        .eq('id', existing.id);

      if (error) {
        console.error('Progress update error:', error);
        return NextResponse.json(
          { error: 'Failed to update progress' },
          { status: 500 }
        );
      }
    } else {
      // Create new record
      const { error } = await supabaseAdmin
        .from('church_progress')
        .insert({
          church_id: church.id,
          milestone_id: milestoneId,
          completed: completed || false,
          completed_at: completed ? new Date().toISOString() : null,
          completed_by: completed ? leader.id : null,
          notes,
          target_date: targetDate,
        });

      if (error) {
        console.error('Progress insert error:', error);
        return NextResponse.json(
          { error: 'Failed to save progress' },
          { status: 500 }
        );
      }
    }

    // Check if milestone is a key milestone and send notification
    if (completed) {
      const { data: milestone } = await supabaseAdmin
        .from('milestones')
        .select('*, phase:phases(name, phase_number)')
        .eq('id', milestoneId)
        .single();

      if (milestone?.is_key_milestone) {
        // Log notification
        await supabaseAdmin.from('notification_log').insert({
          church_id: church.id,
          milestone_id: milestoneId,
          notification_type: 'milestone_completed',
          sent_to: 'thearkidentity@gmail.com',
        });

        // Send email notification
        await sendMilestoneNotification(
          church.name,
          milestone.title,
          milestone.phase?.name || 'Unknown Phase',
          leader.name
        );
      }

      // Check if all milestones in phase are completed - auto advance
      const { data: phaseInfo } = await supabaseAdmin
        .from('milestones')
        .select('phase_id')
        .eq('id', milestoneId)
        .single();

      if (phaseInfo) {
        const { data: allPhaseMilestones } = await supabaseAdmin
          .from('milestones')
          .select('id')
          .eq('phase_id', phaseInfo.phase_id);

        const { data: completedMilestones } = await supabaseAdmin
          .from('church_progress')
          .select('milestone_id')
          .eq('church_id', church.id)
          .eq('completed', true)
          .in('milestone_id', allPhaseMilestones?.map(m => m.id) || []);

        // If all milestones completed, advance to next phase
        if (allPhaseMilestones && completedMilestones &&
            completedMilestones.length === allPhaseMilestones.length) {

          const { data: currentPhase } = await supabaseAdmin
            .from('phases')
            .select('phase_number')
            .eq('id', phaseInfo.phase_id)
            .single();

          if (currentPhase && currentPhase.phase_number >= church.current_phase) {
            // Get phase name for notification
            const { data: phaseData } = await supabaseAdmin
              .from('phases')
              .select('name')
              .eq('id', phaseInfo.phase_id)
              .single();

            await supabaseAdmin
              .from('churches')
              .update({ current_phase: currentPhase.phase_number + 1 })
              .eq('id', church.id);

            // Log phase completion notification
            await supabaseAdmin.from('notification_log').insert({
              church_id: church.id,
              notification_type: 'phase_completed',
              sent_to: 'thearkidentity@gmail.com',
            });

            // Send phase completion email
            await sendPhaseCompletionNotification(
              church.name,
              currentPhase.phase_number,
              phaseData?.name || `Phase ${currentPhase.phase_number}`
            );
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
