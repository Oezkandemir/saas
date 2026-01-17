import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from "../hooks/useRoles";
import { roleSchema } from "../lib/validations";
import { Plus, Edit, Trash2, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import type { Role } from "../api/admin-roles";
import type { z } from "zod";

type RoleFormData = z.infer<typeof roleSchema>;

// Common permissions that can be assigned
const availablePermissions = [
  "users.read",
  "users.write",
  "users.delete",
  "plans.read",
  "plans.write",
  "plans.delete",
  "roles.read",
  "roles.write",
  "roles.delete",
  "webhooks.read",
  "webhooks.write",
  "webhooks.delete",
  "emails.read",
  "emails.write",
  "emails.delete",
  "blog.read",
  "blog.write",
  "blog.delete",
  "analytics.read",
  "revenue.read",
  "system.read",
  "support.read",
  "support.write",
  "companies.read",
  "companies.write",
];

export default function RolesPage() {
  const { data: rolesResponse, isLoading } = useRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const roles = rolesResponse?.data || [];

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: {},
      is_system_role: false,
    },
  });

  const onSubmit = async (data: RoleFormData) => {
    if (editingRole) {
      await updateRole.mutateAsync({ id: editingRole.id, input: data });
    } else {
      await createRole.mutateAsync(data);
    }
    setShowCreateForm(false);
    setEditingRole(null);
    form.reset();
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    form.reset({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions || {},
      is_system_role: role.is_system_role,
    });
    setShowCreateForm(true);
  };

  const handleDelete = async () => {
    if (deletingRole) {
      await deleteRole.mutateAsync(deletingRole.id);
      setDeletingRole(null);
    }
  };

  const togglePermission = (permission: string) => {
    const currentPermissions = form.getValues("permissions") || {};
    form.setValue("permissions", {
      ...currentPermissions,
      [permission]: !currentPermissions[permission],
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Roles</h1>
          <p className="text-muted-foreground mt-2">Manage user roles and permissions</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roles</h1>
          <p className="text-muted-foreground mt-2">
            Manage user roles and permissions ({roles.length} roles)
          </p>
        </div>
        <Button
          onClick={() => {
            setShowCreateForm(true);
            setEditingRole(null);
            form.reset();
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Roles List */}
      <div className="space-y-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="p-6 bg-card border border-border rounded-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold">{role.name}</h3>
                    {role.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {role.description}
                      </p>
                    )}
                  </div>
                  {role.is_system_role && (
                    <Badge variant="secondary" className="text-xs">
                      System Role
                    </Badge>
                  )}
                </div>

                {role.permissions && Object.keys(role.permissions).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Permissions:</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(role.permissions)
                        .filter(([_, enabled]) => enabled)
                        .map(([permission]) => (
                          <Badge
                            key={permission}
                            variant="outline"
                            className="text-xs bg-green-500/10 text-green-500 border-green-500/20"
                          >
                            {permission}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(role)}
                  disabled={role.is_system_role}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingRole(role)}
                  disabled={role.is_system_role}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}

        {roles.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No roles found. Create your first role to get started.
          </div>
        )}
      </div>

      {/* Create/Edit Role Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create New Role"}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update the role details and permissions below."
                : "Fill in the details to create a new role with specific permissions."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Editor" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Role description..."
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Permissions</FormLabel>
                <FormDescription>
                  Select the permissions this role should have
                </FormDescription>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg max-h-64 overflow-y-auto">
                  {availablePermissions.map((permission) => {
                    const currentPermissions = form.watch("permissions") || {};
                    const isChecked = currentPermissions[permission] || false;
                    return (
                      <div
                        key={permission}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={permission}
                          checked={isChecked}
                          onCheckedChange={() => togglePermission(permission)}
                        />
                        <label
                          htmlFor={permission}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {permission}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <FormField
                control={form.control}
                name="is_system_role"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={editingRole?.is_system_role}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>System Role</FormLabel>
                      <FormDescription>
                        System roles cannot be deleted or modified
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingRole(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRole ? "Update Role" : "Create Role"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingRole}
        onOpenChange={(open) => !open && setDeletingRole(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the role{" "}
              <strong>{deletingRole?.name}</strong>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingRole(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
