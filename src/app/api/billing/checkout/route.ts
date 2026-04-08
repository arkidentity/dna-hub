import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth'
import { createClient } from '@supabase/supabase-js'

function getStripe() { return new Stripe(process.env.STRIPE_SECRET_KEY!) }

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PRICE_IDS: Record<string, string> = {
  seed:     process.env.STRIPE_PRICE_SEED!,
  growth:   process.env.STRIPE_PRICE_GROWTH!,
  thrive:   process.env.STRIPE_PRICE_THRIVE!,
  multiply: process.env.STRIPE_PRICE_MULTIPLY!,
}

export async function POST(req: NextRequest) {
  const session = await getUnifiedSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { church_id, tier, success_url, cancel_url } = await req.json()

  if (!church_id || !tier) {
    return NextResponse.json({ error: 'church_id and tier required' }, { status: 400 })
  }

  if (!PRICE_IDS[tier]) {
    return NextResponse.json({ error: `Invalid tier: ${tier}` }, { status: 400 })
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

  // Get or create Stripe customer
  const { data: billing } = await supabaseAdmin
    .from('church_billing_status')
    .select('stripe_customer_id, billing_email')
    .eq('church_id', church_id)
    .single()

  let customerId = billing?.stripe_customer_id

  if (!customerId) {
    // Get church name + leader email for customer record
    const { data: church } = await supabaseAdmin
      .from('churches')
      .select('name')
      .eq('id', church_id)
      .single()

    const customer = await getStripe().customers.create({
      email: billing?.billing_email || session.email,
      name: church?.name || 'DNA Church',
      metadata: { church_id },
    })

    customerId = customer.id

    // Store customer ID
    await supabaseAdmin
      .from('church_billing_status')
      .upsert({ church_id, stripe_customer_id: customerId }, { onConflict: 'church_id' })
  }

  const origin = req.headers.get('origin') || 'https://hub.dnachurch.app'

  const checkoutSession = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: PRICE_IDS[tier], quantity: 1 }],
    automatic_tax: { enabled: true },
    customer_update: { address: 'auto' },
    success_url: success_url || `${origin}/dashboard?billing=success`,
    cancel_url: cancel_url || `${origin}/dashboard?billing=canceled`,
    metadata: { church_id },
    subscription_data: { metadata: { church_id } },
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
