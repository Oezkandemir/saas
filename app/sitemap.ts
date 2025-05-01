import { MetadataRoute } from "next";

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

  // Generate entries for default locale (English)
  const enEntries = routes.map((route) => ({
    url: `${baseUrl}/en${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // Generate entries for German locale
  const deEntries = routes.map((route) => ({
    url: `${baseUrl}/de${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 0.9 : 0.7,
  }));

  return [...enEntries, ...deEntries];
} 