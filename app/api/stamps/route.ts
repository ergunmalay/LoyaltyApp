import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { wallet_pass_id, event_type = 'add' } = await req.json()
  if (!wallet_pass_id) {
    return NextResponse.json({ error: 'wallet_pass_id is required' }, { status: 400 })
  }
  if (!['add', 'remove'].includes(event_type)) {
    return NextResponse.json({ error: 'event_type must be add or remove' }, { status: 400 })
  }

  const db = createServiceClient()

  // Verify staff exists and get their business
  const { data: staffUser } = await db
    .from('staff_users')
    .select('id, business_id')
    .eq('id', user.id)
    .single()

  if (!staffUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch pass with promotion to enforce tenant isolation
  const { data: pass } = await db
    .from('wallet_passes')
    .select('id, promotions!inner(business_id)')
    .eq('id', wallet_pass_id)
    .single()

  if (!pass) {
    return NextResponse.json({ error: 'Pass not found' }, { status: 404 })
  }

  // Tenant isolation: staff may only modify passes belonging to their own business
  const passBusiness = (pass.promotions as unknown as { business_id: string }).business_id
  if (passBusiness !== staffUser.business_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Atomic stamp via Postgres function (uses SELECT FOR UPDATE to prevent lost updates)
  const rpcName = event_type === 'add' ? 'add_stamp' : 'remove_stamp'
  const { error: rpcError } = await db.rpc(rpcName, {
    p_wallet_pass_id: wallet_pass_id,
    p_staff_user_id: staffUser.id,
  })

  if (rpcError) {
    if (rpcError.message.includes('pass_not_found')) {
      return NextResponse.json({ error: 'Pass not found' }, { status: 404 })
    }
    if (rpcError.message.includes('no_recent_stamp')) {
      return NextResponse.json(
        { error: 'Stamps can only be removed within 1 hour of adding' },
        { status: 400 }
      )
    }
    console.error('[stamps] rpc error:', rpcError)
    return NextResponse.json({ error: 'Failed to update stamp', detail: rpcError.message }, { status: 500 })
  }

  // Refetch with joins for the scanner UI response
  const { data: updatedPass } = await db
    .from('wallet_passes')
    .select('*, customers(*), promotions(*)')
    .eq('id', wallet_pass_id)
    .single()

  return NextResponse.json({ pass: updatedPass })
}
