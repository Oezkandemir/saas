import type { SidebarNavItem, SiteConfig } from "types";
import { env } from "@/env.mjs";

const site_url = env.NEXT_PUBLIC_APP_URL;

export const siteConfig: SiteConfig = {
  name: "Cenety",
  description:
    "Get your project off to an explosive start with Cenety! Harness the power of Next.js 14, Prisma, Neon, Auth.js v5, Resend, React Email, Shadcn/ui and Stripe to build your next big thing.",
  url: site_url,
  ogImage: `${site_url}/og.jpg`,
  links: {
    twitter: env.NEXT_PUBLIC_TWITTER_URL || "https://twitter.com/miickasmt",
    github:
      env.NEXT_PUBLIC_GITHUB_URL ||
      "https://github.com/mickasmt/next-saas-stripe-starter",
  },
  mailSupport: env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@cenety.com",
};

export const footerLinks: SidebarNavItem[] = [
  {
    title: "Company",
    items: [
      { title: "About", href: "/company/about" },
      { title: "Terms", href: "/terms" },
      { title: "Privacy", href: "/privacy" },
      { title: "Imprint", href: "/imprint" },
    ],
  },
  {
    title: "Product",
    items: [
      { title: "Security", href: "/product/security" },
      { title: "Customization", href: "/product/customization" },
      { title: "Changelog", href: "/product/changelog" },
    ],
  },
  {
    title: "Docs",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Installation", href: "/docs/installation" },
      { title: "Components", href: "/docs/components" },
      { title: "Code Blocks", href: "/docs/code-blocks" },
    ],
  },
];
