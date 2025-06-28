"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, User2, UserPlus, Users } from "lucide-react";
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

type TeamRole = "OWNER" | "ADMIN" | "MEMBER" | "GUEST";

export interface TeamListProps {
  teams: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    role: TeamRole;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
  }[];
}

export function TeamList({ teams }: TeamListProps) {
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

      // Use window.location to do a full page refresh to update all UI
      window.location.href = `/dashboard/teams`;
    } catch (error) {
      console.error("Error setting default team:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to set default team",
      );
    } finally {
      setIsLoading(null);
    }
  };

  if (!teams.length) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <Users className="mb-4 size-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">{t("noTeams.title")}</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {t("noTeams.description")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <Card key={team.id} className={team.isDefault ? "border-primary" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="size-9">
                  {team.logoUrl ? (
                    <AvatarImage src={team.logoUrl} alt={team.name} />
                  ) : (
                    <AvatarFallback>
                      {team.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <CardTitle className="text-base">{team.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {t("teamList.created", {
                      time: formatDistanceToNow(new Date(team.createdAt), {
                        addSuffix: true,
                      }),
                    })}
                  </CardDescription>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">{t("teamList.openMenu")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {t("teamList.manageTeam")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {!team.isDefault && (
                    <DropdownMenuItem
                      onClick={() => setDefaultTeam(team.id)}
                      disabled={isLoading === team.id}
                    >
                      {t("teamList.setDefault")}
                    </DropdownMenuItem>
                  )}
                  {(team.role === "OWNER" || team.role === "ADMIN") && (
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/teams/${team.id}/invite`}>
                        {t("teamList.inviteMembers")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {team.role === "OWNER" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/teams/${team.id}/settings`}>
                          {t("teamList.settings")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        asChild
                      >
                        <Link href={`/dashboard/teams/${team.id}/delete`}>
                          {t("teamList.deleteTeam")}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {team.isDefault && (
              <Badge className="mt-2" variant="outline">
                {t("teamList.defaultTeam")}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {team.description || t("teamList.noDescription")}
            </p>
          </CardContent>
          <CardFooter className="flex justify-between pt-2">
            <Badge variant="secondary">
              {t(`roles.${team.role.toLowerCase()}`)}
            </Badge>
            <Link href={`/dashboard/teams/${team.id}`}>
              <Button variant="default" size="sm">
                {t("teamList.viewTeam")}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
