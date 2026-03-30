import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role ?? null
  const path = request.nextUrl.pathname

  // Protected patient routes
  if (path.startsWith('/patient/intake') || path.startsWith('/patient/portal')) {
    if (!user || role !== 'patient') {
      return NextResponse.redirect(new URL('/patient/login', request.url))
    }
  }

  // Protected staff dashboard routes
  if (path.startsWith('/dashboard') || path.startsWith('/patients') ||
      path.startsWith('/appointments') || path.startsWith('/settings') ||
      path.startsWith('/charting') || path.startsWith('/diagnostics') ||
      path.startsWith('/reports') || path.startsWith('/admin') ||
      path.startsWith('/radiology') || path.startsWith('/schedule')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (role === 'patient') {
      return NextResponse.redirect(new URL('/patient/portal', request.url))
    }
  }

  // Admin-only routes
  if (path.startsWith('/admin') || path.startsWith('/settings')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const proxyConfig = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
