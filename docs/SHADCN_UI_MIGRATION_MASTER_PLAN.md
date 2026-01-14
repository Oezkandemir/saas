# 🎯 shadcn/ui Migration Master Plan

**Vollständige Migration von AlignUI zurück zu shadcn/ui (Latest Version)**

## 📋 Übersicht

Dieses Dokument beschreibt die komplette Migration aller UI-Komponenten von AlignUI zurück zu shadcn/ui, einschließlich der neuesten Features wie Email-Komponenten.

## 🎯 Warum zurück zu shadcn/ui?

- ✅ **Neueste Version**: Moderne, ständig aktualisierte Komponenten
- ✅ **Email-Komponenten**: Responsive Mail Client & Subscribe Blocks (2025)
- ✅ **Bewährte Lösung**: Große Community, umfangreiche Dokumentation
- ✅ **Copy/Paste Ansatz**: Vollständige Kontrolle über den Quellcode
- ✅ **Production-Ready**: Stabil, getestet, weit verbreitet
- ✅ **Modern & Slick**: Neueste Design-Updates und Best Practices

## 📊 Aktueller Status

### ✅ Bereits vorhanden (shadcn/ui Komponenten)
- 52 Komponenten im `components/ui/` Verzeichnis
- Vollständige shadcn/ui Setup-Konfiguration (`components.json`)
- Alle Radix UI Dependencies installiert

### 🔄 Zu migrieren (AlignUI → shadcn/ui)
- **38 AlignUI Komponenten** müssen zurück zu shadcn/ui migriert werden
- **~200+ Dateien** verwenden aktuell AlignUI Imports
- **5 Basis-Komponenten** bereits migriert (Button, Card, Input, Badge, Avatar)

## 🗺️ Migrationsstrategie

### Phase 1: Vorbereitung & Setup ✅

#### 1.1 shadcn/ui CLI Setup
- [ ] shadcn/ui CLI installieren/aktualisieren
- [ ] `components.json` auf neueste Version aktualisieren
- [ ] Neue Email-Komponenten installieren (Mail Client, Subscribe Blocks)

#### 1.2 Komponenten-Inventar
- [ ] Alle verwendeten AlignUI Komponenten auflisten
- [ ] Mapping-Tabelle erstellen (AlignUI → shadcn/ui)
- [ ] Abhängigkeiten identifizieren

#### 1.3 Dokumentation
- [ ] Migrationsplan dokumentieren ✅
- [ ] Rollback-Strategie definieren
- [ ] Testing-Plan erstellen

### Phase 2: Basis-Komponenten Migration 🔴 KRITISCH

**Priorität: HÖCHSTE** - Diese werden am häufigsten verwendet

#### 2.1 Button & Actions
- [ ] **Button** (`@/components/ui/button`)
  - AlignUI: `@/components/alignui/actions/button`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **LinkButton** → Button mit `asChild` oder `variant="link"`
  - AlignUI: `@/components/alignui/actions/link-button`
  - Aktion: Durch shadcn/ui Button ersetzen

- [ ] **CompactButton** → Button mit `size="sm"`
  - AlignUI: `@/components/alignui/actions/compact-button`
  - Aktion: Durch shadcn/ui Button ersetzen

#### 2.2 Data Display
- [ ] **Card** (`@/components/ui/card`)
  - AlignUI: `@/components/alignui/data-display/card`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **Avatar** (`@/components/ui/avatar`)
  - AlignUI: `@/components/alignui/data-display/avatar`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **Badge** (`@/components/ui/badge`)
  - AlignUI: `@/components/alignui/data-display/badge`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **Table** (`@/components/ui/table`)
  - AlignUI: `@/components/alignui/data-display/table`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **Skeleton** (`@/components/ui/skeleton`)
  - AlignUI: `@/components/alignui/data-display/skeleton`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **Separator** (`@/components/ui/separator`)
  - AlignUI: `@/components/alignui/data-display/separator`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **ScrollArea** (`@/components/ui/scroll-area`)
  - AlignUI: `@/components/alignui/data-display/scroll-area`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

