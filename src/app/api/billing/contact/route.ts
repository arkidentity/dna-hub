import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PATCH /api/billing/contact
// Body: { church_id, billing_email }
// Updates the billing contact email for a church.
export async function PATCH(req: NextRequest) {
  const session = await getUnifiedSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { church_id, billing_email } = await req.json()

  if (!church_id) {
    return NextResponse.json({ error: 'church_id required' }, { status: 400 })
  }

  // Must be a church leader for this church or admin
  if (!isAdmin(session)) {
    const { data: leader } = await supabaseAdmin
      .from('church_leaders')
      .select('id')
      .eq('user_id', session.userId)
      .eq('church_id', church_id)
      .single()

    if (!leader) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { error } = await supabaseAdmin
    .from('church_billing_status')
    .upsert(
      { church_id, billing_email: billing_email || null },
      { onConflict: 'church_id' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
