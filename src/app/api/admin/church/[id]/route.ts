import { NextRequest, NextResponse } from 'next/server';
import { getSession, isAdmin, getSupabaseAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: churchId } = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.leader.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    // Get phases and milestones for all churches (admin view)
    let phases = null;
    const { data: phasesData } = await supabase
      .from('phases')
      .select('*')
      .order('phase_number', { ascending: true });

    if (phasesData) {
      // Get template milestones (no church_id) and church-specific milestones
      const { data: milestones } = await supabase
        .from('milestones')
        .select('*')
        .or(`church_id.is.null,church_id.eq.${churchId}`)
        .order('display_order', { ascending: true });

      const { data: progress } = await supabase
        .from('church_progress')
        .select('*')
        .eq('church_id', churchId);

      const { data: attachments } = await supabase
        .from('milestone_attachments')
        .select('*')
        .eq('church_id', churchId);

      // Get global resources linked to milestones
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

      phases = phasesData.map((phase) => {
        const phaseMilestones = milestones?.filter((m) => m.phase_id === phase.id) || [];
        const milestonesWithProgress = phaseMilestones.map((m) => {
          const milestoneProgress = progress?.find((p) => p.milestone_id === m.id);
          const milestoneAttachments = attachments?.filter((a) => a.milestone_id === m.id);
          // Get global resources for this milestone
          const resources = milestoneResources
            ?.filter((mr) => mr.milestone_id === m.id)
            .map((mr) => mr.resource)
            .filter(Boolean) || [];
          return {
            ...m,
            progress: milestoneProgress || null,
            attachments: milestoneAttachments || [],
            resources, // Global template resources
            is_custom: !!m.church_id, // Flag for church-specific milestones
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
        };
      });
    }

    return NextResponse.json({
      church,
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
