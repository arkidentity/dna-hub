import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency check — skip if already processed
  const { data: existing } = await supabaseAdmin
    .from('billing_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .single()

  if (existing) {
    return NextResponse.json({ received: true, skipped: true })
  }

  // Resolve church_id from the event
  let churchId: string | null = null

  try {
    churchId = await resolveChurchId(event)
    await handleEvent(event, churchId)
  } catch (err) {
    console.error(`Error handling Stripe event ${event.type}:`, err)
    // Still log the event even if handler fails
  }

  // Log event to audit trail
  await supabaseAdmin.from('billing_events').insert({
    church_id: churchId,
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event.data.object,
  })

  return NextResponse.json({ received: true })
}

async function resolveChurchId(event: Stripe.Event): Promise<string | null> {
  const obj = event.data.object as unknown as Record<string, unknown>

  // Try metadata.church_id first (set at checkout)
  const metadata = obj.metadata as Record<string, string> | undefined
  if (metadata?.church_id) return metadata.church_id

  // Try customer lookup
  const customerId = (obj.customer as string) || null
  if (customerId) {
    const { data } = await supabaseAdmin
      .from('church_billing_status')
      .select('church_id')
      .eq('stripe_customer_id', customerId)
      .single()
    if (data?.church_id) return data.church_id
  }

  // Try subscription lookup
  const subscriptionId = (obj.id as string) || null
  if (subscriptionId && event.type.startsWith('customer.subscription')) {
    const { data } = await supabaseAdmin
      .from('church_billing_status')
      .select('church_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()
    if (data?.church_id) return data.church_id
  }

  return null
}

async function handleEvent(event: Stripe.Event, churchId: string | null) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
      break

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpsert(event.data.object as Stripe.Subscription, churchId)
      break

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, churchId)
      break

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice, churchId)
      break

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice, churchId)
      break

    case 'invoice.upcoming':
      // Email handled by dunning cron — log only
      break

    default:
      break
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const churchId = session.metadata?.church_id
  if (!churchId) {
    console.error('checkout.session.completed: no church_id in metadata')
    return
  }

  // Fetch the subscription to get tier info
  let tier = 'seed'
  let monthlyAmountCents = 0
  let subscriptionId = null
  let periodStart = null
  let periodEnd = null

  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string, {
      expand: ['items.data.price.product'],
    }) as unknown as Stripe.Subscription

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = subscription as any
    subscriptionId = sub.id
    periodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null
    periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null

    const price = subscription.items.data[0]?.price
    const product = price?.product as Stripe.Product
    tier = product?.metadata?.tier || 'seed'
    monthlyAmountCents = price?.unit_amount || 0
  }

  // Upsert billing status
  await supabaseAdmin
    .from('church_billing_status')
    .upsert({
      church_id: churchId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscriptionId,
      plan_tier: tier,
      status: 'active',
      monthly_amount_cents: monthlyAmountCents,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: false,
    }, { onConflict: 'church_id' })

  // Enable Live Service Mode
  await supabaseAdmin
    .from('church_branding_settings')
    .upsert({ church_id: churchId, live_service_enabled: true }, { onConflict: 'church_id' })
}

async function handleSubscriptionUpsert(
  subscription: Stripe.Subscription,
  churchId: string | null
) {
  if (!churchId) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sub = subscription as any
  const price = sub.items?.data[0]?.price
  let tier = 'seed'
  let monthlyAmountCents = price?.unit_amount || 0

  if (price?.product) {
    const product = await stripe.products.retrieve(price.product as string)
    tier = product.metadata?.tier || 'seed'
  }

  const status = stripeStatusToLocal(sub.status)

  await supabaseAdmin
    .from('church_billing_status')
    .upsert({
      church_id: churchId,
      stripe_customer_id: sub.customer as string,
      stripe_subscription_id: sub.id,
      plan_tier: tier,
      status,
      monthly_amount_cents: monthlyAmountCents,
      current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
      current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
    }, { onConflict: 'church_id' })
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  churchId: string | null
) {
  if (!churchId) return

  await supabaseAdmin
    .from('church_billing_status')
    .update({ status: 'canceled', cancel_at_period_end: false })
    .eq('church_id', churchId)

  // Gate Live Service Mode
  await supabaseAdmin
    .from('church_branding_settings')
    .upsert({ church_id: churchId, live_service_enabled: false }, { onConflict: 'church_id' })
}

async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  churchId: string | null
) {
  if (!churchId) return

  // Only restore if previously past_due or suspended
  const { data: billing } = await supabaseAdmin
    .from('church_billing_status')
    .select('status')
    .eq('church_id', churchId)
    .single()

  if (billing?.status === 'past_due' || billing?.status === 'suspended') {
    await supabaseAdmin
      .from('church_billing_status')
      .update({ status: 'active', suspended_at: null })
      .eq('church_id', churchId)

    // Restore Live Service Mode if it was suspended
    await supabaseAdmin
      .from('church_branding_settings')
      .upsert({ church_id: churchId, live_service_enabled: true }, { onConflict: 'church_id' })
  }
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  churchId: string | null
) {
  if (!churchId) return

  await supabaseAdmin
    .from('church_billing_status')
    .update({ status: 'past_due' })
    .eq('church_id', churchId)

  // Dunning emails handled by cron job — not here
}

function stripeStatusToLocal(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active': return 'active'
    case 'past_due': return 'past_due'
    case 'canceled': return 'canceled'
    case 'unpaid': return 'suspended'
    default: return 'active'
  }
}
