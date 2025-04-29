<a href="https://next-saas-stripe-starter.vercel.app">
  <img alt="SaaS Starter" src="public/_static/og.jpg">
  <h1 align="center">Next SaaS Stripe Starter</h1>
</a>

<p align="center">
  Start at full speed with SaaS Starter !
</p>

<p align="center">
  <a href="https://twitter.com/miickasmt">
    <img src="https://img.shields.io/twitter/follow/miickasmt?style=flat&label=miickasmt&logo=twitter&color=0bf&logoColor=fff" alt="Mickasmt Twitter follower count" />
  </a>
</p>

<p align="center">
  <a href="#introduction"><strong>Introduction</strong></a> ·
  <a href="#installation"><strong>Installation</strong></a> ·
  <a href="#tech-stack--features"><strong>Tech Stack + Features</strong></a> ·
  <a href="#author"><strong>Author</strong></a> ·
  <a href="#credits"><strong>Credits</strong></a>
</p>
<br/>

## Introduction

Empower your next project with the stack of Next.js 14, Prisma, Neon, Auth.js v5, Resend, React Email, Shadcn/ui, and Stripe.
<br/>
All seamlessly integrated with the SaaS Starter to accelerate your development and saas journey.

## Installation

Clone & create this repo locally with the following command:

```bash
npx create-next-app my-saas-project --example "https://github.com/mickasmt/next-saas-stripe-starter"
```

Or, deploy with Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmickasmt%2Fnext-saas-stripe-starter)

### Steps

1. Install dependencies using pnpm:

```sh
pnpm install
```

2. Copy `.env.example` to `.env.local` and update the variables.

```sh
cp .env.example .env.local
```

3. Start the development server:

```sh
pnpm run dev
```

