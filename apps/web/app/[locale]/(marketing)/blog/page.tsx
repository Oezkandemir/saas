import { getPublishedBlogPosts } from "@/actions/blog-actions";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import { constructMetadata, getBlurDataURL } from "@/lib/utils";
import { BlogPosts } from "@/components/content/blog-posts";

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Blog");

  return constructMetadata({
    title: t("metaTitle"),
    description: t("description"),
  });
}

export default async function BlogPage() {
  const supabasePosts = await getPublishedBlogPosts();

  // Transform Supabase posts to match the expected format
  const posts = await Promise.all(
    supabasePosts.map(async (post) => ({
      _id: post.id,
      title: post.title,
      description: post.description || "",
      date: post.created_at,
      image: post.image,
      authors: post.authors,
      categories: post.categories,
      related: post.related || [],
      slug: `/blog/${post.slug}`,
      slugAsParams: post.slug,
      blurDataURL: await getBlurDataURL(post.image),
    })),
  );

  return <BlogPosts posts={posts} />;
}
