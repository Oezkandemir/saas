import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/session";
import { logger } from "@/lib/logger";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  blocked: boolean;
  blockedUntil?: Date;
}

export interface RateLimitConfig {
  endpoint: string;
  maxRequests: number;
  windowSeconds: number;
  blockDurationSeconds: number;
  enabled: boolean;
}

/**
 * Get rate limit configuration for an endpoint
 * Always returns a config (default if none found)
 */
export async function getRateLimitConfig(
  endpoint: string,
): Promise<RateLimitConfig> {
  const supabase = await createClient();

  // Try exact match first
  let { data: config } = await supabase
    .from("rate_limit_configs")
    .select("*")
    .eq("endpoint", endpoint)
    .eq("enabled", true)
    .single();

  // If no exact match, try wildcard pattern
  if (!config) {
    const { data: wildcardConfigs } = await supabase
      .from("rate_limit_configs")
      .select("*")
      .eq("enabled", true)
      .like("endpoint", "%*%");

    if (wildcardConfigs && wildcardConfigs.length > 0) {
      // Find matching wildcard pattern
      for (const wc of wildcardConfigs) {
        const pattern = wc.endpoint.replace("*", ".*");
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(endpoint)) {
          config = wc;
          break;
        }
      }
    }
  }

  // Default config if nothing found
  if (!config) {
    return {
      endpoint,
      maxRequests: 100,
      windowSeconds: 60,
      blockDurationSeconds: 300,
      enabled: true,
    };
  }

  return {
    endpoint: config.endpoint,
    maxRequests: config.max_requests,
    windowSeconds: config.window_seconds,
    blockDurationSeconds: config.block_duration_seconds,
    enabled: config.enabled,
  };
}

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  endpoint: string,
  identifier?: string,
  identifierType: "ip" | "user" = "ip",
): Promise<RateLimitResult> {
  const config = await getRateLimitConfig(endpoint);

  if (!config.enabled) {
    return {
      allowed: true,
      remaining: Infinity,
      resetAt: new Date(Date.now() + config.windowSeconds * 1000),
      blocked: false,
    };
  }

  // Get identifier
  let finalIdentifier = identifier;
  if (!finalIdentifier) {
    if (identifierType === "ip") {
      const headersList = await headers();
      finalIdentifier =
        headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headersList.get("x-real-ip") ||
        "unknown";
    } else {
      const user = await getCurrentUser();
      finalIdentifier = user?.id || "anonymous";
    }
  }

  const supabase = await createClient();

  // Call the database function to check rate limit
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_identifier: finalIdentifier,
    p_identifier_type: identifierType,
    p_endpoint: endpoint,
    p_max_requests: config.maxRequests,
    p_window_seconds: config.windowSeconds,
  });

  if (error) {
    logger.error("Rate limit check error", error);
    // Fail open - allow request if rate limit check fails
    return {
      allowed: true,
      remaining: Infinity,
      resetAt: new Date(Date.now() + config.windowSeconds * 1000),
      blocked: false,
    };
  }

  const result = data?.[0];

  if (!result) {
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(Date.now() + config.windowSeconds * 1000),
      blocked: false,
    };
  }

  // If blocked, block the identifier
  if (!result.allowed && !result.blocked) {
    await supabase.rpc("block_rate_limit", {
      p_identifier: finalIdentifier,
      p_identifier_type: identifierType,
      p_endpoint: endpoint,
      p_block_duration_seconds: config.blockDurationSeconds,
    });
  }

  return {
    allowed: result.allowed,
    remaining: result.remaining || 0,
    resetAt: new Date(result.reset_at),
    blocked: result.blocked || false,
    blockedUntil: result.blocked ? new Date(result.reset_at) : undefined,
  };
}

/**
 * Get client IP address from headers
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Rate limit middleware helper
 */
export async function rateLimitMiddleware(
  endpoint: string,
  options?: {
    useUserBasedLimit?: boolean;
    customIdentifier?: string;
  },
): Promise<RateLimitResult> {
  const identifierType = options?.useUserBasedLimit ? "user" : "ip";
  return checkRateLimit(
    endpoint,
    options?.customIdentifier,
    identifierType,
  );
}

