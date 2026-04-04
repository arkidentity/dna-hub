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
        .eq('user_id', session.userId)
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

/**
 * PATCH /api/admin/church/[id]
 * Update church name, primary leader name, and/or primary leader email.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: churchId } = await params;
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { churchName, leaderName, leaderEmail } = body;

    // Validate at least one field is being updated
    if (!churchName && !leaderName && !leaderEmail) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Update church name
    if (churchName?.trim()) {
      const { error: churchError } = await supabase
        .from('churches')
        .update({ name: churchName.trim(), updated_at: new Date().toISOString() })
        .eq('id', churchId);

      if (churchError) {
        console.error('[ADMIN CHURCH PATCH] church update error:', churchError);
        return NextResponse.json({ error: 'Failed to update church name' }, { status: 500 });
      }
    }

    // Update primary leader name and/or email
    if (leaderName?.trim() || leaderEmail?.trim()) {
      // Get current primary leader
      const { data: currentLeader } = await supabase
        .from('church_leaders')
        .select('id, email, user_id')
        .eq('church_id', churchId)
        .eq('is_primary_contact', true)
        .single();

      if (!currentLeader) {
        return NextResponse.json({ error: 'Primary leader not found' }, { status: 404 });
      }

      const leaderUpdates: Record<string, string> = {};
      if (leaderName?.trim()) leaderUpdates.name = leaderName.trim();
      if (leaderEmail?.trim()) leaderUpdates.email = leaderEmail.trim().toLowerCase();

      // Update church_leaders record
      const { error: leaderError } = await supabase
        .from('church_leaders')
        .update(leaderUpdates)
        .eq('id', currentLeader.id);

      if (leaderError) {
        console.error('[ADMIN CHURCH PATCH] leader update error:', leaderError);
        return NextResponse.json({ error: 'Failed to update leader' }, { status: 500 });
      }

      // Also update the users table to keep name/email in sync
      if (currentLeader.user_id) {
        const userUpdates: Record<string, string> = {};
        if (leaderName?.trim()) userUpdates.name = leaderName.trim();
        if (leaderEmail?.trim()) userUpdates.email = leaderEmail.trim().toLowerCase();

        await supabase
          .from('users')
          .update(userUpdates)
          .eq('id', currentLeader.user_id);
      }

      // Update dna_leaders record if email changed
      if (leaderEmail?.trim() && currentLeader.email) {
        const dnaLeaderUpdates: Record<string, string> = {};
        if (leaderName?.trim()) dnaLeaderUpdates.name = leaderName.trim();
        dnaLeaderUpdates.email = leaderEmail.trim().toLowerCase();

        await supabase
          .from('dna_leaders')
          .update(dnaLeaderUpdates)
          .eq('email', currentLeader.email.toLowerCase())
          .eq('church_id', churchId);
      } else if (leaderName?.trim() && currentLeader.email) {
        // Name-only update on dna_leaders
        await supabase
          .from('dna_leaders')
          .update({ name: leaderName.trim() })
          .eq('email', currentLeader.email.toLowerCase())
          .eq('church_id', churchId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN CHURCH PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
