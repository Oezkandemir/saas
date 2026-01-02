import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { siteConfig } from "@/config/site";
import { sidebarLinks } from "@/config/dashboard";
import LanguageDrawer from "@/components/language-drawer";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { UserAccountNav } from "@/components/layout/user-account-nav";
import { DashboardSidebar, MobileSheetSidebar } from "@/components/layout/dashboard-sidebar-wrapper";
import { QuickActions } from "@/components/layout/quick-actions";
import { SearchCommand } from "@/components/dashboard/search-command";
import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { UserRole } from "@/components/forms/user-role-form";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { TwoFactorSecurityBanner } from "@/components/security/two-factor-security-banner";

export const dynamic = "force-dynamic";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function Dashboard({ children }: ProtectedLayoutProps) {
  const user = await getCurrentUser();
  const t = await getTranslations("Meta");

  if (!user) redirect("/login");

  // Get user subscription plan to check if they're on free plan
  // OPTIMIZATION: Don't block layout rendering - fetch plan asynchronously
  // Default to free plan initially, will be updated client-side if needed
  let isFreePlan = true;
  
  // Only fetch subscription plan if needed (can be done client-side for better performance)
  // For now, default to free plan to avoid blocking the layout
  // The subscription check can be done client-side in components that need it

  // Filter sidebar links based on user role
  // Only show items that the user is authorized to see
  // IMPORTANT: Use exact same logic as UserAccountNav - simple string comparison
  const filteredLinks = sidebarLinks.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      // If item requires authorization, check user role
      if (item.authorizeOnly) {
        // For admin items, use exact same check as UserAccountNav: user.role === "ADMIN"
        if (item.authorizeOnly === UserRole.ADMIN) {
          // Only show admin items if user role is exactly "ADMIN"
          return user.role === "ADMIN";
        }
        // For other authorized items, compare roles
        const userRole = (user.role as string)?.toUpperCase() || "USER";
        const requiredRole = String(item.authorizeOnly).toUpperCase();
        return userRole === requiredRole;
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
                {t("shortName")}
              </span>
            </Link>

            <div className="w-full flex-1" />

            <div className="hidden md:flex items-center gap-2">
              <SearchCommand links={filteredLinks} />
              <QuickActions />
            </div>

            <LanguageDrawer />
            <div className="hidden md:block">
              <ModeToggle />
            </div>
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
