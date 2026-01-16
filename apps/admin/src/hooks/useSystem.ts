import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSystemStatus, getRecentErrors, resolveError, sendTestNotification } from "../api/admin-system";
import { toast } from "sonner";

export function useSystemStatus() {
  return useQuery({
    queryKey: ["system-status"],
    queryFn: () => getSystemStatus(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useRecentErrors(limit = 50, component?: string) {
  return useQuery({
    queryKey: ["system-errors", limit, component],
    queryFn: () => getRecentErrors(limit, component),
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useResolveError() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (errorId: string) => resolveError(errorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-errors"] });
      toast.success("Error resolved");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to resolve error");
    },
  });
}

export function useSendTestNotification() {
  return useMutation({
    mutationFn: () => sendTestNotification(),
    onSuccess: () => {
      toast.success("Test notification sent to all admins");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send test notification");
    },
  });
}
