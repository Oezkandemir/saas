# 🚀 shadcn/ui Migration - Quick Start Guide

## Übersicht

Dieser Guide hilft dir, die Migration von AlignUI zurück zu shadcn/ui schnell zu starten.

## ⚡ Schnellstart (5 Minuten)

### 1. shadcn/ui CLI Setup

```bash
# Stelle sicher, dass du im Web-App Verzeichnis bist
cd apps/web

# Installiere/aktualisiere shadcn/ui CLI
npx shadcn@latest init

# Prüfe ob components.json korrekt ist
cat components.json
```

### 2. Neue Email-Komponenten installieren

```bash
# Mail Client Komponenten
npx shadcn@latest add mail

# Falls einzelne Komponenten benötigt werden:
# npx shadcn@latest add [component-name]
```

### 3. Git Branch erstellen

```bash
# Erstelle einen neuen Branch für die Migration
git checkout -b migration/shadcn-ui

# Committe aktuelle Änderungen
git add .
git commit -m "chore: Start shadcn/ui migration"
```

### 4. Migration Script ausführen (Dry Run)

```bash
# Teste die Migration ohne Änderungen
node scripts/migrate-to-shadcn-imports.js --dry-run --path=apps/web
```

### 5. Migration durchführen

```bash
# Führe die Migration durch
node scripts/migrate-to-shadcn-imports.js --path=apps/web
```

### 6. TypeScript & Linter prüfen

```bash
# TypeScript-Fehler prüfen
cd apps/web
pnpm type-check

# Linter-Fehler prüfen
pnpm lint
```

## 📋 Schritt-für-Schritt Anleitung

### Phase 1: Basis-Komponenten (Tag 1-2)

1. **Button Migration**
   ```bash
   # Button ist bereits vorhanden, nur Imports aktualisieren
   # Script macht das automatisch
   ```

2. **Card Migration**
   ```bash
   # Card ist bereits vorhanden
   # Prüfe ob alle Card-Varianten funktionieren
   ```

3. **Form-Komponenten**
   ```bash
   # Input, Label, Textarea, Select, Checkbox, Switch, Form
   # Alle bereits vorhanden, nur Imports aktualisieren
   ```

### Phase 2: Overlay-Komponenten (Tag 3-4)

1. **Dialog & AlertDialog**
   ```bash
   # Beide bereits vorhanden
   # Prüfe ob alle Dialog-Varianten funktionieren
   ```

2. **Drawer Migration**
   ```bash
   # Prüfe ob Drawer oder Sheet verwendet werden soll
   # shadcn/ui hat Sheet, nicht Drawer
   # Falls Drawer benötigt: vaul installieren
   ```

3. **Menus & Popovers**
   ```bash
   # DropdownMenu, Popover, Command
   # Alle bereits vorhanden
   ```

### Phase 3: Layout-Komponenten (Tag 5)

1. **Tabs & Accordion**
   ```bash
   # Beide bereits vorhanden
   ```

### Phase 4: Import-Updates (Tag 6-7)

1. **Automatisierte Migration**
   ```bash
   # Script ausführen
   node scripts/migrate-to-shadcn-imports.js --path=apps/web
   ```

2. **Manuelle Anpassungen**
   - Prüfe Komponenten-APIs
   - Passe Props an (z.B. `variant`, `size`)
   - Prüfe Named Imports

3. **Spezielle Fälle**
   - `LinkButton` → `Button` mit `variant="link"`
   - `CompactButton` → `Button` mit `size="sm"`
   - `StatusBadge` → `Badge` mit custom Varianten
   - `Tag` → `Badge`
   - `Divider` → `Separator`
   - `ProgressBar` → `Progress`
   - `Hint` → `FormDescription`

### Phase 5: Neue Email-Komponenten (Tag 8-9)

1. **Mail Client installieren**
   ```bash
   npx shadcn@latest add mail
   ```

2. **Subscribe Blocks installieren**
   ```bash
   # Prüfe welche Blocks benötigt werden
   # Installiere einzeln oder alle
   ```

3. **Integration**
   - Inbound Email System aktualisieren
   - Newsletter-Formular aktualisieren

### Phase 6: Testing (Tag 10-12)

