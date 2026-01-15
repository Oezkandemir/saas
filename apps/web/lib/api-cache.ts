import crypto from "node:crypto";
import { unstable_cache } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Generate ETag from response data
 */
export function generateETag(data: unknown): string {
  const dataString = JSON.stringify(data);
  return crypto.createHash("md5").update(dataString).digest("hex");
}

/**
 * Check if request has matching ETag (304 Not Modified)
 */
export function checkETag(
  request: NextRequest,
  etag: string
): NextResponse | null {
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch === `"${etag}"` || ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: `"${etag}"`,
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  }
  return null;
}

/**
 * Add cache headers to response
 */
export function addCacheHeaders(
  response: NextResponse,
  options: {
    maxAge?: number;
    staleWhileRevalidate?: number;
    public?: boolean;
    etag?: string;
  } = {}
): NextResponse {
  const {
    maxAge = 60,
    staleWhileRevalidate = 300,
    public: isPublic = true,
    etag,
  } = options;

  const cacheControl = [
    isPublic ? "public" : "private",
    `max-age=${maxAge}`,
    `stale-while-revalidate=${staleWhileRevalidate}`,
  ].join(", ");

  response.headers.set("Cache-Control", cacheControl);

  if (etag) {
    response.headers.set("ETag", `"${etag}"`);
  }

  return response;
}

/**
 * Create cached API handler with ETag support
 */
export function createCachedAPIHandler<T>(
  handler: (request: NextRequest) => Promise<{ data: T; etag?: string }>,
  options: {
    cacheKey: string[];
    revalidate: number;
    maxAge?: number;
    staleWhileRevalidate?: number;
  }
) {
  const {
    cacheKey,
    revalidate,
    maxAge = 60,
    staleWhileRevalidate = 300,
  } = options;

  // Create cached version of the handler
  const cachedHandler = unstable_cache(
    async (request: NextRequest) => {
      return handler(request);
    },
    cacheKey,
    {
      revalidate,
      tags: cacheKey,
    }
  );

  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const result = await cachedHandler(request);
      const etag = result.etag || generateETag(result.data);

      // Check ETag for 304 response
      const etagCheck = checkETag(request, etag);
      if (etagCheck) {
        return etagCheck;
      }

      // Return response with cache headers
      const response = NextResponse.json(result.data);
      return addCacheHeaders(response, {
        maxAge,
        staleWhileRevalidate,
        etag,
      });
    } catch (_error) {
      // On error, don't cache
      return NextResponse.json(
        { error: "Internal server error" },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }
  };
}
