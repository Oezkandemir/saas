import { useQuery } from "@tanstack/react-query";
import {
  getAllPageViews,
  getPageViewStats,
  getPageViewBreakdown,
} from "../api/admin-page-views";

export function usePageViews(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  userId?: string;
  country?: string;
  browser?: string;
  os?: string;
  deviceType?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["page-views", options],
    queryFn: () => getAllPageViews(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePageViewStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["page-view-stats", startDate, endDate],
    queryFn: () => getPageViewStats(startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePageViewBreakdown(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["page-view-breakdown", startDate, endDate],
    queryFn: () => getPageViewBreakdown(startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });
}
