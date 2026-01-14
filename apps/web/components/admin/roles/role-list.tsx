"use client";

import { useState } from "react";
import { Role } from "@/actions/role-actions";
import { Plus, Shield, UserCog } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { RoleForm } from "./role-form";

interface RoleListProps {
  initialRoles: Role[];
  locale: string;
}

export function RoleList({ initialRoles, locale }: RoleListProps) {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRoleCreated = (role: Role) => {
    setRoles([role, ...roles]);
    setIsDialogOpen(false);
  };

  const handleRoleUpdated = (updatedRole: Role) => {
    setRoles(roles.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
  };

  const handleRoleDeleted = (id: string) => {
    setRoles(roles.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Rollen & Berechtigungen</h2>
          <p className="text-muted-foreground">
            Verwalten Sie Custom Rollen und Berechtigungen
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Rolle erstellen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Rolle erstellen</DialogTitle>
              <DialogDescription>
                Erstellen Sie eine neue Rolle mit spezifischen Berechtigungen
              </DialogDescription>
            </DialogHeader>
            <RoleForm
              onSuccess={handleRoleCreated}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {roles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCog className="mb-4 h-12 w-12 text-muted-foreground" />
            <CardTitle className="mb-2">Keine Rollen vorhanden</CardTitle>
            <CardDescription className="mb-4 text-center">
              Erstellen Sie Ihre erste Rolle, um Berechtigungen zu verwalten
            </CardDescription>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Rolle erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Rollen</CardTitle>
            <CardDescription>
              Übersicht aller verfügbaren Rollen und deren Berechtigungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Berechtigungen</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>
                      {role.description || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {role.is_system_role ? (
                        <Badge variant="secondary">
                          <Shield className="mr-1 h-3 w-3" />
                          System
                        </Badge>
                      ) : (
                        <Badge variant="outline">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.keys(role.permissions || {}).length > 0 ? (
                          Object.entries(role.permissions || {})
                            .filter(([, value]) => value === true)
                            .slice(0, 3)
                            .map(([key]) => (
                              <Badge
                                key={key}
                                variant="outline"
                                className="text-xs"
                              >
                                {key}
                              </Badge>
                            ))
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            Keine
                          </span>
                        )}
                        {Object.entries(role.permissions || {}).filter(
                          ([, value]) => value === true,
                        ).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +
                            {Object.entries(role.permissions || {}).filter(
                              ([, value]) => value === true,
                            ).length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(role.created_at).toLocaleDateString(locale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <RoleForm
                        role={role}
                        onSuccess={handleRoleUpdated}
                        onDelete={() => handleRoleDeleted(role.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
