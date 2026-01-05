import { Metadata } from "next";

import { constructMetadata } from "@/lib/utils";
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = constructMetadata({
  title: "Changelog",
  description: "The latest updates and improvements to Cenety",
});

export default async function ChangelogPage() {
  const releases = [
    {
      version: "2.0.0",
      date: "June 15, 2023",
      title: "Major Release - Version 2.0",
      description:
        "A complete rebuild with Next.js 15, improved UI, and enhanced features",
      changes: [
        {
          type: "feature",
          desc: "Upgraded to Next.js 15 with improved performance",
        },
        {
          type: "feature",
          desc: "Added Supabase integration for more flexible database operations",
        },
        {
          type: "feature",
          desc: "Implemented Next-Intl for better internationalization support",
        },
        {
          type: "feature",
          desc: "Added Contentlayer for improved content management",
        },
        {
          type: "improvement",
          desc: "Redesigned dashboard with better user experience",
        },
        {
          type: "improvement",
          desc: "Enhanced Stripe integration with more payment options",
        },
        {
          type: "fix",
          desc: "Fixed authentication issues with email providers",
        },
        {
          type: "fix",
          desc: "Resolved styling inconsistencies across different browsers",
        },
      ],
    },
    {
      version: "1.5.0",
      date: "March 10, 2023",
      title: "Feature Update",
      description: "New features and improvements to enhance user experience",
      changes: [
        { type: "feature", desc: "Added multi-factor authentication support" },
        { type: "feature", desc: "Implemented dark mode toggle" },
        { type: "improvement", desc: "Improved dashboard loading performance" },
        { type: "improvement", desc: "Enhanced mobile responsiveness" },
        { type: "fix", desc: "Fixed subscription cancellation flow" },
      ],
    },
    {
      version: "1.4.0",
      date: "January 15, 2023",
      title: "Dashboard Enhancements",
      description: "Improvements to the dashboard UI and functionality",
      changes: [
        { type: "feature", desc: "Added custom dashboard widgets" },
        { type: "feature", desc: "Implemented user activity logs" },
        { type: "improvement", desc: "Enhanced data visualization components" },
        { type: "fix", desc: "Fixed billing information display issues" },
      ],
    },
    {
      version: "1.3.0",
      date: "November 5, 2022",
      title: "Stripe Integration Update",
      description: "Improvements to payment processing and billing",
      changes: [
        { type: "feature", desc: "Added support for more payment methods" },
        { type: "feature", desc: "Implemented tiered pricing capabilities" },
        { type: "improvement", desc: "Enhanced subscription management UI" },
        { type: "fix", desc: "Fixed payment webhook handling" },
      ],
    },
    {
      version: "1.2.0",
      date: "September 20, 2022",
      title: "Authentication Enhancements",
      description: "Improved user authentication and security",
      changes: [
        { type: "feature", desc: "Added social login options" },
        { type: "feature", desc: "Implemented password strength requirements" },
        { type: "improvement", desc: "Enhanced session management" },
        { type: "fix", desc: "Fixed account recovery flow" },
      ],
    },
    {
      version: "1.1.0",
      date: "August 1, 2022",
      title: "Performance Update",
      description: "Performance improvements and bug fixes",
      changes: [
        { type: "improvement", desc: "Optimized database queries" },
        { type: "improvement", desc: "Reduced initial load time" },
        { type: "improvement", desc: "Enhanced caching strategy" },
        { type: "fix", desc: "Fixed memory leaks in components" },
      ],
    },
    {
      version: "1.0.0",
      date: "June 1, 2022",
      title: "Initial Release",
      description: "First public release of Cenety",
      changes: [
        { type: "feature", desc: "Core SaaS functionality" },
        { type: "feature", desc: "User authentication and management" },
        { type: "feature", desc: "Stripe subscription integration" },
        { type: "feature", desc: "Dashboard and settings" },
      ],
    },
  ];

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Changelog</h1>
        <p className="text-xl text-muted-foreground">
          The latest updates and improvements to Cenety
        </p>
      </div>

      <div className="space-y-12">
        {releases.map((release, index) => (
          <div key={index} className="space-y-4">
            <div className="flex items-baseline justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{release.version}</h2>
                  <Badge variant="outline">{release.date}</Badge>
                </div>
                <h3 className="text-lg font-semibold">{release.title}</h3>
                <p className="text-muted-foreground">{release.description}</p>
              </div>
            </div>

            <div className="space-y-3 pl-4">
              {release.changes.map((change, changeIndex) => (
                <div key={changeIndex} className="flex items-start gap-2">
                  <Badge
                    variant={
                      change.type === "feature"
                        ? "default"
                        : change.type === "improvement"
                          ? "secondary"
                          : "outline"
                    }
                    className="mt-0.5 whitespace-nowrap"
                  >
                    {change.type === "feature"
                      ? "New"
                      : change.type === "improvement"
                        ? "Improved"
                        : "Fixed"}
                  </Badge>
                  <p>{change.desc}</p>
                </div>
              ))}
            </div>

            {index < releases.length - 1 && <Separator className="mt-6" />}
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-muted p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold">Subscribe to updates</h2>
        <p className="mb-4 text-muted-foreground">
          Get notified about new features and improvements.
        </p>
        <div className="mx-auto flex w-full max-w-sm items-center space-x-2">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
}
