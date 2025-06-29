"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { 
  Users, 
  Briefcase, 
  Crown, 
  Shield, 
  User, 
  Eye,
  MoreHorizontal,
  Settings,
  UserPlus,
  Star,
  Trash2,
  Calendar,
  Activity
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
}

interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  role: string;
  isDefault: boolean;
  joinedAt: string;
  createdAt: string;
  memberCount: number;
  activeProjects: number;
  recentActivity: Date;
  members: TeamMember[];
}

interface TeamsGridProps {
  teams: Team[];
}

export function TeamsGrid({ teams }: TeamsGridProps) {
  const t = useTranslations("Teams");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const setDefaultTeam = async (teamId: string) => {
    if (isLoading) return;

    setIsLoading(teamId);
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "set-default-team",
          id: teamId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to set default team");
      }

      toast.success(t("grid.defaultTeamSet"));
      window.location.reload();
    } catch (error) {
      console.error("Error setting default team:", error);
      toast.error(
        error instanceof Error ? error.message : t("grid.defaultTeamError"),
      );
    } finally {
      setIsLoading(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="h-3 w-3" />;
      case "ADMIN":
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
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

  if (!teams.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted p-12 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Users className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{t("grid.noTeams.title")}</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          {t("grid.noTeams.description")}
        </p>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          {t("grid.noTeams.createFirst")}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <Card 
          key={team.id} 
          className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
            team.isDefault ? "ring-2 ring-primary ring-offset-2" : ""
          }`}
        >
          {/* Gradient overlay for default team */}
          {team.isDefault && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          )}

          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                    {team.logoUrl ? (
                      <AvatarImage src={team.logoUrl} alt={team.name} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 font-semibold">
                        {team.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {team.isDefault && (
                    <div className="absolute -top-1 -right-1 rounded-full bg-primary p-1">
                      <Star className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg leading-none">{team.name}</CardTitle>
                  <CardDescription className="text-xs mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t("grid.joined", {
                      time: formatDistanceToNow(new Date(team.joinedAt), {
                        addSuffix: true,
                      }),
                    })}
                  </CardDescription>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">{t("grid.openMenu")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>{t("grid.manageTeam")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {!team.isDefault && (
                    <DropdownMenuItem
                      onClick={() => setDefaultTeam(team.id)}
                      disabled={isLoading === team.id}
                      className="cursor-pointer"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      {t("grid.setDefault")}
                    </DropdownMenuItem>
                  )}
                  
                  {(team.role === "OWNER" || team.role === "ADMIN") && (
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/teams/${team.id}/invite`} className="cursor-pointer">
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t("grid.inviteMembers")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  {team.role === "OWNER" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/teams/${team.id}/settings`} className="cursor-pointer">
                          <Settings className="h-4 w-4 mr-2" />
                          {t("grid.settings")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive cursor-pointer"
                        asChild
                      >
                        <Link href={`/dashboard/teams/${team.id}/delete`}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t("grid.deleteTeam")}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {team.isDefault && (
              <Badge className="w-fit mt-3" variant="outline">
                <Star className="h-3 w-3 mr-1" />
                {t("grid.defaultTeam")}
              </Badge>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
              {team.description || t("grid.noDescription")}
            </p>

            {/* Team Stats */}
            <div className="grid grid-cols-2 gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Users className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="text-sm font-semibold">{team.memberCount}</div>
                        <div className="text-xs text-muted-foreground">{t("grid.members")}</div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("grid.totalMembers")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Briefcase className="h-4 w-4 text-purple-600" />
                      <div>
                        <div className="text-sm font-semibold">{team.activeProjects}</div>
                        <div className="text-xs text-muted-foreground">{t("grid.projects")}</div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("grid.activeProjects")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Team Members Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("grid.recentMembers")}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  {formatDistanceToNow(team.recentActivity, { addSuffix: true })}
                </div>
              </div>
              <div className="flex -space-x-2">
                {team.members.slice(0, 4).map((member) => (
                  <TooltipProvider key={member.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-8 w-8 border-2 border-background hover:scale-110 transition-transform cursor-pointer">
                          {member.avatarUrl ? (
                            <AvatarImage src={member.avatarUrl} alt={member.name} />
                          ) : (
                            <AvatarFallback className="text-xs">
                              {member.name?.substring(0, 2).toUpperCase() || "?"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {team.memberCount > 4 && (
                  <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                    <span className="text-xs font-medium">+{team.memberCount - 4}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between pt-4">
            <Badge variant={getRoleBadgeVariant(team.role)} className="gap-1">
              {getRoleIcon(team.role)}
              {t(`roles.${team.role.toLowerCase()}`)}
            </Badge>
            
            <Link href={`/dashboard/teams/${team.id}`}>
              <Button size="sm" className="group">
                <Eye className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
                {t("grid.viewTeam")}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 