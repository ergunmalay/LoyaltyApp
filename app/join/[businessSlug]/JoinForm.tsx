'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Business { id: string; name: string; slug: string }
interface Promotion { id: string; title: string; stamps_required: number; reward_name: string }
interface Props { business: Business; promotion: Promotion }

export default function JoinForm({ business, promotion }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, business_id: business.id, promotion_id: promotion.id }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }
    router.push(`/pass/${data.pass.id}`)
  }

  const inputClass =
    'w-full px-4 py-3 border-2 border-stone-200 rounded-xl text-base focus:outline-none focus:border-orange-400 transition-colors'

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-3">☕</div>
          <h1 className="text-3xl font-black text-stone-900">{business.name}</h1>
          <p className="text-orange-500 font-bold mt-1">{promotion.title}</p>
          <p className="text-sm text-stone-400 font-medium mt-2">
            Collect {promotion.stamps_required} stamps and earn{' '}
            <span className="text-stone-700 font-bold">{promotion.reward_name}</span>
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Your Name</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                required placeholder="Jane Smith" className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required placeholder="you@example.com" className={inputClass}
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl font-medium">{error}</p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold rounded-2xl disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading…' : 'Get My Pass ☕'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-stone-400 font-medium">
          Already have a pass? Enter the same email to get it back.
        </p>
      </div>
    </main>
  )
}
