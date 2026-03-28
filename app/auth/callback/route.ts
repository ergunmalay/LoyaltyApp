import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * Handles two Supabase Auth redirect flows:
 *  1. Email confirmation  → redirects to /dashboard
 *  2. Password recovery   → redirects to /auth/update-password
 *
 * Supabase sends either a `code` (PKCE flow, default) or a `token_hash`
 * (older magic-link format). We handle both.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'email' | 'recovery' | null

  const supabase = await createClient()

  // PKCE code exchange (default Supabase flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Recovery codes land here too — check for the type param
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/update-password', origin))
      }
      return NextResponse.redirect(new URL('/dashboard', origin))
    }
  }

  // token_hash flow (email links)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/update-password', origin))
      }
      return NextResponse.redirect(new URL('/dashboard', origin))
    }
  }

  return NextResponse.redirect(new URL('/auth/login?error=invalid_link', origin))
}
