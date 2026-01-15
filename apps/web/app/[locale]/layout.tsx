import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Pre-load messages synchronously to avoid flash during client-side navigation
async function loadMessages(locale: string) {
  // Use direct import for fastest loading - this ensures messages are available immediately
  try {
    const messages = await import(`../../messages/${locale}.json`);
    return messages.default;
  } catch (error) {
    // Fallback to default locale if locale file doesn't exist
    logger.error(`Failed to load messages for locale ${locale}:`, error);
    const fallbackMessages = await import(
      `../../messages/${routing.defaultLocale}.json`
    );
    return fallbackMessages.default;
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure the locale is valid - type guard to narrow to "de" | "en"
  if (!routing.locales.includes(locale as "de" | "en")) {
    notFound();
  }

  // Type assertion after validation
  const validLocale = locale as "de" | "en";

  // Enable static rendering
  setRequestLocale(validLocale);

  // Load messages directly for immediate availability
  // This prevents any flash of incorrect language during client-side navigation
  const messages = await loadMessages(validLocale);

  // Locale layout no longer needs html/body tags as they're in root layout
  // But we need to provide locale-specific messages, so we wrap with NextIntlClientProvider
  // This will override the default locale messages from root layout immediately
  return (
    <NextIntlClientProvider messages={messages} locale={validLocale}>
      {children}
    </NextIntlClientProvider>
  );
}
