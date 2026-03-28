'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

export default function SignupPage() {
  const [form, setForm] = useState({ businessName: '', yourName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }

    if (data.emailConfirmationRequired) {
      // Email confirmation is enabled — send them to the check-email page
      router.push('/auth/check-email')
      return
    }

    // Email confirmation is disabled (dev/test) — sign in immediately
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  const inputClass =
    'w-full px-4 py-3 border-2 border-stone-200 rounded-xl text-base focus:outline-none focus:border-orange-400 transition-colors'

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center">
          <div className="text-5xl mb-3">☕</div>
          <h1 className="text-3xl font-black text-stone-900">Create Account</h1>
          <p className="text-stone-500 mt-1 font-medium">Get started in 30 seconds</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-8 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Business Name</label>
              <input type="text" value={form.businessName} onChange={set('businessName')} required placeholder="Acme Coffee Co." className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Your Name</label>
              <input type="text" value={form.yourName} onChange={set('yourName')} required placeholder="Jane Smith" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Password</label>
              <input type="password" value={form.password} onChange={set('password')} required minLength={6} placeholder="••••••••" className={inputClass} />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold rounded-2xl disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-stone-500 font-medium">
          Have an account?{' '}
          <Link href="/auth/login" className="text-orange-500 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
