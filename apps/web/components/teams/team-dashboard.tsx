"use client";

import { useTranslations } from "next-intl";

interface TeamDashboardProps {
  team: any;
  members: any[];
  projects: any[];
  activities: any[];
  userRole: string;
}

export function TeamDashboard({ team, members, projects, activities, userRole }: TeamDashboardProps) {
  const t = useTranslations("Teams");

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-muted-foreground">
          {t("teamDetail.dashboard.title")}
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          {t("teamDetail.dashboard.dashboardDescription")}
        </p>
      </div>
    </div>
  );
} 