# Vercel Deployment Guide - Monorepo

This project is set up as a Turborepo monorepo with multiple applications. Follow these steps to deploy the web application to Vercel.

## 📋 Prerequisites

- Vercel account
- GitHub/GitLab repository connected to Vercel
- Environment variables configured in Vercel dashboard

## 🚀 Deployment Setup

### 1. Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Vercel will automatically detect the monorepo structure

### 2. Configure Project Settings

#### Root Directory
- **Root Directory**: Leave empty (root of repository)
- Vercel will use the root `vercel.json` for configuration

#### Build & Development Settings
- **Framework Preset**: Other (will auto-detect Next.js)
- **Build Command**: `pnpm turbo run build --filter=@cenety/web`
- **Output Directory**: `apps/web/.next`
- **Install Command**: `pnpm install`

These settings are already configured in `vercel.json`, so you can use "Override" toggle if needed.

### 3. Environment Variables

Add the following environment variables in Vercel Dashboard:

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`

**Stripe:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_API_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Email (Resend):**
- `RESEND_API_KEY`
- `EMAIL_FROM`

**Other:**
- `NODE_ENV=production`
- `NEXT_TELEMETRY_DISABLED=1`

### 4. Deploy

Click "Deploy" and Vercel will:
1. Install dependencies using `pnpm install`
2. Run Turbo build filtered for web app: `turbo run build --filter=@cenety/web`
3. Deploy the built Next.js application from `apps/web/.next`

## 🔧 Configuration Files

### Root `vercel.json`
Located at project root, defines:
- Build command using Turbo
- Install command
- Output directory
- Ignore command for incremental builds
- Build environment variables

### App `vercel.json`
Located at `apps/web/vercel.json`, defines:
- Security headers
- Cache headers
- Function configurations
- Redirects and rewrites

### `.vercelignore`
Excludes unnecessary files from deployment:
- Mobile app (`apps/mobile`)
- Landing page (`apps/landing`)
- Template packages
- Development and test files

## 📦 Monorepo Structure

```
.
├── apps/
│   ├── web/          # Next.js SaaS App (DEPLOYED)
│   ├── landing/      # Marketing site (separate deployment)
│   └── mobile/       # React Native app (not deployed to Vercel)
├── packages/
│   ├── config/       # Shared configs
│   ├── ui/           # Shared UI components
│   └── reusables/    # Shared utilities
└── vercel.json       # Root Vercel configuration
```

## 🎯 Turbo Build Process

When deploying, Turbo will:

1. **Install dependencies** across the monorepo
2. **Build packages** that web app depends on:
   - `@cenety/config`
   - `@cenety/ui`
   - `@cenety/reusables`
3. **Build web app** with all dependencies resolved
4. **Output** to `apps/web/.next` directory

## 🔄 Incremental Builds

The `ignoreCommand` in `vercel.json` enables incremental builds:

```json
"ignoreCommand": "git diff --quiet HEAD^ HEAD ./apps/web ./packages"
```

Vercel will only build if:
- Changes detected in `apps/web/`
- Changes detected in `packages/` (shared dependencies)

## 🐛 Troubleshooting

### Build Fails with "No such file or directory"

**Problem**: Build command tries to `cd` into a directory that doesn't exist.

**Solution**: Use Turbo filter instead:
```bash
pnpm turbo run build --filter=@cenety/web
```

### Dependencies Not Found

**Problem**: Workspace dependencies not installed.

**Solution**: Ensure `pnpm install` runs at root level, not in subdirectory.

### Build Runs for Unchanged Code

**Problem**: Every commit triggers a build even without changes.

**Solution**: Check `ignoreCommand` is properly configured in `vercel.json`.

### Out of Memory Error

**Problem**: Build runs out of memory during Next.js compilation.

**Solution**: Increase Node memory in build env:
```json
{
  "build": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=4096"
    }
  }
}
```

## 📚 Additional Resources

- [Vercel Monorepo Documentation](https://vercel.com/docs/monorepos)
- [Turborepo with Vercel](https://turbo.build/repo/docs/handbook/deploying-with-docker#vercel)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## ✅ Deployment Checklist

- [ ] Repository connected to Vercel
- [ ] All environment variables configured
- [ ] Root directory set correctly (empty/root)
- [ ] Build command uses Turbo filter
- [ ] Output directory points to `apps/web/.next`
- [ ] Ignore command configured for incremental builds
- [ ] Security headers configured
- [ ] Test deployment successful

---

**Note**: For deploying the landing page or other apps, create separate Vercel projects with appropriate filters:
- Landing: `pnpm turbo run build --filter=@cenety/landing`
- Each app should have its own Vercel project

