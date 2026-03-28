import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { wallet_pass_id } = await req.json()
  if (!wallet_pass_id) {
    return NextResponse.json({ error: 'wallet_pass_id is required' }, { status: 400 })
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

  // Tenant isolation: staff may only redeem passes belonging to their own business
  const passBusiness = (pass.promotions as unknown as { business_id: string }).business_id
  if (passBusiness !== staffUser.business_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Atomic redeem via Postgres function (uses SELECT FOR UPDATE to prevent double-redemption)
  const { error: rpcError } = await db.rpc('redeem_reward', {
    p_wallet_pass_id: wallet_pass_id,
    p_staff_user_id: staffUser.id,
  })

  if (rpcError) {
    if (rpcError.message.includes('pass_not_found')) {
      return NextResponse.json({ error: 'Pass not found' }, { status: 404 })
    }
    if (rpcError.message.includes('no_reward_available')) {
      return NextResponse.json({ error: 'No reward available on this pass' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to redeem reward' }, { status: 500 })
  }

  // Refetch with joins for the scanner UI response
  const { data: updatedPass } = await db
    .from('wallet_passes')
    .select('*, customers(*), promotions(*)')
    .eq('id', wallet_pass_id)
    .single()

  return NextResponse.json({ pass: updatedPass })
}
