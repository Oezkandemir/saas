"use client";

import { useTranslations } from "next-intl";

interface TeamProjectsProps {
  teamId: string;
  projects: any[];
  members: any[];
  userRole: string;
}

export function TeamProjects({ teamId, projects, members, userRole }: TeamProjectsProps) {
  const t = useTranslations("Teams");

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-muted-foreground">
          {t("teamDetail.projects.title")}
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          {t("teamDetail.projects.projectsDescription")}
        </p>
      </div>
    </div>
  );
} 