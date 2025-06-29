"use client";

import { useTranslations } from "next-intl";

interface TeamActivityProps {
  teamId: string;
  activities: any[];
  userRole: string;
}

export function TeamActivity({ teamId, activities, userRole }: TeamActivityProps) {
  const t = useTranslations("Teams");

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-muted-foreground">
          {t("teamDetail.activity.title")}
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          {t("teamDetail.activity.activityDescription")}
        </p>
      </div>
    </div>
  );
} 