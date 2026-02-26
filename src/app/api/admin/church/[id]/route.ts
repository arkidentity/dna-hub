import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin, isDNACoach, isAdminOrCoach } from '@/lib/unified-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: churchId } = await params;
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminOrCoach(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminUser = isAdmin(session);
    const coachUser = isDNACoach(session);

    const supabase = getSupabaseAdmin();

    // Get church
    const { data: church, error: churchError } = await supabase
      .from('churches')
      .select('*')
      .eq('id', churchId)
      .single();

    if (churchError || !church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    // Coach scope check: coaches can only view churches assigned to them
    if (coachUser && !adminUser) {
      const { data: coachProfile } = await supabase
        .from('dna_coaches')
        .select('id')
        .eq('email', session.email.toLowerCase())
        .single();
      if (!coachProfile || church.coach_id !== coachProfile.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch coach info if assigned
    let coachInfo: { id: string; name: string; email: string | null } | null = null;
    if (church.coach_id) {
      const { data: coachData } = await supabase
        .from('dna_coaches')
        .select('id, name, email')
        .eq('id', church.coach_id)
        .single();
      coachInfo = coachData ?? null;
    }

    // Get leader
    const { data: leader } = await supabase
      .from('church_leaders')
      .select('*')
      .eq('church_id', churchId)
      .eq('is_primary_contact', true)
      .single();

    // Get assessment
    const { data: assessment } = await supabase
      .from('church_assessments')
      .select('*')
      .eq('church_id', churchId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    // Get funnel documents
    const { data: documents } = await supabase
      .from('funnel_documents')
      .select('*')
      .eq('church_id', churchId)
      .order('created_at', { ascending: true });

    // Get scheduled calls
    const { data: calls } = await supabase
      .from('scheduled_calls')
      .select('*')
      .eq('church_id', churchId)
      .order('scheduled_at', { ascending: true });

    // Get phases and church-specific milestones (admin view)
    let phases = null;
    const { data: phasesData } = await supabase
      .from('phases')
      .select('*')
      .order('phase_number', { ascending: true });

    if (phasesData) {
      // Get church-specific milestones (from church_milestones table)
      const { data: milestones } = await supabase
        .from('church_milestones')
        .select('*')
        .eq('church_id', churchId)
        .order('display_order', { ascending: true });

      const { data: progress } = await supabase
        .from('church_progress')
        .select('*')
        .eq('church_id', churchId);

      const { data: attachments } = await supabase
        .from('milestone_attachments')
        .select('*')
        .eq('church_id', churchId);

      // Get global resources linked to template milestones
      // milestone_resources links to template_milestones, so we map via source_milestone_id
      const { data: milestoneResources } = await supabase
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

      // Build a map from template_milestone_id -> resources
      const templateResourcesMap = new Map<string, typeof milestoneResources>();
      milestoneResources?.forEach(mr => {
        const existing = templateResourcesMap.get(mr.milestone_id) || [];
        templateResourcesMap.set(mr.milestone_id, [...existing, mr]);
      });

      // Get calls linked to milestones for this church
      const { data: linkedCalls } = await supabase
        .from('scheduled_calls')
        .select('*')
        .eq('church_id', churchId)
        .not('milestone_id', 'is', null);

      // Check if template has been applied
      const templateApplied = church.template_applied_at !== null;

      phases = phasesData.map((phase) => {
        const phaseMilestones = milestones?.filter((m) => m.phase_id === phase.id) || [];
        const milestonesWithProgress = phaseMilestones.map((m) => {
          const milestoneProgress = progress?.find((p) => p.milestone_id === m.id);
          const milestoneAttachments = attachments?.filter((a) => a.milestone_id === m.id);
          // Get global resources for this milestone (via source_milestone_id -> template_milestones)
          const templateResources = m.source_milestone_id
            ? templateResourcesMap.get(m.source_milestone_id) || []
            : [];
          const resources = templateResources
            .map((mr) => mr.resource)
            .filter(Boolean);
          // Get calls linked to this milestone
          const milestoneCalls = linkedCalls?.filter((c) => c.milestone_id === m.id) || [];
          return {
            ...m,
            progress: milestoneProgress || null,
            attachments: milestoneAttachments || [],
            resources, // Global template resources
            linked_calls: milestoneCalls, // Calls linked to this milestone
          };
        });

        const completedCount = milestonesWithProgress.filter((m) => m.progress?.completed).length;

        // Determine phase status
        let status = 'locked';
        if (phase.phase_number === 0) {
          status = 'current';
        } else if (phase.phase_number < church.current_phase) {
          status = 'completed';
        } else if (phase.phase_number === church.current_phase) {
          status = 'current';
        } else if (phase.phase_number === church.current_phase + 1) {
          status = 'upcoming';
        }

        return {
          ...phase,
          milestones: milestonesWithProgress,
          status,
          completedCount,
          totalCount: phaseMilestones.length,
          templateApplied,
        };
      });
    }

    return NextResponse.json({
      church,
      coach: coachInfo,
      leader: leader || { id: '', name: 'Unknown', email: '' },
      assessment: assessment || null,
      documents: documents || [],
      calls: calls || [],
      phases,
    });
  } catch (error) {
    console.error('[ADMIN CHURCH] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
