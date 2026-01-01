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
import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { UserRole } from "@/components/forms/user-role-form";

export const dynamic = "force-dynamic";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function Dashboard({ children }: ProtectedLayoutProps) {
  const user = await getCurrentUser();
  const t = await getTranslations("Meta");

  if (!user) redirect("/login");

  // Get user subscription plan to check if they're on free plan
  let isFreePlan = true;
  try {
    const subscriptionPlan = await getUserSubscriptionPlan(user.id, user.email);
    
    // Show upgrade button ONLY if user is on Free plan
    // User is NOT on free plan if:
    // 1. They have a paid subscription (isPaid is true)
    // 2. AND they have a valid stripePriceId
    // 3. AND the plan title is NOT "Free" (i.e., Pro or Enterprise)
    isFreePlan = !(
      subscriptionPlan.isPaid && 
      subscriptionPlan.stripePriceId &&
      subscriptionPlan.title !== "Free"
    );
  } catch (error) {
    // Default to free plan if we can't determine the plan
    // Silently fail to avoid blocking the layout
    isFreePlan = true;
  }

  // Filter sidebar links based on user role
  const filteredLinks = sidebarLinks.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.authorizeOnly) {
        const userRole = (user.role as string)?.toUpperCase() || "USER";
        return item.authorizeOnly === (userRole as UserRole);
      }
      return true;
    }),
  }));

  return (
    <div className="flex min-h-screen w-full">
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
              <QuickActions />
            </div>

            <LanguageDrawer />
            <div className="hidden md:block">
              <ModeToggle />
            </div>
            <UserAccountNav />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 xl:px-8">
          <MaxWidthWrapper className="flex h-full max-w-7xl flex-col gap-4 px-0 lg:gap-6">
            {children}
          </MaxWidthWrapper>
        </main>
      </div>
    </div>
  );
}
