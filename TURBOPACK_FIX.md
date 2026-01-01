# Turbopack EBADF Error Fix

Wenn Sie den "spawn EBADF" Fehler erhalten, versuchen Sie folgende Schritte:

## Schnelle Lösung

1. **Cache löschen:**
   ```bash
   pnpm clean:cache
   rm -rf apps/web/.next
   rm -rf .turbo
   ```

2. **Ohne Turbopack starten:**
   ```bash
   cd apps/web
   pnpm dev  # statt pnpm turbo oder --turbo Flag
   ```

## Detaillierte Lösung

### 1. Alle Caches löschen
```bash
# Im Root-Verzeichnis
pnpm clean:cache
rm -rf apps/web/.next
rm -rf apps/web/node_modules/.cache
rm -rf .turbo
```

### 2. Node Modules neu installieren (falls nötig)
```bash
rm -rf node_modules
rm -rf apps/web/node_modules
pnpm install
```

### 3. Ohne Turbopack entwickeln
Turbopack ist noch experimentell und kann manchmal Probleme verursachen. Verwenden Sie den Standard Next.js Dev Server:

```bash
cd apps/web
pnpm dev  # Standard Next.js Dev Server
```

Oder im Root:
```bash
pnpm dev:web  # Startet ohne --turbo Flag
```

### 4. File Watcher Limits erhöhen (macOS/Linux)
Wenn Sie viele Dateien haben, kann das File Watcher Limit überschritten werden:

```bash
# macOS
echo "kern.maxfiles=65536" | sudo tee -a /etc/sysctl.conf
echo "kern.maxfilesperproc=65536" | sudo tee -a /etc/sysctl.conf
sudo sysctl -w kern.maxfiles=65536
sudo sysctl -w kern.maxfilesperproc=65536
```

### 5. Ports prüfen
Stellen Sie sicher, dass Port 3000 nicht von einem anderen Prozess verwendet wird:

```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 6. Node Version prüfen
Stellen Sie sicher, dass Sie Node.js 18+ verwenden:

```bash
node --version
# Sollte 18.x.x oder höher sein
```

## Alternative: Turbopack deaktivieren

Falls das Problem weiterhin besteht, können Sie Turbopack in der `package.json` deaktivieren:

```json
{
  "scripts": {
    "dev": "next dev",  // Entfernen Sie --turbo Flag
    "turbo": "next dev --turbo"  // Optional: separater Befehl
  }
}
```

## Weitere Hilfe

- [Next.js Troubleshooting](https://nextjs.org/docs/app/building-your-application/troubleshooting)
- [Turbopack Issues](https://github.com/vercel/next.js/issues?q=is%3Aissue+EBADF)


