import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import DashboardClient from './DashboardClient'
import type { ActivityItem } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const db = createServiceClient()

  const { data: staffUser } = await db
    .from('staff_users')
    .select('*, businesses(*)')
    .eq('id', user.id)
    .single()

  if (!staffUser || !staffUser.businesses) redirect('/auth/login')

  const { data: promotion } = await db
    .from('promotions')
    .select('*')
    .eq('business_id', staffUser.business_id)
    .eq('is_active', true)
    .maybeSingle()

  // Build origin for the QR join URL
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') || 'http'
  const origin = `${proto}://${host}`

  // ── Activity feed ──────────────────────────────────────────────────────────
  const activityItems: ActivityItem[] = []

  if (promotion) {
    // Get all pass IDs + customer names for this promotion
    const { data: passes } = await db
      .from('wallet_passes')
      .select('id, customers(name)')
      .eq('promotion_id', promotion.id)

    if (passes?.length) {
      const passIds = passes.map((p) => p.id)
      const nameByPassId = Object.fromEntries(
        passes.map((p) => [p.id, (p.customers as unknown as { name: string } | null)?.name ?? 'Unknown'])
      )

      const [{ data: stampEvents }, { data: redemptions }] = await Promise.all([
        db
          .from('stamp_events')
          .select('id, event_type, created_at, wallet_pass_id')
          .in('wallet_pass_id', passIds)
          .order('created_at', { ascending: false })
          .limit(20),
        db
          .from('redemptions')
          .select('id, created_at, wallet_pass_id')
          .in('wallet_pass_id', passIds)
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      for (const e of stampEvents ?? []) {
        activityItems.push({
          id: e.id,
          type: e.event_type === 'add' ? 'stamp_add' : 'stamp_remove',
          customer_name: nameByPassId[e.wallet_pass_id] ?? 'Unknown',
          created_at: e.created_at,
        })
      }

      for (const r of redemptions ?? []) {
        activityItems.push({
          id: r.id,
          type: 'redeem',
          customer_name: nameByPassId[r.wallet_pass_id] ?? 'Unknown',
          created_at: r.created_at,
          reward_name: promotion.reward_name,
        })
      }

      // Sort mixed events by most recent first, keep top 20
      activityItems.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      activityItems.splice(20)
    }
  }

  return (
    <DashboardClient
      business={staffUser.businesses}
      staffUser={{
        id: staffUser.id,
        name: staffUser.name,
        email: staffUser.email,
        role: staffUser.role,
      }}
      promotion={promotion}
      origin={origin}
      activityItems={activityItems}
    />
  )
}
