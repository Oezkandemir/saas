import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

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

  // Get messages for the current locale with error handling
  let messages;
  try {
    messages = await getMessages();
  } catch (error) {
    // Fallback to empty messages if loading fails
    console.error("Failed to load messages for locale:", locale, error);
    try {
      // Try to load default locale messages as fallback
      messages = (await import(`../../messages/${routing.defaultLocale}.json`)).default;
    } catch (fallbackError) {
      console.error("Failed to load fallback messages:", fallbackError);
      messages = {};
    }
  }

  // Locale layout provides locale-specific messages
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
}
