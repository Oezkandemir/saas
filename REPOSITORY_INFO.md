# 📋 Detaillierte Repository-Informationen

## 🎯 Projekt-Übersicht

**Projektname:** Cenety Monorepo  
**Version:** 0.3.1  
**Typ:** Full-Stack SaaS Monorepo  
**Autor:** mickasmt ([@mickasmt](https://twitter.com/mickasmt))  
**Package Manager:** pnpm@9.15.2  
**Lizenz:** MIT

---

## 🏗️ Architektur & Struktur

### Monorepo Setup
- **Build System:** Turborepo 2.5.4
- **Workspace Manager:** pnpm workspaces
- **Struktur:** Multi-App Monorepo mit shared packages

### Apps im Monorepo

#### 1. **Web App** (`apps/web`)
- **Port:** 3000
- **Framework:** Next.js 16.1.1 (App Router)
- **React Version:** 19.0.0
- **TypeScript:** ✅ Vollständig typisiert
- **Zweck:** Haupt-SaaS-Anwendung mit vollständiger Funktionalität

#### 2. **Landing Page** (`apps/landing`)
- **Port:** 3001
- **Framework:** Next.js 15.3.8
- **Zweck:** Marketing-Website und Lead-Generierung

#### 3. **Mobile App** (`apps/mobile`)
- **Framework:** Expo ~53.0.11
- **React Native:** 0.79.3
- **Zweck:** Native Mobile App (iOS/Android)

### Shared Packages

#### `packages/ui`
- Shared UI-Komponenten für Web und Mobile
- 127 TypeScript/TSX Dateien

#### `packages/config`
- Shared Konfigurationen (ESLint, TypeScript, Tailwind)

#### `packages/reusables`
- Wiederverwendbare Komponenten und Utilities
- 136 Dateien (127 TSX, 8 TS, 1 MD)

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16.1.1 (App Router)
- **UI Library:** 
  - Radix UI (Primitive Components)
  - shadcn/ui (aktuell, Migration zu AlignUI Pro geplant)
  - Tailwind CSS 3.4.6
- **State Management:** 
  - React Query (@tanstack/react-query)
  - SWR
- **Form Handling:** 
  - React Hook Form 7.52.1
  - Zod 3.24.1 (Validierung)
- **Styling:**
  - Tailwind CSS
  - CSS Variables für Theming
  - Dark/Light Mode Support (next-themes)

### Backend & Services
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Payment:** 
  - Stripe 15.12.0
  - Polar.sh (optional)
- **Email:** Resend 3.5.0
- **File Storage:** Supabase Storage

### Development Tools
- **TypeScript:** 5.7.2
- **Testing:** Vitest 3.1.3
- **Linting:** ESLint 9.17.0
- **Formatting:** Prettier 3.3.3
- **Bundle Analysis:** @next/bundle-analyzer

### Content & Documentation
- **Content Management:** Contentlayer2 0.5.7
- **MDX Support:** next-mdx-remote
- **Internationalization:** next-intl 4.2.0
  - Unterstützte Sprachen: Deutsch, Englisch

---

## 📊 Datenbank-Schema

### Haupt-Tabellen

#### **users**
- Benutzer-Basis-Tabelle
- Felder: id, name, email, image, role, stripe_customer_id, etc.
- Rollen: ADMIN, USER

#### **user_profiles**
- Erweiterte Benutzer-Profile
- Zusätzliche Metadaten

#### **customers**
- CRM-Light Funktionalität
- Felder: name, email, phone, company, address, tax_id, notes
- QR-Code-Unterstützung

#### **documents**
- Dokumenten-Management (Angebote & Rechnungen)
- Typen: 'quote', 'invoice'
- Status: 'draft', 'sent', 'accepted', 'declined', 'paid', 'overdue'

#### **document_items**
- Positionen innerhalb von Dokumenten
- Verknüpft mit documents

#### **subscriptions**
- Stripe-Abonnement-Verwaltung
- Pläne: 'free', 'starter', 'pro'
- Status: 'active', 'canceled', 'past_due', 'trialing'

#### **notifications**
- Umfassendes Benachrichtigungssystem
- Typen: WELCOME, DOCUMENT, CUSTOMER, INVOICE, PAYMENT, SUBSCRIPTION, SECURITY, BILLING, SUPPORT, SYSTEM, SUCCESS, TEAM, NEWSLETTER, FOLLOW, ROLE_CHANGE

#### **qr_codes**
- QR-Code-Generierung und Tracking
- Verknüpft mit customers

#### **qr_events**
- QR-Code-Scan-Events
- Tracking: user_agent, referrer, country, ip_address

#### **company_profiles**
- Firmenprofile-Verwaltung
- Unterstützt: personal, team
- Felder: company_name, address, tax_id, vat_id, bank info, branding

#### **user_follows**
- Social-Feature: User-Follow-System
- Follower/Following-Verwaltung

#### **teams**
- Team-Kollaboration
- Rollen: OWNER, ADMIN, MEMBER

#### **newsletter_subscribers**
- Newsletter-Abonnenten-Verwaltung

### Sicherheit
- **Row Level Security (RLS):** ✅ Aktiviert auf allen Tabellen
- **Policies:** Benutzer-spezifische Zugriffskontrollen
- **JWT:** Supabase JWT für Authentifizierung

---

## 🔐 Authentifizierung & Sicherheit

### Auth-System
- **Provider:** Supabase Auth
- **Methoden:** 
  - Email/Password
  - OAuth (Google, GitHub, etc.)
- **Session Management:** Server-side mit Cookies
- **Middleware:** Route Protection

### Sicherheits-Features
- **CSP Headers:** Content Security Policy konfiguriert
- **XSS Protection:** Aktiviert
- **Frame Options:** DENY
- **HTTPS:** Erzwungen in Production
- **2FA:** Zwei-Faktor-Authentifizierung unterstützt

---

## 💳 Payment Integration

### Stripe
- **Version:** 15.12.0
- **Features:**
  - Subscription Management
  - Checkout Sessions
  - Webhooks
  - Customer Portal
- **Pläne:**
  - Pro (Monthly/Yearly)
  - Business (Monthly/Yearly)

### Polar.sh (Optional)
- Alternative Payment Provider
- Sandbox-Modus unterstützt

---

## 📧 Email System

### Resend Integration
- **Version:** 3.5.0
- **Features:**
  - Transactional Emails
  - Newsletter
  - Email Templates (React Email)
- **Templates:**
  - Welcome Emails
  - Password Reset
  - Newsletter Confirmation
  - Document Notifications

---

## 🌐 Internationalisierung (i18n)

### Setup
- **Library:** next-intl 4.2.0
- **Sprachen:** 
  - Deutsch (de)
  - Englisch (en)
- **Routing:** Locale-basierte URLs (`/de/...`, `/en/...`)

### Features
- Automatische Locale-Detection
- Language Switcher
- Übersetzte UI-Komponenten
- Content-Übersetzungen

---

## 📱 Mobile App Features

### Implementierte Features
- ✅ Theme System (Dark/Light Mode)
- ✅ UI Components (Buttons, Cards, Forms)
- ✅ Navigation (Bottom Tabs, Stack Navigation)
- ✅ Authentication Flow
- ✅ User Profile Management
- ✅ Notifications System
- ✅ Push Notifications (Expo)
- ✅ Settings Screens
- ✅ Billing & Plans Screens
- ✅ Real User Data Integration

### Navigation Structure
- Bottom Tab Navigation
- Hidden Tabs für Detail-Screens
- Stack Navigation für Flows

---

## 🎨 UI/UX Design System

### Design-Prinzipien
- **User First:** Benutzerfreundlichkeit steht im Vordergrund
- **Minimalismus:** Clean, moderne Ästhetik
- **Responsive:** Mobile-First Approach
- **Accessibility:** WCAG-konform

### Komponenten-Bibliothek
- **Aktuell:** shadcn/ui (Radix UI basiert)
- **Geplant:** Migration zu AlignUI Pro
- **Styling:** Tailwind CSS mit Design Tokens

### Design-Tokens
- **Farben:** Pure Black/White System für maximale Kontraste
- **Typography:** Geist Font Family
- **Spacing:** Konsistentes 4px Grid System
- **Shadows:** Subtile Schatten für Tiefe

---

## 🚀 Performance Optimierungen

### Build Optimizations
- **Webpack Cache:** Filesystem-Caching aktiviert
- **Tree Shaking:** Optimiert für Bundle-Größe
- **Code Splitting:** Automatisches Splitting
- **Dynamic Imports:** Lazy Loading für schwere Komponenten

### Runtime Optimizations
- **Image Optimization:** AVIF, WebP Support
- **Font Optimization:** Display Swap, Preloading
- **Bundle Analysis:** @next/bundle-analyzer integriert
- **Turbo Remote Cache:** Aktiviert für CI/CD

### Optimierte Komponenten
- Analytics (dynamisch importiert)
- ModalProvider (dynamisch importiert)
- DataTable (dynamisch importiert)
- PDF Components (dynamisch importiert)

---

## 📁 Projekt-Struktur (Detailliert)

```
cenety-monorepo/
├── apps/
│   ├── web/                    # Haupt-SaaS-App
│   │   ├── app/                # Next.js App Router
│   │   │   ├── [locale]/       # Internationalisierte Routes
│   │   │   │   ├── (auth)/     # Auth-Seiten
│   │   │   │   ├── (protected)/ # Geschützte Bereiche
│   │   │   │   │   ├── dashboard/ # Dashboard
│   │   │   │   │   ├── admin/     # Admin-Panel
│   │   │   │   │   └── profile/   # User-Profile
│   │   │   │   └── (marketing)/   # Marketing-Seiten
│   │   │   └── api/            # API Routes
│   │   ├── actions/            # Server Actions (50 Dateien)
│   │   ├── components/         # React Components (306 Dateien)
│   │   ├── lib/                # Utilities & Helpers (56 Dateien)
│   │   ├── hooks/              # Custom React Hooks (11 Dateien)
│   │   ├── migrations/         # Database Migrations (9 SQL)
│   │   ├── supabase/           # Supabase Config (39 Dateien)
│   │   └── tests/              # Tests (12 Dateien)
│   ├── landing/                # Marketing Landing Page
│   └── mobile/                 # Expo React Native App
├── packages/
│   ├── ui/                     # Shared UI Components
│   ├── config/                 # Shared Configs
│   └── reusables/              # Reusable Components
├── docs/                       # Dokumentation (16 MD-Dateien)
├── scripts/                    # Utility Scripts
└── public/                     # Static Assets
```

---

## 🔧 Konfiguration

### Environment Variables

#### Server-Side
- `SUPABASE_SERVICE_ROLE_KEY` (required)
- `SUPABASE_JWT_SECRET` (required)
- `STRIPE_API_KEY` (optional)
- `STRIPE_WEBHOOK_SECRET` (optional)
- `RESEND_API_KEY` (optional)
- `EMAIL_FROM` (optional)
- `POLAR_ACCESS_TOKEN` (optional)

#### Client-Side
- `NEXT_PUBLIC_SUPABASE_URL` (required)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required)
- `NEXT_PUBLIC_APP_URL` (required)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional)
- `NEXT_PUBLIC_PAYMENT_PROVIDER` (optional, default: "stripe")

