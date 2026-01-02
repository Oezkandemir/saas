import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BarChart3, TrendingUp, AlertTriangle } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { getAllPlanFeatures } from "@/lib/plan-features";
import { checkUsageWarnings } from "@/lib/usage-billing";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { UsageDashboard } from "@/components/plan/usage-dashboard/usage-dashboard";
import { UsageWarnings } from "@/components/plan/usage-dashboard/usage-warnings";

export async function generateMetadata() {
  const t = await getTranslations("Settings.usage");

  return {
    title: t("title"),
    description: t("description"),
  };
}

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function UsagePage(props: Props) {
  const resolvedParams = await props.params;
  const locale = resolvedParams.locale;

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
      icon={<BarChart3 className="w-4 h-4 text-primary" />}
      contentClassName="space-y-6"
    >
      {warnings.length > 0 && <UsageWarnings warnings={warnings} />}
      <UsageDashboard planFeatures={planFeatures} />
    </UnifiedPageLayout>
  );
}




