'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { createClient } from '@/lib/supabase-client'

export interface ActivityItem {
  id: string
  type: 'stamp_add' | 'stamp_remove' | 'redeem'
  customer_name: string
  created_at: string
  reward_name?: string
}

interface Business { id: string; name: string; slug: string }
interface StaffUser { id: string; name: string; email: string; role: string }
interface Promotion {
  id: string; title: string; stamps_required: number; reward_name: string; is_active: boolean
}
interface Props {
  business: Business
  staffUser: StaffUser
  promotion: Promotion | null
  origin: string
  activityItems: ActivityItem[]
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function DashboardClient({ business, staffUser, promotion, activityItems }: Props) {
  const router = useRouter()
  const [joinUrl, setJoinUrl] = useState('')
  const [form, setForm] = useState({ title: '', stamps_required: 8, reward_name: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/join/${business.slug}`)
  }, [business.slug])

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // business_id is intentionally omitted — the API derives it from the session
      body: JSON.stringify({
        title: form.title,
        stamps_required: form.stamps_required,
        reward_name: form.reward_name,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to create promotion')
      setLoading(false)
      return
    }
    router.refresh()
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const inputClass =
    'w-full px-4 py-3 border-2 border-stone-200 rounded-xl text-base focus:outline-none focus:border-orange-400 transition-colors'

  return (
    <main className="min-h-screen p-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">☕</span>
            <h1 className="text-2xl font-black text-stone-900">{business.name}</h1>
          </div>
          <p className="text-stone-400 text-sm font-medium">
            {staffUser.name} · {staffUser.role}
          </p>
        </div>
        <button onClick={handleLogout} className="text-sm text-stone-400 font-semibold hover:text-stone-600">
          Logout
        </button>
      </div>

      {!promotion ? (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100">
          <h2 className="text-xl font-black text-stone-900 mb-1">Create Your Promotion</h2>
          <p className="text-stone-400 text-sm font-medium mb-6">Set up your stamp card rewards</p>
          <form onSubmit={handleCreatePromotion} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Promotion Title</label>
              <input type="text" value={form.title} onChange={set('title')} required placeholder="e.g. Coffee Stamp Card" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Stamps Required</label>
              <input
                type="number"
                value={form.stamps_required}
                onChange={(e) => setForm((p) => ({ ...p, stamps_required: parseInt(e.target.value) || 1 }))}
                required min={1} max={50}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Reward Name</label>
              <input type="text" value={form.reward_name} onChange={set('reward_name')} required placeholder="e.g. Free Coffee" className={inputClass} />
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl font-medium">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold rounded-2xl disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating…' : 'Create Promotion'}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Promotion card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black text-stone-900">Active Promotion</h2>
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">Live</span>
            </div>
            <dl className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-stone-100">
                <dt className="text-stone-400 font-medium text-sm">Title</dt>
                <dd className="font-bold text-stone-900">{promotion.title}</dd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-stone-100">
                <dt className="text-stone-400 font-medium text-sm">Stamps required</dt>
                <dd className="font-bold text-stone-900">{promotion.stamps_required} ☕</dd>
              </div>
              <div className="flex justify-between items-center py-2">
                <dt className="text-stone-400 font-medium text-sm">Reward</dt>
                <dd className="font-bold text-orange-500">{promotion.reward_name}</dd>
              </div>
            </dl>
          </div>

          {/* QR code card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100 text-center">
            <h2 className="text-xl font-black text-stone-900 mb-1">Customer Join QR</h2>
            <p className="text-stone-400 text-sm font-medium mb-5">Display this at your counter</p>
            <div className="flex justify-center mb-4">
              {joinUrl ? (
                <div className="p-4 bg-orange-50 rounded-2xl border-2 border-orange-100">
                  <QRCodeSVG value={joinUrl} size={200} fgColor="#431407" />
                </div>
              ) : (
                <div className="w-[200px] h-[200px] bg-orange-50 rounded-2xl animate-pulse" />
              )}
            </div>
            <p className="text-xs text-stone-400 break-all font-medium">{joinUrl}</p>
          </div>

          <a
            href="/scan"
            className="block w-full py-5 bg-orange-500 hover:bg-orange-600 text-white text-xl font-black rounded-2xl text-center transition-colors"
          >
            📷 Open Staff Scanner
          </a>

          <a
            href="/analytics"
            className="block w-full py-4 bg-white border-2 border-orange-200 text-orange-600 text-lg font-bold rounded-2xl text-center hover:bg-orange-50 transition-colors"
          >
            📊 View Analytics
          </a>

          <a
            href="/settings"
            className="block w-full py-4 bg-white border-2 border-stone-200 text-stone-600 text-lg font-bold rounded-2xl text-center hover:bg-stone-50 transition-colors"
          >
            ⚙️ Settings
          </a>

          {/* Activity log */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100">
            <h2 className="text-xl font-black text-stone-900 mb-4">Recent Activity</h2>
            {activityItems.length === 0 ? (
              <p className="text-stone-400 text-sm font-medium text-center py-4">
                No activity yet — stamps will appear here as customers scan in.
              </p>
            ) : (
              <ul className="space-y-1">
                {activityItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between py-2.5 border-b border-stone-50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {item.type === 'stamp_add' && '☕'}
                        {item.type === 'stamp_remove' && '↩️'}
                        {item.type === 'redeem' && '🎉'}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-stone-800">{item.customer_name}</p>
                        <p className="text-xs text-stone-400 font-medium">
                          {item.type === 'stamp_add' && 'Stamp added'}
                          {item.type === 'stamp_remove' && 'Stamp removed'}
                          {item.type === 'redeem' && `Redeemed: ${item.reward_name}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-stone-300 font-medium tabular-nums">
                      {timeAgo(item.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
