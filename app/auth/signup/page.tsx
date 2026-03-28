'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase-client'

// ── Validation rules ──────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const NAME_RE = /^[a-zA-Z\s'\-]{2,50}$/

function validateField(field: string, value: string): string {
  switch (field) {
    case 'businessName':
      if (!value.trim()) return 'Business name is required'
      if (value.trim().length < 2) return 'Must be at least 2 characters'
      if (value.trim().length > 50) return 'Must be 50 characters or fewer'
      return ''
    case 'yourName':
      if (!value.trim()) return 'Your name is required'
      if (!NAME_RE.test(value.trim())) return 'Letters, spaces, hyphens and apostrophes only'
      return ''
    case 'email':
      if (!value.trim()) return 'Email is required'
      if (!EMAIL_RE.test(value.trim())) return 'Enter a valid email address'
      return ''
    case 'password':
      if (!value) return 'Password is required'
      if (value.length < 8) return 'Must be at least 8 characters'
      if (!/[0-9]/.test(value)) return 'Include at least one number'
      return ''
    default:
      return ''
  }
}

function friendlyAuthError(message: string): string {
  if (/user already registered/i.test(message)) return 'An account with this email already exists.'
  if (/invalid email/i.test(message)) return 'Please enter a valid email address.'
  if (/password should be at least/i.test(message)) return 'Password must be at least 8 characters.'
  if (/too many requests/i.test(message)) return 'Too many attempts. Please wait a moment.'
  return message
}

// ── Component ─────────────────────────────────────────────────────────────────
type Fields = { businessName: string; yourName: string; email: string; password: string }
type Errors = Partial<Record<keyof Fields, string>>
type Touched = Partial<Record<keyof Fields, boolean>>

export default function SignupPage() {
  const [form, setForm] = useState<Fields>({ businessName: '', yourName: '', email: '', password: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Touched>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (field: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }))
    }
  }

  const handleBlur = (field: keyof Fields) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setErrors((prev) => ({ ...prev, [field]: validateField(field, form[field]) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const allTouched: Touched = { businessName: true, yourName: true, email: true, password: true }
    const allErrors: Errors = {
      businessName: validateField('businessName', form.businessName),
      yourName: validateField('yourName', form.yourName),
      email: validateField('email', form.email),
      password: validateField('password', form.password),
    }
    setTouched(allTouched)
    setErrors(allErrors)
    if (Object.values(allErrors).some(Boolean)) return

    setLoading(true)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: form.businessName.trim(),
        yourName: form.yourName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(friendlyAuthError(data.error || 'Something went wrong'))
      setLoading(false)
      return
    }

    if (data.emailConfirmationRequired) {
      router.push(`/auth/check-email?email=${encodeURIComponent(form.email.trim().toLowerCase())}`)
      return
    }

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    })
    if (signInError) {
      toast.error(friendlyAuthError(signInError.message))
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  const inputClass = (field: keyof Fields) =>
    `w-full px-4 py-3 border-2 rounded-xl text-base focus:outline-none transition-colors ${
      touched[field] && errors[field]
        ? 'border-red-400 focus:border-red-400'
        : 'border-stone-200 focus:border-orange-400'
    }`

  const isSubmittable = Object.keys(form).every(
    (f) => form[f as keyof Fields] && !errors[f as keyof Fields]
  )

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center">
          <div className="text-5xl mb-3">☕</div>
          <h1 className="text-3xl font-black text-stone-900">Create Account</h1>
          <p className="text-stone-500 mt-1 font-medium">Get started in 30 seconds</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-8 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Business Name</label>
              <input
                type="text"
                value={form.businessName}
                onChange={handleChange('businessName')}
                onBlur={handleBlur('businessName')}
                placeholder="Acme Coffee Co."
                className={inputClass('businessName')}
                maxLength={50}
              />
              {touched.businessName && errors.businessName && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.businessName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Your Name</label>
              <input
                type="text"
                value={form.yourName}
                onChange={handleChange('yourName')}
                onBlur={handleBlur('yourName')}
                placeholder="Jane Smith"
                className={inputClass('yourName')}
                maxLength={50}
              />
              {touched.yourName && errors.yourName && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.yourName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                onBlur={handleBlur('email')}
                placeholder="you@example.com"
                className={inputClass('email')}
                autoComplete="email"
              />
              {touched.email && errors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={handleChange('password')}
                onBlur={handleBlur('password')}
                placeholder="••••••••"
                className={inputClass('password')}
                autoComplete="new-password"
              />
              {touched.password && errors.password ? (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.password}</p>
              ) : (
                <p className="mt-1 text-xs text-stone-400">Min 8 characters, include a number</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (Object.values(touched).some(Boolean) && !isSubmittable)}
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
