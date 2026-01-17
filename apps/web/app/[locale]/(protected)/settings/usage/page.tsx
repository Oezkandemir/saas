import { BarChart3 } from "lucide-react";
import { redirect } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { UsageDashboard } from "@/components/plan/usage-dashboard/usage-dashboard";
import { UsageWarnings } from "@/components/plan/usage-dashboard/usage-warnings";
import { getAllPlanFeatures } from "@/lib/plan-features";
import { getCurrentUser } from "@/lib/session";
import { checkUsageWarnings } from "@/lib/usage-billing";

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Settings.usage");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function UsagePage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Settings.usage");

  if (!user?.email || !user?.id) {
    redirect("/login");
  }

  const [planFeatures, warnings] = await Promise.all([
    getAllPlanFeatures(user.id),
    checkUsageWarnings(user.id),
  ]);

  return (
    <UnifiedPageLayout
      title={t("heading")}
      description={t("subheading")}
      icon={<BarChart3 className="size-4 text-primary" />}
      contentClassName="space-y-6"
    >
      {warnings.length > 0 && <UsageWarnings warnings={warnings} />}
      <UsageDashboard planFeatures={planFeatures} />
    </UnifiedPageLayout>
  );
}
