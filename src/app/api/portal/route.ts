import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, getPrimaryChurch } from '@/lib/unified-auth';

export async function GET() {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const churchId = getPrimaryChurch(session);
    if (!churchId) {
      return NextResponse.json({ error: 'No church associated with session' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get church info
    const { data: church, error: churchError } = await supabase
      .from('churches')
      .select('*')
      .eq('id', churchId)
      .single();

    if (churchError || !church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    // If church is active, they should use the main dashboard
    if (church.status === 'active' || church.status === 'completed') {
      return NextResponse.json({ redirect: '/dashboard' }, { status: 307 });
    }

    // Get leader info
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

    // Separate upcoming and completed calls
    const now = new Date().toISOString();
    const nextCall = calls?.find(c => !c.completed && c.scheduled_at > now) || null;
    const completedCalls = calls?.filter(c => c.completed) || [];

    return NextResponse.json({
      church: {
        id: church.id,
        name: church.name,
        status: church.status,
        created_at: church.created_at,
      },
      leader: leader ? {
        id: leader.id,
        name: leader.name,
        email: leader.email,
      } : null,
      assessment: assessment || null,
      documents: documents || [],
      nextCall,
      completedCalls,
    });
  } catch (error) {
    console.error('[PORTAL] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
