'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center">
          <div className="text-5xl mb-3">☕</div>
          <h1 className="text-3xl font-black text-stone-900">Welcome back</h1>
          <p className="text-stone-500 mt-1 font-medium">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-8 space-y-4">
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
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
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
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="text-center pt-1">
            <Link
              href="/auth/reset-password"
              className="text-sm text-stone-400 font-medium hover:text-orange-500 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <p className="text-center text-stone-500 font-medium">
          No account?{' '}
          <Link href="/auth/signup" className="text-orange-500 font-bold hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </main>
  )
}
