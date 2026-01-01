import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

import "@/styles/globals.css";

import { fontGeist, fontHeading, fontSans, fontUrban } from "@/assets/fonts";
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
import { NavigationProgress } from "@/components/navigation-progress";

export const dynamic = "force-dynamic";

export const metadata = constructMetadata();

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Default locale for root layout
  const locale = routing.defaultLocale;
  
  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the default locale with error handling
  let messages;
  try {
    messages = await getMessages();
  } catch (error) {
    // Fallback to empty messages if loading fails
    console.error("Failed to load messages:", error);
    messages = {};
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/GeistVF.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/CalSans-SemiBold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
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
                <NextIntlClientProvider messages={messages} locale={locale}>
                  <AvatarProvider>
                    <QueryClientProvider>
                      <NotificationsProvider>
                        <DynamicProviders>
                          {children}
                        </DynamicProviders>
                        <Toaster richColors closeButton />
                        <TailwindIndicator />
                        <PerformanceTracker />
                        <NavigationProgress />
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
