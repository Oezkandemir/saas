"use client";

import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/page-header";
import { formatDistanceToNow } from "date-fns";

type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

export interface TeamHeaderProps {
  team: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    created_at: string;
    updated_at: string;
  };
  userRole: TeamRole;
}

export function TeamHeader({ team, userRole }: TeamHeaderProps) {
  const t = useTranslations("Teams");

  return (
    <PageHeader>
      <div className="flex items-center gap-4">
        <Avatar className="size-16 border">
          {team.logo_url ? (
            <AvatarImage src={team.logo_url} alt={team.name} />
          ) : (
            <AvatarFallback className="text-2xl">
              {team.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PageHeaderHeading>{team.name}</PageHeaderHeading>
            <Badge variant="secondary" className="ml-2">
              {t(`roles.${userRole.toLowerCase()}`)}
            </Badge>
          </div>
          <PageHeaderDescription className="line-clamp-2">
            {team.description || t("teamDetail.noDescription")}
          </PageHeaderDescription>
          <div className="text-xs text-muted-foreground">
            {t("teamDetail.createdAt", {
              time: formatDistanceToNow(new Date(team.created_at), {
                addSuffix: true,
              }),
            })}
          </div>
        </div>
      </div>
    </PageHeader>
  );
} 