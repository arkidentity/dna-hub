import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedSession, hasRole, isAdmin } from '@/lib/unified-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const session = await getUnifiedSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const churchId = searchParams.get('church_id')

  if (!churchId) {
    return NextResponse.json({ error: 'church_id required' }, { status: 400 })
  }

  // Must be a church leader for this church or admin
  if (!isAdmin(session)) {
    const { data: leader } = await supabaseAdmin
      .from('church_leaders')
      .select('id')
      .eq('user_id', session.userId)
      .eq('church_id', churchId)
      .single()

    if (!leader) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { data, error } = await supabaseAdmin
    .from('church_billing_status')
    .select('*')
    .eq('church_id', churchId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return free status if no row exists yet
  if (!data) {
    return NextResponse.json({
      data: {
        church_id: churchId,
        status: 'free',
        plan_tier: null,
        monthly_amount_cents: null,
        current_period_end: null,
        cancel_at_period_end: false,
      }
    })
  }

  return NextResponse.json({ data })
}
