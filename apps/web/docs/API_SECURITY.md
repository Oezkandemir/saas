# API Security Documentation

## Overview

This document describes the security measures implemented in the API to protect against common attacks and ensure secure access to resources.

## Authentication & Authorization

### Authentication

All protected API routes require authentication. The system uses Supabase Auth for session management.

**How it works:**
- Users authenticate via `/api/auth/signin` or `/api/auth/signup`
- Session tokens are stored in HTTP-only cookies
- Each request includes the session token automatically
- The `getCurrentUser()` function validates the session and returns user data

**Example:**
```typescript
const user = await getCurrentUser();
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Authorization

Authorization is role-based:
- **USER**: Standard user with access to own resources
- **ADMIN**: Administrator with access to all resources

**Admin-only routes:**
- `/api/admin/update-user-role` - Requires ADMIN role
- Admin dashboard routes - Requires ADMIN role

**Example:**
```typescript
if (user.role !== "ADMIN") {
  return NextResponse.json(
    { error: "Forbidden: Admin access required" },
    { status: 403 }
  );
}
```

## CSRF Protection

### Overview

Cross-Site Request Forgery (CSRF) protection is implemented for all state-changing operations (POST, PUT, DELETE, PATCH).

### How it works

1. **Token Generation**: A CSRF token is generated and stored in an HTTP-only cookie when a user authenticates
2. **Token Validation**: For state-changing requests, the token must be included in the `X-CSRF-Token` header
3. **Token Comparison**: The token from the header is compared with the hashed token in the cookie

### Implementation

**Client-side:**
```typescript
// Get CSRF token
const token = await getCSRFToken();

// Include in request headers
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': token,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});
```

**Server-side:**
```typescript
import { requireCSRFToken } from "@/lib/csrf";

const csrfCheck = await requireCSRFToken(request);
if (!csrfCheck.valid) {
  return csrfCheck.response;
}
```

### Exemptions

- GET, HEAD, OPTIONS requests (safe methods)
- Unauthenticated requests (no session = no CSRF risk)

## Rate Limiting

### Overview

Rate limiting prevents abuse and DDoS attacks by limiting the number of requests per time window.

### Configuration

Rate limits are configured per endpoint in the `rate_limit_configs` table:

- **max_requests**: Maximum requests allowed in the window
- **window_seconds**: Time window in seconds
- **block_duration_seconds**: Duration to block after limit exceeded
- **enabled**: Whether rate limiting is active

### Implementation

**Using API Middleware:**
```typescript
import { applyAPIMiddleware } from "@/lib/api-middleware";

const middleware = await applyAPIMiddleware(request, {
  requireAuth: true,
  rateLimit: {
    endpoint: "/api/endpoint",
    useUserBasedLimit: true, // Use user ID instead of IP
  },
});

if (!middleware.valid) {
  return middleware.response;
}
```

**Direct usage:**
```typescript
import { checkRateLimit } from "@/lib/rate-limit";

const rateLimit = await checkRateLimit(
  "/api/endpoint",
  user?.id,
  "user" // or "ip"
);

if (!rateLimit.allowed) {
  return NextResponse.json(
    { error: "Rate limit exceeded" },
    { status: 429 }
  );
}
```

### Rate Limit Types

- **IP-based**: Limits requests per IP address (default for public endpoints)
- **User-based**: Limits requests per authenticated user (for authenticated endpoints)

### Response Headers

When rate limit is exceeded:
- `Retry-After`: Seconds until the rate limit resets
- Status: `429 Too Many Requests`

## Input Validation

### Overview

All inputs are validated using Zod schemas to prevent injection attacks and ensure data integrity.

### Implementation

**Schema Definition:**
```typescript
import { z } from "zod";

const updateRoleSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID"),
  role: z.enum(["ADMIN", "USER"], {
    errorMap: () => ({ message: "Role must be either 'ADMIN' or 'USER'" }),
  }),
});
```

**Validation:**
```typescript
const body = await request.json();
const validationResult = updateRoleSchema.safeParse(body);

if (!validationResult.success) {
  return NextResponse.json(
    {
      error: "Invalid input",
      details: validationResult.error.errors,
    },
    { status: 400 }
  );
}

