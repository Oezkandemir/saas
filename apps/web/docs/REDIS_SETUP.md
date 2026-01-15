# Redis Caching Setup Guide

## Overview

Redis caching is an optional performance optimization that provides:
- Faster session lookups
- Reduced database load
- Better scalability
- Distributed caching across multiple instances

The application gracefully falls back to in-memory caching if Redis is not available.

## Setup

### 1. Install Redis (Optional)

**Local Development:**
```bash
# macOS
brew install redis
brew services start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

**Production:**
- Use a managed Redis service (e.g., Upstash, Redis Cloud, AWS ElastiCache)
- Or deploy Redis on your infrastructure

### 2. Install Redis Client

The Redis client is dynamically imported, so you don't need to install it unless you want to use Redis:

```bash
pnpm add redis
pnpm add -D @types/redis
```

### 3. Configure Environment Variables

Add to `.env.local`:

```bash
# Redis URL (optional - caching will fall back to memory if not set)
REDIS_URL=redis://localhost:6379

# Or for Redis with authentication:
REDIS_URL=redis://:password@localhost:6379

# Or for Redis Cloud/Upstash:
REDIS_URL=rediss://default:password@hostname:port
```

### 4. Verify Setup

The application will automatically detect Redis availability. Check logs for:
- `Redis client initialized successfully` - Redis is working
- `Redis not configured` - Redis is disabled (using memory cache)

## Usage

### Cache API

The cache wrapper provides a simple API:

```typescript
import { cacheSet, cacheGet, cacheDel } from "@/lib/cache";

// Set a value (TTL in seconds)
await cacheSet("key", { data: "value" }, 3600);

// Get a value
const value = await cacheGet<{ data: string }>("key");

// Delete a value
await cacheDel("key");
```

### Session Caching

Session caching is handled automatically:

```typescript
import { cacheUser, getCachedUser, invalidateUserCache } from "@/lib/session-cache";

// Cache user data
await cacheUser(userId, user);

// Get cached user
const cachedUser = await getCachedUser(userId);

// Invalidate cache (e.g., after role change)
await invalidateUserCache(userId);
```

## Cache Strategies

### 1. Cache-Aside Pattern

```typescript
// Check cache first
let data = await cacheGet("key");

if (!data) {
  // Fetch from database
  data = await fetchFromDatabase();
  
  // Store in cache
  await cacheSet("key", data, 3600);
}
```

### 2. Write-Through Pattern

```typescript
// Update database
await updateDatabase(data);

// Update cache
await cacheSet("key", data, 3600);
```

### 3. Write-Behind Pattern

```typescript
// Update cache immediately
await cacheSet("key", data, 3600);

// Update database asynchronously
updateDatabaseAsync(data);
```

## Cache Invalidation

### Manual Invalidation

```typescript
import { cacheDel, cacheDelPattern } from "@/lib/cache";

// Delete specific key
await cacheDel("key");

// Delete keys matching pattern
await cacheDelPattern("user:*");
```

### Automatic Invalidation

The application automatically invalidates caches when:
- User data changes
- User role changes
- Session expires

## Monitoring

### Cache Statistics

```typescript
import { getCacheStats } from "@/lib/cache";

const stats = await getCacheStats();
console.log(stats);
// { type: "redis" | "memory" | "none", size: number, available: boolean }
```

### Health Checks

Check Redis availability:

```typescript
import { isRedisAvailable } from "@/lib/redis";

if (isRedisAvailable()) {
  console.log("Redis is available");
} else {
  console.log("Using memory cache fallback");
}
```

## Performance Considerations

### TTL (Time To Live)

Choose appropriate TTLs based on data freshness requirements:

- **Session data**: 5-10 minutes
- **User data**: 5 minutes
- **Subscription data**: 10 seconds (already configured)
- **Analytics data**: 30-60 seconds
- **Static data**: 1 hour+

### Memory Usage

- Redis: Unlimited (depends on Redis instance)
- Memory cache: Limited to ~1000 entries before cleanup

### Fallback Behavior

If Redis is unavailable:
- Application continues to work
- Uses in-memory cache
- No performance degradation for single-instance deployments
- May have cache misses across instances in multi-instance setups

## Troubleshooting

### Redis Connection Issues

1. **Check Redis URL**: Verify `REDIS_URL` is correct
2. **Check Redis Status**: `redis-cli ping` should return `PONG`
3. **Check Logs**: Look for Redis connection errors
4. **Fallback**: Application will use memory cache automatically

### Cache Not Working

1. **Check Availability**: `isRedisAvailable()` returns `true`
2. **Check Keys**: Use `redis-cli KEYS "*"` to see cached keys
3. **Check TTL**: Keys expire based on TTL configuration
4. **Check Logs**: Look for cache errors

### Performance Issues

1. **Monitor Cache Hit Rate**: Track cache hits vs misses
2. **Adjust TTLs**: Increase TTLs for stable data
3. **Review Cache Keys**: Ensure keys are properly namespaced
4. **Check Redis Memory**: Monitor Redis memory usage

## Best Practices

1. **Use Namespaced Keys**: `user:${userId}`, `session:${sessionId}`
2. **Set Appropriate TTLs**: Balance freshness vs performance
3. **Invalidate on Updates**: Clear cache when data changes
4. **Monitor Cache Performance**: Track hit rates and response times
5. **Handle Cache Misses**: Always have a fallback to database

## Resources

- [Redis Documentation](https://redis.io/docs/)
- [Upstash Redis](https://upstash.com/) - Serverless Redis
- [Redis Cloud](https://redis.com/redis-enterprise-cloud/) - Managed Redis
- [Node Redis Client](https://github.com/redis/node-redis)
