import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

import "@/styles/globals.css";

import { fontGeist, fontHeading, fontSans, fontUrban } from "@/assets/fonts";
import { ThemeProvider } from "next-themes";

import { cn, constructMetadata } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@/components/analytics";
import { AvatarProvider } from "@/components/context/avatar-context";
import { NotificationsProvider } from "@/components/context/notifications-context";
import { ErrorBoundary } from "@/components/error-boundary";
import ModalProvider from "@/components/modals/providers";
import { QueryClientProvider } from "@/components/providers/query-client-provider";
import { SupabaseProvider } from "@/components/supabase-provider";
import { TailwindIndicator } from "@/components/tailwind-indicator";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata = constructMetadata();

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: "en" | "de" }>;
}) {
  const { locale } = await params;

  // Ensure the locale is valid
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the current locale
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/site.webmanifest" />
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
              <NextIntlClientProvider messages={messages} locale={locale}>
                <AvatarProvider>
                  <QueryClientProvider>
                    <NotificationsProvider>
                      <ModalProvider>{children}</ModalProvider>
                      <Analytics />
                      <Toaster richColors closeButton />
                      <TailwindIndicator />
                    </NotificationsProvider>
                  </QueryClientProvider>
                </AvatarProvider>
              </NextIntlClientProvider>
            </ThemeProvider>
          </SupabaseProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
