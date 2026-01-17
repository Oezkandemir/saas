# Performance Monitoring Guide

## Overview

This document outlines performance monitoring strategies, including Lighthouse CI, performance budgets, and Real User Monitoring (RUM).

## Lighthouse CI

### Setup

Lighthouse CI is configured to run automatically on:
- Pull requests to main/develop
- Pushes to main
- Manual workflow dispatch

### Configuration

**File:** `.lighthouserc.js`

The configuration includes:
- Performance thresholds (min score: 0.9)
- Core Web Vitals targets
- Multiple URL testing
- Automatic artifact upload

### Running Locally

```bash
# Run Lighthouse CI locally
pnpm lighthouse

# Or with custom config
pnpm lighthouse:ci
```

### Performance Budgets

**File:** `apps/web/performance-budget.json`

Defines budgets for:
- **Timings**: FCP, LCP, TBT, CLS, SI, TTI
- **Resource Sizes**: Scripts, CSS, Images, Fonts
- **Resource Counts**: Number of resources per type

### CI Integration

The GitHub Actions workflow (`.github/workflows/lighthouse.yml`) automatically:
1. Builds the application
2. Starts the dev server
3. Runs Lighthouse on configured URLs
4. Uploads results as artifacts
5. Fails if thresholds are not met

## Performance Targets

### Core Web Vitals

| Metric | Target | Budget |
|--------|--------|--------|
| **FCP** (First Contentful Paint) | < 1.8s | 2000ms |
| **LCP** (Largest Contentful Paint) | < 2.5s | 2500ms |
| **TBT** (Total Blocking Time) | < 200ms | 200ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.1 |
| **SI** (Speed Index) | < 3.5s | 3500ms |
| **TTI** (Time to Interactive) | < 3.8s | 3800ms |

### Lighthouse Scores

| Category | Target | Minimum |
|----------|--------|---------|
| **Performance** | 90+ | 90 |
| **Accessibility** | 90+ | 90 |
| **Best Practices** | 90+ | 90 |
| **SEO** | 90+ | 90 |

### Resource Budgets

| Resource Type | Budget (KB) |
|---------------|-------------|
| **JavaScript** | 200 KB |
| **CSS** | 50 KB |
| **Images** | 500 KB |
| **Fonts** | 100 KB |
| **Total** | 500 KB |

## Real User Monitoring (RUM)

### Vercel Analytics

The project uses Vercel Analytics for RUM:

```tsx
import { Analytics } from "@vercel/analytics/react";

<Analytics />
```

**Metrics Tracked:**
- Page views
- Core Web Vitals
- User interactions
- Performance metrics

### Custom Performance Tracking

Custom performance tracking is implemented in `components/performance-tracker.tsx`:

- Tracks Core Web Vitals
- Logs performance metrics
- Sends data to analytics

## Monitoring Workflow

### 1. Pre-Commit Checks

Before committing:
```bash
# Run Lighthouse locally
pnpm lighthouse

# Check bundle size
pnpm analyze:bundle

# Check CSS size
pnpm analyze:css
```

### 2. CI/CD Pipeline

The CI pipeline automatically:
- Runs Lighthouse on all PRs
- Fails if budgets are exceeded
- Uploads reports as artifacts

### 3. Production Monitoring

In production:
- Vercel Analytics tracks RUM
- Performance metrics are logged
- Alerts for performance regressions

## Performance Budget Enforcement

### Automatic Enforcement

Lighthouse CI automatically enforces budgets:
- Fails builds if thresholds are exceeded
- Provides detailed reports
- Suggests optimizations

### Manual Review

Review performance budgets:
1. Check Lighthouse CI reports
2. Review bundle analyzer output
3. Monitor Vercel Analytics dashboard
4. Address regressions immediately

## Troubleshooting

### Lighthouse CI Failing

**Problem**: Lighthouse CI fails on PRs.

**Solutions**:
1. Check Lighthouse report in CI artifacts
2. Identify which metric failed
3. Optimize the failing metric
4. Update budget if target is unrealistic

### Performance Regression

**Problem**: Performance metrics degraded.

**Solutions**:
1. Compare current vs previous Lighthouse reports
2. Check bundle size changes
3. Review recent code changes
4. Optimize largest resources first

### Budget Exceeded

**Problem**: Resource budget exceeded.

**Solutions**:
1. Analyze bundle with `pnpm analyze:bundle`
2. Remove unused dependencies
3. Implement code splitting
4. Optimize images
5. Use dynamic imports

## Best Practices

### 1. Regular Monitoring

- Run Lighthouse weekly
- Review performance budgets monthly
- Monitor RUM metrics daily

### 2. Performance Budgets

- Set realistic budgets
- Review and adjust quarterly
- Consider user experience over strict numbers

### 3. Optimization Priority

1. **Core Web Vitals** - Most important for SEO
2. **Bundle Size** - Affects load time
3. **Resource Count** - Affects network requests
4. **Third-party Scripts** - Can block rendering

### 4. CI Integration

- Always run Lighthouse in CI
- Fail builds on regressions
- Keep budgets up to date

## Resources

- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Web Vitals](https://web.dev/vitals/)
- [Performance Budgets](https://web.dev/performance-budgets-101/)
- [Vercel Analytics](https://vercel.com/analytics)
