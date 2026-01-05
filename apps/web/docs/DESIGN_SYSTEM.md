# Modern SaaS Design System - Cenety

## 🎯 Design-Philosophie

**Clean, Subtle, Professional** - Ein Design-System inspiriert von Big-Tech/SaaS-Unternehmen (Vercel, Linear, Stripe) mit Fokus auf:

- Großzügige Whitespaces
- Subtile Borders statt harte Boxen
- Weiche Shadows für Tiefe
- Klare Typografie-Hierarchie
- Dezente Farbpalette (Brand-Farbe sparsam als Accent)
- Konsistente Icon-Sprache (lucide-react)

## 📐 Design Tokens

### Farben (HSL)

**Light Mode:**

- `--background`: 0 0% 100% (Pure White)
- `--foreground`: 0 0% 3.9% (Near Black)
- `--card`: 0 0% 100% (White)
- `--card-foreground`: 0 0% 3.9% (Near Black)
- `--popover`: 0 0% 100% (White)
- `--popover-foreground`: 0 0% 3.9% (Near Black)
- `--primary`: 0 0% 9% (Dark Gray)
- `--primary-foreground`: 0 0% 98% (Near White)
- `--secondary`: 0 0% 96.1% (Light Gray)
- `--secondary-foreground`: 0 0% 9% (Dark Gray)
- `--muted`: 0 0% 96.1% (Light Gray)
- `--muted-foreground`: 0 0% 45.1% (Medium Gray)
- `--accent`: 0 0% 98% (Near White)
- `--accent-foreground`: 0 0% 9% (Dark Gray)
- `--destructive`: 0 84.2% 60.2% (Red)
- `--destructive-foreground`: 0 0% 98% (Near White)
- `--border`: 0 0% 89.8% (Light Border)
- `--input`: 0 0% 89.8% (Input Border)
- `--ring`: 0 0% 3.9% (Focus Ring)

**Dark Mode:**

- `--background`: 0 0% 3.9% (Near Black)
- `--foreground`: 0 0% 98% (Near White)
- `--card`: 0 0% 3.9% (Near Black)
- `--card-foreground`: 0 0% 98% (Near White)
- `--popover`: 0 0% 3.9% (Near Black)
- `--popover-foreground`: 0 0% 98% (Near White)
- `--primary`: 0 0% 98% (Near White)
- `--primary-foreground`: 0 0% 9% (Dark Gray)
- `--secondary`: 0 0% 14.9% (Dark Gray)
- `--secondary-foreground`: 0 0% 98% (Near White)
- `--muted`: 0 0% 14.9% (Dark Gray)
- `--muted-foreground`: 0 0% 63.9% (Light Gray)
- `--accent`: 0 0% 8% (Very Dark Gray)
- `--accent-foreground`: 0 0% 98% (Near White)
- `--destructive`: 0 62.8% 30.6% (Dark Red)
- `--destructive-foreground`: 0 0% 98% (Near White)
- `--border`: 0 0% 14.9% (Dark Border)
- `--input`: 0 0% 14.9% (Dark Input Border)
- `--ring`: 0 0% 83.1% (Light Focus Ring)

### Spacing Scale

```
0.5rem  = 8px   (gap-2)
0.75rem = 12px  (gap-3)
1rem    = 16px  (gap-4)
1.5rem  = 24px  (gap-6)
2rem    = 32px  (gap-8)
2.5rem  = 40px  (gap-10)
3rem    = 48px  (gap-12)
```

**Container Padding:**

- Mobile: `1rem` (16px)
- Tablet: `1.5rem` (24px)
- Desktop: `2rem` (32px)
- Large: `2.5rem` (40px)
- XL: `3rem` (48px)

### Typography Scale

**Headings:**

- `h1`: `1.875rem` (30px) / `2.25rem` (36px) - Line Height: 1.2
- `h2`: `1.5rem` (24px) / `1.875rem` (30px) - Line Height: 1.3
- `h3`: `1.25rem` (20px) / `1.5rem` (24px) - Line Height: 1.4
- `h4`: `1.125rem` (18px) / `1.25rem` (20px) - Line Height: 1.5

**Body:**

- `base`: `1rem` (16px) - Line Height: 1.6
- `sm`: `0.875rem` (14px) - Line Height: 1.5
- `xs`: `0.75rem` (12px) - Line Height: 1.5

**Weights:**

- Normal: `400`
- Medium: `500`
- Semibold: `600`
- Bold: `700`

### Border Radius

- `sm`: `calc(var(--radius) - 4px)` = 4px
- `md`: `calc(var(--radius) - 2px)` = 6px
- `lg`: `var(--radius)` = 8px
- `xl`: `12px`
- `2xl`: `16px`
- `full`: `9999px`

**Default:** `--radius: 0.5rem` (8px)

### Shadows

**Subtle Shadows (SaaS-Style):**