#### 2.3 Forms
- [ ] **Input** (`@/components/ui/input`)
  - AlignUI: `@/components/alignui/forms/input`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **Label** (`@/components/ui/label`)
  - AlignUI: `@/components/alignui/forms/label`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **Textarea** (`@/components/ui/textarea`)
  - AlignUI: `@/components/alignui/forms/textarea`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **Select** (`@/components/ui/select`)
  - AlignUI: `@/components/alignui/forms/select`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **Checkbox** (`@/components/ui/checkbox`)
  - AlignUI: `@/components/alignui/forms/checkbox`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **Switch** (`@/components/ui/switch`)
  - AlignUI: `@/components/alignui/forms/switch`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **Form** (`@/components/ui/form`)
  - AlignUI: `@/components/alignui/forms/form`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

### Phase 3: Overlay-Komponenten Migration 🟠 HOCH

#### 3.1 Dialog & Modals
- [ ] **Dialog** (`@/components/ui/dialog`)
  - AlignUI: `@/components/alignui/overlays/dialog`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **AlertDialog** (`@/components/ui/alert-dialog`)
  - AlignUI: `@/components/alignui/overlays/alert-dialog`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **Drawer** (`@/components/ui/drawer`)
  - AlignUI: `@/components/alignui/overlays/drawer`
  - Status: ✅ shadcn/ui bereits vorhanden (Sheet)
  - Aktion: Prüfen ob Drawer oder Sheet verwendet werden soll

#### 3.2 Menus & Popovers
- [ ] **DropdownMenu** (`@/components/ui/dropdown-menu`)
  - AlignUI: `@/components/alignui/overlays/dropdown-menu`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **Popover** (`@/components/ui/popover`)
  - AlignUI: `@/components/alignui/overlays/popover`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **Command** (`@/components/ui/command`)
  - AlignUI: `@/components/alignui/overlays/command-menu`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **Tooltip** (`@/components/ui/tooltip`)
  - AlignUI: Nicht vorhanden (muss installiert werden)
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Komponente installieren falls benötigt

### Phase 4: Layout-Komponenten Migration 🟡 MITTEL

#### 4.1 Navigation & Tabs
- [ ] **Tabs** (`@/components/ui/tabs`)
  - AlignUI: `@/components/alignui/layout/tabs`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **Accordion** (`@/components/ui/accordion`)
  - AlignUI: `@/components/alignui/layout/accordion`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **Breadcrumb** (`@/components/ui/breadcrumb`)
  - AlignUI: Nicht vorhanden
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Komponente installieren falls benötigt

- [ ] **NavigationMenu** (`@/components/ui/navigation-menu`)
  - AlignUI: Nicht vorhanden
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Komponente installieren falls benötigt

### Phase 5: Feedback-Komponenten Migration 🟡 MITTEL

#### 5.1 Alerts & Toasts
- [ ] **Alert** (`@/components/ui/alert`)
  - AlignUI: `@/components/alignui/feedback/alert`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

- [ ] **Toast** (`@/components/ui/toast`)
  - AlignUI: Nicht vorhanden
  - Status: ✅ shadcn/ui bereits vorhanden (Sonner)
  - Aktion: Prüfen ob Sonner oder Toast verwendet wird

- [ ] **Sonner** (`@/components/ui/sonner`)
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Aktuell verwendet, beibehalten

#### 5.2 Progress
- [ ] **Progress** (`@/components/ui/progress`)
  - AlignUI: `@/components/alignui/feedback/progress-bar`
  - Status: ✅ shadcn/ui bereits vorhanden
  - Aktion: Imports aktualisieren

### Phase 6: Spezielle Komponenten Migration 🟢 NIEDRIG

