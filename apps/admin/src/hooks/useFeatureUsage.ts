import { useQuery } from "@tanstack/react-query";
import {
  getAllFeatureUsage,
  getFeatureUsageStats,
} from "../api/admin-feature-usage";

export function useFeatureUsage(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  userId?: string;
  featureName?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["feature-usage", options],
    queryFn: () => getAllFeatureUsage(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useFeatureUsageStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["feature-usage-stats", startDate, endDate],
    queryFn: () => getFeatureUsageStats(startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });
}
