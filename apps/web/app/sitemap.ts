import type { MetadataRoute } from "next";

import { getPublishedBlogPosts } from "@/actions/blog-actions";
import { routing } from "@/i18n/routing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Define static routes that should be included in the sitemap
  const staticRoutes = [
    "",
    "/pricing",
    "/features",
    "/contact",
    "/terms",
    "/privacy",
  ];

  // Fetch published blog posts for dynamic sitemap entries
  let blogPosts: Array<{ slug: string; updated_at: string }> = [];
  try {
    const posts = await getPublishedBlogPosts(true); // Use static client
    blogPosts = posts.map((post) => ({
      slug: post.slug,
      updated_at: post.updated_at,
    }));
  } catch (error) {
    // If blog posts can't be fetched, continue without them
    console.warn("Failed to fetch blog posts for sitemap:", error);
  }

  // Generate entries for all locales
  const entries: MetadataRoute.Sitemap = [];

  // Add static routes for each locale
  for (const locale of routing.locales) {
    for (const route of staticRoutes) {
      entries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: route === "" && locale === routing.defaultLocale ? 1 : 0.8,
      });
    }

    // Add blog posts for each locale
    for (const post of blogPosts) {
      entries.push({
        url: `${baseUrl}/${locale}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      });
    }
  }

  return entries;
}
