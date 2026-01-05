import { Shield } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";

export default function AdminPanelLoading() {
  return (
    <UnifiedPageLayout
      title="Admin Panel"
      description="Access only for users with ADMIN role."
      icon={<Shield className="w-4 h-4 text-primary" />}
      contentClassName="space-y-6"
    >
      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>

      {/* Main Admin Modules */}
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[500px] w-full rounded-lg" />
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    </UnifiedPageLayout>
  );
}
