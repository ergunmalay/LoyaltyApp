import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data: staff } = await db
    .from('staff_users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const raw = body as Record<string, unknown>
  const title       = typeof raw.title       === 'string' ? raw.title.trim()             : null
  const reward_name = typeof raw.reward_name === 'string' ? raw.reward_name.trim()       : null
  const stamps_required = typeof raw.stamps_required === 'number' ? raw.stamps_required  : null

  if (!title)         return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  if (!reward_name)   return NextResponse.json({ error: 'Reward name is required' }, { status: 400 })
  if (!stamps_required || stamps_required < 1 || stamps_required > 50) {
    return NextResponse.json({ error: 'Stamps required must be between 1 and 50' }, { status: 400 })
  }

  const { data: promotion } = await db
    .from('promotions')
    .select('id')
    .eq('business_id', staff.business_id)
    .eq('is_active', true)
    .maybeSingle()

  if (!promotion) return NextResponse.json({ error: 'No active promotion found' }, { status: 404 })

  const { data, error } = await db
    .from('promotions')
    .update({ title, reward_name, stamps_required })
    .eq('id', promotion.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ promotion: data })
}
