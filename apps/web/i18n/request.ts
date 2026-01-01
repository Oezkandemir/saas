import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Check for saved locale preference in cookie
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get("NEXT_LOCALE")?.value;

  // Use saved locale if valid, otherwise use request locale
  if (savedLocale && routing.locales.includes(savedLocale as any)) {
    locale = savedLocale;
  }

  // Ensure locale is valid
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
