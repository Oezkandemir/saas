# AlignUI Pro - UI Optimierungsplan

## 📊 Aktueller Status

### ✅ Bereits migriert (5 Komponenten)
- Button ✅
- Card ✅
- Input ✅
- Badge ✅
- Avatar ✅

### 🔴 Phase 1: Kritische Komponenten (SOFORT benötigt)
Diese Komponenten werden am häufigsten verwendet und sollten zuerst migriert werden:

#### 1. **Dialog** (`overlays/dialog.tsx`)
- **Verwendungen**: ~15 Dateien
- **Priorität**: 🔴 HÖCHSTE
- **Verwendet in**: Document forms, Customer dialogs, Modals, PDF previews
- **Kategorie**: Overlays → Dialog

#### 2. **Select** (`forms/select.tsx`)
- **Verwendungen**: ~12 Dateien
- **Priorität**: 🔴 HÖCHSTE
- **Verwendet in**: Language switcher, Customer selector, Settings, Forms
- **Kategorie**: Forms → Select

#### 3. **Dropdown Menu** (`overlays/dropdown-menu.tsx`)
- **Verwendungen**: ~10 Dateien
- **Priorität**: 🔴 HÖCHSTE
- **Verwendet in**: Document actions, Customer actions, User menus
- **Kategorie**: Overlays → Dropdown Menu

#### 4. **Tabs** (`layout/tabs.tsx`)
- **Verwendungen**: ~8 Dateien
- **Priorität**: 🔴 HÖCHSTE
- **Verwendet in**: Dashboard, Admin pages, Profile, Settings
- **Kategorie**: Layout → Tabs

#### 5. **Form** (`forms/form.tsx`)
- **Verwendungen**: ~10 Dateien
- **Priorität**: 🔴 HÖCHSTE
- **Verwendet in**: Alle Formulare (Customer, Document, User, etc.)
- **Kategorie**: Forms → Form

#### 6. **Textarea** (`forms/textarea.tsx`)
- **Verwendungen**: ~8 Dateien
- **Priorität**: 🟠 HOCH
- **Verwendet in**: Document forms, Email dialogs, Customer forms
- **Kategorie**: Forms → Textarea

#### 7. **Label** (`forms/label.tsx`)
- **Verwendungen**: ~10 Dateien
- **Priorität**: 🟠 HOCH
- **Verwendet in**: Alle Formulare
- **Kategorie**: Forms → Label

#### 8. **Alert Dialog** (`overlays/alert-dialog.tsx`)
- **Verwendungen**: ~6 Dateien
- **Priorität**: 🟠 HOCH
- **Verwendet in**: Delete confirmations, Account deletion, System errors
- **Kategorie**: Overlays → Alert Dialog

#### 9. **Table** (`data-display/table.tsx`)
- **Verwendungen**: ~12 Dateien
- **Priorität**: 🟠 HOCH
- **Verwendet in**: Customers table, Documents table, Admin tables, Analytics
- **Kategorie**: Data Display → Table

#### 10. **Switch** (`forms/switch.tsx`)
- **Verwendungen**: ~5 Dateien
- **Priorität**: 🟡 MITTEL
- **Verwendet in**: Settings, Preferences, Cookie consent
- **Kategorie**: Forms → Switch

### 🟡 Phase 2: Wichtige Komponenten

#### 11. **Checkbox** (`forms/checkbox.tsx`)
- **Verwendungen**: ~4 Dateien
- **Kategorie**: Forms → Checkbox

#### 12. **Popover** (`overlays/popover.tsx`)
- **Verwendungen**: ~3 Dateien
- **Kategorie**: Overlays → Popover

#### 13. **Separator** (`data-display/separator.tsx`)
- **Verwendungen**: ~5 Dateien
- **Kategorie**: Data Display → Separator

#### 14. **Toast** (`feedback/toast.tsx`) + **useToast** Hook
- **Verwendungen**: ~10 Dateien
- **Kategorie**: Feedback → Toast

#### 15. **Accordion** (`layout/accordion.tsx`)
- **Verwendungen**: ~2 Dateien
- **Kategorie**: Layout → Accordion

#### 16. **Drawer** (`overlays/drawer.tsx`)
- **Verwendungen**: ~2 Dateien
- **Kategorie**: Overlays → Drawer

#### 17. **Alert** (`feedback/alert.tsx`)
- **Verwendungen**: ~3 Dateien
- **Kategorie**: Feedback → Alert

#### 18. **Progress** (`feedback/progress-bar.tsx`)
- **Verwendungen**: ~1 Datei
- **Kategorie**: Feedback → Progress Bar

#### 19. **Skeleton** (`data-display/skeleton.tsx`)
- **Verwendungen**: ~2 Dateien
- **Kategorie**: Data Display → Skeleton

### 🟢 Phase 3: Zusätzliche Komponenten

#### 20. **Scroll Area** (`data-display/scroll-area.tsx`)
- **Verwendungen**: ~1 Datei
- **Kategorie**: Data Display → Scroll Area

#### 21. **Toggle Group** (`forms/toggle-group.tsx`)
- **Verwendungen**: ~1 Datei
- **Kategorie**: Forms → Toggle Group

#### 22. **Collapsible** (`layout/collapsible.tsx`)
- **Verwendungen**: ~1 Datei
- **Kategorie**: Layout → Collapsible

## 🎯 Migrations-Reihenfolge (Empfohlen)

### Woche 1: Kritische Komponenten
1. Dialog
2. Select
3. Dropdown Menu
4. Tabs
5. Form

### Woche 2: Form-Komponenten
6. Textarea
7. Label
8. Switch
9. Checkbox

### Woche 3: Overlay & Feedback
10. Alert Dialog
11. Popover
12. Toast + useToast
13. Alert

### Woche 4: Data Display & Layout
14. Table
15. Separator
16. Accordion
17. Drawer
18. Skeleton
19. Progress

## 📋 Was wird benötigt?

### Für jede Komponente:
1. **Vollständiger TypeScript/React Code** von AlignUI Pro
2. **Alle Varianten** (falls vorhanden)
3. **Zugehörige Hooks** (z.B. useToast für Toast)
4. **Dependencies-Liste** (falls spezielle Packages benötigt werden)

### Format für Code-Übergabe:
```
=== [Komponenten-Name] ===
Kategorie: [Kategorie]
Pfad: apps/web/components/alignui/[kategorie]/[komponente].tsx

[Vollständiger Code hier]
```

## 🚀 Nächste Schritte

1. **Starte mit Phase 1** - Die 10 kritischsten Komponenten
2. **Kopiere Code** von AlignUI Pro Dashboard
3. **Ich integriere** die Komponenten ins Projekt
4. **Ich aktualisiere** alle Imports automatisch
5. **Wir testen** zusammen

## 📊 Erwartete Verbesserungen

Nach Migration aller Komponenten:
- ✅ Konsistentes Design-System
- ✅ Bessere Performance
- ✅ Modernere UI-Komponenten
- ✅ Einfachere Wartung
- ✅ Vollständige Kontrolle über Code

## 🔗 Links

- [AlignUI Pro Dashboard](https://pro.alignui.com)
- [Migrations-Guide](./ALIGNUI_MIGRATION.md)
- [Komponenten-README](../apps/web/components/alignui/README.md)







