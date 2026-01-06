import { Metadata } from "next";
import { clsx, type ClassValue } from "clsx";
import ms from "ms";
import { twMerge } from "tailwind-merge";

import { env } from "@/env.mjs";
import { siteConfig } from "@/config/site";

/**
 * AlignUI - cn Utility
 * Merges Tailwind classes with proper conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export AlignUI utilities for convenience
export { tv } from "./tv";
export { recursiveCloneChildren } from "./recursive-clone-children";
export {
  createPolymorphicComponent,
  type PolymorphicComponent,
} from "./polymorphic";

export function constructMetadata({
  title = siteConfig.name,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  icons = "/favicon.ico",
  noIndex = false,
  keywords,
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
  keywords?: string[];
} = {}): Metadata {
  const defaultKeywords = [
    "Next.js",
    "React",
    "Prisma",
    "Neon",
    "Auth.js",
    "shadcn ui",
    "Resend",
    "React Email",
    "Stripe",
  ];
  const finalKeywords = keywords || defaultKeywords;

  return {
    title,
    description,
    authors: [
      {
        name: "mickasmt",
      },
    ],
    creator: "mickasmt",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteConfig.url,
      title,
      description,
      siteName: title,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@miickasmt",
    },
    icons,
    metadataBase: new URL(siteConfig.url),
    manifest: `${siteConfig.url}/site.webmanifest`,
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    ...(finalKeywords.length > 0 && {
      keywords: finalKeywords.join(", "),
    }),
  };
}

/**
 * Get the base URL for the application based on the current environment
 * This is useful for OAuth redirects and API calls
 */
export function getURL() {
  // Get the environment-specific URL
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    "http://localhost:3000";

  // Make sure to include protocol when not present, but preserve http for localhost
  if (!url.startsWith("http")) {
    // Only use https if it's not localhost
    const isLocalhost = url.includes("localhost") || url.includes("127.0.0.1");
    url = isLocalhost ? `http://${url}` : `https://${url}`;
  }

  // Make sure to include a trailing `/`.
  url = url.endsWith("/") ? url : `${url}/`;

  return url;
}

/**
 * Format a date to a readable string
 */
/**
 * Format duration in minutes to a human-readable string
 * Rounds to nearest half hour (0, 0.5, 1, 1.5, 2, etc.)
 * Examples: 180 min -> "3 Stunden", 90 min -> "1.5 Stunden", 30 min -> "0.5 Stunden"
 */
export function formatDuration(minutes: number, locale: string = "de"): string {
  const hours = minutes / 60;
  // Round to nearest half hour
  const roundedHours = Math.round(hours * 2) / 2;

  if (roundedHours === 0) {
    return locale === "de" ? "0 Stunden" : "0 hours";
  }

  // Check if it's a whole number or half hour
  if (roundedHours % 1 === 0) {
    // Whole hours
    const hoursText =
      locale === "de"
        ? roundedHours === 1
          ? "Stunde"
          : "Stunden"
        : roundedHours === 1
          ? "hour"
          : "hours";
    return `${roundedHours} ${hoursText}`;
  } else {
    // Half hours - format as "X.5 Stunden" or "X Stunden 30 Minuten"
    const wholeHours = Math.floor(roundedHours);
    if (locale === "de") {
      if (wholeHours === 0) {
        return "30 Minuten";
      }
      return `${wholeHours}.5 Stunden`;
    } else {
      if (wholeHours === 0) {
        return "30 minutes";
      }
      return `${wholeHours}.5 hours`;
    }
  }
}

/**
 * Format duration hours (decimal) to a human-readable string
 * Rounds to nearest half hour
 */
