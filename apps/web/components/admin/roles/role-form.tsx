"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createRole,
  updateRole,
  deleteRole,
  Role,
} from "@/actions/role-actions";
import { toast } from "sonner";

const roleFormSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich").max(100),
  description: z.string().max(500).optional(),
  permissions: z.record(z.string(), z.boolean()),
  is_system_role: z.boolean().optional().default(false),
});

const AVAILABLE_PERMISSIONS = [
  { key: "users.read", label: "Benutzer lesen" },
  { key: "users.write", label: "Benutzer schreiben" },
  { key: "users.delete", label: "Benutzer löschen" },
  { key: "documents.read", label: "Dokumente lesen" },
  { key: "documents.write", label: "Dokumente schreiben" },
  { key: "documents.delete", label: "Dokumente löschen" },
  { key: "customers.read", label: "Kunden lesen" },
  { key: "customers.write", label: "Kunden schreiben" },
  { key: "customers.delete", label: "Kunden löschen" },
  { key: "qr_codes.read", label: "QR-Codes lesen" },
  { key: "qr_codes.write", label: "QR-Codes schreiben" },
  { key: "qr_codes.delete", label: "QR-Codes löschen" },
  { key: "analytics.read", label: "Analysen lesen" },
  { key: "settings.read", label: "Einstellungen lesen" },
  { key: "settings.write", label: "Einstellungen schreiben" },
  { key: "*", label: "Alle Berechtigungen (Admin)" },
];

interface RoleFormProps {
  role?: Role;
  onSuccess: (role: Role) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

export function RoleForm({
  role,
  onSuccess,
  onCancel,
  onDelete,
}: RoleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(!role);

  const form = useForm<z.infer<typeof roleFormSchema>>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissions: role?.permissions || {},
      is_system_role: role?.is_system_role ?? false,
    },
  });

  const onSubmit = async (values: z.infer<typeof roleFormSchema>) => {
    setIsSubmitting(true);
    try {
      let result;
      if (role) {
        result = await updateRole({ ...values, id: role.id });
      } else {
        result = await createRole(values);
      }

      if (result.success && result.data) {
        toast.success(
          role ? "Rolle erfolgreich aktualisiert" : "Rolle erfolgreich erstellt",
        );
        onSuccess(result.data);
        if (role) {
          setIsEditing(false);
        }
      } else {
        toast.error(result.error || "Fehler beim Speichern der Rolle");
      }
    } catch (error) {
      toast.error("Ein Fehler ist aufgetreten");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!role || !onDelete) return;

    if (!confirm("Sind Sie sicher, dass Sie diese Rolle löschen möchten?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteRole(role.id);
      if (result.success) {
        toast.success("Rolle erfolgreich gelöscht");
        onDelete();
      } else {
        toast.error(result.error || "Fehler beim Löschen der Rolle");
      }
    } catch (error) {
      toast.error("Ein Fehler ist aufgetreten");
    } finally {
      setIsDeleting(false);
    }
  };

  if (role && !isEditing) {
    return (
      <div className="flex items-center justify-end gap-2">
        {onDelete && !role.is_system_role && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Bearbeiten
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Rollenname" {...field} disabled={role?.is_system_role} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beschreibung</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Beschreibung der Rolle"
                  {...field}
                  disabled={role?.is_system_role}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="permissions"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Berechtigungen</FormLabel>
                <FormDescription>
                  Wählen Sie die Berechtigungen für diese Rolle
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <FormField
                    key={permission.key}
                    control={form.control}
                    name="permissions"
                    render={({ field }) => {
                      const permissions = field.value || {};
                      return (
                        <FormItem
                          key={permission.key}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={permissions[permission.key] === true}
                              disabled={role?.is_system_role}
                              onCheckedChange={(checked) => {
                                const newPermissions = {
                                  ...permissions,
                                  [permission.key]: checked === true,
                                };
                                // If "*" is checked, uncheck all others
                                if (permission.key === "*" && checked) {
                                  Object.keys(newPermissions).forEach((key) => {
                                    if (key !== "*") {
                                      newPermissions[key] = false;
                                    }
                                  });
                                } else if (checked) {
                                  // If any other permission is checked, uncheck "*"
                                  newPermissions["*"] = false;
                                }
                                field.onChange(newPermissions);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {permission.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {!role && (
          <FormField
            control={form.control}
            name="is_system_role"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>System-Rolle</FormLabel>
                  <FormDescription>
                    System-Rollen können nicht bearbeitet oder gelöscht werden
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-between">
          <div>
            {role && onDelete && !role.is_system_role && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Löschen
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Abbrechen
              </Button>
            )}
            {role && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  form.reset();
                }}
              >
                Abbrechen
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || role?.is_system_role}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {role ? "Aktualisieren" : "Erstellen"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

