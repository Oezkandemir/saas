# CSS Optimization Guide

## Overview

This document outlines strategies for optimizing CSS bundle size in the Next.js application.

## Current Setup

### Tailwind CSS

The project uses Tailwind CSS with optimized configuration:

- **Content Paths**: Scans all relevant directories for class usage
- **PurgeCSS**: Automatically removes unused classes in production
- **Safelist**: Preserves dynamic classes that might be missed

### Critical CSS

Next.js automatically inlines critical CSS for above-the-fold content. This is handled by the framework and doesn't require manual configuration.

## Optimization Strategies

### 1. Tailwind PurgeCSS

Tailwind automatically purges unused CSS in production builds. The `content` configuration in `tailwind.config.ts` determines which files are scanned:

```typescript
content: [
  "./app/**/*.{ts,tsx,js,jsx}",
  "./components/**/*.{ts,tsx,js,jsx}",
  "./ui/**/*.{ts,tsx,js,jsx}",
  "./content/**/*.{md,mdx}",
  "./actions/**/*.{ts,tsx}",
  "./lib/**/*.{ts,tsx}",
  "./hooks/**/*.{ts,tsx}",
]
```

**Best Practices:**
- Include all directories that contain Tailwind classes
- Exclude build directories (`!./.next/**/*`)
- Use safelist for dynamic classes

### 2. Safelist Configuration

Dynamic classes that aren't detected by PurgeCSS should be added to the safelist:

```typescript
safelist: [
  {
    pattern: /^(border-subtle|shadow-subtle|transition-subtle)/,
  },
]
```

### 3. CSS Analysis

Run CSS analysis to identify optimization opportunities:

```bash
pnpm analyze:css
```

This will:
- Show CSS bundle sizes
- Identify files that are too large
- Provide optimization recommendations

### 4. Custom Utilities

Custom Tailwind utilities are defined in the config. Review these periodically:

```typescript
addUtilities({
  ".border-subtle": { /* ... */ },
  ".shadow-subtle": { /* ... */ },
  // ...
})
```

**Recommendation**: Only add utilities that are used frequently. For one-off styles, use inline styles or CSS modules.

## Performance Budgets

Target CSS sizes:
- **Total CSS**: < 50 KB (gzipped)
- **Critical CSS**: < 15 KB (inlined)
- **Non-critical CSS**: < 35 KB (loaded async)

## Monitoring

### Regular Checks

1. **After Major Changes**: Run `pnpm analyze:css`
2. **Before Release**: Verify CSS size is within budget
3. **Quarterly**: Review safelist and custom utilities

### CI Integration

Consider adding CSS size checks to CI:

```yaml
- name: Check CSS size
  run: |
    pnpm build
    pnpm analyze:css
```

## Common Issues & Solutions

### Large CSS Bundle

**Problem**: CSS bundle exceeds target size.

**Solutions**:
1. Review Tailwind safelist - remove unused patterns
2. Check for duplicate custom utilities
3. Use CSS modules for component-specific styles
4. Consider CSS-in-JS for dynamic styles

### Unused Classes

**Problem**: Classes are being purged that should be kept.

**Solutions**:
1. Add classes to safelist
2. Ensure content paths include all relevant files
3. Use explicit class names instead of string concatenation

### Dynamic Classes Not Working

**Problem**: Dynamic classes are being purged.

**Solutions**:
1. Add pattern to safelist
2. Use complete class names (e.g., `text-red-500` instead of `text-${color}-500`)
3. Consider using CSS variables for dynamic values

## Best Practices

1. **Use Tailwind Utilities First**
   ```tsx
   // ✅ Good - uses Tailwind utilities
   <div className="flex items-center gap-4 p-6">
   
   // ❌ Bad - custom CSS for common patterns
   <div className="custom-flex-container">
   ```

2. **Minimize Custom Utilities**
   ```typescript
   // ✅ Good - only for frequently used patterns
   ".shadow-subtle": { /* ... */ }
   
   // ❌ Bad - one-off styles as utilities
   ".specific-component-style": { /* ... */ }
   ```

3. **Use CSS Modules for Component Styles**
   ```tsx
   // ✅ Good - component-specific styles
   import styles from "./component.module.css";
   <div className={styles.container}>
   ```

4. **Avoid Inline Styles for Repeated Patterns**
   ```tsx
   // ❌ Bad - repeated inline styles
   <div style={{ padding: "1rem", margin: "1rem" }}>
   
   // ✅ Good - use Tailwind utilities
   <div className="p-4 m-4">
   ```

## Resources

- [Tailwind CSS Optimization](https://tailwindcss.com/docs/optimizing-for-production)
- [Next.js CSS Optimization](https://nextjs.org/docs/app/building-your-application/styling/css-modules)
- [Critical CSS Guide](https://web.dev/extract-critical-css/)
