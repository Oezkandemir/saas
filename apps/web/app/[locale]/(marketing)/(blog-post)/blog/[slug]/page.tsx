import { notFound } from "next/navigation";
import { getBlogPostBySlug, getPublishedBlogPosts } from "@/actions/blog-actions";

import "@/styles/mdx.css";

import { Metadata } from "next";
import Link from "next/link";

import { BLOG_CATEGORIES } from "@/config/blog";
import { getTableOfContents } from "@/lib/toc";
import {
  cn,
  constructMetadata,
  formatDate,
  getBlurDataURL,
  placeholderBlurhash,
} from "@/lib/utils";
import { buttonVariants } from "@/components/alignui/actions/button";
import Author from "@/components/content/author";
import { BlurImage } from "@/components/shared/blur-image";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { DashboardTableOfContents } from "@/components/shared/toc";

interface PostPageProps {
  params: Promise<{
    slug: string;
    locale?: string;
  }>;
}

export async function generateStaticParams() {
  const posts = await getPublishedBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Helper function to get post by slug - now correctly handling async params
async function getPostFromParams(params: Awaited<PostPageProps["params"]>) {
  const slug = params.slug;
  const post = await getBlogPostBySlug(slug);
  if (!post) return null;
  return post;
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata | undefined> {
  const resolvedParams = await params;
  const post = await getPostFromParams(resolvedParams);
  if (!post) {
    return;
  }

  const { title, description, image } = post;

  return constructMetadata({
    title: `${title} – SaaS Starter`,
    description: description || undefined,
    image,
  });
}

export default async function PostPage({ params }: PostPageProps) {
  const resolvedParams = await params;
  const post = await getPostFromParams(resolvedParams);

  if (!post) {
    notFound();
  }

  const category = BLOG_CATEGORIES.find(
    (category) => category.slug === post.categories[0],
  )!;

  // Get related articles
  const allPosts = await getPublishedBlogPosts();
  const relatedArticles =
    (post.related &&
      post.related
        .map((slug) => allPosts.find((p) => p.slug === slug))
        .filter((post): post is NonNullable<typeof post> => post !== undefined)) ||
    [];

  // Generate table of contents from HTML content
  const toc = await getTableOfContents(post.content);

  const thumbnailBlurhash = await getBlurDataURL(post.image);

  return (
    <>
      <MaxWidthWrapper className="pt-6 md:pt-10">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <Link
              href={`/blog/category/${category.slug}`}
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "sm",
                }),
                "h-8 rounded-lg",
              )}
            >
              {category.title}
            </Link>
            <time
              dateTime={post.created_at}
              className="text-sm font-medium text-muted-foreground"
            >
              {formatDate(post.created_at)}
            </time>
          </div>
          <h1 className="font-heading text-3xl text-foreground sm:text-4xl">
            {post.title}
          </h1>
          {post.description && (
            <p className="text-base text-muted-foreground md:text-lg">
              {post.description}
            </p>
          )}
          <div className="flex flex-nowrap items-center space-x-5 pt-1 md:space-x-8">
            {post.authors.map((author) => (
              <Author username={author} key={post.id + author} />
            ))}
          </div>
        </div>
      </MaxWidthWrapper>

      <div className="relative">
        <div className="absolute top-52 w-full border-t" />

        <MaxWidthWrapper className="grid grid-cols-4 gap-10 pt-8 max-md:px-0">
          <div className="relative col-span-4 mb-10 flex flex-col space-y-8 border-y bg-background md:rounded-xl md:border lg:col-span-3">
            {post.image ? (
              <BlurImage
                alt={post.title}
                blurDataURL={thumbnailBlurhash ?? placeholderBlurhash}
                className="aspect-[1200/630] border-b object-cover md:rounded-t-xl"
                width={1200}
                height={630}
                priority
                placeholder="blur"
                src={post.image}
                sizes="(max-width: 768px) 770px, 1000px"
                unoptimized={post.image.startsWith("http")}
              />
            ) : (
              <div className="aspect-[1200/630] border-b bg-muted flex items-center justify-center md:rounded-t-xl">
                <p className="text-muted-foreground">Bild nicht verfügbar</p>
              </div>
            )}
            <div className="px-[.8rem] pb-10 md:px-8">
              <div
                className="mdx prose prose-slate dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>
          </div>

          <div className="sticky top-20 col-span-1 mt-52 hidden flex-col divide-y divide-muted self-start pb-24 lg:flex">
            <DashboardTableOfContents toc={toc} />
          </div>
        </MaxWidthWrapper>
      </div>

      <MaxWidthWrapper>
        {relatedArticles.length > 0 && (
          <div className="flex flex-col space-y-4 pb-16">
            <p className="font-heading text-2xl text-foreground">
              More Articles
            </p>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:gap-6">
              {relatedArticles.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/blog/${relatedPost.slug}`}
                  className="flex flex-col space-y-2 rounded-xl border p-5 transition-colors duration-300 hover:bg-muted/80"
                >
                  <h3 className="font-heading text-xl text-foreground">
                    {relatedPost.title}
                  </h3>
                  {relatedPost.description && (
                    <p className="line-clamp-2 text-[15px] text-muted-foreground">
                      {relatedPost.description}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {formatDate(relatedPost.created_at)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </MaxWidthWrapper>
    </>
  );
}
