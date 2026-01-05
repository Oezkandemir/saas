import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import { env } from "@/env.mjs";
import { usePageViews } from "@/hooks/use-page-views";

// Initialize the Supabase client with public/anon key (safe for browser)
const supabaseClient = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

interface UseRealtimePageViewsProps {
  slug: string;
  trackView?: boolean;
}

/**
 * A hook that provides real-time page view updates using Supabase Realtime
 *
 * @param slug - The URL slug for the page
 * @param trackView - Whether to track the page view
 * @returns The current view count and loading state
 */
export function useRealtimePageViews({
  slug,
  trackView = true,
}: UseRealtimePageViewsProps) {
  const normalizedSlug = slug?.trim().toLowerCase() || "";
  const {
    views: initialViews,
    isLoading,
    isError,
  } = usePageViews({
    slug: normalizedSlug,
    trackView,
  });

  const [views, setViews] = useState(initialViews);

  // Update local state when initial views change
  useEffect(() => {
    if (!isLoading && !isError) {
      setViews(initialViews);
    }
  }, [initialViews, isLoading, isError]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!normalizedSlug) return;

    // Create unique channel name per slug to avoid conflicts
    const channelName = `page_views_changes:${normalizedSlug}`;

    // Subscribe to changes on the page_views table
    const channel = supabaseClient
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "page_views",
          filter: `slug=eq.${normalizedSlug}`,
        },
        (payload) => {
          // Update the views when data changes
          if (payload.new && typeof payload.new.view_count === "number") {
            setViews(payload.new.view_count);
          }
        },
      )
      .subscribe();

    // Clean up subscription on unmount or when slug changes
    return () => {
      if (channel) {
        supabaseClient.removeChannel(channel).catch(() => {
          // Ignore cleanup errors
        });
      }
    };
  }, [normalizedSlug]);

  return {
    views,
    isLoading,
    isError,
  };
}
