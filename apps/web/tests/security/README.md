# Security Tests

This directory contains unit tests for security-critical functionality.

## Test Files

- **csrf.test.ts** - Tests for CSRF protection
- **api-middleware.test.ts** - Tests for API middleware (auth, rate limiting)
- **error-handler.test.ts** - Tests for error handling
- **admin-route.test.ts** - Tests for admin route security
- **rate-limit.test.ts** - Tests for rate limiting functionality

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run only security tests
pnpm test tests/security
```

## Test Coverage

These tests cover:

1. **CSRF Protection**

   - Token generation
   - Token validation
   - Request validation
   - Safe method exemptions

2. **API Middleware**

   - Authentication checks
   - Authorization checks (admin)
   - Rate limiting
   - Combined checks

3. **Error Handling**

   - Zod validation errors
   - Standard errors
   - Production vs development error details
   - Error response formatting

4. **Admin Route Security**

   - Authentication requirements
   - Authorization requirements
   - CSRF protection
   - Rate limiting
   - Input validation
   - Self-demotion protection

5. **Rate Limiting**
   - Configuration retrieval
   - IP-based limiting
   - User-based limiting
   - Rate limit exceeded handling
   - Fail-open behavior

## Adding New Tests

When adding new security features:

1. Create a test file in `tests/security/`
2. Follow the existing test structure
3. Mock external dependencies (database, auth, etc.)
4. Test both success and failure cases
5. Test edge cases and boundary conditions

## Mocking

Tests use Vitest mocks for:

- `next/headers` - Cookie and header access
- `@/lib/session` - User session management
- `@/lib/rate-limit` - Rate limiting
- `@/lib/csrf` - CSRF protection
- `@/lib/supabase/server` - Database access

## Best Practices

1. **Isolate tests** - Each test should be independent
2. **Clear mocks** - Reset mocks between tests
3. **Test edge cases** - Test null, undefined, invalid inputs
4. **Test security** - Verify security checks are enforced
5. **Test error handling** - Verify errors are handled correctly
