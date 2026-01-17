# SEO Optimization Guide

## Overview

This document outlines SEO optimizations implemented in the Next.js application, including structured data, sitemaps, and meta tags.

## Implemented Features

### 1. Structured Data (JSON-LD)

Structured data helps search engines understand your content better, leading to rich snippets in search results.

**Available Schemas:**
- Organization
- Article (for blog posts)
- WebSite
- BreadcrumbList
- Product (for pricing)
- SoftwareApplication

**Usage:**

```tsx
import { StructuredData } from "@/components/structured-data";
import { generateArticleSchema } from "@/lib/structured-data";

// In your page component
<StructuredData
  data={generateArticleSchema({
    title: "Blog Post Title",
    description: "Blog post description",
    image: "/blog-image.jpg",
    datePublished: "2025-01-16",
    dateModified: "2025-01-16",
    authorName: "Author Name",
  })}
/>
```

### 2. Dynamic Sitemap

The sitemap automatically includes:
- All static routes (home, pricing, features, etc.)
- All published blog posts
- Multi-language support (en, de)

**Location:** `app/sitemap.ts`

The sitemap is automatically generated and available at `/sitemap.xml`.

### 3. Meta Tags

Meta tags are configured via `constructMetadata()`:

```typescript
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Page Title",
  description: "Page description",
  image: "/og-image.jpg",
  keywords: ["keyword1", "keyword2"],
});
```

**Includes:**
- Open Graph tags
- Twitter Card tags
- Robots meta tags
- Canonical URLs

### 4. Open Graph Images

Open Graph images are automatically configured for:
- Homepage
- Blog posts
- Pricing page
- Feature pages

**Best Practices:**
- Size: 1200x630px
- Format: PNG or JPG
- Include text overlay for better engagement

## Implementation Examples

### Blog Post Page

```tsx
import { StructuredData } from "@/components/structured-data";
import { generateArticleSchema } from "@/lib/structured-data";

export default async function BlogPostPage({ params }) {
  const post = await getBlogPost(params.slug);

  return (
    <>
      <StructuredData
        data={generateArticleSchema({
          title: post.title,
          description: post.description,
          image: post.image,
          datePublished: post.created_at,
          dateModified: post.updated_at,
          authorName: post.authors[0],
        })}
      />
      {/* Page content */}
    </>
  );
}
```

### Homepage

```tsx
import { StructuredData } from "@/components/structured-data";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
} from "@/lib/structured-data";

export default function HomePage() {
  return (
    <>
      <StructuredData data={generateOrganizationSchema()} />
      <StructuredData data={generateWebSiteSchema()} />
      {/* Page content */}
    </>
  );
}
```

### Pricing Page

```tsx
import { StructuredData } from "@/components/structured-data";
import { generateProductSchema } from "@/lib/structured-data";

export default function PricingPage() {
  return (
    <>
      <StructuredData
        data={generateProductSchema({
          name: "Pro Plan",
          description: "Professional features",
          price: 29,
          currency: "USD",
        })}
      />
      {/* Page content */}
    </>
  );
}
```

## Testing

### Google Rich Results Test

Test your structured data:
1. Visit: https://search.google.com/test/rich-results
2. Enter your page URL
3. Check for errors or warnings

### Schema.org Validator

Validate JSON-LD:
1. Visit: https://validator.schema.org/
2. Paste your JSON-LD code
3. Check for validation errors

### Sitemap Testing

Test your sitemap:
1. Visit: `https://yourdomain.com/sitemap.xml`
2. Verify all routes are included
3. Check lastModified dates
4. Validate XML structure

## Best Practices

### 1. Structured Data

- **Always include required fields**: Each schema type has required fields
- **Use correct types**: Choose the most specific schema type
- **Keep data accurate**: Ensure dates, prices, and descriptions are current
- **Test regularly**: Use Google's Rich Results Test

### 2. Sitemap

- **Update regularly**: Include new blog posts automatically
- **Set priorities**: Homepage = 1.0, important pages = 0.8, blog posts = 0.7
- **Set changeFrequency**: Static pages = "weekly", blog posts = "monthly"
- **Include lastModified**: Helps search engines know when to re-crawl

### 3. Meta Tags

- **Unique titles**: Each page should have a unique title
- **Descriptive descriptions**: 150-160 characters, include keywords
- **Relevant images**: Use high-quality images for Open Graph
- **Keywords**: Include relevant keywords naturally

### 4. Canonical URLs

- **One canonical per page**: Prevents duplicate content issues
- **Include locale**: For multi-language sites
- **Use absolute URLs**: Full URL including protocol and domain

## Monitoring

### Google Search Console

Monitor SEO performance:
1. Submit sitemap: `/sitemap.xml`
2. Check coverage: Ensure all pages are indexed
3. Monitor performance: Track impressions and clicks
4. Fix issues: Address any crawl errors

### Analytics

Track SEO metrics:
- Organic traffic
- Keyword rankings
- Click-through rates
- Bounce rates

## Common Issues

### Structured Data Not Showing

**Problem**: Rich snippets not appearing in search results.

**Solutions**:
1. Validate JSON-LD syntax
2. Check required fields are present
3. Ensure content matches structured data
4. Wait for Google to re-crawl (can take days/weeks)

### Sitemap Not Updating

**Problem**: New blog posts not in sitemap.

**Solutions**:
1. Check `getPublishedBlogPosts()` function
2. Verify blog posts are marked as published
3. Clear Next.js cache
4. Rebuild and redeploy

### Duplicate Content

**Problem**: Same content appearing with different URLs.

**Solutions**:
1. Use canonical URLs
2. Ensure proper locale handling
3. Use 301 redirects for old URLs
4. Configure robots.txt properly

## Resources

- [Google Structured Data](https://developers.google.com/search/docs/appearance/structured-data)
- [Schema.org](https://schema.org/)
- [Next.js Metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
