import "server-only";

import type { User } from "@supabase/supabase-js";
import { cacheDel, cacheGet, cacheSet } from "./cache";

/**
 * Session Cache Keys
 */
const CACHE_KEYS = {
  user: (userId: string) => `session:user:${userId}`,
  session: (sessionId: string) => `session:${sessionId}`,
  userRole: (userId: string) => `session:role:${userId}`,
} as const;

/**
 * Cache TTLs (in seconds)
 */
const CACHE_TTL = {
  user: 300, // 5 minutes
  session: 600, // 10 minutes
  userRole: 300, // 5 minutes
} as const;

/**
 * Cache user data
 */
export async function cacheUser(
  userId: string,
  user: User | null
): Promise<void> {
  if (!userId) return;

  const key = CACHE_KEYS.user(userId);
  await cacheSet(key, user, CACHE_TTL.user);
}

/**
 * Get cached user data
 */
export async function getCachedUser(userId: string): Promise<User | null> {
  if (!userId) return null;

  const key = CACHE_KEYS.user(userId);
  return await cacheGet<User>(key);
}

/**
 * Cache user role
 */
export async function cacheUserRole(
  userId: string,
  role: string
): Promise<void> {
  if (!userId) return;

  const key = CACHE_KEYS.userRole(userId);
  await cacheSet(key, role, CACHE_TTL.userRole);
}

/**
 * Get cached user role
 */
export async function getCachedUserRole(
  userId: string
): Promise<string | null> {
  if (!userId) return null;

  const key = CACHE_KEYS.userRole(userId);
  return await cacheGet<string>(key);
}

/**
 * Invalidate user cache
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  if (!userId) return;

  await Promise.all([
    cacheDel(CACHE_KEYS.user(userId)),
    cacheDel(CACHE_KEYS.userRole(userId)),
  ]);
}

/**
 * Invalidate all session caches for a user
 */
export async function invalidateAllUserCaches(userId: string): Promise<void> {
  if (!userId) return;

  await invalidateUserCache(userId);
  // Also invalidate any session-related caches
  await cacheDel(CACHE_KEYS.session(userId));
}