export function formatDurationHours(
  hours: number,
  locale: string = "de",
): string {
  // Round to nearest half hour
  const roundedHours = Math.round(hours * 2) / 2;

  if (roundedHours === 0) {
    return locale === "de" ? "0 Stunden" : "0 hours";
  }

  // Check if it's a whole number or half hour
  if (roundedHours % 1 === 0) {
    // Whole hours
    const hoursText =
      locale === "de"
        ? roundedHours === 1
          ? "Stunde"
          : "Stunden"
        : roundedHours === 1
          ? "hour"
          : "hours";
    return `${roundedHours} ${hoursText}`;
  } else {
    // Half hours
    const wholeHours = Math.floor(roundedHours);
    if (locale === "de") {
      if (wholeHours === 0) {
        return "30 Minuten";
      }
      return `${wholeHours}.5 Stunden`;
    } else {
      if (wholeHours === 0) {
        return "30 minutes";
      }
      return `${wholeHours}.5 hours`;
    }
  }
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function absoluteUrl(path: string) {
  return `${env.NEXT_PUBLIC_APP_URL}${path}`;
}

// Utils from precedent.dev
export const timeAgo = (timestamp: Date, timeOnly?: boolean): string => {
  if (!timestamp) return "never";
  return `${ms(Date.now() - new Date(timestamp).getTime())}${
    timeOnly ? "" : " ago"
  }`;
};

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<JSON> {
  const res = await fetch(input, init);

  if (!res.ok) {
    // Check content type before parsing JSON
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        const text = await res.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const json = JSON.parse(jsonMatch[0]);
          if (json.error) {
            const error = new Error(json.error) as Error & {
              status: number;
            };
            error.status = res.status;
            throw error;
          }
        }
      } catch (parseError) {
        // JSON parse failed - throw generic error
      }
    }
    throw new Error("An unexpected error occurred");
  }

  // Check content type before parsing JSON
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Response is not JSON");
  }

  try {
    const text = await res.text();
    const trimmedText = text.trim();
    // Try direct parse first
    try {
      return JSON.parse(trimmedText);
    } catch {
      // If direct parse fails, try to extract JSON object
      const jsonMatch = trimmedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("No valid JSON found in response");
    }
  } catch (parseError) {
    throw new Error(
      `Failed to parse JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
    );
  }
}

export function nFormatter(num: number, digits?: number) {
  if (!num) return "0";
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "K" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });
  return item
    ? (num / item.value).toFixed(digits || 1).replace(rx, "$1") + item.symbol
    : "0";
}

export function capitalize(str: string) {
  if (!str || typeof str !== "string") return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const truncate = (str: string, length: number) => {
  if (!str || str.length <= length) return str;
  return `${str.slice(0, length)}...`;
};

export const getBlurDataURL = async (url: string | null) => {
  if (!url) {
    return "data:image/webp;base64,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
  }

  // Use the resolveStaticPath function to ensure consistent path handling
  const resolvedUrl = resolveStaticPath(url);
  const fullUrl = resolvedUrl.startsWith("/")
    ? `${siteConfig.url}${resolvedUrl}`
    : url;

  try {
    const response = await fetch(
      `https://wsrv.nl/?url=${fullUrl}&w=50&h=50&blur=5`,
    );
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return `data:image/png;base64,${base64}`;
  } catch (error) {
    return "data:image/webp;base64,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
  }
};

/**
 * Resolves a static asset path to ensure it works with localized routes
 * @param path - The original path of the static asset
 * @returns The corrected path that will work regardless of locale
 */
export const resolveStaticPath = (path: string): string => {
  // If the path already starts with a leading slash, use it as-is
  if (path.startsWith("/")) {
    // Convert old _static paths to regular paths
    if (path.startsWith("/_static/")) {
      return path.replace("/_static/", "/");
    }
    return path;
  }

  // If no leading slash, add one to make it relative to public folder
  return `/${path}`;
};

export const placeholderBlurhash =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAoJJREFUWEfFl4lu4zAMRO3cx/9/au6reMaOdkxTTl0grQFCRoqaT+SQotq2bV9N8rRt28xms87m83l553eZ/9vr9Wpkz+ezkT0ej+6dv1X81AFw7M4FBACPVn2c1Z3zLgDeJwHgeLFYdAARYioAEAKJEG2WAjl3gCwNYymQQ9b7/V4spmIAwO6Wy2VnAMikBWlDURBELf8CuN1uHQSrPwMAHK5WqwFELQ01AIXdAa7XawfAb3p6AOwK5+v1ugAoEq4FRSFLgavfQ49jAGQpAE5wjgGCeRrGdBArwHOPcwFcLpcGU1X0IsBuN5tNgYhaiFFwHTiAwq8I+O5xfj6fOz38K+X/fYAdb7fbAgFAjIJ6Aav3AYlQ6nfnDoDz0+lUxNiLALvf7XaDNGQ6GANQBKR85V27B4D3QQRw7hGIYlQKWGM79hSweyCUe1blXhEAogfABwHAXAcqSYkxCtHLUK3XBajSc4Dj8dilAeiSAgD2+30BAEKV4GKcAuDqB4TdYwBgPQByCgApUBoE4EJUGvxUjF3Q69/zLw3g/HA45ABKgdIQu+JPIyDnisCfAxAFNFM0EFNQ64gfS0EUoQP8ighrZSjn3oziZEQpauyKbfjbZchHUL/3AS/Dd30gAkxuRACgfO+EWQW8qwI1o+wseNuKcQiESjALvwNoMI0TcRzD4lFcPYwIM+JTF5x6HOs8yI7jeB5oKhpMRFH9UwaSCDB2Jmg4rc6E2TT0biIaG0rQhNqyhpHBcayTTSXH6vcDL7/sdqRK8LkwTsU499E8vRcAojHcZ4AxABdilgrp4lsXk8oVqgwh7+6H3phqd8J0Kk4vbx/+sZqCD/vNLya/5dT9fAH8g1WdNGgwbQAAAABJRU5ErkJggg==";
