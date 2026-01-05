# CommandMenu Verwendungsanleitung

## Übersicht

Das AlignUI CommandMenu ist eine moderne Command Palette Komponente, die es Benutzern ermöglicht, schnell durch Ihre Anwendung zu navigieren und Aktionen auszuführen.

## Installation

Die Komponente ist bereits installiert. Stellen Sie sicher, dass `@remixicon/react` installiert ist:

```bash
cd apps/web && pnpm install
```

## Grundlegende Verwendung

### 1. Einfaches Beispiel

```tsx
'use client';

import { CommandMenuExample } from '@/components/alignui/overlays/command-menu-example';

export function MyComponent() {
  return <CommandMenuExample />;
}
```

### 2. Mit eigenen Navigation-Items

```tsx
'use client';

import { CommandMenuExample } from '@/components/alignui/overlays/command-menu-example';
import { RiUserLine, RiSettingsLine } from '@remixicon/react';

export function MyComponent() {
  const customActions = [
    {
      id: 'new-user',
      title: 'Neuer Benutzer',
      description: 'Benutzer erstellen',
      icon: RiUserLine,
      action: () => {
        // Ihre Aktion hier
        console.log('Neuer Benutzer');
      },
      category: 'Aktionen',
    },
  ];

  return <CommandMenuExample actions={customActions} />;
}
```

### 3. Direkte Verwendung der CommandMenu Komponente

```tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CommandMenu } from '@/components/alignui/overlays/command-menu';
import { RiHomeLine } from '@remixicon/react';

export function CustomCommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  // CMD+K Shortcut aktivieren
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      <button onClick={() => setOpen(true)}>Öffne Command Menu</button>
      
      <CommandMenu.Dialog open={open} onOpenChange={setOpen}>
        <CommandMenu.Content>
          <CommandMenu.Command>
            <CommandMenu.Input placeholder="Suche..." />
            <CommandMenu.List>
              <CommandMenu.Empty>Keine Ergebnisse</CommandMenu.Empty>
              <CommandMenu.Group heading="Navigation">
                <CommandMenu.Item onSelect={() => router.push('/dashboard')}>
                  <CommandMenu.ItemIcon as={RiHomeLine} />
                  Dashboard
                </CommandMenu.Item>
              </CommandMenu.Group>
            </CommandMenu.List>
          </CommandMenu.Command>
        </CommandMenu.Content>
      </CommandMenu.Dialog>
    </>
  );
}
```

## Integration in bestehende Komponenten

### In den Header integrieren

```tsx
// apps/web/components/layout/header-command-menu.tsx
'use client';

import { CommandMenuExample } from '@/components/alignui/overlays/command-menu-example';

export function HeaderCommandMenu() {
  return (
    <div className="hidden md:block">
      <CommandMenuExample />
    </div>
  );
}
```

Dann in `apps/web/app/[locale]/(protected)/layout.tsx`:

```tsx
import { HeaderCommandMenu } from '@/components/layout/header-command-menu';

// Im Header:
<HeaderCommandMenu />
```

### In QuickActions integrieren

```tsx
// apps/web/components/layout/quick-actions.tsx
import { CommandMenuExample } from '@/components/alignui/overlays/command-menu-example';

export function QuickActions() {
  return (
    <div className="flex items-center gap-2">
      <CommandMenuExample />
      {/* Weitere Actions */}
    </div>
  );
}
```

## Tastenkürzel

- **CMD+K** (Mac) oder **CTRL+K** (Windows/Linux): Öffnet das CommandMenu
- **Pfeil nach oben/unten**: Navigiert durch die Liste
- **Enter**: Wählt ein Item aus
- **ESC**: Schließt das CommandMenu

## Komponenten-API

### CommandMenu.Dialog
Haupt-Dialog-Komponente.

**Props:**
- `open: boolean` - Ob der Dialog geöffnet ist
- `onOpenChange: (open: boolean) => void` - Callback wenn sich der Zustand ändert

### CommandMenu.Content
Wrapper für den Dialog-Inhalt.

### CommandMenu.Command
Haupt-Command-Komponente (von cmdk).

### CommandMenu.Input
Suchfeld für die Suche.

**Props:**
- `placeholder?: string` - Platzhalter-Text

### CommandMenu.List
Container für die Liste der Items.

### CommandMenu.Empty
Wird angezeigt, wenn keine Ergebnisse gefunden werden.

**Props:**
- `children: React.ReactNode` - Text der angezeigt werden soll

### CommandMenu.Group
Gruppiert Items nach Kategorien.

**Props:**
- `heading: string` - Überschrift der Gruppe

### CommandMenu.Item
Ein einzelnes Item in der Liste.

**Props:**
- `onSelect: () => void` - Callback wenn das Item ausgewählt wird
- `children: React.ReactNode` - Inhalt des Items

### CommandMenu.ItemIcon
Icon für ein Item.

**Props:**
- `as: React.ElementType` - Icon-Komponente (z.B. von @remixicon/react)

### CommandMenu.Footer
Footer-Bereich mit Tastenkürzel-Hinweisen.

### CommandMenu.FooterKeyBox
Box für ein Tastenkürzel im Footer.

## Beispiele

### Beispiel 1: Mit Navigation-Links

```tsx
import { sidebarLinks } from '@/config/dashboard';
import { CommandMenuExample } from '@/components/alignui/overlays/command-menu-example';

<CommandMenuExample navigationItems={sidebarLinks} />
```

### Beispiel 2: Mit Aktionen

```tsx
const actions = [
  {
    id: 'new-customer',
    title: 'Neuer Kunde',
    icon: RiUserLine,
    action: () => {
      // Öffne Modal oder navigiere
    },
    category: 'Aktionen',
  },
];

<CommandMenuExample actions={actions} />
```

### Beispiel 3: Mit Suche

Das CommandMenu unterstützt automatisch die Suche durch alle Items. Die Suche filtert nach:
- Titel
- Beschreibung
- Kategorie

## Styling

Das CommandMenu verwendet Tailwind CSS und folgt dem AlignUI Designsystem. Sie können die Styles über die `className` Props anpassen:

```tsx
<CommandMenu.Content className="max-w-3xl">
  {/* ... */}
</CommandMenu.Content>
```

## Best Practices

1. **Tastenkürzel aktivieren**: Immer CMD+K/CTRL+K Shortcut implementieren
2. **Kategorien verwenden**: Gruppieren Sie Items logisch nach Kategorien
3. **Icons hinzufügen**: Verwenden Sie Icons für bessere UX
4. **Beschreibungen**: Fügen Sie Beschreibungen hinzu, um Items zu erklären
5. **Leere Zustände**: Zeigen Sie hilfreiche Nachrichten an, wenn keine Ergebnisse gefunden werden

## Troubleshooting

### CommandMenu öffnet sich nicht
- Stellen Sie sicher, dass `open` State korrekt verwaltet wird
- Prüfen Sie, ob der Event Listener korrekt registriert ist

### Tastenkürzel funktioniert nicht
- Stellen Sie sicher, dass kein Input-Feld fokussiert ist
- Prüfen Sie die Event Handler Logik

### Items werden nicht angezeigt
- Prüfen Sie, ob die Items korrekt strukturiert sind
- Stellen Sie sicher, dass `CommandMenu.List` verwendet wird

## Weitere Ressourcen

- [AlignUI Dokumentation](https://alignui.com)
- [cmdk Dokumentation](https://cmdk.paco.me)
- Demo-Komponente: `apps/web/components/alignui/overlays/command-menu-demo.tsx`















