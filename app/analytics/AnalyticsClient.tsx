'use client'

import Link from 'next/link'

interface DayData  { label: string; date: string; count: number }
interface Customer { name: string; email: string; stamps: number; current: number; rewardReady: boolean }
interface Stats {
  totalMembers: number
  totalStamps: number
  totalRedeemed: number
  rewardReadyNow: number
  completionRate: number
  stampsThisWeek: number
  weeklyChange: number | null
}
interface Props {
  businessName: string
  promotion: { title: string; stamps_required: number; reward_name: string }
  stats: Stats
  stampDays: DayData[]
  memberDays: DayData[]
  topCustomers: Customer[]
}

function BarChart({ days, color, height = 'h-32' }: { days: DayData[]; color: string; height?: string }) {
  const max = Math.max(...days.map((d) => d.count), 1)
  return (
    <div className={`flex items-end gap-1.5 ${height} w-full`}>
      {days.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-bold text-stone-400 tabular-nums leading-none">
            {d.count || ''}
          </span>
          <div
            className="w-full rounded-t-lg transition-all duration-500"
            style={{
              height: `${Math.max((d.count / max) * 88, d.count > 0 ? 8 : 3)}px`,
              background: d.count > 0 ? color : 'rgba(0,0,0,0.06)',
            }}
          />
          <span className="text-xs font-semibold text-stone-400 leading-none">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ emoji, label, value, sub, subColor = 'text-stone-400' }: {
  emoji: string; label: string; value: string | number; sub?: string; subColor?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100 flex flex-col">
      <p className="text-2xl mb-3">{emoji}</p>
      <p className="text-3xl font-black text-stone-900">{value}</p>
      <p className="text-sm font-semibold text-stone-500 mt-1">{label}</p>
      {sub && <p className={`text-xs font-bold mt-1.5 ${subColor}`}>{sub}</p>}
    </div>
  )
}

export default function AnalyticsClient({ businessName, promotion, stats, stampDays, memberDays, topCustomers }: Props) {
  const { totalMembers, totalStamps, totalRedeemed, rewardReadyNow, completionRate, stampsThisWeek, weeklyChange } = stats

  const weeklyBadge = weeklyChange === null ? undefined
    : weeklyChange >= 0 ? `▲ ${weeklyChange}% vs last week`
    : `▼ ${Math.abs(weeklyChange)}% vs last week`
  const weeklyColor = weeklyChange === null ? 'text-stone-400'
    : weeklyChange >= 0 ? 'text-green-600' : 'text-red-500'

  return (
    <div className="min-h-screen bg-orange-50">
      {/* ── Sticky header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-orange-50/90 backdrop-blur border-b border-orange-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">☕</span>
            <div>
              <h1 className="text-lg font-black text-stone-900 leading-none">{businessName}</h1>
              <p className="text-xs text-stone-400 font-medium mt-0.5">{promotion.title} · Analytics</p>
            </div>
          </div>
          <Link href="/dashboard" className="text-sm text-stone-400 font-semibold hover:text-stone-700 transition-colors">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ── Stat cards: 2-col mobile, 4-col desktop ─────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard emoji="👥" label="Total Members"    value={totalMembers} />
          <StatCard emoji="☕" label="Stamps This Week"  value={stampsThisWeek} sub={weeklyBadge} subColor={weeklyColor} />
          <StatCard emoji="🎉" label="Rewards Redeemed" value={totalRedeemed} />
          <StatCard emoji="⭐" label="Reward Ready Now"  value={rewardReadyNow}
            sub={rewardReadyNow > 0 ? 'Awaiting redemption' : undefined}
            subColor="text-orange-500"
          />
        </div>

        {/* ── Middle row: completion + charts side by side on desktop ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Completion rate */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100 flex flex-col justify-between">
            <div>
              <p className="font-black text-stone-900 text-lg">Completion Rate</p>
              <p className="text-xs text-stone-400 font-medium mt-1">
                {totalRedeemed} of {totalMembers} members redeemed
              </p>
            </div>
            <div>
              <p className="text-5xl font-black text-orange-500 my-4">{completionRate}%</p>
              <div className="w-full bg-stone-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-700"
                  style={{ width: `${completionRate}%`, background: 'linear-gradient(90deg,#f97316,#fbbf24)' }}
                />
              </div>
            </div>
            <p className="text-xs text-stone-400 font-medium mt-3">
              {totalStamps} stamps collected all time
            </p>
          </div>

          {/* Stamps chart */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
            <p className="font-black text-stone-900">Stamps — Last 7 Days</p>
            <p className="text-xs text-stone-400 font-medium mt-1 mb-4">{stampsThisWeek} this week</p>
            <BarChart days={stampDays} color="linear-gradient(180deg,#f97316,#fbbf24)" height="h-36" />
          </div>

          {/* Members chart */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
            <p className="font-black text-stone-900">New Members — Last 7 Days</p>
            <p className="text-xs text-stone-400 font-medium mt-1 mb-4">{totalMembers} total</p>
            <BarChart days={memberDays} color="linear-gradient(180deg,#a78bfa,#818cf8)" height="h-36" />
          </div>
        </div>

        {/* ── Top customers ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <p className="font-black text-stone-900">Top Customers</p>
            <p className="text-xs text-stone-400 font-medium mt-0.5">Ranked by all-time stamps</p>
          </div>

          {topCustomers.length === 0 ? (
            <p className="text-stone-400 text-sm font-medium text-center py-10">No customers yet.</p>
          ) : (
            <>
              {/* Desktop table */}
              <table className="hidden lg:table w-full text-sm">
                <thead>
                  <tr className="text-xs font-bold text-stone-400 uppercase tracking-wide border-b border-stone-100">
                    <th className="text-left px-5 py-3 w-8">#</th>
                    <th className="text-left px-5 py-3">Customer</th>
                    <th className="text-left px-5 py-3">Email</th>
                    <th className="text-center px-5 py-3">Current Stamps</th>
                    <th className="text-center px-5 py-3">All-Time</th>
                    <th className="text-center px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((c, i) => (
                    <tr key={c.email} className="border-b border-stone-50 last:border-0 hover:bg-orange-50/40 transition-colors">
                      <td className="px-5 py-3.5 font-black text-stone-300 tabular-nums">{i + 1}</td>
                      <td className="px-5 py-3.5 font-bold text-stone-800">{c.name}</td>
                      <td className="px-5 py-3.5 text-stone-400 font-medium">{c.email}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-bold text-stone-700">{c.current}</span>
                        <span className="text-stone-300 font-medium"> / {promotion.stamps_required}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center font-black text-orange-500">{c.stamps} ☕</td>
                      <td className="px-5 py-3.5 text-center">
                        {c.rewardReady
                          ? <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-bold">Ready</span>
                          : <span className="text-xs bg-stone-100 text-stone-400 px-2 py-1 rounded-full font-medium">Collecting</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile list */}
              <ul className="lg:hidden divide-y divide-stone-50">
                {topCustomers.map((c, i) => (
                  <li key={c.email} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-xs font-black text-stone-300 tabular-nums">{i + 1}</span>
                      <div>
                        <p className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                          {c.name}
                          {c.rewardReady && (
                            <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">Ready</span>
                          )}
                        </p>
                        <p className="text-xs text-stone-400 font-medium">
                          {c.current} / {promotion.stamps_required} stamps
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-orange-500">{c.stamps} ☕</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
