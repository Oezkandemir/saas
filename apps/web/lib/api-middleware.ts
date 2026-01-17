import { type NextRequest, NextResponse } from "next/server";

import { logger } from "./logger";
import { checkRateLimit } from "./rate-limit";
import { getCurrentUser } from "./session";

/**
 * API Middleware for common security checks
 */
export interface APIMiddlewareOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  rateLimit?: {
    endpoint: string;
    useUserBasedLimit?: boolean;
  };
}

/**
 * Apply API middleware (auth, rate limiting, etc.)
 */
export async function applyAPIMiddleware(
  request: NextRequest,
  options: APIMiddlewareOptions = {}
): Promise<
  | { valid: true; user?: Awaited<ReturnType<typeof getCurrentUser>> }
  | { valid: false; response: NextResponse }
> {
  // Rate limiting
  if (options.rateLimit) {
    const user = await getCurrentUser();
    const identifier = options.rateLimit.useUserBasedLimit
      ? user?.id
      : undefined;
    const identifierType = options.rateLimit.useUserBasedLimit ? "user" : "ip";

    const rateLimit = await checkRateLimit(
      options.rateLimit.endpoint,
      identifier,
      identifierType
    );

    if (!rateLimit.allowed) {
      logger.warn("Rate limit exceeded", {
        endpoint: options.rateLimit.endpoint,
        identifier,
        identifierType,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });

      return {
        valid: false,
        response: NextResponse.json(
          {
            error: "Rate limit exceeded",
            retryAfter: Math.ceil(
              (rateLimit.resetAt.getTime() - Date.now()) / 1000
            ),
          },
          {
            status: 429,
            headers: {
              "Retry-After": Math.ceil(
                (rateLimit.resetAt.getTime() - Date.now()) / 1000
              ).toString(),
            },
          }
        ),
      };
    }
  }

  // Authentication check
  if (options.requireAuth || options.requireAdmin) {
    const user = await getCurrentUser();

    if (!user) {
      logger.warn("Unauthorized API access attempt", {
        path: request.nextUrl.pathname,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });

      return {
        valid: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    // Admin check
    if (options.requireAdmin && user.role !== "ADMIN") {
      logger.warn("Forbidden API access attempt - insufficient permissions", {
        userId: user.id,
        userRole: user.role,
        path: request.nextUrl.pathname,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });

      return {
        valid: false,
        response: NextResponse.json(
          { error: "Forbidden: Admin access required" },
          { status: 403 }
        ),
      };
    }

    return { valid: true, user };
  }

  return { valid: true };
}
