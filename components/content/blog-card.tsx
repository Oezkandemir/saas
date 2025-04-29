"use client";

import { useState } from "react";
import { Post } from "contentlayer/generated";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { cn, formatDate, placeholderBlurhash } from "@/lib/utils";
import { BlurImage } from "@/components/shared/blur-image";
import { Link } from "@/i18n/routing";
import { BLOG_AUTHORS } from "@/config/blog";

export function BlogCard({
  data,
  priority,
  horizontale = false,
}: {
  data: Post & {
    blurDataURL: string;
  };
  priority?: boolean;
  horizontale?: boolean;
}) {
  const t = useTranslations("Blog");
  const [imageError, setImageError] = useState(false);
  
  return (
    <article
      className={cn(
        "group relative",
        horizontale
          ? "grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6"
          : "flex flex-col space-y-2",
      )}
    >
      {data.image && !imageError && (
        <div className="w-full overflow-hidden rounded-xl border">
          <BlurImage
            alt={data.title}
            blurDataURL={data.blurDataURL ?? placeholderBlurhash}
            className={cn(
              "size-full object-cover object-center",
              horizontale ? "lg:h-72" : null,
            )}
            width={800}
            height={400}
            priority={priority}
            placeholder="blur"
            src={data.image}
            sizes="(max-width: 768px) 750px, 600px"
            onError={() => setImageError(true)}
          />
        </div>
      )}
      <div
        className={cn(
          "flex flex-1 flex-col",
          horizontale ? "justify-center" : "justify-between",
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
            {data.authors.map((author) => (
              <div key={author} className="relative">
                {BLOG_AUTHORS[author] && (
                  <Image
                    src={BLOG_AUTHORS[author].image}
                    alt={BLOG_AUTHORS[author].name}
                    width={32}
                    height={32}
                    className="size-8 rounded-full border-2 border-background transition-all group-hover:brightness-90"
                  />
                )}
              </div>
            ))}
          </div>

          {data.date && (
            <p className="text-sm text-muted-foreground">
              {formatDate(data.date)}
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
