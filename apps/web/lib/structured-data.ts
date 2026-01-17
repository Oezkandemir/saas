import { siteConfig } from "@/config/site";

/**
 * Structured Data (JSON-LD) Helpers
 *
 * Provides functions to generate JSON-LD structured data for SEO
 */

export interface OrganizationSchema {
  "@context"?: "https://schema.org";
  "@type"?: "Organization";
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
}

export interface ArticleSchema {
  "@context": "https://schema.org";
  "@type": "Article";
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  author: {
    "@type": "Person" | "Organization";
    name: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    logo: {
      "@type": "ImageObject";
      url: string;
    };
  };
}

export interface WebSiteSchema {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  description: string;
  potentialAction: {
    "@type": "SearchAction";
    target: {
      "@type": "EntryPoint";
      urlTemplate: string;
    };
    "query-input": string;
  };
}

export interface BreadcrumbSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(
  options?: Partial<OrganizationSchema>
): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: options?.name || siteConfig.name,
    url: options?.url || siteConfig.url,
    logo: options?.logo || `${siteConfig.url}/logo.png`,
    description: options?.description || siteConfig.description,
    sameAs: options?.sameAs || [],
  };
}

/**
 * Generate Article schema for blog posts
 */
export function generateArticleSchema({
  title,
  description,
  image,
  datePublished,
  dateModified,
  authorName = "mickasmt",
  authorType = "Person",
}: {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  authorName?: string;
  authorType?: "Person" | "Organization";
}): ArticleSchema {
  const fullImageUrl = image.startsWith("http")
    ? image
    : `${siteConfig.url}${image}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: fullImageUrl,
    datePublished,
    dateModified,
    author: {
      "@type": authorType,
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/logo.png`,
      },
    },
  };
}

/**
 * Generate WebSite schema
 */
export function generateWebSiteSchema(searchUrl?: string): WebSiteSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          searchUrl || `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate Breadcrumb schema
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): BreadcrumbSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http")
        ? item.url
        : `${siteConfig.url}${item.url}`,
    })),
  };
}

/**
 * Generate Product schema (for pricing page)
 */
export function generateProductSchema({
  name,
  description,
  price,
  currency = "USD",
  availability = "https://schema.org/InStock",
}: {
  name: string;
  description: string;
  price: number;
  currency?: string;
  availability?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: currency,
      availability,
    },
  };
}

/**
 * Generate SoftwareApplication schema
 */
export function generateSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      ratingCount: "100",
    },
  };
}

/**
 * Render JSON-LD script tag
 */
export function renderJsonLd(data: object): string {
  return `<script type="application/ld+json">${JSON.stringify(data, null, 2)}</script>`;
}
