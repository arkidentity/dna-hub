import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedSession, hasRole, isAdmin } from '@/lib/unified-auth';
import { createClient } from '@supabase/supabase-js';

const MAX_CONDUCTORS = 2;

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/admin/conductors?church_id=xxx
export async function GET(req: NextRequest) {
  const session = await getUnifiedSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasRole(session, 'church_leader') && !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const churchId = req.nextUrl.searchParams.get('church_id');
  if (!churchId) return NextResponse.json({ error: 'church_id required' }, { status: 400 });

  const supabase = adminClient();
  const { data, error } = await supabase.rpc('get_church_conductors', {
    p_church_id: churchId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conductors: data ?? [] });
}

// POST /api/admin/conductors
// Body: { church_id, email }
export async function POST(req: NextRequest) {
  const session = await getUnifiedSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasRole(session, 'church_leader') && !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { church_id, email } = await req.json();
  if (!church_id || !email) {
    return NextResponse.json({ error: 'church_id and email required' }, { status: 400 });
  }

  const supabase = adminClient();

  // Enforce max 2 conductors
  const { data: existing } = await supabase.rpc('get_church_conductors', {
    p_church_id: church_id,
  });
  if ((existing ?? []).length >= MAX_CONDUCTORS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_CONDUCTORS} conductors allowed per church` },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('church_conductors')
    .insert({ church_id, email: email.toLowerCase().trim(), granted_by: session.userId });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'That email already has conductor access' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/conductors
// Body: { church_id, conductor_id }
export async function DELETE(req: NextRequest) {
  const session = await getUnifiedSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasRole(session, 'church_leader') && !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { church_id, conductor_id } = await req.json();
  if (!church_id || !conductor_id) {
    return NextResponse.json({ error: 'church_id and conductor_id required' }, { status: 400 });
  }

  const supabase = adminClient();
  const { error } = await supabase
    .from('church_conductors')
    .delete()
    .eq('id', conductor_id)
    .eq('church_id', church_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
