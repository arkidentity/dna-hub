import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';
import { logAdminAction } from '@/lib/audit';

// POST: Apply the default journey template to a church
// This copies Phase 0 & 1 milestones from template_milestones to church_milestones
export async function POST(
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

    // Verify church exists and doesn't have template already applied
    const { data: church, error: churchError } = await supabase
      .from('churches')
      .select('id, name, template_applied_at')
      .eq('id', churchId)
      .single();

    if (churchError || !church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    if (church.template_applied_at) {
      return NextResponse.json(
        { error: 'Template already applied to this church' },
        { status: 400 }
      );
    }

    // Get the default template
    const { data: template, error: templateError } = await supabase
      .from('journey_templates')
      .select('id, name')
      .eq('is_default', true)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Default template not found' },
        { status: 500 }
      );
    }

    // Get template milestones (Phase 0 and 1 only)
    const { data: templateMilestones, error: milestonesError } = await supabase
      .from('template_milestones')
      .select('*, phase:phases(phase_number)')
      .eq('template_id', template.id)
      .order('phase_id')
      .order('display_order', { ascending: true });

    if (milestonesError) {
      console.error('[APPLY TEMPLATE] Error fetching template milestones:', milestonesError);
      return NextResponse.json(
        { error: 'Failed to fetch template milestones' },
        { status: 500 }
      );
    }

    // Copy each template milestone to church_milestones
    const churchMilestones = templateMilestones?.map(tm => ({
      church_id: churchId,
      phase_id: tm.phase_id,
      title: tm.title,
      description: tm.description,
      resource_url: tm.resource_url,
      resource_type: tm.resource_type,
      display_order: tm.display_order,
      is_key_milestone: tm.is_key_milestone,
      source_template_id: template.id,
      source_milestone_id: tm.id,
      is_custom: false,
    })) || [];

    if (churchMilestones.length > 0) {
      const { error: insertError } = await supabase
        .from('church_milestones')
        .insert(churchMilestones);

      if (insertError) {
        console.error('[APPLY TEMPLATE] Error inserting church milestones:', insertError);
        return NextResponse.json(
          { error: 'Failed to create church milestones' },
          { status: 500 }
        );
      }
    }

    // Update church with template reference
    const { error: updateError } = await supabase
      .from('churches')
      .update({
        journey_template_id: template.id,
        template_applied_at: new Date().toISOString(),
      })
      .eq('id', churchId);

    if (updateError) {
      console.error('[APPLY TEMPLATE] Error updating church:', updateError);
      return NextResponse.json(
        { error: 'Failed to update church template reference' },
        { status: 500 }
      );
    }

    // Log the action
    await logAdminAction(
      session.email,
      'template_applied',
      'church',
      churchId,
      null,
      {
        template_id: template.id,
        template_name: template.name,
        milestones_created: churchMilestones.length,
      },
      `Applied journey template "${template.name}" to ${church.name}`
    );

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
      },
      milestonesCreated: churchMilestones.length,
    });
  } catch (error) {
    console.error('[APPLY TEMPLATE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
