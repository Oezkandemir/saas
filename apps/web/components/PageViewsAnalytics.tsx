import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, BarChart3, ExternalLink, Eye } from "lucide-react";

import { Button } from "@/components/alignui/actions/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/alignui/data-display/card";

// Interface for API response
interface PageViewsData {
  pages: Array<{
    slug: string;
    view_count: number;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
}

async function fetchPageViews(limit: number = 5): Promise<PageViewsData> {
  const response = await fetch(`/api/analytics/page-views?limit=${limit}`);
  if (!response.ok) {
    throw new Error("Failed to fetch page views");
  }
  return response.json();
}

interface PageViewsAnalyticsProps {
  limit?: number;
}

/**
 * A component that displays page analytics, showing the most viewed pages
 *
 * @param limit - The number of top pages to show
 */
export function PageViewsAnalytics({ limit = 5 }: PageViewsAnalyticsProps) {
  const { data, isLoading, error } = useQuery<PageViewsData>({
    queryKey: ["pageViews", limit],
    queryFn: () => fetchPageViews(limit),
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 size-5" />
            Page Views
          </CardTitle>
          <CardDescription>Loading analytics data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: limit }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center justify-between py-2"
              >
                <div className="h-5 w-2/3 rounded bg-muted"></div>
                <div className="h-5 w-16 rounded bg-muted"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">
            Error Loading Analytics
          </CardTitle>
          <CardDescription>Failed to load page view analytics.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalViews = data.total || 0;
  const topPages = data.pages || [];

  // Function to format URL for display
  const formatSlug = (slug: string) => {
    return slug === "/" ? "Homepage" : slug.replace(/^\//, "");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="mr-2 size-5" />
          Page Views
        </CardTitle>
        <CardDescription>
          {totalViews.toLocaleString()} total views across all pages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {topPages.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No page views recorded yet.
            </p>
          ) : (
            topPages.map((page) => (
              <div
                key={page.slug}
                className="flex items-center justify-between border-b py-2 last:border-0"
              >
                <Link
                  href={page.slug}
                  className="flex max-w-[70%] items-center truncate text-sm hover:underline"
                >
                  {formatSlug(page.slug)}
                  <ArrowUpRight className="ml-1 size-3" />
                </Link>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Eye className="mr-1 size-4" />
                  {page.view_count.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="ghost" size="sm">
          <Link href="/dashboard/analytics">
            <span className="flex items-center">
              View All Analytics
              <ExternalLink className="ml-1 size-3" />
            </span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
