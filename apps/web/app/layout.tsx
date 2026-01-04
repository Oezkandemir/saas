import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { cookies } from "next/headers";

import "@/styles/globals.css";

import { fontGeist, fontHeading, fontSans, fontUrban, fontInter } from "@/assets/fonts";
import { ThemeProvider } from "next-themes";

import { cn, constructMetadata } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { AvatarProvider } from "@/components/context/avatar-context";
import { NotificationsProvider } from "@/components/context/notifications-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { QueryClientProvider } from "@/components/providers/query-client-provider";
import { DynamicProviders } from "@/components/providers/dynamic-providers";
import { SupabaseProvider } from "@/components/supabase-provider";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { ThemeSyncProvider } from "@/components/providers/theme-sync-provider";
import { PerformanceTracker } from "@/components/performance-tracker";
import { AutoRefreshSubscription } from "@/components/pricing/auto-refresh-subscription";

export const dynamic = "force-dynamic";

export const metadata = constructMetadata();

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
        {/* Only load manifest in production to avoid SSL errors in development */}
        {process.env.NODE_ENV === "production" && (
          <link rel="manifest" href="/site.webmanifest" />
        )}
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontInter.variable,
          fontSans.variable,
          fontUrban.variable,
          fontHeading.variable,
          fontGeist.variable,
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
                        <AutoRefreshSubscription />
                        <Toaster richColors closeButton />
                        <TailwindIndicator />
                        <PerformanceTracker />
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
