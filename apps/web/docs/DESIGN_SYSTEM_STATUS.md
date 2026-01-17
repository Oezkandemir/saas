# Design System Status

**Last Updated:** 2026-01-15  
**Status:** ✅ **shadcn/ui Only - Fully Configured**

---

## Overview

This project uses **shadcn/ui exclusively** as its design system. All UI components must come from shadcn/ui, and custom primitives that duplicate shadcn functionality are prohibited.

---

## ✅ Current Configuration

### 1. shadcn/ui Components

**Location:** `/apps/web/components/ui/`

**Available Components:** 50+ components including:
- **Forms:** button, input, textarea, select, checkbox, switch, label, form
- **Layout:** card, tabs, accordion, separator, scroll-area, sheet, drawer
- **Overlays:** dialog, alert-dialog, dropdown-menu, popover, command, tooltip
- **Data Display:** table, avatar, badge, skeleton, calendar, chart
- **Feedback:** alert, progress, toast
- **Navigation:** breadcrumb, menubar, navigation-menu, context-menu

**Configuration File:** `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

---

## 🛡️ Enforcement Mechanisms

### ESLint Rules

**Location:** `/apps/web/eslint-rules/`

#### 1. `no-alignui.js` (Error Level)

Bans all AlignUI/AliGUI imports completely.

**Triggers on:**
- `import { Button } from "@/components/alignui/..."`
- Any path containing `alignui`, `AliGUI`, or `aligui`

**Message:** 
> AlignUI/AliGUI imports are banned. Use shadcn/ui components from '@/components/ui/*' instead.

#### 2. `shadcn-only.js` (Warning Level)

Prevents creating custom primitives that exist in shadcn.

**Protected Primitives:** button, input, card, badge, avatar, label, textarea, select, checkbox, switch, radio-group, dialog, alert-dialog, dropdown-menu, popover, command, tabs, accordion, alert, progress, skeleton, separator, scroll-area, table, form, slider, toggle, tooltip, hover-card, menubar, navigation-menu, context-menu, drawer, sheet

**Triggers on:**
- Importing these primitives from non-`@/components/ui/` paths
- Creating components with these names outside `/components/ui/`

**Message:** 
> Component 'button' exists in shadcn/ui. Import from '@/components/ui/button' instead.

### ESLint Configuration

**File:** `eslint.config.js`

```javascript
rules: {
  // Ban AlignUI completely
  "custom/no-alignui": "error",
  
  // Enforce shadcn/ui usage
  "custom/shadcn-only": "warn",
}
```

---

## 📖 Documentation

### CODE_QUALITY_RULES.md

**Location:** `/apps/web/docs/CODE_QUALITY_RULES.md`

**Key Rules:**

#### ✅ Correct Usage

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter text" />
      <Button>Submit</Button>
    </Card>
  );
}
```

#### ❌ Incorrect Usage

```tsx
// DON'T: Create custom Button when shadcn Button exists
import { Button } from "@/components/custom/button";

// DON'T: Import from AlignUI (will trigger ESLint error)
import { Button } from "@/components/alignui/actions/button";
```

---

## 🧹 Migration Status

### Completed Actions

- ✅ AlignUI directory removed (`/components/alignui/`)
- ✅ All AlignUI imports replaced with shadcn/ui
- ✅ ESLint rules active and enforcing
- ✅ Documentation updated
- ✅ Zero production code using AlignUI

### Verification

```bash
# Verify no AlignUI imports in production code
grep -r "from.*@/components/alignui" apps/web --include="*.tsx" --include="*.ts" --exclude-dir="docs"
# Result: 0 matches (only documentation examples)

# Verify shadcn/ui components available
ls apps/web/components/ui/
# Result: 50+ component files
```

---

## 🚀 Usage Guidelines

### Adding New Components

