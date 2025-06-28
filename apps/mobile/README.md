# Cenety Mobile App

React Native app built with Expo and React Native Reusables.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:

Create a `.env` file in the root directory (`/Users/dmr/Desktop/next-saas-stripe-starter-main/`) with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The mobile app will automatically use the same Supabase credentials as the web app.

## Running the App

```bash
# Start the development server
pnpm start

# Run on iOS simulator
pnpm ios

# Run on Android emulator  
pnpm android
```

## Features

- 🔐 Authentication with Supabase (same database as web app)
- 🎨 React Native Reusables UI components
- 🌙 Dark/Light theme support
- 📱 User avatar and authentication modal
- 🔄 Auto-sync with web app user data

## Authentication

The app uses the same Supabase authentication as the web app:
- Users can sign in/out using the avatar icon in the header
- User avatar is displayed when logged in
- User data is synchronized between web and mobile apps 