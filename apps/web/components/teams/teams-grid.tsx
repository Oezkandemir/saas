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
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 p-16 text-center bg-muted/10">
        <div className="rounded-full bg-gradient-to-br from-primary/10 to-primary/5 p-8 mb-6">
          <Users className="h-16 w-16 text-primary/60" />
        </div>
        <h3 className="text-2xl font-semibold mb-3 text-foreground">{t("grid.noTeams.title")}</h3>
        <p className="text-muted-foreground max-w-md mb-8 text-lg">
          {t("grid.noTeams.description")}
        </p>
        <Button size="lg" className="gap-2">
          <UserPlus className="h-5 w-5" />
          {t("grid.noTeams.createFirst")}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {teams.map((team) => (
        <Card 
          key={team.id} 
          className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 bg-gradient-to-br from-background via-background to-muted/20 ${
            team.isDefault 
              ? "border border-primary/40 shadow-md shadow-primary/10" 
              : "border-0 hover:-translate-y-1"
          }`}
        >
          <CardHeader className="pb-3 relative">
            {/* Menu Button */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 rounded-full bg-background/80 hover:bg-background border border-border/50"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
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

            {/* Team Avatar & Basic Info */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-background shadow-sm ring-1 ring-border/10">
                  {team.logoUrl ? (
                    <AvatarImage src={team.logoUrl} alt={team.name} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 font-semibold text-sm text-primary">
                      {team.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                {team.isDefault && (
                  <div className="absolute -top-0.5 -right-0.5 rounded-full bg-primary p-1 shadow-sm">
                    <Star className="h-2.5 w-2.5 text-primary-foreground fill-current" />
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <h3 className="font-semibold text-base leading-tight">{team.name}</h3>
                {team.isDefault && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    {t("grid.defaultTeam")}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Description */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem] leading-relaxed">
                {team.description || t("teamList.noDescription")}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 rounded-md bg-muted/30 border border-border/20">
                <Users className="h-3.5 w-3.5 text-blue-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-foreground">{team.memberCount}</div>
                <div className="text-xs text-muted-foreground">{t("grid.members")}</div>
              </div>
              
              <div className="text-center p-2 rounded-md bg-muted/30 border border-border/20">
                <Briefcase className="h-3.5 w-3.5 text-purple-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-foreground">{team.activeProjects}</div>
                <div className="text-xs text-muted-foreground">{t("grid.projects")}</div>
              </div>
            </div>

            {/* Member Avatars */}
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground text-center">
                {t("grid.recentMembers")}
              </div>
                             <div className="flex justify-center">
                 <div className="flex -space-x-2">
                   {team.members.slice(0, 4).map((member) => (
                     <TooltipProvider key={member.id}>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Avatar className="h-8 w-8 border-2 border-background hover:scale-110 transition-transform cursor-pointer ring-1 ring-border/10">
                             {member.avatarUrl ? (
                               <AvatarImage src={member.avatarUrl} alt={member.name} />
                             ) : (
                               <AvatarFallback className="text-xs bg-gradient-to-br from-muted to-muted/50">
                                 {member.name?.substring(0, 2).toUpperCase() || "?"}
                               </AvatarFallback>
                             )}
                           </Avatar>
                         </TooltipTrigger>
                         <TooltipContent side="bottom">
                           <p className="font-medium">{member.name}</p>
                           <p className="text-xs text-muted-foreground">{member.role}</p>
                         </TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                   ))}
                   {team.memberCount > 4 && (
                     <div className="h-8 w-8 rounded-full border-2 border-background bg-muted/60 flex items-center justify-center ring-1 ring-border/10">
                       <span className="text-xs font-medium text-muted-foreground">+{team.memberCount - 4}</span>
                     </div>
                   )}
                 </div>
               </div>
            </div>

            {/* Role & Actions */}
            <div className="flex items-center justify-between pt-1 border-t border-border/20">
              <Badge variant={getRoleBadgeVariant(team.role)} className="gap-1 text-xs">
                {getRoleIcon(team.role)}
                {t(`roles.${team.role.toLowerCase()}`)}
              </Badge>
              
              <Link href={`/dashboard/teams/${team.id}`}>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="gap-1.5 text-primary hover:text-primary hover:bg-primary/10 transition-colors h-7 px-2"
                >
                  {t("grid.viewTeam")}
                  <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>

            {/* Joined Date */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Calendar className="h-2.5 w-2.5" />
                {t("grid.joined")} {formatDistanceToNow(new Date(team.joinedAt), { addSuffix: true })}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 