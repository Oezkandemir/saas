# AlignUI Pro Komponenten

Dieses Verzeichnis enthält alle migrierten AlignUI Pro Komponenten.

## Struktur

```
alignui/
├── actions/          # Button, ButtonGroup, LinkButton
├── forms/            # Input, Select, Checkbox, Radio, Switch, etc.
├── overlays/         # Dialog, Popover, Dropdown, Modal, etc.
├── layout/           # Tabs, Accordion, Breadcrumb, etc.
├── feedback/         # Toast, Alert, Notification, Progress
├── data-display/     # Table, DataTable, Avatar, Badge, Card
└── navigation/       # Pagination, Stepper, etc.
```

## Status

### ✅ Basis-Komponenten implementiert (AlignUI Free)

- [x] Button (`actions/button.tsx`) - ✅ Implementiert
- [x] Card (`data-display/card.tsx`) - ✅ Implementiert
- [x] Input (`forms/input.tsx`) - ✅ Implementiert
- [x] Badge (`data-display/badge.tsx`) - ✅ Implementiert
- [x] Avatar (`data-display/avatar.tsx`) - ✅ Implementiert

### 📝 Komponenten-Details

Alle Basis-Komponenten sind implementiert basierend auf:

- AlignUI Design System
- Radix UI Primitives (wo zutreffend)
- Tailwind CSS für Styling
- class-variance-authority für Varianten
- TypeScript für Type-Safety

## Verwendung

### ✅ Migration abgeschlossen!

```tsx
import { Button } from "@/components/alignui/actions/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/alignui/data-display/avatar";
import { Badge } from "@/components/alignui/data-display/badge";
import { Card } from "@/components/alignui/data-display/card";
import { Input } from "@/components/alignui/forms/input";
```

## Migrations-Schritte

1. **Komponente von AlignUI Pro kopieren**

   - Besuche [pro.alignui.com](https://pro.alignui.com)
   - Navigiere zur Komponente
   - Kopiere den vollständigen Code

2. **Komponente einfügen**

   - Öffne die entsprechende `.tsx` Datei
   - Ersetze den Platzhalter-Code mit dem AlignUI-Code
   - Passe Imports an (`@/lib/utils` statt relative Pfade)

3. **Export prüfen**

   - Export ist bereits in `index.ts` vorhanden
   - Prüfe ob alle Exports korrekt sind

4. **Imports aktualisieren**

   - Finde alle Verwendungen der alten Komponente
   - Ersetze Import-Pfad
   - Teste Funktionalität

5. **Alte Komponente entfernen**
   - Nach erfolgreicher Migration: Entferne aus `components/ui/`

## Wichtige Hinweise

- **Tailwind CSS**: Alle Komponenten verwenden Tailwind CSS
- **TypeScript**: Alle Komponenten sollten vollständig typisiert sein
- **Dark Mode**: Stelle sicher, dass Dark Mode unterstützt wird
- **Accessibility**: Prüfe auf ARIA-Attribute und Keyboard-Navigation

## Testing Checklist

Für jede migrierte Komponente:

- [ ] Visuell identisch (oder verbessert)
- [ ] Alle Props funktionieren
- [ ] Dark Mode funktioniert
- [ ] Responsive Design funktioniert
- [ ] Accessibility-Tests bestehen
- [ ] Keine Console-Errors
- [ ] TypeScript-Typen korrekt

## Nächste Schritte

1. ✅ Basis-Komponenten implementiert (Button, Card, Input, Badge, Avatar)
2. ⏭️ Komponenten testen und validieren
3. ⏭️ Imports in der Web-App aktualisieren (von `@/components/ui/*` zu `@/components/alignui/*`)
4. ⏭️ Weitere Komponenten migrieren (Form, Select, Dialog, etc.)
5. ⏭️ Alte shadcn/ui Komponenten entfernen (nach vollständiger Migration)