const { userId, role } = validationResult.data;
```

### Common Validations

- **UUIDs**: `z.string().uuid()`
- **Emails**: `z.string().email()`
- **Enums**: `z.enum([...])`
- **Numbers**: `z.number().min(0).max(100)`
- **Strings**: `z.string().min(1).max(255)`

## Error Handling

### Standardized Error Responses

All errors follow a consistent format:

```typescript
{
  error: "ERROR_TYPE",
  message: "Human-readable error message",
  details?: {} // Only in development
}
```

### Error Types

- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: User not authenticated
- `AUTHORIZATION_ERROR`: User not authorized
- `NOT_FOUND_ERROR`: Resource not found
- `RATE_LIMIT_ERROR`: Rate limit exceeded
- `INTERNAL_ERROR`: Server error

### Implementation

```typescript
import { handleAPIError } from "@/lib/error-handler";

try {
  // ... operation
} catch (error) {
  return handleAPIError(error, {
    defaultMessage: "Operation failed",
    logError: true,
    includeDetails: process.env.NODE_ENV === "development",
  });
}
```

## Security Headers

### Content Security Policy (CSP)

The CSP is configured to prevent XSS attacks:

```
default-src 'self'
script-src 'self' 'unsafe-inline' https://vercel.live
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
```

**Note:** `unsafe-inline` is required for Next.js hydration but `unsafe-eval` has been removed for security.

### Other Security Headers

- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Strict-Transport-Security` - Forces HTTPS (production only)
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information

## CORS Configuration

### Overview

CORS is configured to allow only trusted origins.

### Implementation

```typescript
const origin = request.headers.get("origin");
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL,
  ...(process.env.ALLOWED_ORIGINS?.split(",") || []),
];

const isAllowedOrigin =
  !origin ||
  origin === request.nextUrl.origin ||
  allowedOrigins.some((allowed) => origin.startsWith(allowed));

if (isAllowedOrigin) {
  response.headers.set("Access-Control-Allow-Origin", origin);
}
```

## Database Security

### Row Level Security (RLS)

All tables have RLS enabled. Policies ensure:
- Users can only access their own data
- Admins can access all data
- Public data is accessible to all

### SECURITY DEFINER Functions

Database functions with `SECURITY DEFINER` are secured with:
- Authentication checks (`auth.uid()`)
- Authorization checks (role verification)
- Input validation (UUID format, not null)
- Resource existence checks
- Protection against self-actions

## API Endpoints

### Protected Endpoints

All endpoints under `/api/` require authentication unless explicitly marked as public.

### Public Endpoints

- `/api/health` - Health check
- `/api/auth/signin` - User sign in
- `/api/auth/signup` - User sign up
- `/q/[code]` - Public QR code access
- `/c/[code]` - Public customer access

### Admin Endpoints

- `/api/admin/update-user-role` - Update user role (POST)
  - Requires: ADMIN role
  - CSRF: Yes
  - Rate Limit: Yes (user-based)
  - Input: `{ userId: UUID, role: "ADMIN" | "USER" }`

## Best Practices

1. **Always validate input** - Use Zod schemas for all inputs
2. **Check authentication** - Verify user is authenticated before processing
3. **Check authorization** - Verify user has required permissions
4. **Use rate limiting** - Protect against abuse
5. **Log security events** - Log authentication failures, authorization failures, rate limit violations
6. **Handle errors securely** - Don't expose internal error details in production
7. **Use HTTPS** - Always use HTTPS in production
8. **Keep dependencies updated** - Regularly update dependencies for security patches

## Security Checklist

Before deploying to production:

- [ ] All API routes have authentication checks
- [ ] Admin routes have authorization checks
- [ ] CSRF protection is enabled for state-changing operations
- [ ] Rate limiting is configured for all endpoints
- [ ] Input validation is implemented for all inputs
- [ ] Error handling doesn't expose sensitive information
- [ ] Security headers are configured
- [ ] CORS is properly configured
- [ ] Database RLS policies are enabled
- [ ] SECURITY DEFINER functions are secured
- [ ] Logging is implemented for security events
- [ ] Environment variables are properly secured

## Reporting Security Issues

If you discover a security vulnerability, please report it to the security team immediately. Do not create a public issue.

