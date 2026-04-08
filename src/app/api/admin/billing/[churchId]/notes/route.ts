import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PATCH /api/admin/billing/[churchId]/notes
// Admin-only: update internal notes on a church's billing record
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ churchId: string }> }
) {
  const session = await getUnifiedSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { churchId } = await params
  const { admin_notes } = await req.json()

  const { error } = await supabaseAdmin
    .from('church_billing_status')
    .upsert(
      { church_id: churchId, admin_notes: admin_notes ?? null },
      { onConflict: 'church_id' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
