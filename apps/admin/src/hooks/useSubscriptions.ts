import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllSubscriptions,
  getSubscriptionDetails,
  updateSubscription,
  getSubscriptionAnalytics,
  type Subscription,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "../api/admin-subscriptions";
import { toast } from "sonner";

export function useSubscriptions() {
  return useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => getAllSubscriptions(),
  });
}

export function useSubscription(id: string) {
  return useQuery({
    queryKey: ["subscription", id],
    queryFn: () => getSubscriptionDetails(id),
    enabled: !!id,
  });
}

export function useSubscriptionAnalytics() {
  return useQuery({
    queryKey: ["subscription-analytics"],
    queryFn: () => getSubscriptionAnalytics(),
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<{
        plan: SubscriptionPlan;
        status: SubscriptionStatus;
        cancel_at_period_end: boolean;
      }>;
    }) => updateSubscription(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({
        queryKey: ["subscription", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["subscription-analytics"],
      });
      toast.success("Subscription updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update subscription");
    },
  });
}
