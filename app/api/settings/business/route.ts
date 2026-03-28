import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data: staff } = await db
    .from('staff_users')
    .select('business_id, role')
    .eq('id', user.id)
    .single()

  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (staff.role !== 'owner') return NextResponse.json({ error: 'Only owners can change business settings' }, { status: 403 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const name = typeof (body as Record<string, unknown>).name === 'string'
    ? (body as Record<string, unknown>).name as string
    : null

  if (!name?.trim()) return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
  if (name.trim().length < 2) return NextResponse.json({ error: 'Must be at least 2 characters' }, { status: 400 })
  if (name.trim().length > 50) return NextResponse.json({ error: 'Must be 50 characters or fewer' }, { status: 400 })

  // Regenerate slug from new name
  let slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const { data: existing } = await db
    .from('businesses')
    .select('id')
    .eq('slug', slug)
    .neq('id', staff.business_id)
    .maybeSingle()
  if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`

  const { data, error } = await db
    .from('businesses')
    .update({ name: name.trim(), slug })
    .eq('id', staff.business_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ business: data })
}
