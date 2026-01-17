import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  getWebhookDeliveries,
  type Webhook,
  type WebhookInput,
} from "../api/admin-webhooks";
import { toast } from "sonner";

export function useWebhooks() {
  return useQuery({
    queryKey: ["webhooks"],
    queryFn: () => getWebhooks(),
  });
}

export function useWebhookDeliveries(webhookId?: string) {
  return useQuery({
    queryKey: ["webhook-deliveries", webhookId],
    queryFn: () => getWebhookDeliveries(webhookId),
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: WebhookInput) => createWebhook(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create webhook");
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<WebhookInput> }) =>
      updateWebhook(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update webhook");
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete webhook");
    },
  });
}
