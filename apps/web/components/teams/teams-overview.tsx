"use client";

import { Users, Briefcase, TrendingUp, Crown, Target, Activity } from "lucide-react";
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
      icon: Target,
      description: t("overview.teamsDescription"),
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: t("overview.totalMembers"),
      value: totalMembers,
      icon: Users,
      description: t("overview.membersDescription"),
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: t("overview.activeProjects"),
      value: totalProjects,
      icon: Briefcase,
      description: t("overview.projectsDescription"),
      gradient: "from-purple-500 to-violet-500",
      bgGradient: "from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: t("overview.ownedTeams"),
      value: ownedTeams,
      icon: Crown,
      description: t("overview.ownedDescription"),
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={stat.title} 
            className="group relative overflow-hidden border-0 bg-gradient-to-br from-background via-background to-muted/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
          >
            {/* Background Pattern */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-40`} />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/80 to-background/90" />
            
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground/90">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 bg-gradient-to-br ${stat.bgGradient} shadow-sm ring-1 ring-border/10`}>
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            
            <CardContent className="relative">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-2xl font-bold tracking-tight text-foreground">
                    {stat.value}
                  </div>
                  {stat.value > 0 && (
                    <div className="flex items-center gap-1">
                      <Badge 
                        variant="secondary" 
                        className="text-xs gap-1 bg-gradient-to-r from-muted to-muted/50 hover:from-muted/80 hover:to-muted/30 transition-colors"
                      >
                        <Activity className="w-2.5 h-2.5" />
                        {t("overview.active")}
                      </Badge>
                    </div>
                  )}
                </div>
                
                {/* Trend indicator */}
                {stat.value > 0 && (
                  <div className="opacity-15 group-hover:opacity-30 transition-opacity">
                    <TrendingUp className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                )}
              </div>
              
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {stat.description}
              </p>
            </CardContent>
            
            {/* Subtle accent border */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient} opacity-50`} />
          </Card>
        );
      })}
    </div>
  );
} 