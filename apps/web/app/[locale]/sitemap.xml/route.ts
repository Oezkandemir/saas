import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

export async function GET(request: NextRequest) {
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
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly" as const,
      priority: locale === routing.defaultLocale && route === "" ? 1 : 0.8,
    }));
  });

  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

