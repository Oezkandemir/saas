import { Settings } from "lucide-react";

import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { SkeletonSection } from "@/components/shared/section-skeleton";

export default function DashboardSettingsLoading() {
  return (
    <UnifiedPageLayout
      title="Settings"
      description="Manage account and website settings."
      icon={<Settings className="size-4 text-primary" />}
      contentClassName="divide-y divide-border/50 space-y-3 sm:space-y-4 pb-10"
    >
      <div className="pt-3 sm:pt-4">
        <SkeletonSection />
      </div>
      <div className="pt-3 sm:pt-4">
        <SkeletonSection />
      </div>
      <div className="pt-3 sm:pt-4">
        <SkeletonSection card />
      </div>
    </UnifiedPageLayout>
  );
}
