import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

import "@/styles/globals.css";

import { fontGeist, fontHeading, fontSans, fontUrban } from "@/assets/fonts";
import { ThemeProvider } from "next-themes";

import { cn, constructMetadata } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@/components/analytics";
import ModalProvider from "@/components/modals/providers";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { SupabaseProvider } from "@/components/supabase-provider";
import { AvatarProvider } from "@/components/context/avatar-context";

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
        <link rel="manifest" href={`/${locale}/site.webmanifest`} />
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
        <SupabaseProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NextIntlClientProvider messages={messages} locale={locale}>
              <AvatarProvider>
                <ModalProvider>{children}</ModalProvider>
                <Analytics />
                <Toaster richColors closeButton />
                <TailwindIndicator />
              </AvatarProvider>
            </NextIntlClientProvider>
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
