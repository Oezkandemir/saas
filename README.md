# Next SaaS Stripe Starter

<div align="center">
  <img alt="Next SaaS Stripe Starter" src="public/_static/og.jpg" width="800" />
  <p>A complete SaaS starter kit with Next.js 15, Supabase, Stripe Subscriptions, i18n, MDX, and more.</p>
  <p>
    <a href="https://next-saas-stripe-starter.vercel.app">Live Demo</a> ·
    <a href="#getting-started">Get Started</a> ·
    <a href="#tech-stack">Tech Stack</a> ·
    <a href="#documentation">Documentation</a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/Next.js-15-blue" alt="Next.js 15" />
    <img src="https://img.shields.io/badge/Supabase-Latest-green" alt="Supabase" />
    <img src="https://img.shields.io/badge/Stripe-Integrated-purple" alt="Stripe" />
    <img src="https://img.shields.io/badge/i18n-Supported-yellow" alt="i18n" />
    <img src="https://img.shields.io/badge/MDX-Content-red" alt="MDX" />
    <img src="https://img.shields.io/badge/Shadcn-UI-indigo" alt="Shadcn UI" />
  </p>
</div>

## ✨ Features

<table>
  <tr>
    <td>
      <h3>🔐 Authentication</h3>
      <p>Complete authentication system with Supabase. Login, register, password reset, and more.</p>
    </td>
    <td>
      <h3>💳 Subscription Payments</h3>
      <p>Fully integrated Stripe subscription payments with multiple plans and billing cycles.</p>
    </td>
  </tr>
  <tr>
    <td>
      <h3>📊 Dashboard</h3>
      <p>Beautiful user dashboard with subscription management, settings, and analytics.</p>
    </td>
    <td>
      <h3>🌐 Internationalization</h3>
      <p>Built-in i18n support with next-intl for multiple languages and automated translations.</p>
    </td>
  </tr>
  <tr>
    <td>
      <h3>📝 Blog with MDX</h3>
      <p>Content management with MDX for publishing beautiful blog posts with code highlighting.</p>
    </td>
    <td>
      <h3>✉️ Email Templates</h3>
      <p>Ready-to-use email templates with React Email and Resend for sending beautiful emails.</p>
    </td>
  </tr>
  <tr>
    <td>
      <h3>👨‍💼 Admin Dashboard</h3>
      <p>Complete admin panel for managing users, subscriptions, and content.</p>
    </td>
    <td>
      <h3>📱 Responsive Design</h3>
      <p>Fully responsive design that looks great on all devices with Tailwind CSS.</p>
    </td>
  </tr>
</table>

## 📋 About This Project

Next SaaS Stripe Starter is a comprehensive solution for launching your SaaS business with minimal setup time. This project combines the best modern web technologies to provide you with a solid foundation for building subscription-based applications.

### Why This Starter?

- **Production Ready**: Built with scalability in mind from day one
- **Developer Experience**: Clean code, consistent patterns, and extensive documentation
- **User Experience**: Beautiful UI with responsive design and intuitive navigation
- **Business Model Built-in**: Subscription system ready to generate revenue
- **Modern Stack**: Uses the latest stable versions of all frameworks and libraries

### Key Benefits

- Save 100+ hours of development time
- Start with best practices already implemented
- Focus on your unique business logic instead of boilerplate
- Launch faster with a complete authentication and payment system
- Scale easily with cloud-native architecture

## 🚀 Getting Started <a name="getting-started"></a>

### 1. Clone the repository

```bash
npx create-next-app my-saas-project --example "https://github.com/mickasmt/next-saas-stripe-starter"
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase and Stripe credentials.

### 4. Set up Supabase

Follow the instructions in the Supabase setup guide to configure your database:

```bash
npm run setup-supabase
```

This will set up the necessary tables, functions, and triggers in your Supabase project.

### 5. Configure Stripe

Set up your Stripe products and prices according to the Stripe setup guide:

```bash
npm run setup-env
```

Remember to use price IDs (starting with `price_`) in your environment variables, not product IDs.

### 6. Start the development server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## 🛠️ Tech Stack <a name="tech-stack"></a>

### Frontend

- **Next.js 15** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Reusable UI components built with Radix UI
- **next-intl** - i18n solution for Next.js
- **Framer Motion** - Animation library
- **React Hook Form** - Form validation
- **Lucide Icons** - Beautiful icons

### Backend

- **Supabase Auth** - Authentication and user management
- **next-auth** - Authentication for Next.js
- **React Email** - Email templates
- **Resend** - Email delivery service
- **API Routes** - Serverless API endpoints
- **Edge Functions** - Fast, globally distributed functions

### Database

- **Supabase** - PostgreSQL database as a service
- **Row Level Security** - Secure database access
- **Database Functions** - Custom PostgreSQL functions
- **Database Triggers** - Automate database operations

### Payments

- **Stripe** - Payment processing
- **Subscription Management** - Recurring billing
- **Webhook Integration** - Real-time payment events
- **Customer Portal** - Self-service subscription management

### Deployment

- **Vercel** - Hosting and deployment
- **Edge Network** - Global CDN
- **Analytics** - Insights on usage and performance
- **Environment Variables** - Secure configuration

## 🌍 Internationalization

> **Info:** This project uses the inlang ecosystem for internationalization (i18n) and automated translation processes.

### Available Commands

```bash
# Synchronize translation keys
npm run i18n:sync

# Validate your inlang configuration
npm run i18n:validate

