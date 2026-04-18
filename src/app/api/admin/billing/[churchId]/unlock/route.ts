import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ churchId: string }> }
) {
  const session = await getUnifiedSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { churchId } = await params
  const { data } = await supabaseAdmin
    .from('church_billing_status')
    .select('features_unlocked, features_unlocked_at, features_unlocked_by')
    .eq('church_id', churchId)
    .maybeSingle()

  return NextResponse.json({ features_unlocked: data?.features_unlocked ?? false })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ churchId: string }> }
) {
  const session = await getUnifiedSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { churchId } = await params
  const { features_unlocked } = await req.json() as { features_unlocked: boolean }

  const { error } = await supabaseAdmin
    .from('church_billing_status')
    .upsert(
      {
        church_id: churchId,
        features_unlocked,
        features_unlocked_at: features_unlocked ? new Date().toISOString() : null,
        features_unlocked_by: features_unlocked ? session.email : null,
      },
      { onConflict: 'church_id', ignoreDuplicates: false }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, features_unlocked })
}
