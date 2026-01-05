"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { cn, resolveStaticPath } from "@/lib/utils";

export function BlurImage({
  src,
  alt,
  width = 720,
  height = 480,
  className = "",
  blurDataURL,
  priority,
  placeholder,
  sizes,
  onError,
  ...props
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  blurDataURL?: string;
  priority?: boolean;
  placeholder?: "blur" | "empty";
  sizes?: string;
  onError?: () => void;
  [key: string]: any;
}) {
  const [isLoading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const t = useTranslations("Common");

  const handleError = () => {
    setImgError(true);
    if (onError) onError();
  };

  // Resolve the image path to ensure it works with localized routes
  // Don't resolve if it's already a full URL (Supabase storage URLs)
  const resolvedSrc = src.startsWith("http") ? src : resolveStaticPath(src);

  if (imgError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted/30",
          className,
        )}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <span className="text-sm text-muted-foreground">
          {t("imageUnavailable")}
        </span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <Image
        alt={alt}
        src={resolvedSrc}
        width={width}
        height={height}
        className={cn(
          "duration-700 ease-in-out",
          isLoading ? "scale-105 blur-sm" : "scale-100 blur-0",
          className,
        )}
        placeholder={placeholder || (blurDataURL ? "blur" : "empty")}
        blurDataURL={blurDataURL}
        onLoad={() => setLoading(false)}
        onError={handleError}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        sizes={
          sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        }
        unoptimized={resolvedSrc.startsWith("http")}
        {...props}
      />
    </div>
  );
}
