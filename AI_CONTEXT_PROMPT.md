# 🤖 AI Context Prompt für Cenety Monorepo

Dieser Prompt kann zu Beginn einer neuen AI-Konversation verwendet werden, um vollständigen Kontext über das Repository zu geben.

---

## 📋 Basis-Prompt (Kopieren & Einfügen)

```
Ich arbeite an einem Next.js SaaS Monorepo-Projekt namens "Cenety". Hier sind die wichtigsten Informationen:

## Projekt-Übersicht
- **Typ:** Full-Stack SaaS Monorepo mit Next.js, Supabase, Stripe
- **Version:** 0.3.1
- **Package Manager:** pnpm 9.15.2
- **Build System:** Turborepo 2.5.4

## Tech Stack
- **Frontend:** Next.js 16.1.1 (App Router), React 19, TypeScript 5.7.2
- **UI:** Radix UI, shadcn/ui (Migration zu AlignUI Pro geplant), Tailwind CSS 3.4.6
- **Backend:** Supabase (PostgreSQL), Server Actions
- **Auth:** Supabase Auth
- **Payment:** Stripe 15.12.0, Polar.sh (optional)
- **Email:** Resend 3.5.0
- **i18n:** next-intl 4.2.0 (Deutsch, Englisch)

## Projekt-Struktur
- `apps/web/` - Haupt-SaaS-App (Port 3000)
- `apps/landing/` - Marketing Landing Page (Port 3001)
- `apps/mobile/` - Expo React Native App
- `packages/ui/` - Shared UI Components
- `packages/config/` - Shared Configs
- `packages/reusables/` - Reusable Components

## Wichtige Features
- CRM-Funktionalität (Customers, Documents, QR-Codes)
- User Management mit Rollen (ADMIN, USER)
- Team-Kollaboration
- Subscription Management (Stripe)
- Umfassendes Notification System
- User Follow System
- Newsletter System
- Admin Dashboard
- Mobile App (Expo)

## Datenbank
- Supabase PostgreSQL
- Row Level Security (RLS) aktiviert
- Haupt-Tabellen: users, customers, documents, subscriptions, notifications, teams, company_profiles

## Code-Standards
- TypeScript Strict Mode
- ESLint (max-warnings=0)
- Prettier für Formatierung
- Server Components bevorzugt
- Type-Safe mit Zod Validation
- Error Boundaries und Loading States

## Aktuelle Entwicklungs-Fokus
- AlignUI Pro Migration (in Progress)
- Team Features Erweiterung
- Performance Optimierungen
- Mobile App Completion

Bitte beachte diese Informationen bei allen Code-Vorschlägen und Änderungen. Verwende die bestehende Architektur und Code-Stil-Konventionen.
```

---

## 🎯 Erweiterte Prompt-Variante (Für spezifische Aufgaben)

### Für UI/UX-Arbeiten
```
[Füge Basis-Prompt ein]

**Spezifischer Kontext für UI/UX:**
- Design-System: Modern, minimalistisch, inspiriert von Stripe/Linear/Vercel
- Farben: Pure Black/White System für maximale Kontraste
- Typography: Geist Font Family
- Spacing: 4px Grid System
- Responsive: Mobile-First Approach
- Dark/Light Mode: Vollständig unterstützt
- Komponenten: Aktuell shadcn/ui, Migration zu AlignUI Pro geplant

Siehe auch: `docs/UI_UX_MASTER_PROMPT.md` für Design-Prinzipien.
```

### Für Backend/Database-Arbeiten
```
[Füge Basis-Prompt ein]

**Spezifischer Kontext für Backend:**
- Database: Supabase PostgreSQL
- RLS: Alle Tabellen haben Row Level Security aktiviert
- Server Actions: In `apps/web/actions/` (50 Dateien)
- API Routes: In `apps/web/app/api/`
- Migrations: In `apps/web/supabase/migrations/`
- Validation: Zod Schema für alle Inputs
- Error Handling: Logger in `apps/web/lib/logger.ts`

Wichtig: Alle Database-Queries müssen RLS-Policies respektieren.
```

### Für Mobile App-Entwicklung
```
[Füge Basis-Prompt ein]

**Spezifischer Kontext für Mobile:**
- Framework: Expo ~53.0.11, React Native 0.79.3
- Navigation: Expo Router mit Bottom Tabs
- Theme: Dark/Light Mode mit useColorScheme
- Components: Shared UI aus `packages/reusables/`
- Navigation Rules: Siehe `docs/BOTTOM_TAB_NAVIGATION_RULES.md`
- Features: Auth, Profile, Notifications, Billing implementiert

Wichtig: Bottom Tab Navigation muss auf ALLEN Screens sichtbar sein (außer bei hidden tabs).
```