### Build Configuration
- **Node Options:** `--max-old-space-size=4096` für große Builds
- **Output:** `.next` Directory
- **Cache:** Turbo Remote Cache aktiviert
- **Framework:** Next.js (auto-detected)

---

## 📝 Wichtige Features

### CRM-Funktionalität
- ✅ Kundenverwaltung (Customers)
- ✅ QR-Code-Generierung
- ✅ QR-Code-Tracking
- ✅ Dokumenten-Management (Angebote & Rechnungen)
- ✅ PDF-Generierung

### User Management
- ✅ User-Profile mit Avatar
- ✅ Rollen-System (ADMIN, USER)
- ✅ User-Follow-System
- ✅ Benachrichtigungssystem
- ✅ Newsletter-System

### Team Features
- ✅ Team-Erstellung
- ✅ Team-Mitglieder-Verwaltung
- ✅ Team-Rollen (OWNER, ADMIN, MEMBER)
- ✅ Team-Dashboard (in Entwicklung)

### Admin Features
- ✅ User-Verwaltung
- ✅ Analytics Dashboard
- ✅ Revenue Tracking
- ✅ Support-Ticket-System
- ✅ Webhook-Management
- ✅ System-Übersicht

### Billing & Subscriptions
- ✅ Stripe Integration
- ✅ Subscription Management
- ✅ Plan-Upgrades/Downgrades
- ✅ Customer Portal
- ✅ Usage Tracking

