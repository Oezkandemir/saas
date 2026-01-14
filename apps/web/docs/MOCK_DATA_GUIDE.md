# Mock Data Guide

This guide explains when and how to use mock data in the codebase.

## Overview

Mock data is used for:
- **Development**: Testing features without real API/data
- **Testing**: Unit tests, integration tests
- **Storybook**: Component stories and demos

**IMPORTANT**: Mock data should NEVER be used in production code paths.

## Location

All mock data lives in `/lib/mocks/`:

```
apps/web/lib/mocks/
├── subscriptions.ts    # Subscription/plan mock data
├── users.ts           # User mock data (if needed)
├── customers.ts       # Customer mock data (if needed)
└── index.ts          # Central export
```

## When to Use Mocks

### ✅ Use Mocks When:

1. **Development Environment**
   ```tsx
   if (process.env.NODE_ENV === "development") {
     const data = mockData;
   }
   ```

2. **Test Files**
   ```tsx
   // In *.test.ts or *.spec.ts
   import { mockUsers } from "@/lib/mocks";
   ```

3. **Storybook Stories**
   ```tsx
   // In *.stories.tsx
   import { mockCustomers } from "@/lib/mocks";
   ```

4. **Fallback Values** (development only)
   ```tsx
   const planId = env.PLAN_ID || mockPolarIds.pro.monthly;
   ```

### ❌ Don't Use Mocks When:

1. **Production Code**
   ```tsx
   // DON'T: Use mocks in production
   const planId = mockPolarIds.pro.monthly; // ❌
   ```

2. **API Routes** (unless testing)
   ```tsx
   // DON'T: Use mocks in API routes
   export async function GET() {
     return mockData; // ❌
   }
   ```

3. **Server Components** (unless development)
   ```tsx
   // DON'T: Use mocks in server components
   export async function ServerComponent() {
     const data = mockData; // ❌
   }
   ```

## Structure

### File Structure

Each mock file should:

1. **Export constants** with clear naming (`mock*`)
2. **Mark as MOCK DATA** in comments
3. **Use `as const`** for type safety
4. **Document purpose** in JSDoc

```tsx
/**
 * MOCK DATA - Development/Testing Only
 * 
 * This file contains hardcoded mock values for development and testing purposes.
 * These values should NEVER be used in production.
 */

export const mockPolarIds = {
  pro: {
    monthly: "77c6e131-56bc-46cf-8c5b-d8e6814a356b",
    yearly: "8bc98233-3a2c-46e5-ae90-c71ac7b4e22f",
  },
  enterprise: {
    monthly: "2a37d4e2-e513-4c3b-b463-9c79372a0e4f",
    yearly: "d05fc952-3c93-43cf-a8ac-9c2fea507e6c",
  },
} as const;
```

### Index File

The `index.ts` file re-exports all mocks:

```tsx
/**
 * MOCK DATA - Central Export
 * 
 * This module exports all mock data for development and testing.
 */

export * from "./subscriptions";
export * from "./users";
export * from "./customers";

// Re-export for convenience
export { mockPolarIds, mockSubscriptionPlans } from "./subscriptions";
```

## Usage Examples

### Example 1: Development Fallback

```tsx
import { env } from "@/env.mjs";
import { mockPolarIds } from "@/lib/mocks";

// In config file
export const pricingData = {
  polarIds: {
    monthly:
      env.NEXT_PUBLIC_POLAR_PRO_MONTHLY_PLAN_ID ||
      (process.env.NODE_ENV === "development"
        ? mockPolarIds.pro.monthly
        : null),
  },
};
```

### Example 2: Test File

```tsx
import { describe, it, expect } from "vitest";
import { mockSubscriptionPlans } from "@/lib/mocks";

describe("Subscription Plans", () => {
  it("should have valid mock data", () => {
    expect(mockSubscriptionPlans.pro.price).toBe(10);
  });
});
```

### Example 3: Storybook Story

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { mockCustomers } from "@/lib/mocks";
import { CustomerList } from "./customer-list";

const meta: Meta<typeof CustomerList> = {
  component: CustomerList,
};

export default meta;
type Story = StoryObj<typeof CustomerList>;

export const Default: Story = {
  args: {
    customers: mockCustomers,
  },
};
```

## Best Practices

### 1. Clear Naming

Always prefix mock data with `mock`:

```tsx
// ✅ Good
export const mockUsers = [...];
export const mockPolarIds = {...};

