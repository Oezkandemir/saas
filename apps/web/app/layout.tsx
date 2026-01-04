import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { cookies } from "next/headers";

import "@/styles/globals.css";

// ⚡ PERFORMANCE: Only load critical fonts - reduced from 5 to 2 fonts
import { fontSans, fontHeading } from "@/assets/fonts";
import { ThemeProvider } from "next-themes";

import { cn, constructMetadata } from "@/lib/utils";
import { AvatarProvider } from "@/components/context/avatar-context";
import { NotificationsProvider } from "@/components/context/notifications-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { QueryClientProvider } from "@/components/providers/query-client-provider";
import { DynamicProviders } from "@/components/providers/dynamic-providers";
import { SupabaseProvider } from "@/components/supabase-provider";
import { ThemeSyncProvider } from "@/components/providers/theme-sync-provider";
import { DeferredComponents } from "@/components/providers/deferred-components";

export const dynamic = "force-dynamic";

export const metadata = constructMetadata();

// Mobile-optimized viewport settings for fullscreen experience
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover", // For iOS notch support
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // CRITICAL FIX: Detect locale from cookie (set by next-intl middleware)
  // This ensures correct language is loaded immediately, preventing flash
  // Priority: Cookie → Default Locale
  // The [locale] layout will override this with the correct locale from URL params
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get("NEXT_LOCALE")?.value;
  
  // Use saved locale if valid, otherwise use default locale
  const locale = (savedLocale && routing.locales.includes(savedLocale as any))
    ? savedLocale
    : routing.defaultLocale; // Default to "de" (German)

  // Load messages for the detected locale to prevent flash
  // The [locale] layout will provide the correct locale-specific messages immediately
  let messages;
  try {
    const localeMessages = await import(`../messages/${locale}.json`);
    messages = localeMessages.default;
  } catch {
    // Fallback to default locale messages (should never happen, but safety net)
    const defaultMessages = await import(`../messages/${routing.defaultLocale}.json`);
    messages = defaultMessages.default;
  }

  return (
    <html lang={locale} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Resource hints for performance - preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://*.supabase.co" />
        
        {/* Preload critical fonts - Inter für optimale Lesbarkeit */}
        <link
          rel="preload"
          href="/assets/fonts/Inter-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/assets/fonts/Inter-Bold.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        
        {/* Only load manifest in production to avoid SSL errors in development */}
        {process.env.NODE_ENV === "production" && (
          <link rel="manifest" href="/site.webmanifest" />
        )}
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontHeading.variable,
        )}
      >
        <ErrorBoundary>
          <SupabaseProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <ThemeSyncProvider>
                {/* Load messages based on cookie to prevent flash - LocaleLayout will override if different */}
                <NextIntlClientProvider messages={messages} locale={locale}>
                  <AvatarProvider>
                    <QueryClientProvider>
                      <NotificationsProvider>
                        <DynamicProviders>
                          {children}
                        </DynamicProviders>
                        <DeferredComponents />
                      </NotificationsProvider>
                    </QueryClientProvider>
                  </AvatarProvider>
                </NextIntlClientProvider>
              </ThemeSyncProvider>
            </ThemeProvider>
          </SupabaseProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
