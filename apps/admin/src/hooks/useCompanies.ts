import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCompanyProfiles,
  getAllCompanyProfiles,
  getCompanyProfile,
  getCompanyProfilesByUser,
  updateCompanyProfile,
  setDefaultCompanyProfile,
  getCompanyStats,
  type CompanyProfile,
} from "../api/admin-companies";
import { toast } from "sonner";

export function useCompanyProfiles(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  userId?: string;
  profileType?: string;
  country?: string;
}) {
  return useQuery({
    queryKey: ["company-profiles", options],
    queryFn: () => getCompanyProfiles(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAllCompanyProfiles() {
  return useQuery({
    queryKey: ["company-profiles", "all"],
    queryFn: () => getAllCompanyProfiles(),
  });
}

export function useCompanyStats() {
  return useQuery({
    queryKey: ["company-stats"],
    queryFn: () => getCompanyStats(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompanyProfile(id: string) {
  return useQuery({
    queryKey: ["company-profile", id],
    queryFn: () => getCompanyProfile(id),
    enabled: !!id,
  });
}

export function useCompanyProfilesByUser(userId: string) {
  return useQuery({
    queryKey: ["company-profiles", "user", userId],
    queryFn: () => getCompanyProfilesByUser(userId),
    enabled: !!userId,
  });
}

export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CompanyProfile>;
    }) => updateCompanyProfile(id, updates),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ["company-profiles"] });
        toast.success("Company profile updated successfully");
      } else {
        toast.error(response.error || "Failed to update company profile");
        throw new Error(response.error || "Failed to update company profile");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update company profile");
    },
  });
}

export function useSetDefaultCompanyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      profileId,
    }: {
      userId: string;
      profileId: string;
    }) => setDefaultCompanyProfile(userId, profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-profiles"] });
      toast.success("Default company profile updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to set default profile");
    },
  });
}
