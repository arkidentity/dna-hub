import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin, isAdminOrCoach, isChurchLeader } from '@/lib/unified-auth';

async function authorizeForSeries(seriesId: string) {
  const session = await getUnifiedSession();
  if (!session) return { session: null, churchId: null };
  const supabase = getSupabaseAdmin();
  const { data: series } = await supabase
    .from('church_passage_series')
    .select('church_id')
    .eq('id', seriesId)
    .single();
  if (!series) return { session: null, churchId: null };
  if (isAdmin(session) || isAdminOrCoach(session) || isChurchLeader(session, series.church_id)) {
    return { session, churchId: series.church_id };
  }
  return { session: null, churchId: null };
}

// ============================================
// GET — Fetch full series detail + entries
// ============================================
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  try {
    const { seriesId } = await params;
    const { session } = await authorizeForSeries(seriesId);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const [{ data: series }, { data: entries }] = await Promise.all([
      supabase
        .from('church_passage_series')
        .select('id, name, description, start_date, end_date, row_count, created_at')
        .eq('id', seriesId)
        .single(),
      supabase
        .from('church_passage_plan_entries')
        .select('id, date, reference, theme')
        .eq('series_id', seriesId)
        .order('date'),
    ]);

    if (!series) return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    return NextResponse.json({ series, entries: entries || [] });
  } catch (err) {
    console.error('[ADMIN] Series detail error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PUT — Replace series contents (atomic swap)
// Body: { name?, description?, entries: [{ date, reference, theme? }] }
// Used by "Replace CSV" flow. Cross-series conflicts handled same as POST.
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  try {
    const { seriesId } = await params;
    const { searchParams } = new URL(request.url);
    const overwrite = searchParams.get('overwrite') === 'true';

    const { session, churchId } = await authorizeForSeries(seriesId);
    if (!session || !churchId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, description, entries } = body as {
      name?: string;
      description?: string | null;
      entries: Array<{ date: string; reference: string; theme?: string | null }>;
    };

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'entries required' }, { status: 400 });
    }

    // Validate + dedupe within payload
    const seenDates = new Set<string>();
    for (const [i, e] of entries.entries()) {
      if (!e.date || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) {
        return NextResponse.json({ error: `Row ${i + 1}: invalid date` }, { status: 400 });
      }
      if (!e.reference?.trim()) {
        return NextResponse.json({ error: `Row ${i + 1}: reference is required` }, { status: 400 });
      }
      if (seenDates.has(e.date)) {
        return NextResponse.json({ error: `Duplicate date in upload: ${e.date}` }, { status: 400 });
      }
      seenDates.add(e.date);
    }

    const supabase = getSupabaseAdmin();

    // Check for conflicts with OTHER series in this church
    const dates = entries.map(e => e.date);
    const { data: conflicting } = await supabase
      .from('church_passage_plan_entries')
      .select('date, series_id, church_passage_series!inner(name)')
      .eq('church_id', churchId)
      .neq('series_id', seriesId)
      .in('date', dates);

    if (conflicting && conflicting.length > 0 && !overwrite) {
      return NextResponse.json(
        {
          error: 'conflicts',
          conflicts: conflicting.map((c: any) => ({
            date: c.date,
            series_name: c.church_passage_series?.name || 'existing series',
          })),
        },
        { status: 409 }
      );
    }

    if (conflicting && conflicting.length > 0 && overwrite) {
      await supabase
        .from('church_passage_plan_entries')
        .delete()
        .eq('church_id', churchId)
        .neq('series_id', seriesId)
        .in('date', dates);
    }

    // Update series metadata if name/description changed
    if (name !== undefined || description !== undefined) {
      await supabase
        .from('church_passage_series')
        .update({
          ...(name !== undefined ? { name: name.trim() } : {}),
          ...(description !== undefined ? { description: description?.trim() || null } : {}),
        })
        .eq('id', seriesId);
    }

    const { error: rpcError } = await supabase.rpc('replace_passage_series', {
      p_series_id: seriesId,
      p_church_id: churchId,
      p_entries: entries.map(e => ({
        date: e.date,
        reference: e.reference.trim(),
        theme: e.theme?.trim() || null,
      })),
    });

    if (rpcError) {
      console.error('[ADMIN] replace_passage_series error:', rpcError);
      return NextResponse.json({ error: 'Failed to save entries' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[ADMIN] Series PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// DELETE — Remove the series (cascades to entries)
// ============================================
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  try {
    const { seriesId } = await params;
    const { session } = await authorizeForSeries(seriesId);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('church_passage_series')
      .delete()
      .eq('id', seriesId);

    if (error) {
      console.error('[ADMIN] Series delete error:', error);
      return NextResponse.json({ error: 'Failed to delete series' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[ADMIN] Series DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