#### 6.1 Custom AlignUI Komponenten
- [ ] **StatusBadge** → Badge mit custom Varianten
  - AlignUI: `@/components/alignui/data-display/status-badge`
  - Aktion: Durch shadcn/ui Badge mit custom Varianten ersetzen

- [ ] **Tag** → Badge oder custom Komponente
  - AlignUI: `@/components/alignui/data-display/tag`
  - Aktion: Durch shadcn/ui Badge ersetzen oder custom Komponente erstellen

- [ ] **FileFormatIcon** → Custom Komponente behalten
  - AlignUI: `@/components/alignui/data-display/file-format-icon`
  - Aktion: Behalten oder durch Lucide Icons ersetzen

- [ ] **Kbd** → Keyboard Komponente
  - AlignUI: `@/components/alignui/actions/kbd`
  - Aktion: shadcn/ui Kbd installieren oder custom behalten

- [ ] **Hint** → Form Description
  - AlignUI: `@/components/alignui/feedback/hint`
  - Aktion: Durch FormDescription ersetzen

- [ ] **Divider** → Separator
  - AlignUI: `@/components/alignui/layout/divider`
  - Aktion: Durch Separator ersetzen

### Phase 7: Neue shadcn/ui Features 🆕

#### 7.1 Email-Komponenten (2025)
- [ ] **Mail Client** - Responsive Mail Client Komponente
  - [ ] Inbox-Komponente installieren
  - [ ] Search-Funktionalität integrieren
  - [ ] Composer-Komponente integrieren
  - [ ] Inbound Email System aktualisieren

- [ ] **Subscribe Blocks** - Newsletter Subscription
  - [ ] Benefits List Block installieren
  - [ ] Incentive Center Aligned Block installieren
  - [ ] Newsletter Preview Block installieren
  - [ ] Social Proof Center Block installieren
  - [ ] Split Layout Block installieren
  - [ ] Newsletter-Formular aktualisieren

#### 7.2 Weitere neue Komponenten
- [ ] Prüfen welche neuen shadcn/ui Komponenten verfügbar sind
- [ ] Relevante Komponenten installieren
- [ ] Dokumentation aktualisieren

### Phase 8: Import-Migration 🔄

#### 8.1 Automatisierte Import-Updates
- [ ] Script erstellen für automatische Import-Ersetzung
- [ ] Mapping-Tabelle implementieren:
  ```typescript
  const importMappings = {
    '@/components/alignui/actions/button': '@/components/ui/button',
    '@/components/alignui/data-display/card': '@/components/ui/card',
    '@/components/alignui/forms/input': '@/components/ui/input',
    '@/components/alignui/data-display/badge': '@/components/ui/badge',
    '@/components/alignui/data-display/avatar': '@/components/ui/avatar',
    // ... weitere Mappings
  }
  ```

#### 8.2 Manuelle Anpassungen
- [ ] Komponenten-APIs prüfen (können sich unterscheiden)
- [ ] Props-Mappings anpassen
- [ ] Varianten-Namen aktualisieren
- [ ] Custom Wrapper-Komponenten anpassen

#### 8.3 Dateien aktualisieren
- [ ] Alle Dateien mit AlignUI Imports finden (~200+)
- [ ] Imports systematisch ersetzen
- [ ] TypeScript-Fehler beheben
- [ ] Linter-Fehler beheben

### Phase 9: Testing & Qualitätssicherung ✅

#### 9.1 Funktionalitätstests
- [ ] Alle Seiten manuell testen
- [ ] Formulare testen (Customer, Document, User, etc.)
- [ ] Modals und Dialogs testen
- [ ] Navigation testen
- [ ] Responsive Design testen

#### 9.2 Design-Tests
- [ ] Dark Mode testen
- [ ] Light Mode testen
- [ ] Alle Varianten testen
- [ ] Animationen testen
- [ ] Hover-States testen