> [!NOTE]  
> I use [npm-check-updates](https://www.npmjs.com/package/npm-check-updates) package for update this project.
>
> Use this command for update your project: `ncu -i --format group`

## Roadmap
- [ ] Upgrade eslint to v9
- [ ] Add resend for success subscriptions

## Tech Stack + Features

https://github.com/mickasmt/next-saas-stripe-starter/assets/62285783/828a4e0f-30e3-4cfe-96ff-4dfd9cd55124

### Frameworks

- [Next.js](https://nextjs.org/) – React framework for building performant apps with the best developer experience
- [Auth.js](https://authjs.dev/) – Handle user authentication with ease with providers like Google, Twitter, GitHub, etc.
- [Prisma](https://www.prisma.io/) – Typescript-first ORM for Node.js
- [React Email](https://react.email/) – Versatile email framework for efficient and flexible email development

### Platforms

- [Vercel](https://vercel.com/) – Easily preview & deploy changes with git
- [Resend](https://resend.com/) – A powerful email framework for streamlined email development
- [Neon](https://neon.tech/) – Serverless Postgres with autoscaling, branching, bottomless storage and generous free tier.

### UI

- [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS framework for rapid UI development
- [Shadcn/ui](https://ui.shadcn.com/) – Re-usable components built using Radix UI and Tailwind CSS
- [Framer Motion](https://framer.com/motion) – Motion library for React to animate components with ease
- [Lucide](https://lucide.dev/) – Beautifully simple, pixel-perfect icons
- [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) – Optimize custom fonts and remove external network requests for improved performance
- [`ImageResponse`](https://nextjs.org/docs/app/api-reference/functions/image-response) – Generate dynamic Open Graph images at the edge

### Hooks and Utilities

- `useIntersectionObserver` – React hook to observe when an element enters or leaves the viewport
- `useLocalStorage` – Persist data in the browser's local storage
- `useScroll` – React hook to observe scroll position ([example](https://github.com/mickasmt/precedent/blob/main/components/layout/navbar.tsx#L12))
- `nFormatter` – Format numbers with suffixes like `1.2k` or `1.2M`
- `capitalize` – Capitalize the first letter of a string
- `truncate` – Truncate a string to a specified length
- [`use-debounce`](https://www.npmjs.com/package/use-debounce) – Debounce a function call / state update

### Code Quality

- [TypeScript](https://www.typescriptlang.org/) – Static type checker for end-to-end typesafety
- [Prettier](https://prettier.io/) – Opinionated code formatter for consistent code style
- [ESLint](https://eslint.org/) – Pluggable linter for Next.js and TypeScript

### Miscellaneous

- [Vercel Analytics](https://vercel.com/analytics) – Track unique visitors, pageviews, and more in a privacy-friendly way

## Author

Created by [@miickasmt](https://twitter.com/miickasmt) in 2023, released under the [MIT license](https://github.com/shadcn/taxonomy/blob/main/LICENSE.md).

## Credits

This project was inspired by shadcn's [Taxonomy](https://github.com/shadcn-ui/taxonomy), Steven Tey's [Precedent](https://github.com/steven-tey/precedent), and Antonio Erdeljac's [Next 13 AI SaaS](https://github.com/AntonioErdeljac/next13-ai-saas).

- Shadcn ([@shadcn](https://twitter.com/shadcn))
- Steven Tey ([@steventey](https://twitter.com/steventey))
- Antonio Erdeljac ([@YTCodeAntonio](https://twitter.com/AntonioErdeljac))

## Authentication

This project uses [Supabase Authentication](https://supabase.com/docs/guides/auth) for handling user sessions and authentication. The SQL migrations under `lib/supabase/migrations` create the necessary tables and relationships for the authentication system.

### Setting Up Authentication

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the Supabase dashboard
3. Run `npm run setup-env` to create a basic `.env.local` file
4. Run `npm run setup-supabase` to update the `.env.local` file with your Supabase credentials
5. Replace the placeholder values in `.env.local` with your actual Supabase details

### Authentication API Routes

- `/api/auth/signup` - Register a new user
- `/api/auth/signin` - Sign in an existing user
- `/api/auth/signout` - Sign out the current user
- `/api/auth/reset-password` - Send a password reset email

## Subscription Management

This project integrates with Stripe for subscription management. Users can choose between different plans (Starter, Pro, Business) on the pricing page. 

### Setting Up Subscription Management

1. **Configure Stripe Keys**: Ensure you have valid Stripe API keys set in your environment variables.

2. **Configure Stripe Customer Portal**: As an admin, visit the admin dashboard and use the "Configure Stripe Portal" button to set up the customer portal with the recommended settings. This step is essential for enabling users to manage their subscriptions directly through Stripe's secure interface.

3. **Test the Subscription Flow**: Use Stripe's test cards to test the entire subscription flow including:
   - Initial subscription
   - Upgrading/downgrading plans
   - Updating payment methods
   - Canceling subscriptions

### Test Customer Portal

In development and test environments, the application is configured to use a specific test customer portal:
```
https://billing.stripe.com/p/login/test_14kcMTbsj2hdbgQ288
```

This test portal URL is hard-coded in development mode to make testing easier. Users will see:
- A direct link to the test portal on the billing page
- The "Manage Subscription" button will open the test portal
- Simplified workflows that bypass actual Stripe API calls during development

In production, the application will use proper Stripe API calls to generate unique customer portal sessions.

### Managing Subscriptions

For users with active subscriptions, they will see a "Manage Subscription" button on the billing page that redirects them to the Stripe Customer Portal where they can:

- Update their payment method
- Change their subscription plan
- View invoice history
- Cancel their subscription

### Troubleshooting Subscription Issues

If you experience any of the following issues:
- Subscription payments are successful but not reflected in the UI
- Plan remains as "Starter" after upgrading
- Subscription data isn't updated in the database

You can use the following troubleshooting steps:

1. **Check your webhook setup**: Ensure your Stripe webhooks are correctly configured and pointing to your application's webhook endpoint at `/api/webhooks/stripe`. The webhook should have the following events enabled:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`

2. **Manual subscription sync**: If your subscription isn't showing up in the UI, visit your billing page and use the "Fix Subscription" button that appears for free users. This will attempt to sync your subscription status directly from Stripe.

3. **Check server logs**: Look for webhook event logs in your server logs to see if Stripe events are being received and processed correctly.

4. **Verify database records**: Check your database users table to see if the subscription fields are correctly populated:
   - `stripe_customer_id`
   - `stripe_subscription_id`
   - `stripe_price_id`
   - `stripe_current_period_end`

5. **Configure Stripe Portal**: If users are having trouble managing their subscriptions, make sure the Stripe customer portal is properly configured using the admin dashboard.
