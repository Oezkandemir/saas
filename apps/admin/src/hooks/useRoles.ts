import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  assignRoleToUser,
  removeRoleFromUser,
  type Role,
  type RoleInput,
} from "../api/admin-roles";
import { toast } from "sonner";

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => getRoles(),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RoleInput) => createRole(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create role");
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<RoleInput> }) =>
      updateRole(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update role");
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete role");
    },
  });
}