#### 9.3 Browser-Tests
- [ ] Chrome/Edge testen
- [ ] Firefox testen
- [ ] Safari testen
- [ ] Mobile Browser testen

#### 9.4 Accessibility-Tests
- [ ] Keyboard-Navigation testen
- [ ] Screen Reader testen
- [ ] ARIA-Attribute prüfen
- [ ] Kontrast-Verhältnisse prüfen

#### 9.5 Performance-Tests
- [ ] Bundle-Größe prüfen
- [ ] Ladezeiten messen
- [ ] Render-Performance testen
- [ ] Memory-Leaks prüfen

### Phase 10: Cleanup 🧹

#### 10.1 AlignUI Komponenten entfernen
- [ ] `components/alignui/` Verzeichnis löschen
- [ ] AlignUI-spezifische Dependencies entfernen
- [ ] AlignUI Dokumentation entfernen

#### 10.2 Dependencies bereinigen
- [ ] Nicht mehr benötigte Packages entfernen
- [ ] `package.json` bereinigen
- [ ] `pnpm-lock.yaml` aktualisieren

#### 10.3 Dokumentation aktualisieren
- [ ] README aktualisieren
- [ ] Komponenten-Dokumentation aktualisieren
- [ ] Migration-Dokumentation archivieren
- [ ] TASK.md aktualisieren

### Phase 11: Mobile App Migration 📱

#### 11.1 Prüfung
- [ ] Prüfen ob Mobile App AlignUI verwendet
- [ ] Mobile-spezifische Komponenten identifizieren
- [ ] shadcn/ui React Native Kompatibilität prüfen

#### 11.2 Migration (falls nötig)
- [ ] Mobile Komponenten migrieren
- [ ] NativeWind Integration sicherstellen
- [ ] Mobile-spezifische Tests durchführen

## 📝 Import-Mapping Tabelle

| AlignUI Import | shadcn/ui Import | Status |
|----------------|------------------|--------|
| `@/components/alignui/actions/button` | `@/components/ui/button` | ✅ Vorhanden |
| `@/components/alignui/data-display/card` | `@/components/ui/card` | ✅ Vorhanden |
| `@/components/alignui/forms/input` | `@/components/ui/input` | ✅ Vorhanden |
| `@/components/alignui/data-display/badge` | `@/components/ui/badge` | ✅ Vorhanden |
| `@/components/alignui/data-display/avatar` | `@/components/ui/avatar` | ✅ Vorhanden |
| `@/components/alignui/forms/label` | `@/components/ui/label` | ✅ Vorhanden |
| `@/components/alignui/forms/textarea` | `@/components/ui/textarea` | ✅ Vorhanden |
| `@/components/alignui/forms/select` | `@/components/ui/select` | ✅ Vorhanden |
| `@/components/alignui/forms/checkbox` | `@/components/ui/checkbox` | ✅ Vorhanden |
| `@/components/alignui/forms/switch` | `@/components/ui/switch` | ✅ Vorhanden |
| `@/components/alignui/forms/form` | `@/components/ui/form` | ✅ Vorhanden |
| `@/components/alignui/overlays/dialog` | `@/components/ui/dialog` | ✅ Vorhanden |
| `@/components/alignui/overlays/alert-dialog` | `@/components/ui/alert-dialog` | ✅ Vorhanden |
| `@/components/alignui/overlays/drawer` | `@/components/ui/drawer` oder `sheet` | ✅ Vorhanden |
| `@/components/alignui/overlays/dropdown-menu` | `@/components/ui/dropdown-menu` | ✅ Vorhanden |
| `@/components/alignui/overlays/popover` | `@/components/ui/popover` | ✅ Vorhanden |
| `@/components/alignui/overlays/command-menu` | `@/components/ui/command` | ✅ Vorhanden |
| `@/components/alignui/layout/tabs` | `@/components/ui/tabs` | ✅ Vorhanden |
| `@/components/alignui/layout/accordion` | `@/components/ui/accordion` | ✅ Vorhanden |
| `@/components/alignui/feedback/alert` | `@/components/ui/alert` | ✅ Vorhanden |
| `@/components/alignui/feedback/progress-bar` | `@/components/ui/progress` | ✅ Vorhanden |
| `@/components/alignui/data-display/table` | `@/components/ui/table` | ✅ Vorhanden |
| `@/components/alignui/data-display/skeleton` | `@/components/ui/skeleton` | ✅ Vorhanden |
| `@/components/alignui/data-display/separator` | `@/components/ui/separator` | ✅ Vorhanden |
| `@/components/alignui/data-display/scroll-area` | `@/components/ui/scroll-area` | ✅ Vorhanden |

