import { NextRequest, NextResponse } from 'next/server';
import { getSession, isAdmin, getSupabaseAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.leader.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // Check for specific IDs to export
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    const selectedIds = idsParam ? idsParam.split(',').filter(id => id.trim()) : null;

    // Build query
    let query = supabase
      .from('churches')
      .select(`
        id,
        name,
        status,
        current_phase,
        selected_tier,
        created_at,
        updated_at
      `);

    // Filter by IDs if provided
    if (selectedIds && selectedIds.length > 0) {
      query = query.in('id', selectedIds);
    }

    const { data: churches, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[EXPORT] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // Get leaders
    const churchIds = churches?.map(c => c.id) || [];
    const { data: leaders } = await supabase
      .from('church_leaders')
      .select('church_id, name, email, phone')
      .in('church_id', churchIds)
      .eq('is_primary_contact', true);

    // Get assessments
    const { data: assessments } = await supabase
      .from('church_assessments')
      .select('church_id, congregation_size, denomination, readiness_score')
      .in('church_id', churchIds);

    // Get progress counts
    const { data: progress } = await supabase
      .from('church_progress')
      .select('church_id, completed')
      .in('church_id', churchIds);

    // Build CSV rows
    const rows = churches?.map(church => {
      const leader = leaders?.find(l => l.church_id === church.id);
      const assessment = assessments?.find(a => a.church_id === church.id);
      const churchProgress = progress?.filter(p => p.church_id === church.id) || [];
      const completedCount = churchProgress.filter(p => p.completed).length;

      return {
        'Church Name': church.name,
        'Status': church.status,
        'Current Phase': church.current_phase,
        'Selected Tier': church.selected_tier || '',
        'Leader Name': leader?.name || '',
        'Leader Email': leader?.email || '',
        'Leader Phone': leader?.phone || '',
        'Congregation Size': assessment?.congregation_size || '',
        'Denomination': assessment?.denomination || '',
        'Readiness Score': assessment?.readiness_score || '',
        'Milestones Completed': completedCount,
        'Created Date': new Date(church.created_at).toLocaleDateString(),
        'Last Updated': new Date(church.updated_at).toLocaleDateString(),
      };
    }) || [];

    // Convert to CSV
    if (rows.length === 0) {
      return new Response('No data to export', { status: 200 });
    }

    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(h => {
          const val = String(row[h as keyof typeof row] || '');
          // Escape quotes and wrap in quotes if contains comma or quote
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',')
      )
    ];

    const csv = csvLines.join('\n');
    const filename = `dna-churches-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[EXPORT] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
