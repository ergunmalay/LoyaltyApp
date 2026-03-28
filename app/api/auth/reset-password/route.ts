import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?type=recovery`,
  })

  // Always return success to avoid leaking whether an email is registered
  return NextResponse.json({ success: true })
}
