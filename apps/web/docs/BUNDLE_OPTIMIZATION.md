# Bundle Size Optimization Guide

## Overview

This document outlines strategies and tools for optimizing bundle size in the Next.js application.

## Tools & Scripts

### Bundle Analyzer

The project uses `@next/bundle-analyzer` to visualize bundle composition.

**Usage:**
```bash
# Analyze full bundle
pnpm analyze

# Analyze server bundle only
pnpm analyze:server

# Analyze browser bundle only
pnpm analyze:browser

# Run full analysis script
pnpm analyze:bundle
```

The analyzer will open a browser window showing:
- Bundle size breakdown
- Largest dependencies
- Code splitting opportunities
- Duplicate dependencies

### Dependency Checking

Check for unused dependencies:
```bash
pnpm check:deps
```

This helps identify dependencies that can be removed to reduce bundle size.

## Optimization Strategies

### 1. Dynamic Imports

Heavy components should use dynamic imports with SSR disabled:

```typescript
const HeavyComponent = dynamic(() => import("./heavy-component"), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});
```

**Already Optimized:**
- Analytics components
- PDF components
- Data tables
- Modal providers
- Toast notifications

### 2. Route-based Code Splitting

Next.js automatically splits code by route. Ensure:
- Large pages use dynamic imports for heavy components
- Shared components are in the `components` directory
- Route-specific code is in route directories

### 3. Tree Shaking

The project uses `optimizePackageImports` in `next.config.js` for:
- Radix UI components
- Lucide icons
- Supabase client
- Date-fns
- Chart libraries

### 4. Webpack Chunk Splitting

Optimized chunk splitting strategy:
- Framework chunk (React, Next.js) - priority 40
- UI libraries chunk (Radix UI, Lucide) - priority 30
- Supabase chunk - priority 25
- Vendor chunk - priority 20
- Common chunk - priority 10

## Performance Budgets

Target bundle sizes:
- **Initial JS**: < 200 KB (gzipped)
- **Total JS**: < 500 KB (gzipped)
- **CSS**: < 50 KB (gzipped)
- **Images**: Optimized with Next.js Image component

## Monitoring

### Regular Checks

1. **Weekly**: Run `pnpm analyze:bundle` after major changes
2. **Before Release**: Check bundle sizes against budgets
3. **After Dependency Updates**: Verify no unexpected size increases

### CI Integration

Consider adding bundle size checks to CI:
```yaml
- name: Check bundle size
  run: |
    pnpm build
    pnpm analyze:bundle
```

## Common Issues & Solutions

### Large Dependencies

**Problem**: A dependency adds significant size to the bundle.

**Solutions**:
1. Check if the dependency can be replaced with a lighter alternative
2. Use dynamic imports for features that aren't immediately needed
3. Consider using CDN for large libraries (e.g., Chart.js)

### Duplicate Dependencies

**Problem**: Multiple versions of the same dependency.

**Solutions**:
1. Use `pnpm why <package>` to identify duplicates
2. Update dependencies to use the same version
3. Use `pnpm overrides` in `package.json` to force a version

### Unused Code

**Problem**: Code that's imported but never used.

**Solutions**:
1. Run `pnpm check:deps` to find unused dependencies
2. Use TypeScript's `unusedLocals` and `unusedParameters` options
3. Remove unused imports manually or with ESLint

## Best Practices

1. **Import Only What You Need**
   ```typescript
   // ❌ Bad
   import * as Icons from "lucide-react";
   
   // ✅ Good
   import { Check, X } from "lucide-react";
   ```

2. **Use Barrel Exports Sparingly**
   ```typescript
   // ❌ Bad - imports entire barrel
   import { Button, Input, Card } from "@/components";
   
   // ✅ Good - direct imports
   import { Button } from "@/components/ui/button";
   ```

3. **Lazy Load Heavy Features**
   ```typescript
   // ✅ Good - lazy load charts
   const Chart = dynamic(() => import("./chart"), { ssr: false });
   ```

4. **Optimize Images**
   - Use Next.js Image component
   - Provide proper `sizes` attribute
   - Use `priority` only for above-the-fold images

## Resources

- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Next.js Code Splitting](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [Tree Shaking Guide](https://webpack.js.org/guides/tree-shaking/)
