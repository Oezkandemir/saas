# Cenety Monorepo

<div align="center">
  <p>A complete SaaS ecosystem with Next.js Web App, Marketing Landing Page, and React Native Mobile App.</p>
  <p>
    <a href="#getting-started">Get Started</a> ·
    <a href="#apps">Apps</a> ·
    <a href="#packages">Packages</a> ·
    <a href="#development">Development</a>
  </p>
</div>

## 🏗️ Monorepo Structure

```
cenety-monorepo/
├── apps/
│   ├── web/                 # Next.js SaaS Application (Port 3000)
│   ├── landing/             # Marketing Landing Page (Port 3001)
│   └── mobile/              # Expo React Native App
├── packages/
│   ├── ui/                  # Shared UI Components
│   ├── config/              # Shared Configuration
│   ├── database/            # Database Schema & Types
│   ├── auth/                # Authentication Logic
│   └── utils/               # Shared Utilities
└── turbo.json               # Turborepo Configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd cenety-monorepo
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment files for each app
   cp apps/web/.env.example apps/web/.env.local
   ```

4. **Start development servers**
   ```bash
   # Start all apps
   pnpm dev

   # Or start specific apps
   pnpm dev:web      # Web app on http://localhost:3000
   pnpm dev:landing  # Landing page on http://localhost:3001
   pnpm dev:mobile   # Mobile app with Expo
   ```

## 📱 Apps

### Web App (`apps/web`)
- **Port**: 3000
- **Tech**: Next.js 15, Supabase, Stripe, i18n
- **Features**: Complete SaaS platform with authentication, payments, dashboard

### Landing Page (`apps/landing`)
- **Port**: 3001
- **Tech**: Next.js 15, Tailwind CSS
- **Features**: Marketing website, lead generation, product showcase

### Mobile App (`apps/mobile`)
- **Tech**: Expo, React Native
- **Features**: Native mobile experience, cross-platform compatibility

## 📦 Packages

### UI (`packages/ui`)
Shared React components used across web and mobile apps.

### Config (`packages/config`)
Shared configuration files (ESLint, TypeScript, Tailwind).

### Database (`packages/database`)
Database schemas, types, and utilities.

### Auth (`packages/auth`)
Shared authentication logic and utilities.

### Utils (`packages/utils`)
Common utility functions and helpers.

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev                    # Start all apps
pnpm dev:web               # Start web app only
pnpm dev:landing           # Start landing page only
pnpm dev:mobile            # Start mobile app only

# Building
pnpm build                 # Build all apps
pnpm build --filter=@cenety/web  # Build specific app

# Testing & Quality
pnpm test                  # Run all tests
pnpm lint                  # Lint all packages
pnpm type-check           # Type check all packages
pnpm format               # Format code

# Utilities
pnpm clean                # Clean all build artifacts
```

### Adding New Packages

1. Create new package directory in `packages/`
2. Add `package.json` with `@cenety/package-name`
3. Update workspace dependencies as needed

### Adding Dependencies

```bash
# Add to specific app
pnpm add <package> --filter=@cenety/web

# Add to workspace root
pnpm add <package> -w

# Add to shared package
pnpm add <package> --filter=@cenety/ui
```

## 🔧 Configuration

### Environment Variables

Each app has its own environment configuration:

- `apps/web/.env.local` - Web app environment
- `apps/landing/.env.local` - Landing page environment  
- `apps/mobile/.env.local` - Mobile app environment

### Shared Configuration

- `turbo.json` - Turborepo pipeline configuration
- `pnpm-workspace.yaml` - Workspace package definitions
- `packages/config/` - Shared ESLint, TypeScript, Tailwind configs

## 📚 Documentation

- [Web App Setup](./apps/web/README.md)
- [Landing Page Setup](./apps/landing/README.md)
- [Mobile App Setup](./apps/mobile/README.md)
- [Supabase Setup](./apps/web/README-SETUP-SUPABASE.md)
- [Stripe Setup](./apps/web/STRIPE-SETUP-GUIDE.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting: `pnpm test && pnpm lint`
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details. 