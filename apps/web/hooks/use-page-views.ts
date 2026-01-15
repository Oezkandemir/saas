import { useEffect, useState } from "react";
import useSWR from "swr";

import { logger } from "@/lib/logger";

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch page views");
  }
  return res.json();
};

interface UsePageViewsProps {
  slug: string;
  trackView?: boolean;
}

interface PageViewsResponse {
  views: number;
}

/**
 * Custom hook to track and display page views
 *
 * @param slug - The URL slug for the page
 * @param trackView - Whether to track the page view (defaults to true)
 * @returns Object containing the view count and loading state
 */
export function usePageViews({ slug, trackView = true }: UsePageViewsProps) {
  const normalizedSlug = slug?.trim().toLowerCase() || "";
  const [hasTracked, setHasTracked] = useState(false);

  // Fetch the current view count
  const { data, error, isLoading, mutate } = useSWR<PageViewsResponse>(
    normalizedSlug
      ? `/api/views?slug=${encodeURIComponent(normalizedSlug)}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // Track the page view once when the component mounts
  useEffect(() => {
    // Only track if requested and we haven't tracked yet
    if (!trackView || hasTracked || !normalizedSlug) return;

    const trackPageView = async () => {
      try {
        // Send request to increment view count
        await fetch("/api/views", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ slug: normalizedSlug }),
        });

        // After tracking, revalidate to get updated count
        mutate();
        setHasTracked(true);
      } catch (error) {
        logger.error("Error tracking page view", error);
      }
    };

    // Use requestIdleCallback to track view when browser is idle
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => trackPageView());
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(trackPageView, 1000);
    }
  }, [normalizedSlug, trackView, hasTracked, mutate]);

  return {
    views: data?.views || 0,
    isLoading,
    isError: !!error,
  };
}
