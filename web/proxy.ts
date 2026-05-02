import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = ['/login', '/register']

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // Unauthenticated: redirect to /login (unless already on a public route)
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const role = (user.user_metadata?.role as string | undefined) ?? ''

    // /join is open to any authenticated role — check before role guards
    if (pathname.startsWith('/join')) {
      return supabaseResponse
    }

    // Cross-role redirects
    if (role === 'admin' && (pathname.startsWith('/student') || pathname.startsWith('/tutor'))) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }

    if (role === 'tutor' && (pathname.startsWith('/student') || pathname.startsWith('/admin'))) {
      const url = request.nextUrl.clone()
      url.pathname = '/tutor/dashboard'
      return NextResponse.redirect(url)
    }

    if (role === 'student' && (pathname.startsWith('/admin') || pathname.startsWith('/tutor'))) {
      const url = request.nextUrl.clone()
      url.pathname = '/student/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
