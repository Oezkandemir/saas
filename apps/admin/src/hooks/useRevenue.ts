import { useQuery } from "@tanstack/react-query";
import { getRevenueAnalytics } from "../api/admin-revenue";

export function useRevenue(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ["revenue", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () => getRevenueAnalytics(startDate, endDate),
    refetchInterval: false, // Disable auto-refetch to prevent infinite loops
    retry: 1,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}
