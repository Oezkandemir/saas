"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

interface TeamPermissionsProps {
  teamId: string;
  userRole: TeamRole;
}

export function TeamPermissions({ teamId, userRole }: TeamPermissionsProps) {
  const t = useTranslations('Teams');

  // These would normally come from an API or be defined elsewhere
  const permissions = [
    { id: 'view_team', name: t('permissions.viewTeam.name'), description: t('permissions.viewTeam.description') },
    { id: 'invite_members', name: t('permissions.inviteMembers.name'), description: t('permissions.inviteMembers.description') },
    { id: 'manage_members', name: t('permissions.manageMembers.name'), description: t('permissions.manageMembers.description') },
    { id: 'remove_members', name: t('permissions.removeMembers.name'), description: t('permissions.removeMembers.description') },
    { id: 'update_team', name: t('permissions.updateTeam.name'), description: t('permissions.updateTeam.description') },
    { id: 'delete_team', name: t('permissions.deleteTeam.name'), description: t('permissions.deleteTeam.description') },
  ];

  // Role-based permissions (simplified version)
  const rolePermissions = {
    'OWNER': ['view_team', 'invite_members', 'manage_members', 'remove_members', 'update_team', 'delete_team'],
    'ADMIN': ['view_team', 'invite_members', 'manage_members', 'remove_members', 'update_team'],
    'MEMBER': ['view_team'],
    'GUEST': ['view_team'],
  };

  const hasPermission = (role: TeamRole, permissionId: string) => {
    return rolePermissions[role].includes(permissionId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('teamPermissions.title')}</CardTitle>
        <CardDescription>
          {t('teamPermissions.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('teamPermissions.permissionName')}</TableHead>
              <TableHead>{t('teamPermissions.owner')}</TableHead>
              <TableHead>{t('teamPermissions.admin')}</TableHead>
              <TableHead>{t('teamPermissions.member')}</TableHead>
              <TableHead>{t('teamPermissions.guest')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((permission) => (
              <TableRow key={permission.id}>
                <TableCell>
                  <div className="font-medium">{permission.name}</div>
                  <div className="text-sm text-muted-foreground">{permission.description}</div>
                </TableCell>
                <TableCell>
                  {hasPermission('OWNER', permission.id) ? (
                    <CheckCircle2 className="size-5 text-green-500" />
                  ) : (
                    <XCircle className="size-5 text-red-500" />
                  )}
                </TableCell>
                <TableCell>
                  {hasPermission('ADMIN', permission.id) ? (
                    <CheckCircle2 className="size-5 text-green-500" />
                  ) : (
                    <XCircle className="size-5 text-red-500" />
                  )}
                </TableCell>
                <TableCell>
                  {hasPermission('MEMBER', permission.id) ? (
                    <CheckCircle2 className="size-5 text-green-500" />
                  ) : (
                    <XCircle className="size-5 text-red-500" />
                  )}
                </TableCell>
                <TableCell>
                  {hasPermission('GUEST', permission.id) ? (
                    <CheckCircle2 className="size-5 text-green-500" />
                  ) : (
                    <XCircle className="size-5 text-red-500" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 