import { NextResponse } from 'next/server';
import { getUnifiedSession, isTrainingParticipant, isAdmin } from '@/lib/unified-auth';
import { supabase } from '@/lib/supabase';
import { getSessionCount } from '@/lib/dna-manual-data';

/**
 * GET /api/training/certificate
 * Get user's training certificates
 */
export async function GET() {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isTrainingParticipant(session) && !isAdmin(session)) {
      return NextResponse.json({ error: 'Not a training participant' }, { status: 403 });
    }

    // Get user's certificates
    const { data: certificates } = await supabase
      .from('user_training_certificates')
      .select('*')
      .eq('user_id', session.userId)
      .order('issued_at', { ascending: false });

    return NextResponse.json({
      certificates: certificates || []
    });
  } catch (error) {
    console.error('Error loading certificates:', error);
    return NextResponse.json(
      { error: 'Failed to load certificates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/training/certificate
 * Issue a new certificate (called when completing a milestone)
 */
export async function POST(request: Request) {
  try {
    const { certificateType } = await request.json();

    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isTrainingParticipant(session) && !isAdmin(session)) {
      return NextResponse.json({ error: 'Not a training participant' }, { status: 403 });
    }

    // Validate certificate type
    const validTypes = ['dna_manual', 'launch_guide', 'full_training'];
    if (!validTypes.includes(certificateType)) {
      return NextResponse.json({ error: 'Invalid certificate type' }, { status: 400 });
    }

    // Check if user has already earned this certificate
    const { data: existing } = await supabase
      .from('user_training_certificates')
      .select('id')
      .eq('user_id', session.userId)
      .eq('certificate_type', certificateType)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Certificate already issued' }, { status: 400 });
    }

    // Verify eligibility based on certificate type
    if (certificateType === 'dna_manual') {
      // Check all manual sessions are complete
      const { data: unlocks } = await supabase
        .from('user_content_unlocks')
        .select('*')
        .eq('user_id', session.userId)
        .like('content_type', 'manual_session_%');

      const completedSessions = unlocks?.filter(u => u.metadata?.completed === true) || [];
      if (completedSessions.length < getSessionCount()) {
        return NextResponse.json({ error: 'Must complete all sessions first' }, { status: 403 });
      }
    }

    // Get completion stats for metadata
    const { data: progress } = await supabase
      .from('user_training_progress')
      .select('*')
      .eq('user_id', session.userId)
      .single();

    // Issue certificate
    const { data: certificate, error } = await supabase
      .from('user_training_certificates')
      .insert({
        user_id: session.userId,
        certificate_type: certificateType,
        metadata: {
          userName: session.name || 'DNA Leader',
          userEmail: session.email,
          completedAt: new Date().toISOString(),
          stage: progress?.current_stage || 'training'
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error issuing certificate:', error);
      return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      certificate
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    return NextResponse.json(
      { error: 'Failed to issue certificate' },
      { status: 500 }
    );
  }
}
