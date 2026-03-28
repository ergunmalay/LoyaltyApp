'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="text-6xl">📬</div>
          <div>
            <h1 className="text-3xl font-black text-stone-900">Check your email</h1>
            <p className="text-stone-500 mt-2 font-medium leading-relaxed">
              If an account exists for{' '}
              <span className="font-bold text-stone-700">{email}</span>, we sent
              a password reset link.
            </p>
          </div>
          <Link href="/auth/login" className="text-orange-500 font-bold hover:underline">
            Back to Sign In
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center">
          <div className="text-5xl mb-3">☕</div>
          <h1 className="text-3xl font-black text-stone-900">Reset password</h1>
          <p className="text-stone-500 mt-1 font-medium">
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl text-base focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl font-medium">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold rounded-2xl disabled:opacity-50 transition-colors"
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        </div>

        <p className="text-center text-stone-500 font-medium">
          <Link href="/auth/login" className="text-orange-500 font-bold hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </main>
  )
}
