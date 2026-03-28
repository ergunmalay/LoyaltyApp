'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const inputClass =
    'w-full px-4 py-3 border-2 border-stone-200 rounded-xl text-base focus:outline-none focus:border-orange-400 transition-colors'

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center">
          <div className="text-5xl mb-3">☕</div>
          <h1 className="text-3xl font-black text-stone-900">New password</h1>
          <p className="text-stone-500 mt-1 font-medium">Choose a secure password for your account</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold rounded-2xl disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving…' : 'Save New Password'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
