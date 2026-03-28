import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { businessName, yourName, email, password } = await req.json()

  if (!businessName || !yourName || !email || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  // Use the anon client for signUp so Supabase sends the confirmation email automatically.
  // If "Enable email confirmations" is off in Supabase Auth settings, the user is
  // confirmed immediately and authData.session will be non-null.
  const anonClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: authData, error: authError } = await anonClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Signup failed' }, { status: 400 })
  }

  const db = createServiceClient()

  // Generate a URL-safe slug, append a short random suffix on collision
  let slug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { data: existing } = await db
    .from('businesses')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`
  }

  const { data: business, error: bizError } = await db
    .from('businesses')
    .insert({ name: businessName, slug })
    .select()
    .single()

  if (bizError) {
    // Best-effort cleanup: delete the auth user if business creation fails
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json(
      { error: 'Could not create business: ' + bizError.message },
      { status: 500 }
    )
  }

  const { error: staffError } = await db.from('staff_users').insert({
    id: authData.user.id,
    business_id: business.id,
    name: yourName,
    email,
    role: 'owner',
  })

  if (staffError) {
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: staffError.message }, { status: 500 })
  }

  // If authData.session is present, email confirmation is disabled — user can sign in now.
  // Otherwise they need to confirm their email first.
  return NextResponse.json({
    success: true,
    emailConfirmationRequired: !authData.session,
  })
}
