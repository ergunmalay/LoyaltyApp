import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  const { barcode } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  // Get the authenticated staff user's business for tenant isolation
  const { data: staffUser } = await db
    .from('staff_users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!staffUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: pass, error } = await db
    .from('wallet_passes')
    .select('*, customers(*), promotions(*)')
    .eq('barcode_value', barcode)
    .single()

  if (error || !pass) {
    return NextResponse.json({ error: 'Pass not found' }, { status: 404 })
  }

  // Tenant isolation: only return passes that belong to this staff member's business.
  // Return 404 (not 403) to avoid leaking the existence of other businesses' passes.
  if ((pass.promotions as { business_id: string }).business_id !== staffUser.business_id) {
    return NextResponse.json({ error: 'Pass not found' }, { status: 404 })
  }

  return NextResponse.json(pass)
}
