# AlignUI Pro Migration Guide

## Übersicht

Dieses Dokument beschreibt die Migration der gesamten Plattform von shadcn/ui (Radix UI) zu AlignUI Pro Komponenten.

## Warum AlignUI Pro?

- **Copy/Paste Ansatz**: Vollständige Kontrolle über den Quellcode
- **Keine Dependency Lock-in**: Komponenten sind Teil des Projekts
- **Hochgradig anpassbar**: Direkter Zugriff auf Styles und Verhalten
- **Production-Ready**: Komponenten sind sofort einsatzbereit
- **Moderne Design-Sprache**: Professionelle, moderne UI-Komponenten

## Migrationsstrategie

### Phase 1: Vorbereitung & Setup ✅
- [x] Migrationsplan erstellen
- [x] Dokumentation erstellen
- [ ] AlignUI Pro Account-Zugriff einrichten
- [ ] Komponenten-Struktur erstellen

### Phase 2: Basis-Komponenten Migration
- [ ] Button
- [ ] Card
- [ ] Input
- [ ] Badge
- [ ] Avatar
- [ ] Label

### Phase 3: Form-Komponenten
- [ ] Form
- [ ] Select
- [ ] Checkbox
- [ ] Radio Group
- [ ] Switch
- [ ] Textarea
- [ ] Datepicker
- [ ] File Upload

### Phase 4: Overlay-Komponenten
- [ ] Dialog/Modal
- [ ] Popover
- [ ] Dropdown Menu
- [ ] Command Menu
- [ ] Drawer
- [ ] Tooltip

### Phase 5: Layout-Komponenten
- [ ] Tabs
- [ ] Accordion
- [ ] Breadcrumb
- [ ] Segmented Control
- [ ] Navigation Menu

### Phase 6: Feedback-Komponenten
- [ ] Toast
- [ ] Alert
- [ ] Notification
- [ ] Progress Bar
- [ ] Progress Circle

### Phase 7: Data-Display-Komponenten
- [ ] Table
- [ ] Data Table
- [ ] Avatar Group
- [ ] Status Badge
- [ ] Tag
- [ ] Rating

### Phase 8: Navigation-Komponenten
- [ ] Pagination
- [ ] Stepper (Horizontal/Vertical)
- [ ] Dot Stepper

### Phase 9: Mobile App Migration
- [ ] Prüfen ob AlignUI React Native Komponenten verfügbar sind
- [ ] Mobile-spezifische Komponenten migrieren
- [ ] NativeWind Integration sicherstellen

### Phase 10: Cleanup
- [ ] Alte shadcn/ui Komponenten entfernen
- [ ] Nicht mehr benötigte Radix UI Dependencies entfernen
- [ ] Imports aktualisieren
- [ ] Tests aktualisieren

## Komponenten-Struktur

```
apps/web/
├── components/
│   ├── alignui/              # Neue AlignUI Komponenten
│   │   ├── actions/
│   │   │   ├── button.tsx
│   │   │   ├── button-group.tsx
│   │   │   └── link-button.tsx
│   │   ├── forms/
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── checkbox.tsx
│   │   │   └── ...
│   │   ├── overlays/
│   │   │   ├── dialog.tsx
│   │   │   ├── popover.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── tabs.tsx
│   │   │   ├── accordion.tsx
│   │   │   └── ...
│   │   └── feedback/
│   │       ├── toast.tsx
│   │       ├── alert.tsx
│   │       └── ...
│   └── ui/                   # Alte shadcn/ui Komponenten (werden entfernt)
```

## Migrations-Schritte für jede Komponente

### 1. Komponente von AlignUI Pro kopieren
- Besuche [pro.alignui.com](https://pro.alignui.com)
- Navigiere zur gewünschten Komponente
- Kopiere den vollständigen Quellcode

### 2. Komponente in Projekt einfügen
- Erstelle Datei in `apps/web/components/alignui/[kategorie]/[komponente].tsx`
- Füge den Code ein
- Passe Imports an (z.B. `@/lib/utils` statt relative Pfade)

### 3. Export in Index-Datei hinzufügen
- Erstelle/aktualisiere `apps/web/components/alignui/index.ts`
- Exportiere die Komponente

### 4. Imports aktualisieren
- Finde alle Verwendungen der alten Komponente
- Ersetze Import von `@/components/ui/[komponente]` zu `@/components/alignui/[kategorie]/[komponente]`
- Teste die Funktionalität

### 5. Alte Komponente entfernen
- Nach erfolgreicher Migration: Entferne alte Komponente aus `components/ui/`
- Entferne nicht mehr benötigte Dependencies

## Wichtige Hinweise

### Tailwind CSS Konfiguration
- AlignUI verwendet Tailwind CSS
- Stelle sicher, dass alle benötigten Tailwind-Klassen verfügbar sind
- Prüfe `tailwind.config.ts` auf benötigte Plugins

### TypeScript Typen
- Alle AlignUI Komponenten sollten TypeScript-Typen haben
- Prüfe auf fehlende Typen und ergänze sie bei Bedarf

### Styling-Anpassungen
- AlignUI Komponenten können direkt angepasst werden
- Nutze CSS-Variablen für Theme-Unterstützung
- Stelle sicher, dass Dark Mode funktioniert

### Testing
- Teste jede migrierte Komponente gründlich
- Prüfe auf visuelle Unterschiede
- Stelle sicher, dass alle Props funktionieren

## Bekannte Unterschiede zwischen shadcn/ui und AlignUI

### API-Unterschiede
- Einige Props-Namen können unterschiedlich sein
- Event-Handler können sich unterscheiden
- Prüfe die AlignUI Dokumentation für Details

### Styling-Unterschiede
- AlignUI hat möglicherweise andere Standard-Styles
- Farben und Spacing können variieren
- Passe bei Bedarf an das bestehende Design an

## Rollback-Plan

Falls Probleme auftreten:
1. Alte Komponenten bleiben in `components/ui/` bis Migration abgeschlossen
2. Git-Branches für jede Migrations-Phase
3. Schrittweise Migration (nicht alles auf einmal)

## Nützliche Links

- [AlignUI Pro Dashboard](https://pro.alignui.com)
- [AlignUI Dokumentation](https://alignui.com/docs/v1.2/introduction)
- [AlignUI Support](mailto:email@alignui.com)

## Fortschritt Tracking

Siehe `TASK.md` für detaillierte Aufgabenliste und Fortschritt.