---

## 🧪 Testing

### Test Setup
- **Framework:** Vitest 3.1.3
- **Testing Library:** @testing-library/react
- **Coverage:** Jest DOM Matchers

### Test-Struktur
- Tests in `apps/web/tests/`
- Unit Tests für Actions
- Component Tests
- Integration Tests

---

## 📚 Dokumentation

### Verfügbare Dokumentation
- `README.md` - Haupt-README
- `TASK.md` - Task-Tracking und Feature-Status
- `docs/` - Detaillierte Dokumentationen:
  - UI/UX Master Prompts
  - AlignUI Migration Guide
  - Deployment Guides
  - Setup Guides

### Wichtige Docs
- `docs/UI_UX_MASTER_PROMPT.md` - Design-System-Prompt
- `docs/ALIGNUI_MIGRATION.md` - Komponenten-Migration
- `docs/DEPLOYMENT.md` - Deployment-Anleitung
- `docs/BOTTOM_TAB_NAVIGATION_RULES.md` - Mobile Navigation Rules

---

## 🚢 Deployment

### Vercel Configuration
- **Build Command:** `pnpm turbo run build --filter=@cenety/web`
- **Output Directory:** `apps/web/.next`
- **Framework:** Next.js (auto-detected)
- **Environment:** Production-ready

### CI/CD
- Turbo Remote Cache aktiviert
- Optimierte Build-Pipeline
- Environment Variable Management

---

## 🔄 Aktuelle Entwicklungs-Status

