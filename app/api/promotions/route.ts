import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'

async function getAuthenticatedStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const db = createServiceClient()
  const { data: staffUser } = await db
    .from('staff_users')
    .select('*')
    .eq('id', user.id)
    .single()

  return staffUser
}

export async function GET() {
  const staff = await getAuthenticatedStaff()
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data: promotion } = await db
    .from('promotions')
    .select('*')
    .eq('business_id', staff.business_id)
    .eq('is_active', true)
    .maybeSingle()

  return NextResponse.json({ promotion })
}

export async function POST(req: NextRequest) {
  const staff = await getAuthenticatedStaff()
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, stamps_required, reward_name } = await req.json()

  if (!title || !stamps_required || !reward_name) {
    return NextResponse.json(
      { error: 'title, stamps_required, and reward_name are required' },
      { status: 400 }
    )
  }

  const db = createServiceClient()

  const { data: existing } = await db
    .from('promotions')
    .select('id')
    .eq('business_id', staff.business_id)
    .eq('is_active', true)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'An active promotion already exists' }, { status: 400 })
  }

  // business_id always comes from the authenticated session — never trust the request body
  const { data: promotion, error } = await db
    .from('promotions')
    .insert({
      business_id: staff.business_id,
      title,
      stamps_required: Number(stamps_required),
      reward_name,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ promotion })
}
