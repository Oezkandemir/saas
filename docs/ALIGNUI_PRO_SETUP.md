# AlignUI Pro - Was wird benötigt?

## ❌ Kein API Key nötig!

AlignUI Pro funktioniert **NICHT** wie eine normale API oder npm-Package. Es ist ein **Copy/Paste-System** - das bedeutet:

- ✅ **Kein API Key**
- ✅ **Keine Installation über npm**
- ✅ **Keine Authentifizierung im Code**
- ✅ **Einfach Code kopieren und einfügen**

## ✅ Was wird benötigt?

### 1. Zugriff auf AlignUI Pro Dashboard
- Login auf [pro.alignui.com](https://pro.alignui.com)
- E-Mail-Adresse, die beim Kauf verwendet wurde
- Magic Link zum Einloggen

### 2. Komponenten-Quellcode kopieren
Der Kollege muss für jede Komponente:
1. Auf [pro.alignui.com](https://pro.alignui.com) einloggen
2. Zur gewünschten Komponente navigieren (z.B. "Actions" → "Button")
3. Den **vollständigen Quellcode** kopieren
4. Den Code an uns weitergeben

## 📋 Checkliste für deinen Kollegen

### Schritt 1: Login
- [ ] Auf [pro.alignui.com/sign-in](https://pro.alignui.com/sign-in) gehen
- [ ] E-Mail-Adresse eingeben (die beim Kauf verwendet wurde)
- [ ] Magic Link anfordern
- [ ] Magic Link öffnen und einloggen

### Schritt 2: Komponenten finden
- [ ] Dashboard öffnen
- [ ] Zu "Components" oder "Blocks" navigieren
- [ ] Verfügbare Komponenten-Kategorien prüfen:
  - Actions (Button, ButtonGroup, etc.)
  - Forms (Input, Select, Checkbox, etc.)
  - Overlays (Dialog, Popover, etc.)
  - Layout (Tabs, Accordion, etc.)
  - Feedback (Toast, Alert, etc.)
  - Data Display (Table, Avatar, Badge, etc.)

### Schritt 3: Code kopieren
Für jede Komponente:
- [ ] Komponente öffnen
- [ ] Code-Tab oder "Copy Code" Button finden
- [ ] **Vollständigen TypeScript/React Code** kopieren
- [ ] Code in eine Datei speichern oder direkt weitergeben

## 🎯 Prioritätenliste - Welche Komponenten zuerst?

### Phase 1: Basis-Komponenten (WICHTIGST!)
Diese werden am häufigsten verwendet:

1. **Button** (`actions/button.tsx`)
   - Wird überall verwendet
   - Höchste Priorität

2. **Card** (`data-display/card.tsx`)
   - Wird auf fast jeder Seite verwendet
   - Sehr wichtig

3. **Input** (`forms/input.tsx`)
   - Für alle Formulare benötigt
   - Sehr wichtig

4. **Badge** (`data-display/badge.tsx`)
   - Für Status-Anzeigen
   - Wichtig

5. **Avatar** (`data-display/avatar.tsx`)
   - Für User-Profile
   - Wichtig

### Phase 2: Form-Komponenten
6. **Select** (`forms/select.tsx`)
7. **Checkbox** (`forms/checkbox.tsx`)
8. **Radio Group** (`forms/radio-group.tsx`)
9. **Switch** (`forms/switch.tsx`)
10. **Textarea** (`forms/textarea.tsx`)

### Phase 3: Overlay-Komponenten
11. **Dialog** (`overlays/dialog.tsx`)
12. **Popover** (`overlays/popover.tsx`)
13. **Dropdown Menu** (`overlays/dropdown-menu.tsx`)

### Phase 4: Layout-Komponenten
14. **Tabs** (`layout/tabs.tsx`)
15. **Accordion** (`layout/accordion.tsx`)

### Phase 5: Feedback-Komponenten
16. **Toast** (`feedback/toast.tsx`)
17. **Alert** (`feedback/alert.tsx`)

### Phase 6: Data-Display
18. **Table** (`data-display/table.tsx`)
19. **Data Table** (`data-display/data-table.tsx`)

## 📝 Format für Code-Übergabe

Wenn dein Kollege den Code kopiert, sollte er folgendes Format haben:

```tsx
// Beispiel: Button-Komponente
import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // Props hier
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <button
        className={cn(
          // Klassen hier
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
```

## ⚠️ Wichtige Hinweise für Code-Kopieren

### Was muss angepasst werden?
1. **Imports**: 
   - AlignUI verwendet möglicherweise relative Imports
   - Wir müssen diese zu `@/lib/utils` ändern
   - Beispiel: `import { cn } from "@/lib/utils"`

2. **Dependencies prüfen**:
   - Prüfe ob alle benötigten Packages installiert sind
   - Meist: `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`

3. **TypeScript-Typen**:
   - Stelle sicher, dass alle Typen vorhanden sind

## 🚀 Workflow

1. **Kollege kopiert Code** → Gibt Code weiter
2. **Wir fügen Code ein** → In entsprechende Datei
3. **Wir passen Imports an** → `@/lib/utils` statt relative Pfade
4. **Wir testen** → Prüfen ob alles funktioniert
5. **Wir aktualisieren Imports** → In allen Dateien, die die Komponente verwenden

## 📦 Was NICHT benötigt wird

- ❌ API Key
- ❌ npm install alignui-pro
- ❌ Environment Variables
- ❌ Authentifizierung im Code
- ❌ API-Calls oder Requests

## ✅ Zusammenfassung

**Was dein Kollege machen muss:**
1. Einloggen auf pro.alignui.com
2. Komponenten öffnen
3. Code kopieren
4. Code weitergeben

**Was wir machen:**
1. Code in Projekt einfügen
2. Imports anpassen
3. Testen
4. Alle Verwendungen aktualisieren

**Einfach Code kopieren und weitergeben - mehr nicht!** 🎉

