import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: 'as-needed', // Only add locale prefix when needed
})

export async function middleware(request: NextRequest) {
  // Skip locale handling if we're already being redirected
  const isAlreadyRedirecting = request.headers.has('x-middleware-rewrite') || 
                               request.headers.has('x-middleware-next');

  // Handle i18n routing first, but only if not already redirecting
  const intlResponse = !isAlreadyRedirecting ? 
    await intlMiddleware(request) : 
    NextResponse.next();
  
  // Clone the response to modify it
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get the locale from the request pathname
  const pathnameWithoutLocale = request.nextUrl.pathname.replace(/^\/(?:en|de)(?=$|\/)/, '')

  // Always use getUser() for security instead of getSession()
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();

  // If accessing a protected route and no authenticated user, redirect to login
  const protectedRoutes = ['/dashboard', '/settings', '/account', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => 
    pathnameWithoutLocale.startsWith(route)
  )

  if (isProtectedRoute && !authUser) {
    // Get the current locale
    const locale = request.nextUrl.pathname.match(/^\/(en|de)(?:\/|$)/)?.[1] || routing.defaultLocale
    
    // Store the original URL to redirect back after login
    const redirectUrl = new URL(`/${locale}/login`, request.url)
    redirectUrl.searchParams.set('redirectTo', pathnameWithoutLocale)
    return NextResponse.redirect(redirectUrl)
  }

  // Check if user is banned when authenticated
  if (authUser) {
    try {
      // Get user status from the database
      const { data: userData, error } = await supabase
        .from('users')
        .select('status')
        .eq('id', authUser.id)
        .single();

      // If user is banned, redirect to banned page regardless of the route they're trying to access
      if (!error && userData?.status === 'banned') {
        // Get the current locale
        const locale = request.nextUrl.pathname.match(/^\/(en|de)(?:\/|$)/)?.[1] || routing.defaultLocale
        
        // Skip redirect if already on the banned page
        if (!pathnameWithoutLocale.startsWith('/banned')) {
          // Redirect to a banned page
          const bannedUrl = new URL(`/${locale}/banned`, request.url);
          return NextResponse.redirect(bannedUrl);
        }
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  }

  // If accessing login/register but already logged in, redirect to dashboard
  const authRoutes = ['/login', '/register', '/auth']
  const isAuthRoute = authRoutes.some(route => 
    pathnameWithoutLocale.startsWith(route)
  )

  if (isAuthRoute && session) {
    // Get the current locale
    const locale = request.nextUrl.pathname.match(/^\/(en|de)(?:\/|$)/)?.[1] || routing.defaultLocale
    
    const redirectTo = 
      request.nextUrl.searchParams.get('redirectTo') || 
      (session.user.user_metadata?.role === "ADMIN" ? '/admin' : '/dashboard')
    
    return NextResponse.redirect(new URL(`/${locale}${redirectTo}`, request.url))
  }

  // Use the intl response for all other cases
  return intlResponse
}

export const config = {
  matcher: [
    // Match all pathnames except for those starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - _static (our static files)
    // - favicon.ico (favicon file)
    // - api/webhooks (webhook handlers)
    '/((?!api|_next/static|_next/image|_static|favicon.ico|api/webhooks).*)',
    
    // Optional: Also match locale-specific paths, if needed (or remove if covered by above)
    '/(en|de)/:path*',
  ],
}