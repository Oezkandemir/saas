import { redirect } from "next/navigation";
import { Activity, Database, AlertTriangle, BarChart3, Settings, Zap } from "lucide-react";
import { getLocale, setRequestLocale } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { SystemStatus } from "@/components/admin/system-status";
import { SystemErrors } from "@/components/admin/system-errors";
import { DatabaseStats } from "@/components/admin/database-stats";
import { QuickActions } from "@/components/admin/quick-actions";
import { SystemMetricsComponent } from "@/components/admin/system-metrics";
import { EnvironmentInfo } from "@/components/admin/environment-info";
import {
  AccordionRoot,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/alignui/layout/accordion";

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
      description="Umfassende Systemüberwachung, Datenbank-Statistiken und Admin-Tools"
      icon={<Activity className="h-4 w-4 text-primary" />}
      contentClassName="pb-10"
    >
      <div className="max-w-7xl mx-auto">
        <AccordionRoot type="multiple" defaultValue={["system-status", "database-stats"]} className="w-full space-y-4">
          {/* System Status */}
          <AccordionItem value="system-status" className="border rounded-lg px-6 bg-card shadow-sm">
            <AccordionTrigger className="hover:no-underline py-6 -mx-6 px-6">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <h3 className="text-lg font-semibold">System-Status</h3>
                  <p className="text-sm text-muted-foreground font-normal">
                    Aktueller Status aller Systemkomponenten
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6 -mx-6 px-6">
              <div className="pt-4">
                <SystemStatus />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Database Statistics */}
          <AccordionItem value="database-stats" className="border rounded-lg px-6 bg-card shadow-sm">
            <AccordionTrigger className="hover:no-underline py-6 -mx-6 px-6">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <h3 className="text-lg font-semibold">Datenbank-Statistiken</h3>
                  <p className="text-sm text-muted-foreground font-normal">
                    Tabellengrößen, Zeilenanzahl und Datenbank-Informationen
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6 -mx-6 px-6">
              <div className="pt-4">
                <DatabaseStats />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Quick Actions */}
          <AccordionItem value="quick-actions" className="border rounded-lg px-6 bg-card shadow-sm">
            <AccordionTrigger className="hover:no-underline py-6 -mx-6 px-6">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <h3 className="text-lg font-semibold">Schnellaktionen</h3>
                  <p className="text-sm text-muted-foreground font-normal">
                    Häufig verwendete Admin-Aktionen für Systemwartung
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6 -mx-6 px-6">
              <div className="pt-4">
                <QuickActions />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* System Errors */}
          <AccordionItem value="system-errors" className="border rounded-lg px-6 bg-card shadow-sm">
            <AccordionTrigger className="hover:no-underline py-6 -mx-6 px-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <h3 className="text-lg font-semibold">System-Fehler</h3>
                  <p className="text-sm text-muted-foreground font-normal">
                    Übersicht über Systemfehler und Ausnahmen
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6 -mx-6 px-6">
              <div className="pt-4">
                <SystemErrors />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* System Metrics */}
          <AccordionItem value="system-metrics" className="border rounded-lg px-6 bg-card shadow-sm">
            <AccordionTrigger className="hover:no-underline py-6 -mx-6 px-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <h3 className="text-lg font-semibold">System-Metriken</h3>
                  <p className="text-sm text-muted-foreground font-normal">
                    Leistungsmetriken der letzten 24 Stunden
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6 -mx-6 px-6">
              <div className="pt-4">
                <SystemMetricsComponent />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Environment Info */}
          <AccordionItem value="environment-info" className="border rounded-lg px-6 bg-card shadow-sm">
            <AccordionTrigger className="hover:no-underline py-6 -mx-6 px-6">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <h3 className="text-lg font-semibold">Umgebungsinformationen</h3>
                  <p className="text-sm text-muted-foreground font-normal">
                    Systemkonfiguration und Speicher-Statistiken
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6 -mx-6 px-6">
              <div className="pt-4">
                <EnvironmentInfo />
              </div>
            </AccordionContent>
          </AccordionItem>
        </AccordionRoot>
      </div>
    </UnifiedPageLayout>
  );
}




