'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

interface Business  { id: string; name: string; slug: string }
interface StaffUser { id: string; name: string; email: string; role: string }
interface Promotion { id: string; title: string; stamps_required: number; reward_name: string }

interface Props {
  business: Business
  staffUser: StaffUser
  promotion: Promotion | null
}

function Section({ title, description, children }: {
  title: string; description: string; children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-8 border-b border-stone-200 last:border-0">
      <div>
        <h2 className="text-base font-black text-stone-900">{title}</h2>
        <p className="text-sm text-stone-400 font-medium mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="lg:col-span-2 space-y-4">{children}</div>
    </div>
  )
}

const inputClass = 'w-full px-4 py-3 border-2 border-stone-200 rounded-xl text-base focus:outline-none focus:border-orange-400 transition-colors bg-white'

export default function SettingsClient({ business, staffUser, promotion }: Props) {
  const router = useRouter()

  // ── Business form ─────────────────────────────────────────────────────────
  const [bizName, setBizName]     = useState(business.name)
  const [bizLoading, setBizLoading] = useState(false)

  const saveBusiness = async () => {
    if (!bizName.trim()) return toast.error('Business name is required')
    setBizLoading(true)
    const res = await fetch('/api/settings/business', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: bizName }),
    })
    const data = await res.json()
    setBizLoading(false)
    if (!res.ok) return toast.error(data.error || 'Failed to save')
    toast.success('Business name updated')
    router.refresh()
  }

  // ── Profile form ──────────────────────────────────────────────────────────
  const [myName, setMyName]         = useState(staffUser.name)
  const [profileLoading, setProfileLoading] = useState(false)

  const saveProfile = async () => {
    if (!myName.trim()) return toast.error('Name is required')
    setProfileLoading(true)
    const res = await fetch('/api/settings/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: myName }),
    })
    const data = await res.json()
    setProfileLoading(false)
    if (!res.ok) return toast.error(data.error || 'Failed to save')
    toast.success('Profile updated')
    router.refresh()
  }

  // ── Promotion form ────────────────────────────────────────────────────────
  const [promo, setPromo] = useState({
    title: promotion?.title ?? '',
    stamps_required: promotion?.stamps_required ?? 8,
    reward_name: promotion?.reward_name ?? '',
  })
  const [promoLoading, setPromoLoading] = useState(false)

  const savePromotion = async () => {
    setPromoLoading(true)
    const res = await fetch('/api/settings/promotion', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promo),
    })
    const data = await res.json()
    setPromoLoading(false)
    if (!res.ok) return toast.error(data.error || 'Failed to save')
    toast.success('Promotion updated')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-orange-50/90 backdrop-blur border-b border-orange-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">☕</span>
            <div>
              <h1 className="text-lg font-black text-stone-900 leading-none">{business.name}</h1>
              <p className="text-xs text-stone-400 font-medium mt-0.5">Settings</p>
            </div>
          </div>
          <Link href="/dashboard" className="text-sm text-stone-400 font-semibold hover:text-stone-700 transition-colors">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 px-6 divide-y divide-stone-100">

          {/* ── Business ─────────────────────────────────────────────────────── */}
          <Section
            title="Business"
            description="This name appears on your customers' stamp cards and the join page."
          >
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Business Name</label>
              <input
                type="text"
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                maxLength={50}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Join URL</label>
              <div className="px-4 py-3 bg-stone-50 border-2 border-stone-100 rounded-xl text-sm text-stone-500 font-medium break-all select-all">
                /join/{business.slug}
              </div>
              <p className="text-xs text-stone-400 font-medium mt-1">Updates automatically when you change the business name.</p>
            </div>
            <SaveButton onClick={saveBusiness} loading={bizLoading} disabled={bizName.trim() === business.name} />
          </Section>

          {/* ── Profile ──────────────────────────────────────────────────────── */}
          <Section
            title="Your Profile"
            description="Your display name shown in the dashboard."
          >
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Your Name</label>
              <input
                type="text"
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                maxLength={50}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Email</label>
              <div className="px-4 py-3 bg-stone-50 border-2 border-stone-100 rounded-xl text-sm text-stone-500 font-medium">
                {staffUser.email}
              </div>
              <p className="text-xs text-stone-400 font-medium mt-1">
                To change your email, use{' '}
                <Link href="/auth/reset-password" className="text-orange-500 hover:underline font-semibold">
                  reset password
                </Link>.
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Role</label>
              <div className="px-4 py-3 bg-stone-50 border-2 border-stone-100 rounded-xl text-sm font-bold text-stone-700 capitalize">
                {staffUser.role}
              </div>
            </div>
            <SaveButton onClick={saveProfile} loading={profileLoading} disabled={myName.trim() === staffUser.name} />
          </Section>

          {/* ── Promotion ────────────────────────────────────────────────────── */}
          <Section
            title="Active Promotion"
            description={promotion ? 'Edit your stamp card settings. Changes apply to new stamps.' : 'No active promotion yet.'}
          >
            {promotion ? (
              <>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Promotion Title</label>
                  <input
                    type="text"
                    value={promo.title}
                    onChange={(e) => setPromo((p) => ({ ...p, title: e.target.value }))}
                    maxLength={80}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Stamps Required</label>
                  <input
                    type="number"
                    value={promo.stamps_required}
                    min={1}
                    max={50}
                    onChange={(e) => setPromo((p) => ({ ...p, stamps_required: parseInt(e.target.value) || 1 }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Reward Name</label>
                  <input
                    type="text"
                    value={promo.reward_name}
                    onChange={(e) => setPromo((p) => ({ ...p, reward_name: e.target.value }))}
                    maxLength={80}
                    placeholder="e.g. Free Coffee"
                    className={inputClass}
                  />
                </div>
                <SaveButton onClick={savePromotion} loading={promoLoading} />
              </>
            ) : (
              <div className="py-4 text-center">
                <p className="text-stone-400 text-sm font-medium mb-3">No active promotion.</p>
                <Link
                  href="/dashboard"
                  className="inline-block px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  Create Promotion
                </Link>
              </div>
            )}
          </Section>

        </div>
      </main>
    </div>
  )
}

function SaveButton({ onClick, loading, disabled = false }: {
  onClick: () => void; loading: boolean; disabled?: boolean
}) {
  return (
    <div className="flex justify-end">
      <button
        onClick={onClick}
        disabled={loading || disabled}
        className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-colors"
      >
        {loading ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}
