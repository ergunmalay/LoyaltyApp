'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

const COOLDOWN_SECONDS = 60

function CheckEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [cooldown, setCooldown] = useState(0)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const handleResend = async () => {
    if (!email) {
      toast.error('Email address not found. Please sign up again.')
      return
    }
    setSending(true)
    const res = await fetch('/api/auth/resend-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    setSending(false)
    if (!res.ok) {
      toast.error(data.error || 'Could not resend email. Try again.')
      return
    }
    toast.success('Confirmation email sent!')
    setCooldown(COOLDOWN_SECONDS)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="text-6xl">📬</div>

        <div>
          <h1 className="text-3xl font-black text-stone-900">Check your email</h1>
          <p className="text-stone-500 mt-2 font-medium leading-relaxed">
            We sent a confirmation link to{' '}
            {email
              ? <span className="font-bold text-stone-700">{email}</span>
              : 'your email address'
            }
            . Click it to activate your account.
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 text-left space-y-3">
          <p className="text-sm text-stone-500 font-medium">Didn&apos;t receive it? Check your spam folder or resend below.</p>
          <button
            onClick={handleResend}
            disabled={sending || cooldown > 0}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors"
          >
            {sending
              ? 'Sending…'
              : cooldown > 0
              ? `Resend in ${cooldown}s`
              : 'Resend Confirmation Email'}
          </button>
        </div>

        <Link
          href="/auth/login"
          className="block w-full py-4 bg-white border-2 border-stone-200 hover:border-orange-400 text-stone-700 text-lg font-bold rounded-2xl transition-colors"
        >
          Go to Sign In
        </Link>
      </div>
    </main>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  )
}
