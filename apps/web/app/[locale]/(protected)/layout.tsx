import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { SidebarLinksProvider } from "@/components/layout/sidebar-links-provider";

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

  return (
    <SidebarLinksProvider 
      userRole={user.role || null}
      isFreePlan={isFreePlan}
      siteName={t("shortName")}
    >
      {children}
    </SidebarLinksProvider>
  );
}
