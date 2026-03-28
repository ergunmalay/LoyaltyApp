import { createServerClient, type SetAllCookies } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

const PROTECTED_PATHS = ['/dashboard', '/scan']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Rate limit the public customer join endpoint ──────────────────────────
  if (pathname === '/api/customers') {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (!rateLimit(`join:${ip}`, 10, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      )
    }
  }

  // ── Auth guard for staff pages ────────────────────────────────────────────
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const res = NextResponse.next()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: ((cookies) =>
            cookies.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            )) as SetAllCookies,
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/scan/:path*', '/api/customers'],
}
