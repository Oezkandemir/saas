"use client";

import { useState } from "react";
import { Post } from "contentlayer/generated";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { cn, formatDate, placeholderBlurhash, resolveStaticPath } from "@/lib/utils";
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
  
  // Ensure the image path is properly resolved
  const imageSrc = data.image ? resolveStaticPath(data.image) : null;
  
  return (
    <article
      className={cn(
        "group relative",
        horizontale
          ? "grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6"
          : "flex flex-col space-y-2",
      )}
    >
      {imageSrc && !imageError && (
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
            src={imageSrc}
            sizes="(max-width: 768px) 750px, 600px"
            onError={() => setImageError(true)}
          />
        </div>
      )}
      
      <div className="flex flex-col space-y-1.5">
        <div className={horizontale ? null : "flex items-center space-x-1 text-sm text-muted-foreground"}>
          <time dateTime={data.date}>
            {formatDate(data.date)}
          </time>
          <span>•</span>
          <span>{t("minToRead", { min: data.readingTime.minutes })}</span>
        </div>
        
        <Link
          href={data.slug}
          className="group-hover:text-foreground group-hover:underline"
        >
          <h3 className="font-medium">{data.title}</h3>
        </Link>
        
        {horizontale && (
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <time dateTime={data.date}>
              {formatDate(data.date)}
            </time>
            <span>•</span>
            <span>{t("minToRead", { min: data.readingTime.minutes })}</span>
          </div>
        )}
      </div>
    </article>
  );
}
