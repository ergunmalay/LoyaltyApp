import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const name = typeof (body as Record<string, unknown>).name === 'string'
    ? (body as Record<string, unknown>).name as string
    : null

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!/^[a-zA-Z\s'\-]{2,50}$/.test(name.trim())) {
    return NextResponse.json({ error: 'Name contains invalid characters' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('staff_users')
    .update({ name: name.trim() })
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ staffUser: data })
}