1. **Funktionalitätstests**
   ```bash
   # Starte Dev-Server
   pnpm dev:web
   
   # Teste alle Seiten manuell
   ```

2. **TypeScript & Linter**
   ```bash
   pnpm type-check
   pnpm lint
   ```

3. **Build-Test**
   ```bash
   pnpm build --filter=@cenety/web
   ```

### Phase 7: Cleanup (Tag 13-14)

1. **AlignUI Komponenten entfernen**
   ```bash
   # Lösche alignui Verzeichnis
   rm -rf apps/web/components/alignui
   ```

2. **Dependencies bereinigen**
   ```bash
   # Prüfe package.json
   # Entferne nicht mehr benötigte Packages
   ```

3. **Dokumentation aktualisieren**
   - README aktualisieren
   - TASK.md aktualisieren

## 🔧 Häufige Probleme & Lösungen

### Problem: TypeScript-Fehler nach Migration

**Lösung:**
```bash
# Prüfe die Fehler
pnpm type-check

# Häufige Ursachen:
# 1. Named Imports müssen angepasst werden
# 2. Props-Namen haben sich geändert
# 3. Komponenten-APIs sind unterschiedlich
```

### Problem: Drawer funktioniert nicht

**Lösung:**
```bash
# shadcn/ui hat Sheet, nicht Drawer
# Option 1: Sheet verwenden
npx shadcn@latest add sheet

# Option 2: vaul für Drawer verwenden
pnpm add vaul
```

### Problem: Komponenten-Varianten fehlen

**Lösung:**
```bash
# Prüfe ob Varianten in der Komponente definiert sind
# Falls nicht: Füge sie hinzu oder verwende className
```

### Problem: Import-Mappings funktionieren nicht

**Lösung:**
```bash
# Prüfe die Mapping-Tabelle im Script
# Füge fehlende Mappings hinzu
# Führe Script erneut aus
```

## 📊 Fortschritt verfolgen

### Checkliste

- [ ] shadcn/ui CLI Setup
- [ ] Email-Komponenten installiert
- [ ] Git Branch erstellt
- [ ] Basis-Komponenten migriert
- [ ] Overlay-Komponenten migriert
- [ ] Layout-Komponenten migriert
- [ ] Import-Updates durchgeführt
- [ ] Email-Komponenten integriert
- [ ] Tests durchgeführt
- [ ] Cleanup abgeschlossen

### Statistiken

```bash
# Anzahl Dateien mit AlignUI Imports
grep -r "@/components/alignui" apps/web --include="*.tsx" --include="*.ts" | wc -l

# Anzahl Dateien mit shadcn/ui Imports
grep -r "@/components/ui" apps/web --include="*.tsx" --include="*.ts" | wc -l
```

## 🎯 Nächste Schritte

1. **Sofort**: shadcn/ui CLI Setup & Email-Komponenten installieren
2. **Heute**: Basis-Komponenten Migration starten
3. **Diese Woche**: Alle Komponenten migrieren
4. **Nächste Woche**: Testing & Cleanup

## 📚 Weitere Ressourcen

- [Master Plan](./SHADCN_UI_MIGRATION_MASTER_PLAN.md) - Vollständiger Migrationsplan
- [shadcn/ui Dokumentation](https://ui.shadcn.com)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [shadcn/ui Email Components](https://ui.shadcn.com/docs/components/mail)

## 💡 Tipps

1. **Schrittweise Migration**: Migriere nicht alles auf einmal
2. **Git Commits**: Committe nach jeder Phase
3. **Testing**: Teste nach jeder Migration-Phase
4. **Dokumentation**: Dokumentiere Änderungen
5. **Rollback**: Halte Rollback-Strategie bereit

## 🆘 Hilfe benötigt?

- Prüfe den [Master Plan](./SHADCN_UI_MIGRATION_MASTER_PLAN.md)
- Schaue in die [shadcn/ui Dokumentation](https://ui.shadcn.com)
- Prüfe die [Import-Mapping-Tabelle](./SHADCN_UI_MIGRATION_MASTER_PLAN.md#import-mapping-tabelle)

---

**Viel Erfolg bei der Migration! 🚀**
