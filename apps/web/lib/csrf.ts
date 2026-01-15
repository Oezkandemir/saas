import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { logger } from "./logger";
import { getSession } from "./session";

const CSRF_TOKEN_COOKIE_NAME = "csrf-token";
const CSRF_TOKEN_HEADER_NAME = "X-CSRF-Token";
const CSRF_TOKEN_MAX_AGE = 60 * 60 * 24; // 24 hours

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Hash a CSRF token for secure storage
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Get or create CSRF token for current session
 */
export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CSRF_TOKEN_COOKIE_NAME);

  if (existingToken?.value) {
    return existingToken.value;
  }

  // Generate new token
  const token = generateCSRFToken();
  const hashedToken = hashToken(token);

  // Store hashed token in cookie (httpOnly for security)
  cookieStore.set(CSRF_TOKEN_COOKIE_NAME, hashedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: CSRF_TOKEN_MAX_AGE,
    path: "/",
  });

  return token;
}

/**
 * Validate CSRF token from request
 */
export async function validateCSRFToken(
  token: string | null | undefined
): Promise<boolean> {
  if (!token) {
    logger.warn("CSRF token missing from request");
    return false;
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_COOKIE_NAME);

  if (!cookieToken?.value) {
    logger.warn("CSRF token cookie missing");
    return false;
  }

  // Compare hashed token from cookie with hashed token from request
  const hashedRequestToken = hashToken(token);
  const isValid = hashedRequestToken === cookieToken.value;

  if (!isValid) {
    logger.warn("CSRF token validation failed", {
      hasCookie: !!cookieToken.value,
      hasRequestToken: !!token,
    });
  }

  return isValid;
}

/**
 * Validate CSRF token from request headers
 * Use this in API routes
 */
export async function validateCSRFTokenFromRequest(
  csrfToken: string | null | undefined
): Promise<boolean> {
  // Skip CSRF validation for GET, HEAD, OPTIONS requests
  // Only validate for state-changing operations

  // Check if user is authenticated (CSRF only applies to authenticated requests)
  const session = await getSession();
  if (!session) {
    // No session means no CSRF risk
    return true;
  }

  return validateCSRFToken(csrfToken);
}

/**
 * CSRF protection middleware for API routes
 * Returns error response if validation fails
 */
export async function requireCSRFToken(
  request: Request
): Promise<{ valid: true } | { valid: false; response: Response }> {
  const session = await getSession();

  // Only require CSRF for authenticated requests
  if (!session) {
    return { valid: true };
  }

  // Skip CSRF for safe methods
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { valid: true };
  }

  // Get token from header
  const csrfToken = request.headers.get(CSRF_TOKEN_HEADER_NAME);

  const isValid = await validateCSRFToken(csrfToken);

  if (!isValid) {
    logger.warn("CSRF validation failed", {
      method,
      path: new URL(request.url).pathname,
      hasToken: !!csrfToken,
    });

    return {
      valid: false,
      response: new Response(JSON.stringify({ error: "Invalid CSRF token" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  return { valid: true };
}

/**
 * Refresh CSRF token (call after login)
 */
export async function refreshCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_TOKEN_COOKIE_NAME);
  return getCSRFToken();
}
