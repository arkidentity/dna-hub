import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin, hasRole } from '@/lib/unified-auth';
import { PhaseWithMilestones, MilestoneWithProgress } from '@/lib/types';

export async function GET() {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a church leader
    if (!hasRole(session, 'church_leader') && !isAdmin(session)) {
      return NextResponse.json(
        { error: 'Forbidden - Church leader access required' },
        { status: 403 }
      );
    }

    // Get church_leader record to find church_id
    const { data: churchLeader, error: leaderError } = await supabaseAdmin
      .from('church_leaders')
      .select(`
        *,
        church:churches(*)
      `)
      .eq('email', session.email)
      .single();

    if (leaderError || !churchLeader) {
      return NextResponse.json(
        { error: 'Church leader not found' },
        { status: 404 }
      );
    }

    const church = churchLeader.church;
    const leader = churchLeader;

    // If church is not active, redirect to portal (unless admin)
    const adminUser = isAdmin(session);
    if (!adminUser && church.status !== 'active' && church.status !== 'completed') {
      return NextResponse.json(
        { redirect: '/portal' },
        { status: 307 }
      );
    }

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

    // Get all attachments for this church
    const { data: attachments } = await supabaseAdmin
      .from('milestone_attachments')
      .select('*')
      .eq('church_id', church.id)
      .order('created_at', { ascending: true });

    // Create a map of milestone attachments
    const attachmentsMap = new Map<string, typeof attachments>();
    attachments?.forEach(attachment => {
      const existing = attachmentsMap.get(attachment.milestone_id) || [];
      attachmentsMap.set(attachment.milestone_id, [...existing, attachment]);
    });

    // Get global resources linked to milestones
    const { data: milestoneResources } = await supabaseAdmin
      .from('milestone_resources')
      .select(`
        milestone_id,
        display_order,
        resource:global_resources (
          id,
          name,
          description,
          file_url,
          resource_type
        )
      `)
      .order('display_order', { ascending: true });

    // Create a map of milestone resources
    type ResourceData = {
      id: string;
      name: string;
      description: string | null;
      file_url: string | null;
      resource_type: string | null;
    };
    const resourcesMap = new Map<string, ResourceData[]>();
    milestoneResources?.forEach(mr => {
      const resource = mr.resource as unknown as ResourceData | null;
      if (resource) {
        const existing = resourcesMap.get(mr.milestone_id) || [];
        resourcesMap.set(mr.milestone_id, [...existing, resource]);
      }
    });

    // Get funnel documents for this church
    const { data: documents } = await supabaseAdmin
      .from('funnel_documents')
      .select('*')
      .eq('church_id', church.id)
      .order('created_at', { ascending: true });

    // Get scheduled calls for this church
    const { data: calls } = await supabaseAdmin
      .from('scheduled_calls')
      .select('*')
      .eq('church_id', church.id)
      .order('scheduled_at', { ascending: true });

    // Get global resources (general resources for all churches)
    const { data: globalResources } = await supabaseAdmin
      .from('global_resources')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // Build phases with milestones and progress
    const phasesWithMilestones: PhaseWithMilestones[] = phases.map(phase => {
      const phaseMilestones: MilestoneWithProgress[] = milestones
        .filter(m => m.phase_id === phase.id)
        .map(milestone => ({
          ...milestone,
          progress: progressMap.get(milestone.id),
          completed_by_name: progressMap.get(milestone.id)?.completed_by_name,
          attachments: attachmentsMap.get(milestone.id) || [],
          resources: resourcesMap.get(milestone.id) || [],
        }));

      const completedCount = phaseMilestones.filter(m => m.progress?.completed).length;
      const totalCount = phaseMilestones.length;

      // Determine phase status
      let status: 'locked' | 'current' | 'completed' | 'upcoming';

      if (phase.phase_number === 0) {
        // Phase 0 (Onboarding): current if church is at phase 0, otherwise completed
        status = church.current_phase === 0 ? 'current' : 'completed';
      } else if (phase.phase_number < church.current_phase) {
        status = 'completed';
      } else if (phase.phase_number === church.current_phase) {
        status = 'current';
      } else if (phase.phase_number === church.current_phase + 1) {
        status = 'upcoming'; // Can see but items are locked
      } else {
        status = 'locked';
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
      documents: documents || [],
      calls: calls || [],
      globalResources: globalResources || [],
      isAdmin: adminUser,
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
