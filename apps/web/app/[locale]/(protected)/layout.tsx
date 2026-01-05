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

  return (
    <SidebarLinksProvider 
      userRole={user.role || null}
      siteName={t("shortName")}
    >
      {children}
    </SidebarLinksProvider>
  );
}
