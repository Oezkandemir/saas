"use client";

import { usePathname } from "next/navigation";
import { SidebarNavItem } from "@/types";
import { adminSidebarLinks } from "@/config/admin";
import { sidebarLinks } from "@/config/dashboard";
import { DashboardSidebar, MobileSheetSidebar } from "./dashboard-sidebar-wrapper";
import { SearchCommand } from "@/components/dashboard/search-command";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserAccountNav } from "./user-account-nav";
import Link from "next/link";
import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { TwoFactorSecurityBanner } from "@/components/security/two-factor-security-banner";
import { ScrollToTop } from "./scroll-to-top";

interface SidebarLinksProviderProps {
  userRole?: string | null;
  isFreePlan?: boolean;
  siteName: string;
  children: React.ReactNode;
}

export function SidebarLinksProvider({ 
  userRole, 
  isFreePlan = true, 
  siteName,
  children 
}: SidebarLinksProviderProps) {
  const pathname = usePathname();
  // Check if we're on an admin route (handles both /admin and /locale/admin)
  // Matches: /admin, /admin/, /en/admin, /de/admin, /en/admin/users, etc.
  const isAdminRoute = pathname?.includes("/admin") || pathname?.match(/\/[a-z]{2}\/admin/);
  
  // Use admin sidebar links if on admin route and user is admin, otherwise use dashboard links
  const baseLinks = isAdminRoute && userRole === "ADMIN" ? adminSidebarLinks : sidebarLinks;
  
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
      <DashboardSidebar links={filteredLinks} isFreePlan={isFreePlan} />
      {/* Main Content Area - full width on mobile/tablet, adjusted on desktop */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-50 flex h-14 shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:h-[60px]">
          <div className="flex w-full items-center gap-x-3 px-4 xl:px-8">
            {/* Mobile Sidebar Trigger - visible on all screens below lg (as overlay) */}
            <MobileSheetSidebar links={filteredLinks} isFreePlan={isFreePlan} />
            <Link href="/" className="flex items-center space-x-1.5">
              <Icons.logo />
              <span className="font-urban text-xl font-bold">
                {siteName}
              </span>
            </Link>

            <div className="w-full flex-1" />

            {/* Command Menu - Hidden but accessible via Command+K */}
            <SearchCommand links={filteredLinks} />

            <LanguageSwitcher />
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

