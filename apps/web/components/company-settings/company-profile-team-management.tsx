"use client";

import {
  Edit,
  FileEdit,
  FileX,
  Loader2,
  Settings,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type AddTeamMemberInput,
  addCompanyProfileTeamMember,
  type CompanyProfileMember,
  type CompanyProfileRole,
  getCompanyProfileTeamMembers,
  removeCompanyProfileTeamMember,
  type UpdateTeamMemberInput,
  updateCompanyProfileTeamMember,
} from "@/actions/company-profile-team-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CompanyProfileTeamManagementProps {
  companyProfileId: string;
  isOwner: boolean;
}

const roleLabels: Record<CompanyProfileRole, string> = {
  owner: "Inhaber",
  admin: "Administrator",
  editor: "Bearbeiter",
  viewer: "Betrachter",
};

const roleDescriptions: Record<CompanyProfileRole, string> = {
  owner: "Vollzugriff auf alle Funktionen",
  admin: "Kann alles verwalten außer Einstellungen",
  editor: "Kann Dokumente und Kunden bearbeiten",
  viewer: "Nur Leserechte",
};

export function CompanyProfileTeamManagement({
  companyProfileId,
  isOwner,
}: CompanyProfileTeamManagementProps) {
  const [members, setMembers] = useState<CompanyProfileMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMember, setAddingMember] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  // Form state for adding member
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] =
    useState<CompanyProfileRole>("viewer");
  const [newMemberPermissions, setNewMemberPermissions] = useState({
    can_edit_documents: false,
    can_delete_documents: false,
    can_edit_customers: false,
    can_delete_customers: false,
    can_manage_team: false,
  });

  // Form state for editing member
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [editMemberRole, setEditMemberRole] =
    useState<CompanyProfileRole>("viewer");
  const [editMemberPermissions, setEditMemberPermissions] = useState({
    can_edit_documents: false,
    can_delete_documents: false,
    can_edit_customers: false,
    can_delete_customers: false,
    can_manage_team: false,
  });

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await getCompanyProfileTeamMembers(companyProfileId);
      setMembers(data);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Fehler beim Laden der Teammitglieder"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [loadMembers]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      toast.error("Bitte geben Sie eine E-Mail-Adresse ein");
      return;
    }

    try {
      setAddingMember(true);
      const input: AddTeamMemberInput = {
        company_profile_id: companyProfileId,
        user_email: newMemberEmail.trim(),
        role: newMemberRole,
        ...newMemberPermissions,
      };

      await addCompanyProfileTeamMember(input);
      toast.success("Teammitglied erfolgreich hinzugefügt");
      setAddDrawerOpen(false);
      setNewMemberEmail("");
      setNewMemberRole("viewer");
      setNewMemberPermissions({
        can_edit_documents: false,
        can_delete_documents: false,
        can_edit_customers: false,
        can_delete_customers: false,
        can_manage_team: false,
      });
      loadMembers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Fehler beim Hinzufügen des Teammitglieds"
      );
    } finally {
      setAddingMember(false);
    }
  };

  const handleEditMember = async () => {
    if (!editMemberId) return;

    try {
      setEditingMember(editMemberId);
      const input: UpdateTeamMemberInput = {
        role: editMemberRole,
        ...editMemberPermissions,
      };

      await updateCompanyProfileTeamMember(editMemberId, input);
      toast.success("Teammitglied erfolgreich aktualisiert");
      setEditDrawerOpen(false);
      setEditMemberId(null);
      loadMembers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Fehler beim Aktualisieren des Teammitglieds"
      );
    } finally {
      setEditingMember(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Möchten Sie dieses Teammitglied wirklich entfernen?")) {
      return;
    }

    try {
      setRemovingMember(memberId);
      await removeCompanyProfileTeamMember(memberId);
      toast.success("Teammitglied erfolgreich entfernt");
      loadMembers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Fehler beim Entfernen des Teammitglieds"
      );
    } finally {
      setRemovingMember(null);
    }
  };

  const openEditDialog = (member: CompanyProfileMember) => {
    setEditMemberId(member.id);
    setEditMemberRole(member.role);
    setEditMemberPermissions({
      can_edit_documents: member.can_edit_documents,
      can_delete_documents: member.can_delete_documents,
      can_edit_customers: member.can_edit_customers,
      can_delete_customers: member.can_delete_customers,
      can_manage_team: member.can_manage_team,
    });
    setEditDrawerOpen(true);
  };

  const updatePermissionsByRole = (
    role: CompanyProfileRole,
    setPermissions: (perms: any) => void
  ) => {
    switch (role) {
      case "owner":
      case "admin":
        setPermissions({
          can_edit_documents: true,
          can_delete_documents: true,
          can_edit_customers: true,
          can_delete_customers: true,
          can_manage_team: true,
        });
        break;
      case "editor":
        setPermissions({
          can_edit_documents: true,
          can_delete_documents: false,
          can_edit_customers: true,
          can_delete_customers: false,
          can_manage_team: false,
        });
        break;
      case "viewer":
        setPermissions({
          can_edit_documents: false,
          can_delete_documents: false,
          can_edit_customers: false,
          can_delete_customers: false,
          can_manage_team: false,
        });
        break;
    }
  };

  if (!isOwner) {
    return null; // Only owners can manage team
  }

  return (
    <Card className="shadow-sm lg:col-span-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="size-5" />
              </div>
              Team-Mitglieder
            </CardTitle>
            <CardDescription>
              Verwalten Sie Teammitglieder und deren Berechtigungen für dieses
              Firmenprofil
            </CardDescription>
          </div>
          <Drawer
            open={addDrawerOpen}
            onOpenChange={setAddDrawerOpen}
            direction="right"
          >
            <DrawerTrigger asChild>
              <Button size="sm" className="gap-2">
                <UserPlus className="size-4" />
                Mitglied hinzufügen
              </Button>
            </DrawerTrigger>
            <DrawerContent side="right" className="mr-2 shadow-custom-md">
              <div className="flex flex-col h-full bg-bg-white-0">
                <DrawerHeader className="bg-bg-white-0">
                  <DrawerTitle className="text-label-lg text-text-strong-950">
                    Teammitglied hinzufügen
                  </DrawerTitle>
                  <p className="text-paragraph-sm text-text-sub-600 mt-1.5">
                    Fügen Sie ein neues Teammitglied zu diesem Firmenprofil
                    hinzu.
                  </p>
                </DrawerHeader>
                <DrawerBody className="overflow-y-auto flex-1 bg-bg-white-0">
                  <div className="p-5 space-y-4">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="email">E-Mail-Adresse</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="mitglied@beispiel.de"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="role">Rolle</Label>
                      <Select
                        value={newMemberRole}
                        onValueChange={(value) => {
                          setNewMemberRole(value as CompanyProfileRole);
                          updatePermissionsByRole(
                            value as CompanyProfileRole,
                            setNewMemberPermissions
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="editor">Bearbeiter</SelectItem>
                          <SelectItem value="viewer">Betrachter</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-paragraph-xs text-text-sub-600 mt-1">
                        {roleDescriptions[newMemberRole]}
                      </p>
                    </div>
                    <div className="space-y-3 rounded-lg border border-stroke-soft-200 p-4 bg-bg-white-50">
                      <Label className="text-label-sm font-semibold text-text-strong-950">
                        Berechtigungen
                      </Label>
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="edit-docs"
                            checked={newMemberPermissions.can_edit_documents}
                            onCheckedChange={(checked) =>
                              setNewMemberPermissions((prev) => ({
                                ...prev,
                                can_edit_documents: checked === true,
                              }))
                            }
                          />
                          <Label
                            htmlFor="edit-docs"
                            className="flex items-center gap-2 cursor-pointer text-paragraph-sm text-text-strong-950"
                          >
                            <FileEdit className="size-4 text-text-sub-600" />
                            Dokumente bearbeiten
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="delete-docs"
                            checked={newMemberPermissions.can_delete_documents}
                            onCheckedChange={(checked) =>
                              setNewMemberPermissions((prev) => ({
                                ...prev,
                                can_delete_documents: checked === true,
                              }))
                            }
                          />
                          <Label
                            htmlFor="delete-docs"
                            className="flex items-center gap-2 cursor-pointer text-paragraph-sm text-text-strong-950"
                          >
                            <FileX className="size-4 text-text-sub-600" />
                            Dokumente löschen
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="edit-customers"
                            checked={newMemberPermissions.can_edit_customers}
                            onCheckedChange={(checked) =>
                              setNewMemberPermissions((prev) => ({
                                ...prev,
                                can_edit_customers: checked === true,
                              }))
                            }
                          />
                          <Label
                            htmlFor="edit-customers"
                            className="flex items-center gap-2 cursor-pointer text-paragraph-sm text-text-strong-950"
                          >
                            <UserCheck className="size-4 text-text-sub-600" />
                            Kunden bearbeiten
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="delete-customers"
                            checked={newMemberPermissions.can_delete_customers}
                            onCheckedChange={(checked) =>
                              setNewMemberPermissions((prev) => ({
                                ...prev,
                                can_delete_customers: checked === true,
                              }))
                            }
                          />
                          <Label
                            htmlFor="delete-customers"
                            className="flex items-center gap-2 cursor-pointer text-paragraph-sm text-text-strong-950"
                          >
                            <UserX className="size-4 text-text-sub-600" />
                            Kunden löschen
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="manage-team"
                            checked={newMemberPermissions.can_manage_team}
                            onCheckedChange={(checked) =>
                              setNewMemberPermissions((prev) => ({
                                ...prev,
                                can_manage_team: checked === true,
                              }))
                            }
                          />
                          <Label
                            htmlFor="manage-team"
                            className="flex items-center gap-2 cursor-pointer text-paragraph-sm text-text-strong-950"
                          >
                            <Settings className="size-4 text-text-sub-600" />
                            Team verwalten
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </DrawerBody>
                <DrawerFooter className="flex gap-3 justify-between p-5 border-t border-stroke-soft-200 bg-bg-white-0">
                  <Button
                    variant="outline"
                    onClick={() => setAddDrawerOpen(false)}
                    className="flex-1 px-6 h-12 text-base font-medium"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleAddMember}
                    disabled={addingMember}
                    className="flex-1 px-6 h-12 text-base font-semibold"
                  >
                    {addingMember ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Wird hinzugefügt...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 size-4" />
                        Hinzufügen
                      </>
                    )}
                  </Button>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : members.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="size-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Noch keine Teammitglieder hinzugefügt
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAddDrawerOpen(true)}
            >
              <UserPlus className="size-4 mr-2" />
              Erstes Mitglied hinzufügen
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="size-10">
                    <AvatarImage
                      src={member.user?.avatar_url || undefined}
                      alt={member.user?.name || "User"}
                    />
                    <AvatarFallback>
                      {member.user?.name?.[0] || member.user?.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {member.user?.name || "Unbekannt"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.user?.email}
                    </p>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {member.role === "owner" && <Shield className="size-3" />}
                    {roleLabels[member.role]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(member)}
                  >
                    <Edit className="size-4" />
                  </Button>
                  {member.role !== "owner" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={removingMember === member.id}
                    >
                      {removingMember === member.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4 text-destructive" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Drawer */}
        <Drawer
          open={editDrawerOpen}
          onOpenChange={setEditDrawerOpen}
          direction="right"
        >
          <DrawerContent side="right" className="mr-2 shadow-custom-md">
            <div className="flex flex-col h-full bg-bg-white-0">
              <DrawerHeader className="bg-bg-white-0">
                <DrawerTitle className="text-label-lg text-text-strong-950">
                  Teammitglied bearbeiten
                </DrawerTitle>
                <p className="text-paragraph-sm text-text-sub-600 mt-1.5">
                  Ändern Sie die Rolle und Berechtigungen dieses Teammitglieds.
                </p>
              </DrawerHeader>
              {editMemberId && (
                <DrawerBody className="overflow-y-auto flex-1 bg-bg-white-0">
                  <div className="p-5 space-y-4">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="edit-role">Rolle</Label>
                      <Select
                        value={editMemberRole}
                        onValueChange={(value) => {
                          setEditMemberRole(value as CompanyProfileRole);
                          updatePermissionsByRole(
                            value as CompanyProfileRole,
                            setEditMemberPermissions
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="editor">Bearbeiter</SelectItem>
                          <SelectItem value="viewer">Betrachter</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-paragraph-xs text-text-sub-600 mt-1">
                        {roleDescriptions[editMemberRole]}
                      </p>
                    </div>
                    <div className="space-y-3 rounded-lg border border-stroke-soft-200 p-4 bg-bg-white-50">
                      <Label className="text-label-sm font-semibold text-text-strong-950">
                        Berechtigungen
                      </Label>
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="edit-docs-edit"
                            checked={editMemberPermissions.can_edit_documents}
                            onCheckedChange={(checked) =>
                              setEditMemberPermissions((prev) => ({
                                ...prev,
                                can_edit_documents: checked === true,
                              }))
                            }
                          />
                          <Label
                            htmlFor="edit-docs-edit"
                            className="flex items-center gap-2 cursor-pointer text-paragraph-sm text-text-strong-950"
                          >
                            <FileEdit className="size-4 text-text-sub-600" />
                            Dokumente bearbeiten
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="delete-docs-edit"
                            checked={editMemberPermissions.can_delete_documents}
                            onCheckedChange={(checked) =>
                              setEditMemberPermissions((prev) => ({
                                ...prev,
                                can_delete_documents: checked === true,
                              }))
                            }
                          />
                          <Label
                            htmlFor="delete-docs-edit"
                            className="flex items-center gap-2 cursor-pointer text-paragraph-sm text-text-strong-950"
                          >
                            <FileX className="size-4 text-text-sub-600" />
                            Dokumente löschen
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="edit-customers-edit"
                            checked={editMemberPermissions.can_edit_customers}
                            onCheckedChange={(checked) =>
                              setEditMemberPermissions((prev) => ({
                                ...prev,
                                can_edit_customers: checked === true,
                              }))
                            }
                          />
                          <Label
                            htmlFor="edit-customers-edit"
                            className="flex items-center gap-2 cursor-pointer text-paragraph-sm text-text-strong-950"
                          >
                            <UserCheck className="size-4 text-text-sub-600" />
                            Kunden bearbeiten
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="delete-customers-edit"
                            checked={editMemberPermissions.can_delete_customers}
                            onCheckedChange={(checked) =>
                              setEditMemberPermissions((prev) => ({
                                ...prev,
                                can_delete_customers: checked === true,
                              }))
                            }
                          />
                          <Label
                            htmlFor="delete-customers-edit"
                            className="flex items-center gap-2 cursor-pointer text-paragraph-sm text-text-strong-950"
                          >
                            <UserX className="size-4 text-text-sub-600" />
                            Kunden löschen
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="manage-team-edit"
                            checked={editMemberPermissions.can_manage_team}
                            onCheckedChange={(checked) =>
                              setEditMemberPermissions((prev) => ({
                                ...prev,
                                can_manage_team: checked === true,
                              }))
                            }
                          />
                          <Label
                            htmlFor="manage-team-edit"
                            className="flex items-center gap-2 cursor-pointer text-paragraph-sm text-text-strong-950"
                          >
                            <Settings className="size-4 text-text-sub-600" />
                            Team verwalten
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </DrawerBody>
              )}
              <DrawerFooter className="flex gap-3 justify-between p-5 border-t border-stroke-soft-200 bg-bg-white-0">
                <Button
                  variant="outline"
                  onClick={() => setEditDrawerOpen(false)}
                  className="flex-1 px-6 h-12 text-base font-medium"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleEditMember}
                  disabled={editingMember !== null}
                  className="flex-1 px-6 h-12 text-base font-semibold"
                >
                  {editingMember ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Wird aktualisiert...
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 size-4" />
                      Aktualisieren
                    </>
                  )}
                </Button>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </CardContent>
    </Card>
  );
}