### Abgeschlossene Features ✅
- Monorepo-Struktur
- Dashboard-Layout-Modernisierung
- Mobile Responsiveness
- Notification System
- User Follow System
- QR-Code-Funktionalität
- Dark/Light Mode
- Mobile App (Phase 1-2)
- Performance Optimierungen (Phase 1-2)

### In Entwicklung 🚧
- AlignUI Pro Migration (Phase 1 abgeschlossen)
- Team Features (Phase 3-4)
- Performance Optimierungen (Phase 3-5)

### Geplante Features 📋
- Erweiterte Team-Funktionalität
- Real-time Collaboration
- Erweiterte Analytics
- Mobile App Phase 3-5

---

## 🛡️ Sicherheits-Features

### Implementiert
- ✅ Row Level Security (RLS) auf allen Tabellen
- ✅ JWT-basierte Authentifizierung
- ✅ CSP Headers
- ✅ XSS Protection
- ✅ CSRF Protection
- ✅ Rate Limiting (geplant)
- ✅ Input Validation (Zod)
- ✅ SQL Injection Prevention (Supabase)

---

## 📊 Code-Statistiken

### Dateien
- **Total Components:** 306+ TSX-Dateien
- **Server Actions:** 50 Dateien
- **Utilities:** 56 Dateien
- **Hooks:** 11 Dateien
- **Tests:** 12 Dateien
- **Migrations:** 9 SQL-Dateien

### Dependencies
- **Production:** ~120 Packages
- **Development:** ~70 Packages
- **Total:** ~190 Packages

---

## 🎯 Design-Philosophie

### Prinzipien
1. **User First:** Jede Entscheidung basiert auf UX
2. **Minimalismus:** Clean, fokussiertes Design
3. **Performance:** Schnelle Ladezeiten und Interaktionen
4. **Accessibility:** Barrierefreiheit für alle
5. **Mobile First:** Responsive Design von Anfang an

### Benchmark-Referenzen
- Stripe (Payment UX)
- Linear (Dashboard Design)
- Notion (Content Management)
- Vercel (Developer Experience)

---

## 🔍 Code-Qualität

### Standards
- **TypeScript:** Strict Mode aktiviert
- **ESLint:** Max Warnings = 0
- **Prettier:** Automatische Formatierung
- **Husky:** Pre-commit Hooks
- **Commitlint:** Conventional Commits

### Best Practices
- Server Components wo möglich
- Client Components nur wenn nötig
- Type-Safe API Calls
- Error Boundaries
- Loading States
- Optimistic Updates

---

## 📞 Support & Community

### Ressourcen
- **Twitter:** [@mickasmt](https://twitter.com/mickasmt)
- **Documentation:** `/docs` Ordner
- **Issues:** GitHub Issues (falls aktiv)

---

## 🎓 Lernressourcen

### Für Entwickler
- Next.js 16 App Router Dokumentation
- Supabase Dokumentation
- Stripe API Dokumentation
- React 19 Dokumentation
- TypeScript Best Practices

---

## 📅 Versionierung

### Aktuelle Version
- **Version:** 0.3.1
- **Release:** In Entwicklung
- **Stability:** Beta/Production-ready

### Changelog
- Siehe `TASK.md` für detaillierte Feature-Liste und Status

---

## ⚠️ Bekannte Einschränkungen

### Performance
- ⚠️ Bundle-Größe könnte optimiert werden
- ⚠️ Console.logs in Production (Cleanup geplant)

### Features
- ⚠️ Team Features noch nicht vollständig
- ⚠️ Mobile App noch in Entwicklung

---

## 🚀 Quick Start

### Installation
```bash
# Dependencies installieren
pnpm install

# Environment Variables setzen
cp apps/web/.env.example apps/web/.env.local

# Development Server starten
pnpm dev

# Oder spezifische App
pnpm dev:web      # Port 3000
pnpm dev:landing  # Port 3001
```

### Build
```bash
# Alle Apps bauen
pnpm build

# Spezifische App bauen
pnpm build --filter=@cenety/web
```

### Testing
```bash
# Alle Tests ausführen
pnpm test

# Tests im Watch-Modus
pnpm test:watch
```

---

## 📖 Nächste Schritte

### Für neue Entwickler
1. README.md lesen
2. TASK.md für Feature-Status prüfen
3. Environment Variables konfigurieren
4. Supabase Setup durchführen
5. Development Server starten

### Für Feature-Entwicklung
1. TASK.md aktualisieren
2. Feature-Branch erstellen
3. Tests schreiben
4. Code-Review einholen
5. Dokumentation aktualisieren

---

**Letzte Aktualisierung:** 2026-01-03  
**Repository-Status:** ✅ Aktiv in Entwicklung  
**Production-Ready:** ✅ Ja (mit Konfiguration)




