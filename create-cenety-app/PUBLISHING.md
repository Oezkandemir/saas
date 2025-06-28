# 📦 Publishing Guide für create-cenety-app

## 🚀 Schritt-für-Schritt Anleitung

### 1. NPM Account erstellen
```bash
# Registriere dich auf npmjs.com
# Dann login im Terminal:
npm login
```

### 2. Package Name prüfen
```bash
# Prüfe ob der Name verfügbar ist:
npm view create-cenety-app
# Sollte "404 Not Found" zeigen wenn verfügbar
```

### 3. Package.json anpassen
Bearbeite `package.json` und ändere:
- `author.name` - Dein Name
- `author.email` - Deine Email
- `author.url` - Deine Website/GitHub
- `repository.url` - Dein GitHub Repository
- `bugs.url` - Issues URL
- `homepage` - Homepage URL

### 4. Templates bauen
```bash
npm run build
```

### 5. Package testen
```bash
# Teste lokal:
node bin/create-cenety-app.js test-project --skip-install

# Teste mit npm pack:
npm pack
npm install -g create-cenety-app-1.0.0.tgz
create-cenety-app test-project2
```

### 6. Veröffentlichen
```bash
# Erste Veröffentlichung:
npm publish

# Updates:
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
npm publish
```

## 🔧 Wichtige Befehle

```bash
# Package Info anzeigen
npm view create-cenety-app

# Alle Versionen anzeigen
npm view create-cenety-app versions --json

# Package löschen (nur innerhalb 72h)
npm unpublish create-cenety-app@1.0.0

# Package deprecaten
npm deprecate create-cenety-app@1.0.0 "Use version 1.0.1 instead"
```

## 📋 Checklist vor Publishing

- [ ] `package.json` Author Info aktualisiert
- [ ] `README.md` GitHub URLs aktualisiert  
- [ ] `npm run build` erfolgreich
- [ ] CLI lokal getestet
- [ ] `npm login` durchgeführt
- [ ] Package Name verfügbar geprüft

## 🎯 Nach dem Publishing

1. **GitHub Repository erstellen** und Code pushen
2. **README.md** mit korrekten Links aktualisieren
3. **GitHub Releases** für Versioning nutzen
4. **NPM Badge** zum README hinzufügen:
   ```markdown
   [![npm version](https://badge.fury.io/js/create-cenety-app.svg)](https://badge.fury.io/js/create-cenety-app)
   ```

## 🔄 Updates

Für Updates:
1. Code ändern
2. `npm run build` 
3. `npm version patch/minor/major`
4. `npm publish`
5. GitHub Release erstellen

## 🆘 Troubleshooting

**"Package name already exists"**
- Wähle einen anderen Namen in `package.json`

**"You must be logged in"**
- `npm login` ausführen

**"Templates not found"**
- `npm run build` ausführen

**"Permission denied"**
- Prüfe ob du Owner des Packages bist 