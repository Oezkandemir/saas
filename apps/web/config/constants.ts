/**
 * Application Constants
 *
 * Centralized configuration for all configurable values in the application.
 * This makes it easier to maintain and adjust performance-related settings.
 */

/**
 * Cache Configuration
 * Times are in milliseconds unless otherwise specified
 */
export const CACHE_CONFIG = {
  // Subscription plan cache time (in seconds for Next.js unstable_cache)
  subscriptionPlanRevalidate: 10,

  // React Query cache times (in milliseconds)
  notifications: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
  },

  // SWR cache configuration
  pageViews: {
    dedupingInterval: 60 * 1000, // 1 minute
  },

  // API Route cache times (in seconds for Next.js unstable_cache)
  api: {
    // Analytics endpoints - cache for 30 seconds, revalidate in background
    analytics: {
      revalidate: 30, // 30 seconds
      staleWhileRevalidate: true,
    },
    // Page views - cache for 60 seconds
    pageViews: {
      revalidate: 60, // 60 seconds
      staleWhileRevalidate: true,
    },
    // Geolocation - shorter cache due to external API dependency
    geolocation: {
      revalidate: 300, // 5 minutes
      staleWhileRevalidate: true,
    },
    // User data - cache for 10 seconds
    user: {
      revalidate: 10, // 10 seconds
      staleWhileRevalidate: false,
    },
  },
} as const;

/**
 * Timing Configuration
 * All delays and intervals in milliseconds
 */
export const TIMING_CONFIG = {
  // Database commit delay (should be removed in favor of proper transaction handling)
  databaseCommitDelay: 200,

  // Page view tracking fallback delay
  pageViewTrackingFallbackDelay: 1000,

  // Realtime analytics refresh interval
  realtimeAnalyticsRefreshInterval: 30 * 1000, // 30 seconds
} as const;

/**
 * Retry Configuration
 */
export const RETRY_CONFIG = {
  notifications: {
    retry: 1,
  },
} as const;
