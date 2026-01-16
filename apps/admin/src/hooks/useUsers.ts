import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllUsers,
  getUserById,
  getUserStats,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  bulkUpdateUserRoles,
  bulkUpdateUserStatus,
  type User,
} from "../api/admin-users";
import { toast } from "sonner";

export function useUsers(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["users", options],
    queryFn: () => getAllUsers(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: ["user-stats"],
    queryFn: () => getUserStats(),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: string }) =>
      updateUserRole(userId, newRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      toast.success("User role updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user role");
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      status,
    }: {
      userId: string;
      status: "active" | "banned";
    }) => updateUserStatus(userId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      toast.success(
        `User ${variables.status === "banned" ? "banned" : "unbanned"} successfully`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user status");
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      toast.success("User deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });
}

export function useBulkUpdateUserRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userIds,
      newRole,
    }: {
      userIds: string[];
      newRole: string;
    }) => bulkUpdateUserRoles(userIds, newRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      toast.success("User roles updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user roles");
    },
  });
}

export function useBulkUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userIds,
      status,
    }: {
      userIds: string[];
      status: "active" | "banned";
    }) => bulkUpdateUserStatus(userIds, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      toast.success(
        `Users ${variables.status === "banned" ? "banned" : "unbanned"} successfully`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user status");
    },
  });
}
