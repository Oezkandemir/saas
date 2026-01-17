# Admin App Vercel Deployment Guide

Die Admin-App ist jetzt als separate Anwendung im Monorepo konfiguriert und kann separat auf Vercel deployed werden.

## Vercel Setup

### 1. Neues Projekt in Vercel erstellen

1. Gehe zu [Vercel Dashboard](https://vercel.com/dashboard)
2. Klicke auf "Add New Project"
3. Wähle das GitHub Repository aus
4. **Wichtig**: Konfiguriere das Projekt für die Admin-App:
   - **Root Directory**: `apps/admin` ⭐ **WICHTIG!**
   - **Framework Preset**: Other (oder Vite)
   - **Build Command**: `pnpm turbo run build --filter=@cenety/admin`
   - **Output Directory**: `dist` (relativ zum Root Directory)
   - **Install Command**: `pnpm install`
   
   **Hinweis**: Wenn das Root Directory auf `apps/admin` gesetzt ist, ist das Output Directory relativ dazu, also nur `dist`, nicht `apps/admin/dist`.

### 2. Environment Variables

Stelle sicher, dass folgende Environment Variables gesetzt sind:

- `VITE_SUPABASE_URL` - Supabase Project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase Anon Key
- `VITE_APP_URL` - URL der **Web-App** (Next.js App, z.B. `https://yourdomain.com` oder `https://app.yourdomain.com`)
  - **Wichtig**: Dies ist NICHT die Admin-App URL, sondern die URL der Hauptanwendung!
  - Wird verwendet, um Nicht-Admin-Benutzer zur Web-App umzuleiten

### 3. Vercel Configuration

Die `vercel.json` Datei ist bereits konfiguriert mit:
- Build Command für Turbo
- Output Directory (`dist` - relativ zum Root Directory)
- SPA Rewrites (alle Routes → `/index.html`)
- Security Headers

### 4. Deployment

Nach dem Setup wird Vercel automatisch deployen bei jedem Push zum `main` Branch, wenn Änderungen in `apps/admin` oder `packages` gemacht werden (siehe `ignoreCommand` in `vercel.json`).

## Monorepo Setup

Das Projekt nutzt:
- **pnpm** als Package Manager
- **Turbo** für Builds
- **Vite** als Build Tool für die Admin-App

Die Root `vercel.json` ist für die Web-App (`apps/web`) konfiguriert.
Die Admin-App hat ihre eigene `apps/admin/vercel.json` für separates Deployment.

## Lokale Entwicklung

```bash
# Admin-App starten
pnpm dev:admin

# Oder direkt im Admin-Verzeichnis
cd apps/admin
pnpm dev
```

Die Admin-App läuft standardmäßig auf `http://localhost:3001`.
