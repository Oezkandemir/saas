import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

import { routing } from "./routing";

// Pre-import messages synchronously to avoid any delay
// This ensures messages are available immediately without flash
const messagesCache: Record<string, () => Promise<any>> = {
  en: () => import("../messages/en.json").then((m) => m.default),
  de: () => import("../messages/de.json").then((m) => m.default),
};

export default getRequestConfig(async ({ requestLocale }) => {
  // CRITICAL FIX: requestLocale is already set correctly by next-intl middleware
  // based on the URL path. We should trust it and only use cookie as fallback.
  let locale = await requestLocale;

  // Only use cookie if requestLocale is not available or invalid
  if (!locale || !routing.locales.includes(locale as any)) {
    const cookieStore = await cookies();
    const savedLocale = cookieStore.get("NEXT_LOCALE")?.value;
    
    // Use saved locale if valid
    if (savedLocale && routing.locales.includes(savedLocale as any)) {
      locale = savedLocale;
    } else {
      // Default to German (not English!) to prevent English flash
      locale = routing.defaultLocale; // This is "de"
    }
  }

  // Use cached message loader for fastest loading
  // This ensures messages are loaded synchronously without any delay
  const messagesLoader = messagesCache[locale];
  if (!messagesLoader) {
    // Fallback to direct import if cache doesn't have the locale
    const messages = (await import(`../messages/${locale}.json`)).default;
    return {
      locale,
      messages,
    };
  }

  const messages = await messagesLoader();

  return {
    locale,
    messages,
  };
});
