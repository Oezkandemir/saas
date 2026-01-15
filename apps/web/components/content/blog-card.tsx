"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BlurImage } from "@/components/shared/blur-image";

import { BLOG_AUTHORS } from "@/config/blog";
import { Link } from "@/i18n/routing";
import {
  cn,
  formatDate,
  placeholderBlurhash,
  resolveStaticPath,
} from "@/lib/utils";

type BlogPostData = {
  _id?: string;
  id?: string;
  title: string;
  description?: string | null;
  image: string;
  authors: string[];
  date?: string;
  created_at?: string;
  slug: string;
  blurDataURL: string;
};

export function BlogCard({
  data,
  priority,
  horizontale = false,
}: {
  data: BlogPostData;
  priority?: boolean;
  horizontale?: boolean;
}) {
  const t = useTranslations("Blog");
  const [imageError, setImageError] = useState(false);

  // Check if image is a full URL (Supabase) or a relative path (legacy)
  const imageSrc = data.image
    ? data.image.startsWith("http")
      ? data.image
      : resolveStaticPath(data.image)
    : "";

  const postDate = data.date || data.created_at || "";

  return (
    <article
      className={cn(
        "group relative",
        horizontale
          ? "grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6"
          : "flex flex-col space-y-2"
      )}
    >
      {imageSrc && !imageError && (
        <div className="w-full overflow-hidden rounded-xl border aspect-video bg-muted/30 flex items-center justify-center">
          <BlurImage
            alt={data.title}
            blurDataURL={data.blurDataURL ?? placeholderBlurhash}
            className="size-full object-contain object-center"
            width={800}
            height={450}
            priority={priority}
            placeholder="blur"
            src={imageSrc}
            sizes="(max-width: 768px) 750px, 600px"
            onError={() => setImageError(true)}
          />
        </div>
      )}
      <div
        className={cn(
          "flex flex-1 flex-col",
          horizontale ? "justify-center" : "justify-between"
        )}
      >
        <div className="w-full">
          <h2 className="my-1.5 line-clamp-2 font-heading text-2xl">
            {data.title}
          </h2>
          {data.description && (
            <p className="line-clamp-2 text-muted-foreground">
              {data.description}
            </p>
          )}
        </div>
        <div className="mt-4 flex items-center space-x-3">
          <div className="flex items-center -space-x-2">
            {data.authors.map((author) => {
              const authorData =
                BLOG_AUTHORS[author as keyof typeof BLOG_AUTHORS];
              return (
                <div key={author} className="relative">
                  {authorData && (
                    <Image
                      src={
                        authorData.image
                          ? resolveStaticPath(authorData.image)
                          : ""
                      }
                      alt={authorData.name}
                      width={32}
                      height={32}
                      className="size-8 rounded-full border-2 border-background transition-all group-hover:brightness-90"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {postDate && (
            <p className="text-sm text-muted-foreground">
              {formatDate(postDate)}
            </p>
          )}
        </div>
      </div>
      <Link href={data.slug} className="absolute inset-0">
        <span className="sr-only">{t("viewArticle")}</span>
      </Link>
    </article>
  );
}
