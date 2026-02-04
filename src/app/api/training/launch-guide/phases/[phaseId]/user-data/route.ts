import { NextRequest, NextResponse } from 'next/server';
import {
  getUnifiedSession,
  isTrainingParticipant,
  isAdmin,
} from '@/lib/unified-auth';
import { supabase } from '@/lib/supabase';
import { getPhase } from '@/lib/launch-guide-data';

/**
 * POST /api/training/launch-guide/phases/[phaseId]/user-data
 * Save user input data (names, dates, text fields)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isTrainingParticipant(session) && !isAdmin(session)) {
      return NextResponse.json(
        { error: 'Not a training participant' },
        { status: 403 }
      );
    }

    const { phaseId } = await params;
    const phaseIdNum = parseInt(phaseId);
    const phase = getPhase(phaseIdNum);

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
    }

    const body = await request.json();
    const { fieldId, value } = body;

    if (!fieldId) {
      return NextResponse.json(
        { error: 'Field ID required' },
        { status: 400 }
      );
    }

    // Validate the fieldId exists in the phase sections
    const validField = phase.sections.find((section) =>
      section.interactiveFields?.find((field) => field.id === fieldId)
    );
    if (!validField) {
      return NextResponse.json(
        { error: 'Invalid field' },
        { status: 400 }
      );
    }

    const phaseKey = `launch_guide_phase_${phaseIdNum}`;

    // Get current progress
    const { data: currentUnlock } = await supabase
      .from('user_content_unlocks')
      .select('*')
      .eq('user_id', session.userId)
      .eq('content_type', phaseKey)
      .single();

    const currentUserData = currentUnlock?.metadata?.userData || {};

    // Update user data
    const newUserData = {
      ...currentUserData,
      [fieldId]: value,
    };

    // Upsert the progress
    const { error: upsertError } = await supabase
      .from('user_content_unlocks')
      .upsert(
        {
          user_id: session.userId,
          content_type: phaseKey,
          unlocked: true,
          unlocked_at: currentUnlock?.unlocked_at || new Date().toISOString(),
          unlock_trigger: 'phase_started',
          metadata: {
            ...currentUnlock?.metadata,
            userData: newUserData,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,content_type' }
      );

    if (upsertError) {
      console.error('Error saving user data:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save user data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      progress: {
        completed: currentUnlock?.metadata?.completed || false,
        checklistCompleted: currentUnlock?.metadata?.checklistCompleted || [],
        sectionChecks: currentUnlock?.metadata?.sectionChecks || [],
        userData: newUserData,
      },
    });
  } catch (error) {
    console.error('Error saving user data:', error);
    return NextResponse.json(
      { error: 'Failed to save user data' },
      { status: 500 }
    );
  }
}
