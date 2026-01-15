import "server-only";

import { logger } from "./logger";
import {
  isRedisAvailable,
  redisDel,
  redisDelPattern,
  redisExists,
  redisGet,
  redisSet,
} from "./redis";

/**
 * Cache wrapper that uses Redis when available, falls back to in-memory cache
 */

// In-memory cache fallback
const memoryCache = new Map<string, { value: any; expires: number }>();

/**
 * Set a value in cache
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = 3600
): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value);

    // Try Redis first
    if (isRedisAvailable()) {
      const success = await redisSet(key, serialized, ttlSeconds);
      if (success) {
        return true;
      }
    }

    // Fall back to memory cache
    const expires = Date.now() + ttlSeconds * 1000;
    memoryCache.set(key, { value, expires });

    // Clean up expired entries periodically
    if (memoryCache.size > 1000) {
      cleanupMemoryCache();
    }

    return true;
  } catch (error) {
    logger.error("Cache SET error:", error);
    return false;
  }
}

/**
 * Get a value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    // Try Redis first
    if (isRedisAvailable()) {
      const value = await redisGet(key);
      if (value !== null) {
        try {
          return JSON.parse(value) as T;
        } catch (parseError) {
          logger.error("Cache GET parse error:", parseError);
          return null;
        }
      }
    }

    // Fall back to memory cache
    const cached = memoryCache.get(key);
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expires) {
      memoryCache.delete(key);
      return null;
    }

    return cached.value as T;
  } catch (error) {
    logger.error("Cache GET error:", error);
    return null;
  }
}

/**
 * Delete a value from cache
 */
export async function cacheDel(key: string): Promise<boolean> {
  try {
    // Try Redis first
    if (isRedisAvailable()) {
      await redisDel(key);
    }

    // Also remove from memory cache
    memoryCache.delete(key);
    return true;
  } catch (error) {
    logger.error("Cache DEL error:", error);
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function cacheDelPattern(pattern: string): Promise<number> {
  try {
    let count = 0;

    // Try Redis first
    if (isRedisAvailable()) {
      count = await redisDelPattern(pattern);
    }

    // Also clean memory cache
    const regex = new RegExp(pattern.replace("*", ".*"));
    for (const key of Array.from(memoryCache.keys())) {
      if (regex.test(key)) {
        memoryCache.delete(key);
        count++;
      }
    }

    return count;
  } catch (error) {
    logger.error("Cache DEL pattern error:", error);
    return 0;
  }
}

/**
 * Check if a key exists in cache
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    // Try Redis first
    if (isRedisAvailable()) {
      return await redisExists(key);
    }

    // Check memory cache
    const cached = memoryCache.get(key);
    if (!cached) {
      return false;
    }

    // Check if expired
    if (Date.now() > cached.expires) {
      memoryCache.delete(key);
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Cache EXISTS error:", error);
    return false;
  }
}

/**
 * Clean up expired entries from memory cache
 */
function cleanupMemoryCache() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, cached] of Array.from(memoryCache.entries())) {
    if (now > cached.expires) {
      memoryCache.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug(`Cleaned up ${cleaned} expired cache entries`);
  }
}

/**
 * Clear all cache (use with caution)
 */
export async function cacheClear(): Promise<boolean> {
  try {
    // Clear Redis cache
    if (isRedisAvailable()) {
      await redisDelPattern("*");
    }

    // Clear memory cache
    memoryCache.clear();
    return true;
  } catch (error) {
    logger.error("Cache CLEAR error:", error);
    return false;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  type: "redis" | "memory" | "none";
  size: number;
  available: boolean;
}> {
  if (isRedisAvailable()) {
    return {
      type: "redis",
      size: 0, // Redis doesn't provide size easily
      available: true,
    };
  }

  return {
    type: memoryCache.size > 0 ? "memory" : "none",
    size: memoryCache.size,
    available: true,
  };
}
