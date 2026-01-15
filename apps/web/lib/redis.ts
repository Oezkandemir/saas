import "server-only";

import { logger } from "./logger";

/**
 * Redis Client Wrapper
 *
 * Provides a Redis client for caching. Falls back gracefully if Redis is not available.
 * Set REDIS_URL environment variable to enable Redis caching.
 */

let redisClient: any = null;
let redisAvailable = false;

// Try to initialize Redis client
async function initializeRedis() {
  // Check if Redis URL is configured
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.debug(
      "Redis not configured - REDIS_URL not set. Caching will be disabled."
    );
    return;
  }

  try {
    // Dynamic import to avoid errors if redis package is not installed
    // @ts-expect-error - redis is an optional dependency
    const { createClient } = await import("redis");

    const client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            logger.warn(
              "Redis reconnection failed after 10 retries. Caching disabled."
            );
            return new Error("Redis reconnection limit exceeded");
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    client.on("error", (err: Error) => {
      logger.error("Redis client error:", err);
      redisAvailable = false;
    });

    client.on("connect", () => {
      logger.info("Redis client connected");
      redisAvailable = true;
    });

    client.on("disconnect", () => {
      logger.warn("Redis client disconnected");
      redisAvailable = false;
    });

    await client.connect();
    redisClient = client;
    redisAvailable = true;

    logger.info("Redis client initialized successfully");
  } catch (error) {
    logger.warn("Failed to initialize Redis client:", error);
    logger.warn("Caching will fall back to in-memory cache");
    redisAvailable = false;
  }
}

// Initialize Redis on module load
if (typeof window === "undefined") {
  initializeRedis().catch((error) => {
    logger.error("Error initializing Redis:", error);
  });
}

/**
 * Get Redis client if available
 */
export function getRedisClient() {
  return redisClient;
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redisAvailable && redisClient !== null;
}

/**
 * Set a value in Redis cache
 */
export async function redisSet(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    if (ttlSeconds) {
      await redisClient.setEx(key, ttlSeconds, value);
    } else {
      await redisClient.set(key, value);
    }
    return true;
  } catch (error) {
    logger.error("Redis SET error:", error);
    return false;
  }
}

/**
 * Get a value from Redis cache
 */
export async function redisGet(key: string): Promise<string | null> {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const value = await redisClient.get(key);
    return value;
  } catch (error) {
    logger.error("Redis GET error:", error);
    return null;
  }
}

/**
 * Delete a value from Redis cache
 */
export async function redisDel(key: string): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error("Redis DEL error:", error);
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function redisDelPattern(pattern: string): Promise<number> {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    await redisClient.del(keys);
    return keys.length;
  } catch (error) {
    logger.error("Redis DEL pattern error:", error);
    return 0;
  }
}

/**
 * Check if a key exists in Redis
 */
export async function redisExists(key: string): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const result = await redisClient.exists(key);
    return result === 1;
  } catch (error) {
    logger.error("Redis EXISTS error:", error);
    return false;
  }
}

/**
 * Set expiration for a key
 */
export async function redisExpire(
  key: string,
  ttlSeconds: number
): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    await redisClient.expire(key, ttlSeconds);
    return true;
  } catch (error) {
    logger.error("Redis EXPIRE error:", error);
    return false;
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      redisAvailable = false;
      logger.info("Redis connection closed");
    } catch (error) {
      logger.error("Error closing Redis connection:", error);
    }
  }
}
