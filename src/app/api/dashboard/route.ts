import { NextResponse } from 'next/server';
import { getSession, supabaseAdmin } from '@/lib/auth';
import { PhaseWithMilestones, MilestoneWithProgress } from '@/lib/types';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { church, leader } = session;

    // Get all phases
    const { data: phases, error: phasesError } = await supabaseAdmin
      .from('phases')
      .select('*')
      .order('display_order', { ascending: true });

    if (phasesError) {
      console.error('Phases fetch error:', phasesError);
      return NextResponse.json(
        { error: 'Failed to fetch phases' },
        { status: 500 }
      );
    }

    // Get all milestones
    const { data: milestones, error: milestonesError } = await supabaseAdmin
      .from('milestones')
      .select('*')
      .order('display_order', { ascending: true });

    if (milestonesError) {
      console.error('Milestones fetch error:', milestonesError);
      return NextResponse.json(
        { error: 'Failed to fetch milestones' },
        { status: 500 }
      );
    }

    // Get church progress
    const { data: progress, error: progressError } = await supabaseAdmin
      .from('church_progress')
      .select(`
        *,
        completed_by_leader:church_leaders(name)
      `)
      .eq('church_id', church.id);

    if (progressError) {
      console.error('Progress fetch error:', progressError);
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      );
    }

    // Create a map of milestone progress
    const progressMap = new Map(
      progress?.map(p => [p.milestone_id, {
        ...p,
        completed_by_name: p.completed_by_leader?.name
      }]) || []
    );

    // Build phases with milestones and progress
    const phasesWithMilestones: PhaseWithMilestones[] = phases.map(phase => {
      const phaseMilestones: MilestoneWithProgress[] = milestones
        .filter(m => m.phase_id === phase.id)
        .map(milestone => ({
          ...milestone,
          progress: progressMap.get(milestone.id),
          completed_by_name: progressMap.get(milestone.id)?.completed_by_name,
        }));

      const completedCount = phaseMilestones.filter(m => m.progress?.completed).length;
      const totalCount = phaseMilestones.length;

      // Determine phase status
      let status: 'locked' | 'current' | 'completed' | 'upcoming';
      if (phase.phase_number < church.current_phase) {
        status = 'completed';
      } else if (phase.phase_number === church.current_phase) {
        status = 'current';
      } else if (phase.phase_number === church.current_phase + 1) {
        status = 'upcoming'; // Can see but items are locked
      } else {
        status = 'locked';
      }

      // If current phase is 0 (not started), phase 1 is current
      if (church.current_phase === 0 && phase.phase_number === 1) {
        status = 'current';
      }

      return {
        ...phase,
        milestones: phaseMilestones,
        status,
        completedCount,
        totalCount,
      };
    });

    return NextResponse.json({
      church,
      leader,
      phases: phasesWithMilestones,
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
