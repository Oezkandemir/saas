# Code Quality Rules

This document outlines the strict code quality rules enforced across the codebase.

## Table of Contents

- [UI Components](#ui-components)
- [No Hardcoded Values](#no-hardcoded-values)
- [Performance Requirements](#performance-requirements)
- [Type Safety & Validation](#type-safety--validation)
- [Component Quality](#component-quality)

## UI Components

### Rule: shadcn/ui Only

**STRICT**: Only use shadcn/ui components. Never create custom primitives that exist in shadcn.

#### ✅ Correct

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter text" />
      <Button>Submit</Button>
    </Card>
  );
}
```

#### ❌ Incorrect

```tsx
// DON'T: Create custom Button when shadcn Button exists
import { Button } from "@/components/custom/button";

// DON'T: Import from AlignUI
import { Button } from "@/components/alignui/actions/button";
```

### Banned: AlignUI/AliGUI

**STRICT**: AlignUI imports are completely banned. Any import containing `alignui`, `AliGUI`, or `aligui` will be caught by ESLint.

## No Hardcoded Values

### Rule: Use Environment Variables or Config

**STRICT**: No hardcoded URLs, tokens, IDs, or data values in components. Use:
- Environment variables (`env.mjs`)
- Config files (`/config/`)
- Mock data (`/lib/mocks/`) - **development/testing only**

#### ✅ Correct

```tsx
import { env } from "@/env.mjs";

const apiUrl = env.NEXT_PUBLIC_API_URL;
const planId = env.NEXT_PUBLIC_POLAR_PRO_MONTHLY_PLAN_ID;
```

```tsx
// In /lib/mocks/subscriptions.ts (development only)
export const mockPolarIds = {
  pro: { monthly: "77c6e131-..." }, // MOCK DATA
};
```

#### ❌ Incorrect

```tsx
// DON'T: Hardcoded URLs
const apiUrl = "https://api.example.com/v1";

// DON'T: Hardcoded tokens
const apiKey = "sk_live_abc123...";

// DON'T: Hardcoded IDs
const planId = "77c6e131-56bc-46cf-8c5b-d8e6814a356b";
```

### Allowed Locations for Hardcoded Values

Hardcoded values are ONLY allowed in:

1. **`/lib/mocks/`** - Mock data for development/testing
2. **`/config/`** - Configuration files (with fallback to env)
3. **Test files** (`*.test.ts`, `*.spec.ts`)
4. **ESLint rules** (`eslint-rules/`)

## Performance Requirements

### Rule: Smooth Performance

**REQUIRED**: All components must be performant with:
- No unnecessary re-renders
- No heavy render work
- Virtualization for large lists (>50 items)
- Loading skeletons for async data
- No layout shift

#### ✅ Correct

```tsx
import { useMemo, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function DataList({ items }: { items: Item[] }) {
  // Memoize expensive computations
  const processedItems = useMemo(
    () => items.map(processItem),
    [items]
  );

  // Use virtualization for large lists
  if (items.length > 50) {
    return <VirtualizedList items={processedItems} />;
  }

  return <SimpleList items={processedItems} />;
}

export function AsyncData() {
  const { data, isLoading } = useQuery();

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />; // Loading skeleton
  }

  return <DataDisplay data={data} />;
}
```

#### ❌ Incorrect

```tsx
// DON'T: Heavy computation in render
export function BadComponent({ items }: { items: Item[] }) {
  // This runs on every render!
  const expensive = items.map(heavyProcessing);
  return <List items={expensive} />;
}

// DON'T: Missing loading state
export function BadAsync() {
  const { data } = useQuery(); // No loading check!
  return <DataDisplay data={data} />; // Crashes if data is undefined
}

// DON'T: Large list without virtualization
export function BadList({ items }: { items: Item[] }) {
  // 1000 items without virtualization = lag
  return items.map(item => <Item key={item.id} data={item} />);
}
```

### Performance Checklist

- [ ] Use `React.memo` for expensive components
- [ ] Use `useMemo` for expensive computations
- [ ] Use `useCallback` for event handlers passed to children
- [ ] Virtualize lists with >50 items
- [ ] Show loading skeletons for async data
- [ ] Handle empty states
- [ ] Handle error states
- [ ] Avoid layout shift

## Type Safety & Validation

### Rule: Zero TypeScript Errors

**STRICT**: Zero TypeScript/ESLint errors or warnings allowed.

### Rule: Zod Validation

**REQUIRED**: All data must be validated with Zod schemas:
- API route inputs
- Form inputs
- External API responses
- Database queries

#### ✅ Correct

```tsx
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export function MyForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
  });
  // ...
}
```

```tsx
// API route
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const validated = createUserSchema.parse(body); // Validates & throws if invalid
  // ...
}
```

#### ❌ Incorrect

```tsx
// DON'T: No validation
export function BadForm() {
  const [email, setEmail] = useState("");
  // No validation!
  return <input value={email} onChange={e => setEmail(e.target.value)} />;
}

// DON'T: Any types
function processData(data: any) {
  // No type safety!
  return data.value;
}
```

### TypeScript Strict Settings

The project uses strict TypeScript settings:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitAny: true`
- `strictNullChecks: true`

Always handle `undefined` when accessing arrays/objects:

```tsx
// ✅ Correct
const item = items[0];
if (item) {
  // Use item
}

// ❌ Incorrect
const item = items[0];
item.value; // Error: item might be undefined
```

## Component Quality

### Rule: Complete State Handling

**REQUIRED**: All components must handle:
- Loading states (skeletons)
- Error states (error boundaries)
- Empty states (empty placeholders)

#### ✅ Correct

```tsx
export function DataComponent() {
  const { data, isLoading, error } = useQuery();

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorDisplay error={error} />;
  if (!data || data.length === 0) return <EmptyState />;

  return <DataDisplay data={data} />;
}
```

### Rule: Error Boundaries

**REQUIRED**: Use error boundaries for async components:

```tsx
import { ErrorBoundary } from "@/components/error-boundary";

export function Page() {
  return (
    <ErrorBoundary>
      <AsyncComponent />
    </ErrorBoundary>
  );
}
```

## Validation Scripts

Run these commands to validate code quality:

```bash
# Lint with zero warnings
pnpm lint:strict

# Type check with strict settings
pnpm type-check:strict

# Run all validations
pnpm validate
```

## Pre-commit Hooks

Pre-commit hooks automatically run:
- ESLint (`lint:strict`)
- TypeScript type checking (`type-check:strict`)
- Prettier format check (`format:check`)

All checks must pass before committing.

## CI/CD

The CI pipeline enforces:
- Zero ESLint warnings
- Zero TypeScript errors
- All tests passing
- Format validation

PRs with violations will be blocked.

## Examples

### Complete Example: Form Component

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@/env.mjs";

const formSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name required"),
});

type FormValues = z.infer<typeof formSchema>;

export function UserForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormValues) => {
    // Use env variable, not hardcoded URL
    const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/users`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    // ...
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register("email")} />
      <Input {...form.register("name")} />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

## Questions?

If you're unsure about a rule, check:
1. This documentation
2. Existing codebase examples
3. ESLint error messages
4. TypeScript error messages
