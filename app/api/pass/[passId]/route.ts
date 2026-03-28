import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

// Public endpoint — returns only stamp state for a known pass ID.
// Pass IDs are UUIDs (unguessable), so no auth is needed.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ passId: string }> }
) {
  const { passId } = await params
  const db = createServiceClient()

  const { data: pass } = await db
    .from('wallet_passes')
    .select('id, current_stamps, reward_available')
    .eq('id', passId)
    .single()

  if (!pass) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ pass })
}
