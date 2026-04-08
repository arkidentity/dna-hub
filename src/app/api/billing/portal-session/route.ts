import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth'
import { createClient } from '@supabase/supabase-js'

function getStripe() { return new Stripe(process.env.STRIPE_SECRET_KEY!) }

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

  const { data: billing } = await supabaseAdmin
    .from('church_billing_status')
    .select('stripe_customer_id')
    .eq('church_id', churchId)
    .single()

  if (!billing?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
  }

  const origin = req.headers.get('origin') || 'https://hub.dnachurch.app'

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: billing.stripe_customer_id,
    return_url: `${origin}/dashboard?tab=billing`,
  })

  return NextResponse.json({ url: portalSession.url })
}
