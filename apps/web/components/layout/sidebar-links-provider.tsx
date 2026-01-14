"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminSidebarLinks } from "@/config/admin";
import { sidebarLinks } from "@/config/dashboard";
import { emailSidebarLinks } from "@/config/emails";
import { SearchCommand } from "@/components/dashboard/search-command";
import { TwoFactorSecurityBanner } from "@/components/security/two-factor-security-banner";
import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

import {
  DashboardSidebar,
  MobileSheetSidebar,
} from "./dashboard-sidebar-wrapper";
import { ScrollToTop } from "./scroll-to-top";
import { UserAccountNav } from "./user-account-nav";

interface SidebarLinksProviderProps {
  userRole?: string | null;
  siteName: string;
  children: React.ReactNode;
}

export function SidebarLinksProvider({
  userRole,
  siteName,
  children,
}: SidebarLinksProviderProps) {
  const pathname = usePathname();
  // Check if we're on an admin route (handles both /admin and /locale/admin)
  // Matches: /admin, /admin/, /en/admin, /de/admin, /en/admin/users, etc.
  const isAdminRoute =
    pathname?.includes("/admin") || pathname?.match(/\/[a-z]{2}\/admin/);
  
  // Check if we're on the emails page - use email-specific sidebar
  const isEmailsPage = pathname?.includes("/admin/emails") && !pathname?.includes("/admin/emails/inbound/");

  // Use email sidebar links if on emails page, admin sidebar links if on admin route and user is admin, otherwise use dashboard links
  let baseLinks = sidebarLinks;
  if (isEmailsPage && userRole === "ADMIN") {
    baseLinks = emailSidebarLinks;
  } else if (isAdminRoute && userRole === "ADMIN") {
    baseLinks = adminSidebarLinks;
  }

  // Filter sidebar links based on user role
  const filteredLinks = baseLinks.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      // If item requires authorization, check user role
      if (item.authorizeOnly) {
        // For admin items, check if user role is exactly "ADMIN"
        const requiredRole = String(item.authorizeOnly);
        if (requiredRole === "ADMIN" || requiredRole === "admin") {
          return userRole === "ADMIN";
        }
        // For other authorized items, compare roles
        const currentUserRole = (userRole as string)?.toUpperCase() || "USER";
        const requiredRoleUpper = requiredRole.toUpperCase();
        return currentUserRole === requiredRoleUpper;
      }
      // Show all items that don't require authorization
      return true;
    }),
  }));

  return (
    <div className="flex min-h-screen w-full">
      <ScrollToTop />
      {/* Desktop Sidebar - sticky, only visible on lg screens and above (1024px+) */}
      {/* Show email-specific sidebar on emails page, otherwise normal sidebar */}
      <DashboardSidebar links={filteredLinks} showBackButton={isEmailsPage} />
      {/* Main Content Area - full width on mobile/tablet, adjusted on desktop */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-50 flex h-14 shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:h-[60px]">
          <div className="flex w-full items-center gap-x-3 px-4 xl:px-8">
            {/* Mobile Sidebar Trigger - visible on all screens below lg (as overlay) */}
            <MobileSheetSidebar links={filteredLinks} showBackButton={isEmailsPage} />
            <Link href="/" className="flex items-center space-x-1.5">
              <Icons.logo />
              <span className="font-urban text-xl font-bold">{siteName}</span>
            </Link>

            <div className="w-full flex-1" />

            {/* Command Menu - Hidden but accessible via Command+K */}
            <SearchCommand links={filteredLinks} />

            <UserAccountNav />
          </div>
        </header>

        {/* 2FA Security Banner */}
        <div>
          <MaxWidthWrapper className="px-4 xl:px-8 py-2">
            <TwoFactorSecurityBanner />
          </MaxWidthWrapper>
        </div>

        <main className="flex-1 overflow-y-auto">
          <MaxWidthWrapper className="flex h-full max-w-7xl flex-col px-0">
            {children}
          </MaxWidthWrapper>
        </main>
      </div>
    </div>
  );
}