- `sm`: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- `md`: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`
- `lg`: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`
- `xl`: `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`

**Dark Mode Shadows:**

- Weicher, subtiler
- Mehr Glow-Effekt statt harte Schatten

## 🧩 Komponenten-Standards

### Button

**Variants:**

- `default`: Primary Action (Dark BG, White Text)
- `destructive`: Danger Actions (Red)
- `outline`: Secondary Actions (Border, Transparent BG)
- `secondary`: Alternative Actions (Gray BG)
- `ghost`: Tertiary Actions (No Border, Hover BG)
- `link`: Text Links (Underline on Hover)

**Sizes:**

- `sm`: `h-9 px-3 text-sm`
- `default`: `h-10 px-4 text-sm`
- `lg`: `h-11 px-8 text-base`
- `icon`: `size-10`

**States:**

- Hover: Subtle scale (0.98) + Shadow
- Active: Scale (0.96)
- Disabled: Opacity 50% + No Pointer Events
- Focus: Ring (2px, offset 2px)

### Card

**Structure:**

- Border: Subtle (`border-border`)
- Background: `bg-card`
- Shadow: `shadow-sm` (subtle)
- Radius: `rounded-lg` (8px)
- Padding: `p-4 sm:p-5` (responsive)

**Variants:**

- `hover`: Hover shadow + border color change
- `interactive`: Cursor pointer + active scale
- `compact`: Reduced padding

### Input

**Base:**

- Height: `h-10` (40px)
- Padding: `px-3 py-2`
- Border: `border-input`
- Radius: `rounded-md` (6px)
- Focus: Ring (2px, offset 2px)

**States:**

- Default: Transparent BG, Border
- Focus: Ring visible
- Disabled: Opacity 50%
- Error: Border destructive color

### Table

**Header:**

- Background: `bg-muted/50`
- Font: `font-semibold`
- Padding: `px-4 py-3`
- Border: Bottom border

**Row:**

- Hover: `bg-muted/30`
- Border: Bottom border (subtle)
- Padding: `px-4 py-3`

**Cell:**

- Padding: `p-4`
- Text: `text-sm`

### Page Header

**Structure:**

- Container: `border-b bg-card/50 backdrop-blur-sm`
- Padding: `px-4 py-3.5 sm:py-4`
- Layout: Flex, space-between

**Title:**

- Size: `text-base sm:text-lg`
- Weight: `font-semibold`
- Truncate: Yes

**Description:**

- Size: `text-xs sm:text-sm`
- Color: `text-muted-foreground`
- Truncate: Yes

### Status Bar

**Structure:**

- Container: `border-b bg-muted/20`
- Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`
- Gap: `gap-4 sm:gap-6`
- Padding: `px-4 sm:px-6 py-4`

**Item:**

- Icon Container: `size-10 rounded-lg bg-background border shadow-sm`
- Value: `text-2xl font-bold`
- Label: `text-xs text-muted-foreground`

## 📄 Page Patterns

### Standard Page Layout

```tsx
<div className="flex flex-col h-full">
  <ModernPageHeader
    title="Page Title"
    description="Page description"
    icon={<Icon />}
    actions={<Button>Action</Button>}
  />

  <StatusBar items={statusBarItems} />

  <div className="flex-1 overflow-y-auto p-4">
    <div className="space-y-4">{/* Content Sections */}</div>
  </div>
</div>
```

### Content Sections

**Card Section:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
    <CardDescription>Section description</CardDescription>
  </CardHeader>
  <CardContent>{/* Content */}</CardContent>
</Card>
```

**Grid Layout:**

- Mobile: `grid-cols-1` or `grid-cols-2`
- Tablet: `grid-cols-2` or `grid-cols-3`
- Desktop: `grid-cols-3` or `grid-cols-4`
- Gap: `gap-4` (mobile), `gap-6` (desktop)

## 🎨 Design-Prinzipien

1. **Whitespace ist wichtig**: Großzügige Abstände zwischen Elementen
2. **Subtile Borders**: Leichte Borders statt harte Boxen
3. **Weiche Shadows**: Subtile Schatten für Tiefe, nicht für Dominanz
4. **Konsistente Icons**: Immer lucide-react, gleiche Größen
5. **Klare Hierarchie**: Typografie und Spacing zeigen Wichtigkeit
6. **Responsive First**: Mobile-first Approach, dann Desktop Enhancement
7. **Accessibility**: Focus States, Keyboard Navigation, ARIA Labels
8. **Performance**: Subtile Animationen (100-150ms), GPU-accelerated

## 🔄 Migration Guide

1. **Ersetze alte Styles** durch neue Komponenten
2. **Verwende Design Tokens** statt hardcoded Werte
3. **Folge Page Patterns** für konsistente Layouts
4. **Teste Dark Mode** bei allen Änderungen
5. **Mobile First**: Teste immer auf Mobile zuerst
