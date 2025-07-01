"use client";

import { ArrowLeft, Users, Briefcase, Calendar, Settings, Crown, Shield, User } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Team {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  createdAt: string;
}

interface TeamHeaderProps {
  team: Team;
  userRole: string;
  memberCount: number;
  projectCount: number;
}

export function TeamHeader({ team, userRole, memberCount, projectCount }: TeamHeaderProps) {
  const t = useTranslations("Teams");

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="h-3 w-3 sm:h-4 sm:w-4" />;
      case "ADMIN":
        return <Shield className="h-3 w-3 sm:h-4 sm:w-4" />;
      default:
        return <User className="h-3 w-3 sm:h-4 sm:w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "OWNER":
        return "default";
      case "ADMIN":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard/teams">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t("header.backToTeams")}</span>
            <span className="sm:hidden">Teams</span>
          </Button>
        </Link>
      </div>

      {/* Team Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Team Info */}
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 sm:border-4 border-background shadow-lg flex-shrink-0 mx-auto sm:mx-0">
                {team.logoUrl ? (
                  <AvatarImage src={team.logoUrl} alt={team.name} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-lg sm:text-2xl font-bold">
                    {team.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className="space-y-2 sm:space-y-3 text-center sm:text-left flex-1">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{team.name}</h1>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-md">
                    {team.description || t("header.noDescription")}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{t("header.created", {
                      time: formatDistanceToNow(new Date(team.createdAt), {
                        addSuffix: true,
                      }),
                    })}</span>
                  </div>
                  
                  <Badge variant={getRoleBadgeVariant(userRole)} className="gap-1 text-xs">
                    {getRoleIcon(userRole)}
                    {t(`roles.${userRole.toLowerCase()}`)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Team Stats & Actions */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
              {/* Team Stats */}
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-background/50 rounded-lg p-3 sm:p-4 text-center">
                    <div className="flex items-center justify-center mb-1 sm:mb-2">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="text-lg sm:text-2xl font-bold">{memberCount}</div>
                    <div className="text-xs text-muted-foreground">{t("header.members")}</div>
                  </div>
                  
                  <div className="bg-background/50 rounded-lg p-3 sm:p-4 text-center">
                    <div className="flex items-center justify-center mb-1 sm:mb-2">
                      <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <div className="text-lg sm:text-2xl font-bold">{projectCount}</div>
                    <div className="text-xs text-muted-foreground">{t("header.projects")}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {(userRole === "OWNER" || userRole === "ADMIN") && (
                <div className="flex justify-center lg:justify-start lg:items-end">
                  <Link href={`/dashboard/teams/${team.id}/settings`}>
                    <Button size="sm" variant="outline" className="gap-2 w-full sm:w-auto">
                      <Settings className="h-4 w-4" />
                      {t("header.settings")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 