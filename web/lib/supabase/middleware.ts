import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, responseHeaders) {
          // Write cookies onto the request so the server can read them
          // NextRequest.cookies.set only accepts name+value (no options)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          // Rebuild the response so cookies are forwarded to the browser
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
          // Forward cache-control headers required for auth cookies
          Object.entries(responseHeaders ?? {}).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          )
        },
      },
    },
  )

  // getUser() validates the token server-side; never use getSession() for auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}
