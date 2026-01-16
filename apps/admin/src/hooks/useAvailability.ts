import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllAvailabilityRules,
  getAvailabilityRules,
  createAvailabilityRule,
  updateAvailabilityRule,
  deleteAvailabilityRule,
  getAllAvailabilityOverrides,
  getAvailabilityOverrides,
  createAvailabilityOverride,
  updateAvailabilityOverride,
  deleteAvailabilityOverride,
  type AvailabilityRule,
  type AvailabilityOverride,
} from "../api/admin-availability";
import { toast } from "sonner";

// Availability Rules Hooks
export function useAvailabilityRules(userId?: string, eventTypeId?: string) {
  return useQuery({
    queryKey: ["availability-rules", userId, eventTypeId],
    queryFn: () => getAvailabilityRules(userId, eventTypeId),
  });
}

export function useAllAvailabilityRules() {
  return useQuery({
    queryKey: ["availability-rules", "all"],
    queryFn: () => getAllAvailabilityRules(),
  });
}

export function useCreateAvailabilityRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      user_id: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
      timezone?: string;
      company_profile_id?: string | null;
      event_type_id?: string | null;
    }) => createAvailabilityRule(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-rules"] });
      toast.success("Availability rule created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create availability rule");
    },
  });
}

export function useUpdateAvailabilityRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AvailabilityRule> }) =>
      updateAvailabilityRule(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-rules"] });
      toast.success("Availability rule updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update availability rule");
    },
  });
}

export function useDeleteAvailabilityRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAvailabilityRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-rules"] });
      toast.success("Availability rule deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete availability rule");
    },
  });
}

// Availability Overrides Hooks
export function useAvailabilityOverrides(userId?: string, eventTypeId?: string) {
  return useQuery({
    queryKey: ["availability-overrides", userId, eventTypeId],
    queryFn: () => getAvailabilityOverrides(userId, eventTypeId),
  });
}

export function useAllAvailabilityOverrides() {
  return useQuery({
    queryKey: ["availability-overrides", "all"],
    queryFn: () => getAllAvailabilityOverrides(),
  });
}

export function useCreateAvailabilityOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      user_id: string;
      date: string;
      is_unavailable: boolean;
      start_time?: string | null;
      end_time?: string | null;
      timezone?: string;
      company_profile_id?: string | null;
      event_type_id?: string | null;
    }) => createAvailabilityOverride(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-overrides"] });
      toast.success("Date override created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create date override");
    },
  });
}

export function useUpdateAvailabilityOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AvailabilityOverride> }) =>
      updateAvailabilityOverride(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-overrides"] });
      toast.success("Date override updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update date override");
    },
  });
}

export function useDeleteAvailabilityOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAvailabilityOverride(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-overrides"] });
      toast.success("Date override deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete date override");
    },
  });
}
