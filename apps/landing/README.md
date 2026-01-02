# Cenety Landing Page

Marketing landing page for Cenety with internationalization (i18n) support and SEO optimization.

## Features

- ✅ **SEO Optimized**: Comprehensive meta tags, structured data (JSON-LD), and semantic HTML
- ✅ **Internationalization**: Full support for English and German
- ✅ **Modern Design**: Beautiful, responsive design with Tailwind CSS
- ✅ **Performance**: Optimized for fast loading and great user experience

## Setup

### Install Dependencies

```bash
pnpm install
```

Make sure to install `next-intl`:

```bash
cd apps/landing
pnpm add next-intl
```

### Development

```bash
pnpm dev
```

The landing page will be available at:
- English: http://localhost:3001/en
- German: http://localhost:3001/de

The root URL (`/`) will automatically redirect to the default locale (`/en`).

## Structure

```
apps/landing/
├── src/
│   ├── app/
│   │   ├── [locale]/          # Locale-specific routes
│   │   │   ├── layout.tsx     # Locale layout with SEO metadata
│   │   │   └── page.tsx       # Landing page component
│   │   └── layout.tsx         # Root layout
│   ├── i18n/
│   │   ├── routing.ts         # i18n routing configuration
│   │   └── request.ts         # Request configuration for next-intl
│   └── middleware.ts          # Middleware for locale detection
├── messages/
│   ├── en.json                # English translations
│   └── de.json                # German translations
└── next.config.js             # Next.js config with next-intl plugin
```

## SEO Features

### Meta Tags
- Dynamic title and description based on locale
- Open Graph tags for social media sharing
- Twitter Card metadata
- Canonical URLs and alternate language links

### Structured Data
- JSON-LD schema for SoftwareApplication
- Aggregate ratings
- Pricing information

### Content Optimization
- Semantic HTML structure
- Proper heading hierarchy (H1, H2, H3)
- Alt text for images (when added)
- Descriptive link text

## Adding New Languages

1. Add the locale to `src/i18n/routing.ts`:
```typescript
export const routing = defineRouting({
  locales: ["en", "de", "fr"], // Add new locale
  defaultLocale: "en",
});
```

2. Create a new translation file in `messages/` (e.g., `messages/fr.json`)

3. Copy the structure from `messages/en.json` and translate the content

4. Update the middleware matcher if needed

## Translation Keys

All translations are organized under the `Landing` namespace:

- `Landing.hero.*` - Hero section content
- `Landing.features.*` - Features section
- `Landing.benefits.*` - Benefits section
- `Landing.testimonials.*` - Customer testimonials
- `Landing.cta.*` - Call-to-action section
- `Landing.seo.*` - SEO metadata

## Building

```bash
pnpm build
```

## Production

The landing page is optimized for production with:
- Static generation for all locales
- Optimized images and assets
- SEO-friendly URLs
- Fast page loads





