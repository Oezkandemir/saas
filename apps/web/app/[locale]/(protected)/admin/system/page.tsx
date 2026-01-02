import { redirect } from "next/navigation";
import { Activity, AlertTriangle } from "lucide-react";
import { getLocale, setRequestLocale } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { SectionColumns } from "@/components/dashboard/section-columns";
import { SystemStatus } from "@/components/admin/system-status";
import { SystemErrors } from "@/components/admin/system-errors";

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
  const locale = await getLocale();
  setRequestLocale(locale);

  return constructMetadata({
    title: "System-Monitoring",
    description: "System-Status und Fehlerüberwachung",
  });
}

export default async function SystemMonitoringPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  // Check for ADMIN role
  const isAdmin = user.role === "ADMIN";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <UnifiedPageLayout
      title="System-Monitoring"
      description="Überwachung des Systemstatus und Fehlerverfolgung"
      icon={<Activity className="h-4 w-4 text-primary" />}
      contentClassName="space-y-6 pb-10"
    >
      {/* System Status Section */}
      <div>
        <SectionColumns
          title="System-Status"
          description="Aktueller Status aller Systemkomponenten"
        >
          <SystemStatus />
        </SectionColumns>
      </div>

      {/* System Errors Section */}
      <div>
        <SectionColumns
          title="System-Fehler"
          description="Übersicht über Systemfehler und Ausnahmen"
        >
          <SystemErrors />
        </SectionColumns>
      </div>
    </UnifiedPageLayout>
  );
}




