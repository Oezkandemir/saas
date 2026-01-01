import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";
import { logger } from "./lib/logger";

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: "as-needed", // Only add locale prefix when needed
  // Use cookie for locale detection
  localeDetection: true, // Enable automatic locale detection
});

// Cache for user status to avoid repeated DB calls
const userStatusCache = new Map<string, { status: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Static file patterns for better performance
const STATIC_FILE_EXTENSIONS = /\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot|otf|mp4|webm|ogg|mp3|wav|pdf|css|js|json|map)$/i;
const INTERNAL_PATHS = /^(\/_next\/|\/api\/|\/favicon\.ico|\/robots\.txt|\/sitemap\.xml)/;

// Proxy function (replaces middleware in Next.js 16)
export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Early return for static files and internal paths
  if (STATIC_FILE_EXTENSIONS.test(pathname) || INTERNAL_PATHS.test(pathname)) {
    return NextResponse.next();
  }

  // Skip i18n middleware for QR code routes (public routes that don't need locale)
  if (pathname.startsWith("/q/") || pathname.startsWith("/c/")) {
    return NextResponse.next();
  }

  // Handle i18n routing first - simplified approach
  try {
    const intlResponse = await intlMiddleware(request);

    // If intl middleware returns a redirect or rewrite, return it immediately
    if (
      intlResponse &&
      (intlResponse.status === 307 ||
        intlResponse.status === 308 ||
        intlResponse.headers.has("x-middleware-rewrite"))
    ) {
      return intlResponse;
    }
  } catch (error) {
    logger.error("Intl middleware error", error);
    return NextResponse.next();
  }

  // Clone the response to modify it
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    },
  );

  // Get the locale from the request pathname
  const pathnameWithoutLocale = pathname.replace(
    /^\/(?:en|de)(?=$|\/)/,
    "",
  );

  // Get user session and data
  const [{ data: { user: authUser } }, { data: { session } }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession()
  ]);

  // Define route checks
  const protectedRoutes = ["/dashboard", "/settings", "/account", "/admin"];
  const authRoutes = ["/login", "/register", "/auth"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route),
  );
  const isAuthRoute = authRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route),
  );

  // Get current locale
  const locale = pathname.match(/^\/(en|de)(?:\/|$)/)?.[1] || routing.defaultLocale;

  // Handle protected routes
  if (isProtectedRoute && !authUser) {
    const redirectUrl = new URL(`/${locale}/login`, request.url);
    redirectUrl.searchParams.set("redirectTo", pathnameWithoutLocale);
    return NextResponse.redirect(redirectUrl);
  }

  // Check if user is banned (with caching)
  if (authUser) {
    const now = Date.now();
    const cached = userStatusCache.get(authUser.id);
    
    let userStatus = 'active';
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      userStatus = cached.status;
    } else {
      try {
        const { data: userData, error } = await supabase
          .from("users")
          .select("status")
          .eq("id", authUser.id)
          .single();

        if (!error && userData?.status) {
          userStatus = userData.status;
          userStatusCache.set(authUser.id, { status: userStatus, timestamp: now });
        }
      } catch (error) {
        logger.error("Error checking user status", error);
      }
    }

    // If user is banned, redirect to banned page
    if (userStatus === "banned" && !pathnameWithoutLocale.startsWith("/banned")) {
      const bannedUrl = new URL(`/${locale}/banned`, request.url);
      return NextResponse.redirect(bannedUrl);
    }
  }

  // Handle auth routes when already logged in
  if (isAuthRoute && session) {
    const redirectTo =
      request.nextUrl.searchParams.get("redirectTo") ||
      (session.user.user_metadata?.role === "ADMIN" ? "/admin" : "/");

    return NextResponse.redirect(
      new URL(`/${locale}${redirectTo}`, request.url),
    );
  }

  // Return the response we've built up
  return response;
}

// Matcher configuration for proxy
export const config = {
  matcher: [
    // Exclude static files, API routes, and Next.js internals
    "/((?!api/|_next/static|_next/image|_next/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot|otf|mp4|webm|ogg|mp3|wav|pdf|css|js|json)).*)",
  ],
};

