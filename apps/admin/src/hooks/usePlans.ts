import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  type Plan,
  type PlanInput,
} from "../api/admin-plans";
import { toast } from "sonner";

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: () => getPlans(),
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PlanInput) => createPlan(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plan created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create plan");
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PlanInput> }) =>
      updatePlan(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plan updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update plan");
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plan deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete plan");
    },
  });
}
