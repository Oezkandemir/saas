# create-cenety-app

A CLI tool to quickly create a new Cenety SaaS application with Next.js, Expo, and more.

## 🚀 Quick Start

```bash
# Using npm
npm create cenety-app@latest my-saas-app

# Using pnpm
pnpm create cenety-app@latest my-saas-app

# Using yarn
yarn create cenety-app@latest my-saas-app

# Using npx
npx create-cenety-app@latest my-saas-app
```

## 📋 What's Included

### 🔥 Full Stack Template (Default)
- **Next.js 15** - Web application with authentication, dashboard, and payments
- **Expo/React Native** - Cross-platform mobile app 
- **Landing Page** - Marketing website
- **Turborepo** - Monorepo management
- **Shared Packages** - UI components, utilities, configuration

### 🛠️ Tech Stack
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Mobile**: Expo, React Native, NativeWind
- **Backend**: Supabase (Database, Auth, Storage)
- **Payments**: Stripe
- **UI**: Custom component library with dark/light mode
- **Deployment**: Vercel, Expo EAS

## 🎯 Usage

### Interactive Mode
```bash
npx create-cenety-app@latest
```

### With Options
```bash
npx create-cenety-app@latest my-app --template full --package-manager pnpm
```

### Available Options

| Option | Description | Choices | Default |
|--------|-------------|---------|---------|
| `--template` | Template to use | `full`, `web`, `mobile` | `full` |
| `--package-manager` | Package manager | `npm`, `pnpm`, `yarn` | `pnpm` |
| `--skip-install` | Skip dependency installation | - | `false` |
| `--skip-git` | Skip git initialization | - | `false` |

## 📁 Templates

### 🚀 Full Stack (`--template full`)
Complete SaaS ecosystem with all apps and packages:
```
my-app/
├── apps/
│   ├── web/           # Next.js SaaS app
│   ├── landing/       # Marketing site
│   └── mobile/        # Expo mobile app
├── packages/
│   ├── ui/            # Shared components
│   ├── config/        # Shared config
│   ├── database/      # DB schemas
│   ├── auth/          # Auth utilities
│   └── utils/         # Shared utilities
└── ...
```

### 💻 Web Only (`--template web`)
Web application with landing page:
```
my-app/
├── apps/
│   ├── web/           # Next.js SaaS app
│   └── landing/       # Marketing site
├── packages/
│   └── ...            # Shared packages
└── ...
```

### 📱 Mobile Only (`--template mobile`)
Expo mobile application:
```
my-app/
├── apps/
│   └── mobile/        # Expo mobile app
├── packages/
│   └── ...            # Shared packages
└── ...
```

## 🔧 Post-Installation Setup

After creating your app, follow these steps:

### 1. Navigate to your project
```bash
cd my-app
```

### 2. Install dependencies (if skipped)
```bash
pnpm install
```

### 3. Set up environment variables
```bash
# Copy example files
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env.local
```

### 4. Configure Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Update your `.env.local` files with your Supabase credentials
3. Run database migrations (see web app README)

### 5. Configure Stripe (Optional)
1. Create a Stripe account
2. Add your Stripe keys to `.env.local`
3. Set up webhooks (see Stripe setup guide)

### 6. Start development
```bash
# Start all apps
pnpm dev

# Or start specific apps
pnpm dev:web      # http://localhost:3000
pnpm dev:landing  # http://localhost:3001
pnpm dev:mobile   # Expo development server
```

## 📱 Mobile Development

For mobile development, you'll need:

1. **Expo Go** app on your device, or
2. **iOS Simulator** (macOS only), or
3. **Android Emulator**

```bash
# Start mobile development
cd apps/mobile
npx expo start

# Open on specific platform
npx expo start --ios
npx expo start --android
```

## 🏗️ Building for Production

### Web Apps
```bash
# Build web app
pnpm build --filter=@cenety/web

# Build landing page
pnpm build --filter=@cenety/landing
```

### Mobile App
```bash
# Build for app stores
cd apps/mobile
npx expo build:ios
npx expo build:android

# Or use EAS Build
npx eas build --platform all
```

## 📚 Documentation

Each app includes detailed setup instructions:

- [Web App Setup](./apps/web/README.md)
- [Landing Page Setup](./apps/landing/README.md)  
- [Mobile App Setup](./apps/mobile/README.md)

## 🤝 Contributing

Found an issue or want to contribute? 

1. [Report bugs](https://github.com/yourusername/create-cenety-app/issues)
2. [Request features](https://github.com/yourusername/create-cenety-app/issues)
3. [Submit pull requests](https://github.com/yourusername/create-cenety-app/pulls)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ for the developer community</p>
  <p>
    <a href="https://github.com/yourusername/create-cenety-app">GitHub</a> ·
    <a href="https://npmjs.com/package/create-cenety-app">NPM</a>
  </p>
</div> 