import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  // Base routes that should be included in the sitemap for all locales
  const baseRoutes = [
    "",
    "/pricing",
    "/dashboard",
    "/blog",
    "/docs",
  ];

  // Create entries for all locales
  const routes = routing.locales.flatMap(locale => {
    return baseRoutes.map(route => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: route === "" ? 1 : 0.8,
    }));
  });

  return routes;
} 