"use client";

import { Users, Briefcase, TrendingUp, Crown } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Team {
  id: string;
  name: string;
  role: string;
  memberCount: number;
  activeProjects: number;
  isDefault: boolean;
}

interface TeamsOverviewProps {
  teams: Team[];
}

export function TeamsOverview({ teams }: TeamsOverviewProps) {
  const t = useTranslations("Teams");

  // Calculate statistics
  const totalTeams = teams.length;
  const totalMembers = teams.reduce((sum, team) => sum + team.memberCount, 0);
  const totalProjects = teams.reduce((sum, team) => sum + team.activeProjects, 0);
  const ownedTeams = teams.filter(team => team.role === "OWNER").length;

  const stats = [
    {
      title: t("overview.totalTeams"),
      value: totalTeams,
      icon: Users,
      description: t("overview.teamsDescription"),
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      title: t("overview.totalMembers"),
      value: totalMembers,
      icon: Users,
      description: t("overview.membersDescription"),
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/50",
    },
    {
      title: t("overview.activeProjects"),
      value: totalProjects,
      icon: Briefcase,
      description: t("overview.projectsDescription"),
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/50",
    },
    {
      title: t("overview.ownedTeams"),
      value: ownedTeams,
      icon: Crown,
      description: t("overview.ownedDescription"),
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={stat.title} 
            className="overflow-hidden relative border-0 shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
          >
            <CardHeader className="flex flex-row justify-between items-center pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.value > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="mr-1 w-3 h-3" />
                    {t("overview.active")}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
            
            {/* Subtle gradient overlay */}
            <div className={`absolute inset-0 opacity-5 bg-gradient-to-br from-transparent to-current ${stat.color} pointer-events-none`} />
          </Card>
        );
      })}
    </div>
  );
} 