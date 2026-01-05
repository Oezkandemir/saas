import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedBlogPosts } from "@/actions/blog-actions";
import { getTranslations } from "next-intl/server";

import { BLOG_CATEGORIES } from "@/config/blog";
import { constructMetadata, getBlurDataURL } from "@/lib/utils";
import { BlogCard } from "@/components/content/blog-card";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
    locale?: string;
  }>;
}

export async function generateStaticParams() {
  return BLOG_CATEGORIES.map((category) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata | undefined> {
  const t = await getTranslations("Blog");
  const resolvedParams = await params;
  const category = BLOG_CATEGORIES.find(
    (category) => category.slug === resolvedParams.slug,
  );
  if (!category) {
    return;
  }

  return constructMetadata({
    title: t("metaCategoryTitle", {
      category: t(`categories.${category.slug}.title`),
    }),
    description: t(`categories.${category.slug}.description`),
  });
}

export default async function BlogCategory({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  const category = BLOG_CATEGORIES.find(
    (ctg) => ctg.slug === resolvedParams.slug,
  );

  if (!category) {
    notFound();
  }

  const allPosts = await getPublishedBlogPosts();
  const articles = await Promise.all(
    allPosts
      .filter((post) => post.categories.includes(category.slug))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(async (post) => ({
        _id: post.id,
        id: post.id,
        title: post.title,
        description: post.description || "",
        image: post.image,
        authors: post.authors,
        date: post.created_at,
        created_at: post.created_at,
        categories: post.categories,
        slug: `/blog/${post.slug}`,
        slugAsParams: post.slug,
        blurDataURL: await getBlurDataURL(post.image),
      })),
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, idx) => (
        <BlogCard key={article._id || article.id} data={article} priority={idx <= 2} />
      ))}
    </div>
  );
}
