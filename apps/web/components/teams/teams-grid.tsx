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
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
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
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 p-8 sm:p-16 text-center bg-muted/10">
        <div className="rounded-full bg-gradient-to-br from-primary/10 to-primary/5 p-6 sm:p-8 mb-4 sm:mb-6">
          <Users className="h-12 w-12 sm:h-16 sm:w-16 text-primary/60" />
        </div>
        <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 text-foreground">{t("grid.noTeams.title")}</h3>
        <p className="text-muted-foreground max-w-md mb-6 sm:mb-8 text-base sm:text-lg px-4">
          {t("grid.noTeams.description")}
        </p>
        <Button size="lg" className="gap-2">
          <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
          {t("grid.noTeams.createFirst")}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {teams.map((team) => (
        <Card 
          key={team.id} 
          className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 bg-gradient-to-br from-background via-background to-muted/20 ${
            team.isDefault 
              ? "border border-primary/40 shadow-md shadow-primary/10" 
              : "border-0 hover:-translate-y-1"
          }`}
        >
          <CardHeader className="pb-2 sm:pb-3 relative">
            {/* Menu Button */}
            <div className="absolute top-2 sm:top-3 right-2 sm:right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 sm:h-7 sm:w-7 rounded-full bg-background/80 hover:bg-background border border-border/50"
                  >
                    <MoreHorizontal className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
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
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/teams/${team.id}`} className="cursor-pointer">
                      <Eye className="h-4 w-4 mr-2" />
                      {t("grid.viewTeam")}
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/teams/${team.id}/settings`} className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      {t("grid.teamSettings")}
                    </Link>
                  </DropdownMenuItem>
                  
                  {team.role === "OWNER" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/teams/${team.id}/delete`} className="cursor-pointer text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t("grid.deleteTeam")}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Team Avatar */}
            <div className="flex justify-center mb-3 sm:mb-4">
              <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-border/20 shadow-sm">
                {team.logoUrl ? (
                  <AvatarImage src={team.logoUrl} alt={team.name} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-base sm:text-xl font-bold">
                    {team.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>

            {/* Team Name */}
            <div className="text-center space-y-1 sm:space-y-2">
              <h3 className="font-semibold text-base sm:text-lg leading-tight line-clamp-1 px-2">{team.name}</h3>
              {team.description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 px-2 leading-relaxed">
                  {team.description}
                </p>
              )}
            </div>

            {/* Default Team Badge */}
            {team.isDefault && (
              <div className="flex justify-center mt-2">
                <Badge variant="secondary" className="text-xs gap-1">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  {t("grid.defaultTeam")}
                </Badge>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-3 sm:space-y-4 pt-0">
            {/* Stats */}
            <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>{team.memberCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>{team.activeProjects}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-2.5 w-2.5" />
                <span className="text-xs">{formatDistanceToNow(new Date(team.recentActivity), { addSuffix: true })}</span>
              </div>
            </div>

            {/* Members Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">{t("grid.members")}</span>
                <Badge variant={getRoleBadgeVariant(team.role)} className="text-xs gap-1">
                  {getRoleIcon(team.role)}
                  {team.role}
                </Badge>
              </div>
              
              {team.members.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {team.members.slice(0, 4).map((member, index) => (
                      <TooltipProvider key={member.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-background">
                              {member.avatarUrl ? (
                                <AvatarImage src={member.avatarUrl} alt={member.name} />
                              ) : (
                                <AvatarFallback className="text-xs font-medium">
                                  {member.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{member.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                    {team.memberCount > 4 && (
                      <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                        <span className="text-xs font-medium text-muted-foreground">
                          +{team.memberCount - 4}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 sm:pt-3 border-t border-border/30">
              <Link 
                href={`/dashboard/teams/${team.id}`}
                className="flex items-center justify-between w-full p-2 sm:p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors group"
              >
                <span className="text-xs sm:text-sm font-medium">{t("grid.viewTeam")}</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 