1. **Check if shadcn/ui has it:**
   - Visit [ui.shadcn.com](https://ui.shadcn.com)
   - Search for the component you need

2. **Install the component:**
   ```bash
   npx shadcn@latest add [component-name]
   ```

3. **Import and use:**
   ```tsx
   import { ComponentName } from "@/components/ui/component-name";
   ```

### Creating Custom Components

**When allowed:**
- Business logic components (e.g., `CustomerTable`, `InvoiceForm`)
- Composite components combining multiple shadcn primitives
- Domain-specific components (e.g., `PricingCard`, `DashboardWidget`)

**Not allowed:**
- Recreating shadcn primitives (e.g., custom `Button`, `Input`)
- Creating alternative versions of shadcn components
- Building primitive UI components from scratch

**Example - Composite Component (Allowed):**

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{customer.name}</CardTitle>
        <Badge>{customer.status}</Badge>
      </CardHeader>
      <CardContent>
        <Button>View Details</Button>
      </CardContent>
    </Card>
  );
}
```

---

## 🔍 Validation

### Pre-commit Hooks

All commits are automatically validated:
- ✅ ESLint checks (including custom rules)
- ✅ TypeScript type checking
- ✅ Prettier formatting

### CI/CD Pipeline

PR checks enforce:
- Zero ESLint warnings/errors
- Zero TypeScript errors
- All tests passing
- Format validation

### Manual Validation

```bash
# Run all linting checks
pnpm lint:strict

# Run type checking
pnpm type-check:strict

# Run all validations
pnpm validate
```

---

## 📚 Resources

### Official Documentation
- **shadcn/ui:** [ui.shadcn.com](https://ui.shadcn.com)
- **Radix UI:** [radix-ui.com](https://www.radix-ui.com) (underlying primitives)
- **Tailwind CSS:** [tailwindcss.com](https://tailwindcss.com)

### Project Documentation
- [CODE_QUALITY_RULES.md](./CODE_QUALITY_RULES.md) - All code quality rules
- [MOCK_DATA_GUIDE.md](./MOCK_DATA_GUIDE.md) - Mock data guidelines
- [PLANNING.md](/PLANNING.md) - Project architecture

### Component Registry

View all available shadcn/ui components:
```bash
npx shadcn@latest add
```

---

## ❓ FAQ

### Q: Can I use Headless UI or Radix UI directly?

**A:** No. Use shadcn/ui components instead. shadcn/ui is built on Radix UI primitives with proper styling and accessibility.

### Q: What if shadcn/ui doesn't have the component I need?

**A:** 
1. Check if it can be composed from existing components
2. Check if shadcn/ui has a similar component you can extend
3. If truly unique, create a custom component but don't duplicate primitive functionality

### Q: Can I customize shadcn/ui components?

**A:** Yes! shadcn/ui components are designed to be customized:
- Modify the component files in `/components/ui/` directly
- Add variants using `cva` (class-variance-authority)
- Extend with composition

### Q: Why can't I use AlignUI?

**A:** 
- Consistency: One design system for the entire project
- Maintenance: Easier to maintain a single source of truth
- Bundle size: Avoid duplicate component libraries
- Team efficiency: Everyone knows one system

### Q: How do I report issues with shadcn/ui components?

**A:**
1. Check if it's a styling issue (fix in `/components/ui/[component].tsx`)
2. Check if it's a Radix UI issue (report to Radix)
3. Check if it's a shadcn/ui issue (report to shadcn/ui GitHub)

---

## ✅ Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| shadcn/ui installed | ✅ Complete | 50+ components |
| AlignUI removed | ✅ Complete | Directory deleted |
| ESLint rules active | ✅ Active | `no-alignui` (error), `shadcn-only` (warn) |
| Documentation | ✅ Complete | CODE_QUALITY_RULES.md |
| Production code clean | ✅ Clean | Zero AlignUI imports |
| CI/CD enforcement | ✅ Active | All PRs checked |

**Status:** Ready for production. All team members should use shadcn/ui exclusively.

---

**Questions or concerns?** Check [CODE_QUALITY_RULES.md](./CODE_QUALITY_RULES.md) or ask the team.
