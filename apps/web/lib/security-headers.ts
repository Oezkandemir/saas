import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Security headers configuration
 */
export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  strictTransportSecurity?: string;
  xFrameOptions?: string;
  xContentTypeOptions?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
  xXSSProtection?: string;
}

/**
 * Default Content Security Policy
 * SECURITY: Removed unsafe-eval for better security
 * Note: unsafe-inline for scripts is required for Next.js hydration
 * Consider implementing nonces in future for better security
 */
const defaultCSP = [
  "default-src 'self'",
  // Removed 'unsafe-eval' - major security improvement
  // unsafe-inline kept for Next.js hydration scripts (can be improved with nonces)
  "script-src 'self' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https: blob:",
  "connect-src 'self' https://*.supabase.co https://*.vercel.app wss://*.supabase.co https://ipapi.co",
  "frame-src 'self' https://vercel.live",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(
  response: NextResponse,
  request: NextRequest,
  customConfig?: SecurityHeadersConfig,
): NextResponse {
  const config: SecurityHeadersConfig = {
    contentSecurityPolicy: defaultCSP,
    strictTransportSecurity:
      request.nextUrl.protocol === "https:"
        ? "max-age=31536000; includeSubDomains; preload"
        : undefined,
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    referrerPolicy: "strict-origin-when-cross-origin",
    permissionsPolicy: "geolocation=(self), microphone=(), camera=()",
    xXSSProtection: "1; mode=block",
    ...customConfig,
  };

  // Apply Content Security Policy
  if (config.contentSecurityPolicy) {
    response.headers.set(
      "Content-Security-Policy",
      config.contentSecurityPolicy,
    );
  }

  // Apply Strict Transport Security
  if (config.strictTransportSecurity) {
    response.headers.set(
      "Strict-Transport-Security",
      config.strictTransportSecurity,
    );
  }

  // Apply X-Frame-Options
  if (config.xFrameOptions) {
    response.headers.set("X-Frame-Options", config.xFrameOptions);
  }

  // Apply X-Content-Type-Options
  if (config.xContentTypeOptions) {
    response.headers.set(
      "X-Content-Type-Options",
      config.xContentTypeOptions,
    );
  }

  // Apply Referrer-Policy
  if (config.referrerPolicy) {
    response.headers.set("Referrer-Policy", config.referrerPolicy);
  }

  // Apply Permissions-Policy
  if (config.permissionsPolicy) {
    response.headers.set("Permissions-Policy", config.permissionsPolicy);
  }

  // Apply X-XSS-Protection
  if (config.xXSSProtection) {
    response.headers.set("X-XSS-Protection", config.xXSSProtection);
  }

  // Remove X-Powered-By header (if not already removed)
  response.headers.delete("X-Powered-By");

  return response;
}

/**
 * Generate CSP nonce for inline scripts
 */
export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

