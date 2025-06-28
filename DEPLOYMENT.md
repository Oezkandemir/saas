# Deployment Setup - Monorepo to Vercel

## Vercel Project Configuration

### 1. Project Settings in Vercel Dashboard

Gehen Sie zu Ihren **Vercel Project Settings** und konfigurieren Sie:

#### Build & Development Settings:
- **Framework Preset**: `Next.js`
- **Root Directory**: `.` (Root des Monorepos) 
- **Build Command**: Wird automatisch aus `apps/web/vercel.json` gelesen
- **Install Command**: Wird automatisch aus `apps/web/vercel.json` gelesen
- **Development Command**: Wird automatisch aus `apps/web/vercel.json` gelesen

**Wichtig**: Die `vercel.json` Datei befindet sich jetzt in `apps/web/vercel.json` mit folgender Konfiguration:
```json
{
  "buildCommand": "cd ../.. && turbo run build --filter=@cenety/web",
  "devCommand": "cd ../.. && turbo run dev --filter=@cenety/web",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile"
}
```

#### Environment Variables:
Stellen Sie sicher, dass alle Environment Variables aus `apps/web/.env.example` in Vercel konfiguriert sind.

### 2. Node.js Version
- **Node.js Version**: `18.x` (in Vercel Settings)

### 3. Package Manager
- **Package Manager**: `pnpm` (wird automatisch erkannt durch `packageManager` in package.json)

## Automatisches Deployment

Mit dieser Konfiguration wird bei jedem Commit:
- Nur die `@cenety/web` App gebaut und deployed
- Die anderen Apps (mobile, landing) werden ignoriert
- Turbo's Caching wird genutzt für schnellere Builds

## Troubleshooting

### Registry Errors
Falls npm registry Fehler auftreten:
1. Prüfen Sie die Netzwerkverbindung
2. Warten Sie und pushen Sie erneut
3. Überprüfen Sie, ob alle Dependencies in `apps/web/package.json` korrekt sind

### Build Errors
1. Lokal testen: `pnpm run build --filter=@cenety/web`
2. Dependencies prüfen: `pnpm install`
3. TypeScript Errors beheben

### Deployment nur bei Web-App Änderungen (Optional)
Um nur bei Änderungen an der Web-App zu deployen, können Sie in Vercel Settings die **Ignored Build Step** konfigurieren:
```bash
git diff HEAD^ HEAD --quiet apps/web/
```

## Befehle

```bash
# Lokal entwickeln (nur Web-App)
pnpm run dev:web

# Lokal builden (nur Web-App)  
turbo run build --filter=@cenety/web

# Alle Apps entwickeln
pnpm run dev

# Dependencies installieren
pnpm install
``` 