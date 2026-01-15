import type {
  ArticleSchema,
  BreadcrumbSchema,
  OrganizationSchema,
  WebSiteSchema,
} from "@/lib/structured-data";

interface StructuredDataProps {
  data:
    | OrganizationSchema
    | ArticleSchema
    | WebSiteSchema
    | BreadcrumbSchema
    | object;
}

/**
 * StructuredData Component
 *
 * Renders JSON-LD structured data for SEO
 */
export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data, null, 2) }}
    />
  );
}
