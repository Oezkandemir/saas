import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Define routes that should be included in the sitemap
  const routes = [
    "",
    "/pricing",
    "/features",
    "/contact",
    "/terms",
    "/privacy",
  ];

  // Generate sitemap entries for all supported locales
  const entries = routing.locales.flatMap((locale) => {
    return routes.map((route) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: locale === routing.defaultLocale && route === "" ? 1 : 0.8,
    }));
  });

  return entries;
}
