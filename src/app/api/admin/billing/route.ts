import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth'
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

  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch all churches with their billing status (left join so free churches appear too)
  const { data: churches, error: churchError } = await supabaseAdmin
    .from('churches')
    .select('id, name, subdomain, created_at')
    .order('name')

  if (churchError) {
    return NextResponse.json({ error: churchError.message }, { status: 500 })
  }

  interface BillingRow {
    church_id: string
    status: string
    plan_tier: string | null
    monthly_amount_cents: number | null
    current_period_end: string | null
    cancel_at_period_end: boolean
    stripe_customer_id: string | null
    suspended_at: string | null
    updated_at: string | null
    billing_email: string | null
    admin_notes: string | null
  }

  const { data: billingRows, error: billingError } = await supabaseAdmin
    .from('church_billing_status')
    .select(
      'church_id, status, plan_tier, monthly_amount_cents, current_period_end, ' +
      'cancel_at_period_end, stripe_customer_id, suspended_at, updated_at, billing_email, admin_notes'
    )

  if (billingError) {
    return NextResponse.json({ error: billingError.message }, { status: 500 })
  }

  // Index billing by church_id
  const billingByChurch = new Map(
    ((billingRows ?? []) as unknown as BillingRow[]).map(b => [b.church_id, b])
  )

  // Merge into a single list
  const rows = (churches ?? []).map(church => {
    const billing = billingByChurch.get(church.id)
    return {
      church_id: church.id,
      church_name: church.name,
      subdomain: church.subdomain,
      church_created_at: church.created_at,
      status: billing?.status ?? 'free',
      plan_tier: billing?.plan_tier ?? null,
      monthly_amount_cents: billing?.monthly_amount_cents ?? null,
      current_period_end: billing?.current_period_end ?? null,
      cancel_at_period_end: billing?.cancel_at_period_end ?? false,
      stripe_customer_id: billing?.stripe_customer_id ?? null,
      suspended_at: billing?.suspended_at ?? null,
      billing_updated_at: billing?.updated_at ?? null,
      billing_email: billing?.billing_email ?? null,
      admin_notes: billing?.admin_notes ?? null,
    }
  })

  // Compute summary stats
  const active = rows.filter(r => r.status === 'active')
  const mrr = active.reduce((sum, r) => sum + (r.monthly_amount_cents ?? 0), 0)
  const arr = mrr * 12

  const summary = {
    mrr_cents: mrr,
    arr_cents: arr,
    total_churches: rows.length,
    active_count: active.length,
    past_due_count: rows.filter(r => r.status === 'past_due').length,
    suspended_count: rows.filter(r => r.status === 'suspended').length,
    free_count: rows.filter(r => r.status === 'free').length,
    canceled_count: rows.filter(r => r.status === 'canceled').length,
  }

  return NextResponse.json({ rows, summary })
}
