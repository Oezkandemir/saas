import { useQuery } from "@tanstack/react-query";
import { getAnalyticsData } from "../api/admin-analytics";

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: () => getAnalyticsData(),
    refetchInterval: 60000, // Refetch every minute
  });
}