# Machine translate missing translations
npm run i18n:translate
```

### Supported Languages

- English (source language)
- German (target language)
- Add more languages by updating the configuration

## 💳 Subscription Management

<div align="center">
  <img alt="Subscription Plans" src="public/_static/og.jpg" width="800" />
</div>

### Available Plans

- **Starter**: Free tier with basic features
- **Pro**: $15/month or $144/year with advanced features
- **Business**: $30/month or $300/year with premium features

### Features Comparison

| Feature | Starter | Pro | Business |
| --- | :---: | :---: | :---: |
| Monthly Posts | 100 | 500 | Unlimited |
| Analytics | Basic | Advanced | Real-time |
| Templates | Standard | Business | All + Custom |
| Customer Support | Limited | Priority | 24/7 |
| API Access | Limited | Standard | Enhanced |
| Custom Branding | ❌ | ✅ | ✅ |
| Onboarding | ❌ | Self-service | Assisted |

## 📚 Documentation <a name="documentation"></a>

### Setup Guides

<table>
  <tr>
    <td>
      <h4>🔧 Supabase Setup</h4>
      <p>Our <a href="README-SETUP-SUPABASE.md">Supabase Setup Guide</a> provides detailed instructions for:</p>
      <ul>
        <li>Creating users table with proper schema</li>
        <li>Setting up Row-Level Security (RLS) policies</li>
        <li>Creating user sync triggers</li>
        <li>Adding helper functions for Stripe integration</li>
        <li>Syncing existing auth users</li>
      </ul>
    </td>
    <td>
      <h4>💳 Stripe Integration</h4>
      <p>The <a href="STRIPE-SETUP-GUIDE.md">Stripe Setup Guide</a> walks you through:</p>
      <ul>
        <li>Creating products and price IDs</li>
        <li>Setting up environment variables</li>
        <li>Testing subscription flows</li>
        <li>Configuring webhooks</li>
        <li>Troubleshooting payment issues</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td>
      <h4>🌐 Internationalization Guide</h4>
      <p>Learn about our i18n implementation in the <a href="I18N.md">I18N Guide</a>, covering:</p>
      <ul>
        <li>Translation file structure</li>
        <li>Adding new translations</li>
        <li>Command workflows</li>
        <li>Automated translation</li>
        <li>Best practices</li>
      </ul>
    </td>
    <td>
      <h4>📝 Implementation Notes</h4>
      <p>Check <a href="IMPLEMENTATION_NOTES.md">Implementation Notes</a> for detailed information about:</p>
      <ul>
        <li>Architecture decisions</li>
        <li>Component structure</li>
        <li>Authentication flow details</li>
        <li>Subscription management logic</li>
        <li>Performance optimization techniques</li>
      </ul>
    </td>
  </tr>
</table>

### Project Structure

```
next-saas-stripe-starter/
├── actions/            # Server actions for Next.js App Router
├── app/                # Next.js App Router pages and layouts
│   ├── api/            # API routes 
│   ├── auth/           # Authentication routes
│   └── [locale]/       # Localized routes
│       ├── (auth)/     # Authentication pages
│       ├── (docs)/     # Documentation pages
│       ├── (marketing)/# Marketing pages and blog
│       └── (protected)/# Protected dashboard and admin pages
├── components/         # Reusable UI components
├── config/             # Site configuration
├── emails/             # React Email templates
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and shared logic
├── messages/           # i18n translation files
├── public/             # Static assets
├── styles/             # Global styles
├── supabase/           # Supabase configuration
└── types/              # TypeScript type definitions
```

### Authentication Flow

The project uses Supabase Authentication with a custom integration to ensure users are properly synced between auth.users and your application's users table. Key authentication endpoints include:

- `/api/auth/signup` - Register a new user
- `/api/auth/signin` - Sign in an existing user
- `/api/auth/signout` - Sign out the current user
- `/api/auth/reset-password` - Send a password reset email

### Webhook Implementation

The Stripe integration relies on webhooks to keep subscription status in sync. The webhook handler processes these key events:

- `checkout.session.completed` - When a user completes checkout
- `invoice.payment_succeeded` - When a subscription payment is successful
- `customer.subscription.deleted` - When a subscription is canceled

## 🧩 Key Components

```tsx
// Example of authenticated route protection
// app/[locale]/(protected)/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session) {
    redirect("/signin");
  }
  
  return <>{children}</>;
}
```

## 🛣️ Roadmap

- [ ] Add multi-team support with team roles and permissions
- [ ] Enhance admin dashboard with detailed analytics
- [ ] Add Stripe tax compliance features
- [ ] Implement content management system (CMS)
- [ ] Add advanced user roles and permissions
- [ ] Integrate webhooks for third-party applications
- [ ] Add more payment providers (PayPal, Wise, etc.)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ❓ FAQ

<details>
<summary><strong>Can I use this starter for commercial projects?</strong></summary>
Yes! This project is licensed under the MIT License, which allows for commercial use.
</details>

<details>
<summary><strong>How do I add more languages?</strong></summary>
Add a new language file in the messages directory and update the inlang configuration. See the I18N.md guide for detailed instructions.
</details>

<details>
<summary><strong>Can I use a different database instead of Supabase?</strong></summary>
Yes, but you'll need to modify the authentication and data access layers accordingly. The project is built with Supabase in mind, but the architecture is modular enough to swap components.
</details>

<details>
<summary><strong>How do I deploy this to production?</strong></summary>
The recommended way is deploying to Vercel. Just connect your repository to Vercel, set up the environment variables, and deploy. For detailed instructions, see the deployment section in the documentation.
</details>

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 👨‍💻 Author

Created by [@miickasmt](https://twitter.com/miickasmt) in 2023.

## 🙏 Credits

This project was inspired by:
- Shadcn's [Taxonomy](https://github.com/shadcn-ui/taxonomy)
- Steven Tey's [Precedent](https://github.com/steven-tey/precedent)
- Antonio Erdeljac's [Next 13 AI SaaS](https://github.com/AntonioErdeljac/next13-ai-saas)
