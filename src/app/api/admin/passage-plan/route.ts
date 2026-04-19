import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin, isAdminOrCoach, isChurchLeader } from '@/lib/unified-auth';

async function authorize(churchId: string) {
  const session = await getUnifiedSession();
  if (!session) return null;
  if (isAdmin(session) || isAdminOrCoach(session) || isChurchLeader(session, churchId)) {
    return session;
  }
  return null;
}

// ============================================
// GET — List all passage series for a church
// Query: ?church_id=UUID
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const churchId = searchParams.get('church_id');
    if (!churchId) {
      return NextResponse.json({ error: 'church_id is required' }, { status: 400 });
    }

    const session = await authorize(churchId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('church_passage_series')
      .select('id, name, description, start_date, end_date, row_count, created_at, updated_at')
      .eq('church_id', churchId)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('[ADMIN] Passage series fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
    }

    return NextResponse.json({ series: data || [] });
  } catch (err) {
    console.error('[ADMIN] Passage plan GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST — Create a new series + insert entries
// Body: { church_id, name, description?, entries: [{ date, reference, theme? }] }
// Returns: { series_id, conflicts?: [{ date, existing_series_name }] }
//
// Conflict handling: if any entry date collides with an existing entry for
// this church (in a different series), the request is rejected with 409 and
// a conflicts[] payload so the client can show the overwrite/skip dialog.
// Client retries with ?overwrite=true to clear the conflicting rows first.
// ============================================
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const overwrite = searchParams.get('overwrite') === 'true';

    const body = await request.json();
    const { church_id, name, description, entries } = body as {
      church_id: string;
      name: string;
      description?: string | null;
      entries: Array<{ date: string; reference: string; theme?: string | null }>;
    };

    if (!church_id || !name?.trim() || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: 'church_id, name, and at least one entry are required' },
        { status: 400 }
      );
    }

    const session = await authorize(church_id);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate entry shape + dedupe within payload
    const seenDates = new Set<string>();
    for (const [i, e] of entries.entries()) {
      if (!e.date || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) {
        return NextResponse.json({ error: `Row ${i + 1}: invalid date` }, { status: 400 });
      }
      if (!e.reference?.trim()) {
        return NextResponse.json({ error: `Row ${i + 1}: reference is required` }, { status: 400 });
      }
      if (seenDates.has(e.date)) {
        return NextResponse.json(
          { error: `Duplicate date in upload: ${e.date}` },
          { status: 400 }
        );
      }
      seenDates.add(e.date);
    }

    const supabase = getSupabaseAdmin();

    // Detect cross-series conflicts against this church's existing entries
    const dates = entries.map(e => e.date);
    const { data: conflicting } = await supabase
      .from('church_passage_plan_entries')
      .select('date, series_id, church_passage_series!inner(name)')
      .eq('church_id', church_id)
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
        .eq('church_id', church_id)
        .in('date', dates);
    }

    const startDate = dates.slice().sort()[0];
    const endDate = dates.slice().sort()[dates.length - 1];

    // Create series first (empty — replace_passage_series fills it)
    const { data: series, error: seriesError } = await supabase
      .from('church_passage_series')
      .insert({
        church_id,
        name: name.trim(),
        description: description?.trim() || null,
        start_date: startDate,
        end_date: endDate,
        created_by: session.userId,
      })
      .select('id')
      .single();

    if (seriesError || !series) {
      console.error('[ADMIN] Series insert error:', seriesError);
      return NextResponse.json({ error: 'Failed to create series' }, { status: 500 });
    }

    // Atomic bulk insert via RPC (handles row_count/start_date/end_date recompute)
    const { error: rpcError } = await supabase.rpc('replace_passage_series', {
      p_series_id: series.id,
      p_church_id: church_id,
      p_entries: entries.map(e => ({
        date: e.date,
        reference: e.reference.trim(),
        theme: e.theme?.trim() || null,
      })),
    });

    if (rpcError) {
      console.error('[ADMIN] replace_passage_series error:', rpcError);
      // Roll back the empty series so the user can retry cleanly
      await supabase.from('church_passage_series').delete().eq('id', series.id);
      return NextResponse.json({ error: 'Failed to save entries' }, { status: 500 });
    }

    return NextResponse.json({ series_id: series.id });
  } catch (err) {
    console.error('[ADMIN] Passage plan POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
