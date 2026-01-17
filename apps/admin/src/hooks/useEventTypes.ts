import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllEventTypes,
  getEventType,
  createEventType,
  updateEventType,
  deleteEventType,
  type EventType,
} from "../api/admin-event-types";
import { toast } from "sonner";

export function useEventTypes() {
  return useQuery({
    queryKey: ["event-types"],
    queryFn: async () => {
      console.log("Fetching event types...");
      const result = await getAllEventTypes();
      console.log("getAllEventTypes result:", result);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch event types");
      }
      return result.data || [];
    },
    staleTime: 0, // Always refetch
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    gcTime: 0, // Don't cache
  });
}

export function useEventType(id: string) {
  return useQuery({
    queryKey: ["event-type", id],
    queryFn: () => getEventType(id),
    enabled: !!id,
  });
}

export function useCreateEventType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      title: string;
      slug: string;
      description?: string | null;
      duration_minutes: number;
      buffer_before_minutes?: number;
      buffer_after_minutes?: number;
      location_type: "google_meet" | "zoom" | "custom_link" | "phone" | "in_person";
      location_value?: string | null;
      minimum_notice_hours?: number;
      booking_window_days?: number;
      is_active?: boolean;
      price_amount?: number | null;
      price_currency?: string | null;
      owner_user_id: string;
      company_profile_id?: string | null;
    }) => createEventType(input),
    onSuccess: async (result) => {
      console.log("Create mutation success:", result);
      if (result.success) {
        // Remove cache and force refetch
        queryClient.removeQueries({ queryKey: ["event-types"] });
        const refetchResult = await queryClient.refetchQueries({ queryKey: ["event-types"] });
        console.log("Refetch after create:", refetchResult);
        toast.success("Event type created successfully");
      } else {
        console.error("Create mutation failed:", result.error);
        toast.error(result.error || "Failed to create event type");
      }
    },
    onError: (error: Error) => {
      console.error("Create event type error:", error);
      toast.error(error.message || "Failed to create event type");
    },
  });
}

export function useUpdateEventType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<EventType> }) =>
      updateEventType(id, updates),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ["event-types"] });
      await queryClient.refetchQueries({ queryKey: ["event-types"] });
      toast.success("Event type updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update event type");
    },
  });
}

export function useDeleteEventType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEventType(id),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ["event-types"] });
      await queryClient.refetchQueries({ queryKey: ["event-types"] });
      toast.success("Event type deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete event type");
    },
  });
}
