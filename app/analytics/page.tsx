import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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

  if (!promotion) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <p className="text-4xl">📊</p>
          <p className="text-stone-500 font-medium">Create a promotion first to see analytics.</p>
          <a href="/dashboard" className="text-orange-500 font-bold hover:underline">Go to Dashboard</a>
        </div>
      </main>
    )
  }

  // ── Fetch all passes for this promotion ──────────────────────────────────────
  const { data: passes } = await db
    .from('wallet_passes')
    .select('id, current_stamps, reward_available, created_at, customers(name, email)')
    .eq('promotion_id', promotion.id)

  const passIds = (passes ?? []).map((p) => p.id)

  // ── Parallel data fetches ────────────────────────────────────────────────────
  const [{ data: stampEvents }, { data: redemptions }] = await Promise.all([
    passIds.length
      ? db
          .from('stamp_events')
          .select('id, event_type, created_at, wallet_pass_id')
          .in('wallet_pass_id', passIds)
          .eq('event_type', 'add')
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    passIds.length
      ? db
          .from('redemptions')
          .select('id, created_at, wallet_pass_id')
          .in('wallet_pass_id', passIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  const stamps      = stampEvents ?? []
  const redeems     = redemptions ?? []
  const passesData  = passes ?? []

  // ── Summary stats ────────────────────────────────────────────────────────────
  const totalMembers    = passesData.length
  const totalStamps     = stamps.length
  const totalRedeemed   = redeems.length
  const rewardReadyNow  = passesData.filter((p) => p.reward_available).length

  // ── Stamps per day — last 7 days ─────────────────────────────────────────────
  const now = new Date()
  const days: { label: string; date: string; count: number }[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (6 - i))
    return {
      label: d.toLocaleDateString('en-GB', { weekday: 'short' }),
      date: d.toISOString().slice(0, 10),
      count: 0,
    }
  })

  for (const s of stamps) {
    const day = s.created_at.slice(0, 10)
    const slot = days.find((d) => d.date === day)
    if (slot) slot.count++
  }

  // ── New members per day — last 7 days ────────────────────────────────────────
  const memberDays: { label: string; date: string; count: number }[] = days.map((d) => ({
    ...d,
    count: 0,
  }))
  for (const p of passesData) {
    const day = p.created_at.slice(0, 10)
    const slot = memberDays.find((d) => d.date === day)
    if (slot) slot.count++
  }

  // ── Top customers by stamps collected ────────────────────────────────────────
  const stampsByPass: Record<string, number> = {}
  for (const s of stamps) {
    stampsByPass[s.wallet_pass_id] = (stampsByPass[s.wallet_pass_id] ?? 0) + 1
  }

  const topCustomers = passesData
    .map((p) => ({
      name: (p.customers as unknown as { name: string } | null)?.name ?? 'Unknown',
      email: (p.customers as unknown as { name: string; email: string } | null)?.email ?? '',
      stamps: stampsByPass[p.id] ?? 0,
      current: p.current_stamps,
      rewardReady: p.reward_available,
    }))
    .sort((a, b) => b.stamps - a.stamps)
    .slice(0, 8)

  // ── Completion rate ───────────────────────────────────────────────────────────
  const completionRate =
    totalMembers > 0 ? Math.round((totalRedeemed / totalMembers) * 100) : 0

  // ── Stamps this week vs last week ────────────────────────────────────────────
  const oneWeekAgo  = new Date(now); oneWeekAgo.setDate(now.getDate() - 7)
  const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14)
  const stampsThisWeek = stamps.filter((s) => new Date(s.created_at) >= oneWeekAgo).length
  const stampsLastWeek = stamps.filter(
    (s) => new Date(s.created_at) >= twoWeeksAgo && new Date(s.created_at) < oneWeekAgo
  ).length
  const weeklyChange =
    stampsLastWeek === 0
      ? null
      : Math.round(((stampsThisWeek - stampsLastWeek) / stampsLastWeek) * 100)

  return (
    <AnalyticsClient
      businessName={staffUser.businesses.name}
      promotion={promotion}
      stats={{ totalMembers, totalStamps, totalRedeemed, rewardReadyNow, completionRate, stampsThisWeek, weeklyChange }}
      stampDays={days}
      memberDays={memberDays}
      topCustomers={topCustomers}
    />
  )
}
