import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";

export default async function sitemap({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<MetadataRoute.Sitemap> {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  // Base routes specific to this locale
  const baseRoutes = [
    "",
    "/pricing",
    "/dashboard",
    "/blog",
    "/docs",
  ];

  // Create entries for the current locale
  const routes = baseRoutes.map(route => ({
    url: `${baseUrl}/${locale}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  return routes;
} 