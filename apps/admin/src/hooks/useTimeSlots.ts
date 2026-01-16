import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllTimeSlots,
  getTimeSlotsByEventType,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  type TimeSlot,
} from "../api/admin-time-slots";
import { toast } from "sonner";

export function useTimeSlots() {
  return useQuery({
    queryKey: ["time-slots"],
    queryFn: () => getAllTimeSlots(),
  });
}

export function useTimeSlotsByEventType(eventTypeId: string) {
  return useQuery({
    queryKey: ["time-slots", eventTypeId],
    queryFn: () => getTimeSlotsByEventType(eventTypeId),
    enabled: !!eventTypeId,
  });
}

export function useCreateTimeSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      event_type_id: string;
      start_time: string;
      end_time: string;
      day_of_week: number | null;
      max_participants?: number | null;
    }) => createTimeSlot(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-slots"] });
      toast.success("Time slot created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create time slot");
    },
  });
}

export function useUpdateTimeSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TimeSlot> }) =>
      updateTimeSlot(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-slots"] });
      toast.success("Time slot updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update time slot");
    },
  });
}

export function useDeleteTimeSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTimeSlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-slots"] });
      toast.success("Time slot deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete time slot");
    },
  });
}