## 🚀 Ausführungsplan

### Woche 1: Setup & Basis-Komponenten
- **Tag 1-2**: Setup, Dokumentation, Inventar
- **Tag 3-5**: Basis-Komponenten Migration (Button, Card, Input, Badge, Avatar)
- **Tag 6-7**: Form-Komponenten Migration

### Woche 2: Overlays & Layout
- **Tag 1-3**: Overlay-Komponenten Migration
- **Tag 4-5**: Layout-Komponenten Migration
- **Tag 6-7**: Feedback-Komponenten Migration

### Woche 3: Import-Updates & Testing
- **Tag 1-3**: Automatisierte Import-Updates
- **Tag 4-5**: Manuelle Anpassungen
- **Tag 6-7**: Funktionalitäts-Tests

### Woche 4: Neue Features & Cleanup
- **Tag 1-3**: Email-Komponenten Integration
- **Tag 4-5**: Finale Tests & Bug-Fixes
- **Tag 6-7**: Cleanup & Dokumentation

## 📊 Erfolgs-Metriken

- ✅ **0 TypeScript-Fehler** nach Migration
- ✅ **0 Linter-Fehler** nach Migration
- ✅ **100% Funktionalität** erhalten
- ✅ **Alle Tests** bestehen
- ✅ **Bundle-Größe** gleich oder kleiner
- ✅ **Performance** gleich oder besser

## 🔄 Rollback-Strategie

Falls Probleme auftreten:
1. Git Branch für Migration erstellen
2. Schrittweise Migration (nicht alles auf einmal)
3. Nach jeder Phase committen
4. Bei kritischen Problemen: Branch zurücksetzen

## 📚 Ressourcen

- [shadcn/ui Dokumentation](https://ui.shadcn.com)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [shadcn/ui Email Components](https://ui.shadcn.com/docs/components/mail)
- [shadcn/ui Blocks](https://ui.shadcn.com/blocks)

## ✅ Checkliste

### Vorbereitung
- [ ] shadcn/ui CLI installiert/aktualisiert
- [ ] `components.json` aktualisiert
- [ ] Git Branch erstellt
- [ ] Backup erstellt

### Migration
- [ ] Phase 2: Basis-Komponenten ✅
- [ ] Phase 3: Overlay-Komponenten
- [ ] Phase 4: Layout-Komponenten
- [ ] Phase 5: Feedback-Komponenten
- [ ] Phase 6: Spezielle Komponenten
- [ ] Phase 7: Neue Features
- [ ] Phase 8: Import-Updates

### Testing
- [ ] Phase 9: Testing & QA

### Cleanup
- [ ] Phase 10: Cleanup
- [ ] Phase 11: Mobile App (falls nötig)

## 🎯 Nächste Schritte

1. **Sofort**: shadcn/ui CLI Setup & Email-Komponenten installieren
2. **Diese Woche**: Basis-Komponenten Migration starten
3. **Nächste Woche**: Overlays & Layout migrieren
4. **Danach**: Import-Updates & Testing

---

**Erstellt**: 2026-01-15  
**Status**: 🚧 IN PROGRESS  
**Verantwortlich**: Development Team
