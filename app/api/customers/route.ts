import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { name, email, business_id, promotion_id } = await req.json()

  if (!name || !email || !business_id || !promotion_id) {
    return NextResponse.json(
      { error: 'name, email, business_id, and promotion_id are required' },
      { status: 400 }
    )
  }

  const db = createServiceClient()

  // Server-side validation: confirm promotion is active and belongs to the claimed business.
  // This prevents registering customers with a mismatched or fake business/promotion pair.
  const { data: promotion } = await db
    .from('promotions')
    .select('id')
    .eq('id', promotion_id)
    .eq('business_id', business_id)
    .eq('is_active', true)
    .maybeSingle()

  if (!promotion) {
    return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
  }

  // Upsert customer — return existing record if they've registered for this business before
  const { data: existingCustomer } = await db
    .from('customers')
    .select('*')
    .eq('email', email)
    .eq('business_id', business_id)
    .maybeSingle()

  let customer = existingCustomer

  if (!customer) {
    const { data: newCustomer, error } = await db
      .from('customers')
      .insert({ name, email, business_id })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    customer = newCustomer
  }

  // Return existing pass if they've already joined this promotion
  const { data: existingPass } = await db
    .from('wallet_passes')
    .select('*')
    .eq('customer_id', customer.id)
    .eq('promotion_id', promotion_id)
    .maybeSingle()

  if (existingPass) {
    return NextResponse.json({ pass: existingPass })
  }

  const barcode_value = crypto.randomUUID()
  const serial_number = crypto.randomUUID()

  const { data: pass, error: passError } = await db
    .from('wallet_passes')
    .insert({
      customer_id: customer.id,
      promotion_id,
      serial_number,
      barcode_value,
      current_stamps: 0,
      reward_available: false,
    })
    .select()
    .single()

  if (passError) {
    // Unique constraint violation means a concurrent request already created the pass
    if (passError.code === '23505') {
      const { data: racedPass } = await db
        .from('wallet_passes')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('promotion_id', promotion_id)
        .single()
      return NextResponse.json({ pass: racedPass })
    }
    return NextResponse.json({ error: passError.message }, { status: 500 })
  }

  return NextResponse.json({ pass })
}