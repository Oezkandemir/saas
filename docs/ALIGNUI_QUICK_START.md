# AlignUI Pro - Quick Start Guide

## 🚀 Schnellstart

### 1. AlignUI Pro Account einrichten

**WICHTIG**: Es wird **KEIN API Key** benötigt! AlignUI Pro ist ein Copy/Paste-System.

1. Besuche [pro.alignui.com/sign-in](https://pro.alignui.com/sign-in)
2. Melde dich mit der E-Mail-Adresse an, die beim Kauf verwendet wurde
3. Klicke auf "Send Magic Link"
4. Öffne den Magic Link aus deiner E-Mail

**Für Kollegen vor Ort**: Siehe `docs/ALIGNUI_PRO_SETUP.md` für Details, was genau benötigt wird.

### 2. Erste Komponente migrieren (Button empfohlen)

#### Schritt 1: Komponente kopieren
1. Gehe zu [pro.alignui.com](https://pro.alignui.com)
2. Navigiere zu "Actions" → "Button"
3. Kopiere den vollständigen Quellcode

#### Schritt 2: Komponente einfügen
```bash
# Erstelle die Datei
touch apps/web/components/alignui/actions/button.tsx
```

Füge den kopierten Code ein und passe die Imports an:
- Ändere relative Imports zu `@/lib/utils`
- Stelle sicher, dass alle Dependencies vorhanden sind

#### Schritt 3: Export hinzufügen
Öffne `apps/web/components/alignui/index.ts` und füge hinzu:
```typescript
export { Button } from './actions/button';
```

#### Schritt 4: Imports aktualisieren
```bash
# Finde alle Verwendungen
./scripts/migrate-to-alignui.sh find button

# Ersetze in allen Dateien:
# Von: import { Button } from '@/components/ui/button'
# Zu:  import { Button } from '@/components/alignui/actions/button'
```

#### Schritt 5: Testen
```bash
# Starte den Dev-Server
pnpm dev

# Prüfe die Button-Komponente auf allen Seiten
```

### 3. Weitere Komponenten migrieren

Wiederhole den Prozess für alle Komponenten. Empfohlene Reihenfolge:

1. **Basis-Komponenten** (am häufigsten verwendet)
   - Button ✅
   - Card
   - Input
   - Badge
   - Avatar

2. **Form-Komponenten**
   - Select
   - Checkbox
   - Radio
   - Switch
   - Textarea

3. **Overlay-Komponenten**
   - Dialog
   - Popover
   - Dropdown

4. **Layout-Komponenten**
   - Tabs
   - Accordion

5. **Feedback-Komponenten**
   - Toast
   - Alert

6. **Data-Display**
   - Table
   - DataTable

## 📋 Nützliche Befehle

### Komponenten-Status prüfen
```bash
./scripts/migrate-to-alignui.sh check
```

### Verwendungen finden
```bash
./scripts/migrate-to-alignui.sh find button
```

### Alle Komponenten auflisten
```bash
./scripts/migrate-to-alignui.sh list
```

## 📁 Projektstruktur

```
apps/web/components/
├── alignui/              # ✨ Neue AlignUI Komponenten
│   ├── actions/
│   ├── forms/
│   ├── overlays/
│   ├── layout/
│   ├── feedback/
│   ├── data-display/
│   └── navigation/
└── ui/                   # ⚠️ Alte shadcn/ui Komponenten (werden entfernt)
```

## ⚠️ Wichtige Hinweise

### Imports aktualisieren
Nach jeder Migration müssen alle Imports aktualisiert werden:
- **Alt**: `@/components/ui/[komponente]`
- **Neu**: `@/components/alignui/[kategorie]/[komponente]`

### Testing
Teste jede Komponente gründlich:
- ✅ Visuell korrekt
- ✅ Dark Mode funktioniert
- ✅ Responsive Design
- ✅ Alle Props funktionieren
- ✅ Keine Console-Errors

### Schrittweise Migration
- Migriere nicht alles auf einmal
- Teste nach jeder Komponente
- Nutze Git-Branches für jede Phase

## 🔗 Nützliche Links

- [AlignUI Pro Dashboard](https://pro.alignui.com)
- [AlignUI Dokumentation](https://alignui.com/docs/v1.2/introduction)
- [Migrations-Guide](./ALIGNUI_MIGRATION.md)
- [Komponenten-README](../apps/web/components/alignui/README.md)

## 📞 Support

Bei Fragen oder Problemen:
- AlignUI Support: email@alignui.com
- Projekt-Dokumentation: `docs/ALIGNUI_MIGRATION.md`

## ✅ Checkliste für jede Komponente

Verwende das [Migrations-Template](../apps/web/components/alignui/MIGRATION_TEMPLATE.md) für jede Komponente:

- [ ] Komponente von AlignUI kopiert
- [ ] In Projekt eingefügt
- [ ] Imports angepasst
- [ ] Export hinzugefügt
- [ ] Alle Verwendungen aktualisiert
- [ ] Getestet
- [ ] Dokumentiert

## 🎯 Nächste Schritte

1. ✅ Setup abgeschlossen
2. ⏭️ AlignUI Pro Account einrichten
3. ⏭️ Erste Komponente migrieren (Button)
4. ⏭️ Schrittweise alle Komponenten migrieren
5. ⏭️ Tests durchführen
6. ⏭️ Cleanup (alte Komponenten entfernen)

Viel Erfolg bei der Migration! 🚀

