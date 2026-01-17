# Deployment Setup - Nur Next.js Web App

## Einfache Vercel Konfiguration

### 1. Vercel Project Settings

Gehe zu deinem **Vercel Project Dashboard** → **Settings** → **General**:

#### Build & Development Settings:
- **Framework Preset**: `Next.js` ✅
- **Root Directory**: `apps/web` ⭐ **WICHTIG!**
- **Build Command**: `npm run build` (Standard)
- **Output Directory**: `.next` (Standard)
- **Install Command**: `npm install` (Standard)
- **Development Command**: `npm run dev` (Standard)

#### Node.js Version:
- **Node.js Version**: `18.x`

### 2. Das wars! 🎉

Mit **Root Directory: apps/web** weiß Vercel:
- ✅ Wo sich die Next.js App befindet
- ✅ Welche package.json zu verwenden ist
- ✅ Dass nur die Web App deployed werden soll
- ✅ Mobile/Landing Apps werden ignoriert

### 3. Environment Variables

Füge deine Environment Variables hinzu:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Warum diese Lösung?

- ✅ **Einfach**: Keine komplizierte vercel.json
- ✅ **Zuverlässig**: Vercel weiß genau wo Next.js ist
- ✅ **Nur Web App**: Mobile/Expo Apps werden nicht deployed
- ✅ **Standard Next.js**: Nutzt normale Next.js Build-Prozesse

## Testing

Lokal testen:
```bash
cd apps/web
npm run build
```

## Mobile Apps

- iOS/Android Apps werden später über Expo/App Stores deployed
- Vercel deployed nur die Web App
- Alle Apps können im selben Repo bleiben 