### Für Performance-Optimierungen
```
[Füge Basis-Prompt ein]

**Spezifischer Kontext für Performance:**
- Build: Webpack Cache aktiviert, Turbo Remote Cache
- Code Splitting: Dynamic Imports für schwere Komponenten
- Bundle Analysis: @next/bundle-analyzer verfügbar
- Optimierungen: Tree Shaking, Image Optimization (AVIF/WebP)
- Node Options: --max-old-space-size=4096 für Builds

Bereits optimiert:
- Analytics (dynamisch)
- ModalProvider (dynamisch)
- DataTable (dynamisch)
- PDF Components (dynamisch)

Siehe: `TASK.md` für Performance-Task-Status.
```

### Für Feature-Entwicklung
```
[Füge Basis-Prompt ein]

**Spezifischer Kontext für Features:**
- Task Tracking: Siehe `TASK.md` für aktuelle Tasks
- Code Structure: Server Components bevorzugt, Client Components nur wenn nötig
- Testing: Vitest für Unit Tests, Testing Library für Components
- Documentation: Aktualisiere README.md und TASK.md nach Feature-Completion
- Type Safety: Vollständige TypeScript-Typisierung erforderlich

Workflow:
1. Task in TASK.md prüfen/hinzufügen
2. Feature-Branch erstellen
3. Tests schreiben
4. Code implementieren
5. TASK.md als completed markieren
```

---

## 🔍 Spezifische Kontext-Hinweise

### Für Code-Reviews
```
Bitte prüfe diesen Code im Kontext des Cenety Monorepos:
- Folgt er den bestehenden Code-Standards?
- Ist er Type-Safe?
- Respektiert er die Architektur-Patterns?
- Gibt es Performance-Probleme?
- Sind Tests vorhanden/notwendig?
```

### Für Bug-Fixes
```
Ich habe einen Bug in [Feature/Bereich]. 
Kontext: [Beschreibung]
Fehler: [Fehlermeldung/Verhalten]
Erwartetes Verhalten: [Was sollte passieren]

Bitte analysiere im Kontext des Cenety Monorepos und schlage eine Lösung vor.
```

### Für Refactoring
```
Ich möchte [Komponente/Feature] refactoren.
Aktueller Zustand: [Beschreibung]
Ziel: [Was soll verbessert werden]

Bitte schlage Refactoring im Kontext der bestehenden Architektur vor.
```

---

## 📚 Wichtige Dateien für Kontext

### Muss gelesen werden:
- `README.md` - Projekt-Übersicht
- `TASK.md` - Feature-Status und Tasks
- `REPOSITORY_INFO.md` - Detaillierte Repository-Informationen (dieses Dokument)

### Sollte gelesen werden (je nach Aufgabe):
- `apps/web/package.json` - Dependencies und Scripts
- `turbo.json` - Build-Konfiguration
- `apps/web/next.config.js` - Next.js Konfiguration
- `apps/web/env.mjs` - Environment Variables Schema
- `docs/UI_UX_MASTER_PROMPT.md` - Design-Prinzipien
- `docs/ALIGNUI_MIGRATION.md` - Komponenten-Migration-Status

---

## 🎨 Code-Style Referenzen

### TypeScript
```typescript
// Server Action Beispiel
"use server";

import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase-server";

const schema = z.object({
  name: z.string().min(1),
});

export async function createItem(data: z.infer<typeof schema>) {
  const supabase = await getSupabaseServer();
  // Implementation
}
```

### React Component
```tsx
// Server Component bevorzugt
export default async function Page() {
  const data = await fetchData();
  return <div>{/* Content */}</div>;
}

// Client Component nur wenn nötig
"use client";

import { useState } from "react";

export function ClientComponent() {
  const [state, setState] = useState();
  return <div>{/* Interactive Content */}</div>;
}
```

### Styling
```tsx
// Tailwind CSS mit cn() Helper
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  className // für Props
)} />
```

---

## ✅ Checkliste für AI-Assistenten

Wenn du als AI-Assistent arbeitest, stelle sicher:

- [ ] Ich habe die Projekt-Struktur verstanden
- [ ] Ich kenne den Tech Stack
- [ ] Ich respektiere die Code-Standards
- [ ] Ich verwende TypeScript korrekt
- [ ] Ich berücksichtige RLS-Policies für Database-Queries
- [ ] Ich verwende Server Components wo möglich
- [ ] Ich füge Error Handling hinzu
- [ ] Ich füge Loading States hinzu
- [ ] Ich aktualisiere TASK.md wenn nötig
- [ ] Ich dokumentiere neue Features

---

**Verwendung:** Kopiere den Basis-Prompt oder eine erweiterte Variante zu Beginn einer neuen Konversation, um vollständigen Kontext zu geben.




