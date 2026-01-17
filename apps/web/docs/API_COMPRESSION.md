# API Response Compression Guide

## Overview

This document explains how API response compression is handled in the application.

## Automatic Compression

### Next.js Built-in Compression

Next.js automatically compresses responses when:
- `compress: true` is set in `next.config.js` (default)
- Deployed on platforms that support compression (Vercel, etc.)

**Supported formats:**
- Gzip (default)
- Brotli (on Vercel/CDN)

### Vercel Compression

When deployed on Vercel:
- **Automatic**: All responses are compressed
- **Brotli**: Used when supported by client
- **Gzip**: Fallback for older clients
- **No configuration needed**: Works out of the box

## Manual Compression

For custom compression needs, use the compression utilities:

```typescript
import { compressResponse, compressedJsonResponse } from "@/lib/compression";

// Compress existing response
export async function GET() {
  const response = NextResponse.json({ data: "large data..." });
  return compressResponse(response);
}

// Create compressed JSON response
export async function GET() {
  const data = { /* large data object */ };
  return compressedJsonResponse(data);
}
```

## Compression Thresholds

Compression is applied when:
- Content size > 1 KB
- Content type is compressible (not images/videos/fonts)
- Client supports compression (via Accept-Encoding header)

## Best Practices

### 1. Let Next.js/Vercel Handle It

**Recommended**: Use automatic compression for most cases.

```typescript
// ✅ Good - Automatic compression
export async function GET() {
  return NextResponse.json({ data: "..." });
}
```

### 2. Large JSON Responses

For very large JSON responses (> 100 KB), consider:

```typescript
// ✅ Good - Explicit compression for large responses
export async function GET() {
  const largeData = await fetchLargeData();
  return compressedJsonResponse(largeData);
}
```

### 3. Streaming Responses

For streaming responses, compression is handled automatically:

```typescript
// ✅ Good - Streaming with automatic compression
export async function GET() {
  return new NextResponse(stream, {
    headers: { "Content-Type": "application/json" },
  });
}
```

## Compression Headers

The compression utilities automatically set:

- `Content-Encoding: gzip` - Indicates compressed content
- `Content-Length` - Updated to compressed size
- `Vary: Accept-Encoding` - Ensures proper caching

## Testing Compression

### Check Response Headers

```bash
curl -H "Accept-Encoding: gzip" \
  -v https://yourdomain.com/api/endpoint \
  | grep -i "content-encoding"
```

### Verify Compression

```bash
# Check if response is compressed
curl -H "Accept-Encoding: gzip" \
  -v https://yourdomain.com/api/endpoint \
  2>&1 | grep "content-encoding: gzip"
```

## Performance Impact

### Compression Benefits

- **60-80% size reduction** for JSON/text responses
- **Faster page loads** especially on slow connections
- **Reduced bandwidth costs**

### When Not to Compress

- Already compressed formats (images, videos, fonts)
- Very small responses (< 1 KB)
- Real-time streaming (compression adds latency)

## Troubleshooting

### Compression Not Working

**Problem**: Responses not compressed.

**Solutions**:
1. Check `compress: true` in `next.config.js`
2. Verify deployment platform supports compression
3. Check `Accept-Encoding` header in request
4. Ensure content type is compressible

### Content-Encoding Header Missing

**Problem**: Response doesn't have `Content-Encoding` header.

**Solutions**:
1. Check if content is large enough (> 1 KB)
2. Verify content type is compressible
3. Check CDN/proxy settings
4. Use manual compression for specific endpoints

## Resources

- [Next.js Compression](https://nextjs.org/docs/api-reference/next.config.js/compress)
- [Vercel Compression](https://vercel.com/docs/concepts/edge-network/compression)
- [HTTP Compression](https://developer.mozilla.org/en-US/docs/Web/HTTP/Compression)