// ❌ Bad
export const users = [...]; // Unclear if mock or real
export const polarIds = {...};
```

### 2. Type Safety

Use `as const` for literal types:

```tsx
// ✅ Good
export const mockStatuses = ["active", "inactive"] as const;

// ❌ Bad
export const mockStatuses = ["active", "inactive"]; // Type: string[]
```

### 3. Documentation

Always document mock data:

```tsx
/**
 * MOCK DATA - Development/Testing Only
 * 
 * Mock user data for testing user-related components.
 * 
 * @example
 * ```tsx
 * import { mockUsers } from "@/lib/mocks";
 * const user = mockUsers[0];
 * ```
 */
export const mockUsers = [
  { id: "1", name: "John Doe", email: "john@example.com" },
] as const;
```

### 4. Environment Checks

Always check environment when using mocks:

```tsx
// ✅ Good
if (process.env.NODE_ENV === "development") {
  const data = mockData;
}

// ❌ Bad
const data = mockData; // Might run in production!
```

### 5. Realistic Data

Make mock data realistic:

```tsx
// ✅ Good
export const mockUsers = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@example.com",
    name: "John Doe",
    createdAt: "2024-01-01T00:00:00Z",
  },
];

// ❌ Bad
export const mockUsers = [
  { id: "1", name: "Test" }, // Missing fields, unrealistic IDs
];
```

## Creating New Mock Files

### Step 1: Create Mock File

```tsx
// apps/web/lib/mocks/users.ts

/**
 * MOCK DATA - Development/Testing Only
 */

export const mockUsers = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@example.com",
    name: "John Doe",
  },
] as const;
```

### Step 2: Export from Index

```tsx
// apps/web/lib/mocks/index.ts

export * from "./users";
export { mockUsers } from "./users";
```

### Step 3: Use in Code

```tsx
import { mockUsers } from "@/lib/mocks";

if (process.env.NODE_ENV === "development") {
  const users = mockUsers;
}
```

## ESLint Rules

The ESLint rule `no-hardcoded-values` allows hardcoded values in:
- `/lib/mocks/` directory
- `/config/` directory (with env fallback)
- Test files (`*.test.ts`, `*.spec.ts`)

Hardcoded values elsewhere will trigger warnings.

## Common Patterns

### Pattern 1: Environment-Based Fallback

```tsx
import { env } from "@/env.mjs";
import { mockPolarIds } from "@/lib/mocks";

const planId =
  env.NEXT_PUBLIC_POLAR_PRO_MONTHLY_PLAN_ID ||
  (process.env.NODE_ENV === "development"
    ? mockPolarIds.pro.monthly
    : null);
```

### Pattern 2: Test Helper

```tsx
// lib/mocks/test-helpers.ts
import { mockUsers } from "./users";

export function createMockUser(overrides?: Partial<User>): User {
  return {
    ...mockUsers[0],
    ...overrides,
  };
}
```

### Pattern 3: Mock Factory

```tsx
// lib/mocks/factories.ts
export function createMockUser(id: string, name: string) {
  return {
    id,
    name,
    email: `${name.toLowerCase()}@example.com`,
    createdAt: new Date().toISOString(),
  };
}
```

## Troubleshooting

### Mock Data Not Found

**Error**: `Cannot find module '@/lib/mocks'`

**Solution**: Ensure `index.ts` exports the mock:

```tsx
// lib/mocks/index.ts
export * from "./subscriptions";
```

### Mock Data Used in Production

**Error**: Mock data appears in production build

**Solution**: Always check environment:

```tsx
if (process.env.NODE_ENV === "development") {
  // Use mock
}
```

### Type Errors with Mock Data

**Error**: Type mismatch with mock data

**Solution**: Use proper types:

```tsx
import type { User } from "@/types";

export const mockUsers: User[] = [
  { id: "1", name: "John" },
];
```

## Summary

- ✅ Use mocks in development, tests, and Storybook
- ✅ Store mocks in `/lib/mocks/`
- ✅ Prefix with `mock*`
- ✅ Document with JSDoc
- ✅ Check environment before using
- ❌ Never use mocks in production
- ❌ Never use mocks in API routes
- ❌ Never use mocks in server components
