import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAllNotifications,
  getNotificationStats,
  createNotification,
  updateNotificationReadStatus,
  deleteNotification,
  markAllNotificationsAsRead,
  bulkDeleteNotifications,
  type UserNotification,
  type NotificationStats,
} from "../api/admin-notifications";

export function useNotifications(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  userId?: string;
  type?: string;
  read?: boolean;
}) {
  return useQuery({
    queryKey: ["notifications", options],
    queryFn: () => getAllNotifications(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useNotificationStats() {
  return useQuery({
    queryKey: ["notification-stats"],
    queryFn: () => getNotificationStats(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      user_id: string;
      title: string;
      content: string;
      type: string;
      action_url?: string;
      metadata?: Record<string, any>;
    }) => createNotification(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
      toast.success("Notification created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create notification");
    },
  });
}

export function useUpdateNotificationReadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) =>
      updateNotificationReadStatus(id, read),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteNotification(id);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete notification");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success("Notification deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete notification");
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => markAllNotificationsAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
      toast.success("All notifications marked as read");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark notifications as read");
    },
  });
}

export function useBulkDeleteNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const result = await bulkDeleteNotifications(ids);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete notifications");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success("Notifications deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete notifications");
    },
  });
}
