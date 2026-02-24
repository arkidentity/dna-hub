import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
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

    const supabase = getSupabaseAdmin();

    // Get church_leader record to find church_id
    const { data: churchLeader, error: leaderError } = await supabase
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

    if (!church) {
      return NextResponse.json(
        { error: 'Church not found for this leader' },
        { status: 404 }
      );
    }

    // If church is not active, redirect to portal (unless admin)
    const adminUser = isAdmin(session);
    if (!adminUser && church.status !== 'active' && church.status !== 'completed') {
      return NextResponse.json(
        { redirect: '/portal' },
        { status: 307 }
      );
    }

    // Run all independent queries in parallel for performance
    const [
      phasesResult,
      milestonesResult,
      progressResult,
      attachmentsResult,
      milestoneResourcesResult,
      documentsResult,
      callsResult,
      globalResourcesResult,
      brandingResult,
    ] = await Promise.all([
      supabase
        .from('phases')
        .select('*')
        .order('phase_number', { ascending: true }),
      supabase
        .from('church_milestones')
        .select('*')
        .eq('church_id', church.id)
        .order('display_order', { ascending: true }),
      supabase
        .from('church_progress')
        .select('*')
        .eq('church_id', church.id),
      supabase
        .from('milestone_attachments')
        .select('*')
        .eq('church_id', church.id)
        .order('created_at', { ascending: true }),
      supabase
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
        .order('display_order', { ascending: true }),
      supabase
        .from('funnel_documents')
        .select('*')
        .eq('church_id', church.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('scheduled_calls')
        .select('*')
        .eq('church_id', church.id)
        .order('scheduled_at', { ascending: true }),
      supabase
        .from('global_resources')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      supabase
        .from('church_branding_settings')
        .select('splash_logo_url')
        .eq('church_id', church.id)
        .maybeSingle(),
    ]);

    const { data: phases, error: phasesError } = phasesResult;
    const { data: milestones, error: milestonesError } = milestonesResult;
    const { data: progress, error: progressError } = progressResult;
    const { data: attachments } = attachmentsResult;
    const { data: milestoneResources } = milestoneResourcesResult;
    const { data: documents } = documentsResult;
    const { data: calls } = callsResult;
    const { data: globalResources } = globalResourcesResult;
    const { data: branding } = brandingResult;

    if (phasesError) {
      console.error('Phases fetch error:', phasesError);
      return NextResponse.json(
        { error: 'Failed to fetch phases' },
        { status: 500 }
      );
    }

    if (milestonesError) {
      console.error('Milestones fetch error:', milestonesError);
      return NextResponse.json(
        { error: 'Failed to fetch milestones' },
        { status: 500 }
      );
    }

    if (progressError) {
      console.error('Progress fetch error:', progressError);
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      );
    }

    // Build a map from template_milestone_id -> resources
    const templateResourcesMap = new Map<string, typeof milestoneResources>();
    milestoneResources?.forEach(mr => {
      const existing = templateResourcesMap.get(mr.milestone_id) || [];
      templateResourcesMap.set(mr.milestone_id, [...existing, mr]);
    });

    // Build phases with milestones and progress
    const phasesWithMilestones: PhaseWithMilestones[] = (phases || []).map(phase => {
      const phaseMilestones = (milestones || []).filter(m => m.phase_id === phase.id);
      const milestonesWithProgress: MilestoneWithProgress[] = phaseMilestones.map(milestone => {
        const milestoneProgress = progress?.find(p => p.milestone_id === milestone.id);
        const milestoneAttachments = attachments?.filter(a => a.milestone_id === milestone.id);
        // Get global resources for this milestone (via source_milestone_id -> template_milestones)
        const templateResources = milestone.source_milestone_id
          ? templateResourcesMap.get(milestone.source_milestone_id) || []
          : [];
        const resources = templateResources
          .map(mr => mr.resource)
          .filter(Boolean);

        return {
          ...milestone,
          progress: milestoneProgress || null,
          attachments: milestoneAttachments || [],
          resources,
        };
      });

      const completedCount = milestonesWithProgress.filter(m => m.progress?.completed).length;
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
        milestones: milestonesWithProgress,
        status,
        completedCount,
        totalCount,
      };
    });

    return NextResponse.json({
      church: { ...church, splash_logo_url: branding?.splash_logo_url ?? null },
      leader,
      phases: phasesWithMilestones,
      documents: documents || [],
      calls: calls || [],
      globalResources: globalResources || [],
      isAdmin: adminUser,
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
