import { useQuery } from "@tanstack/react-query";
import { getTwoFactorStatus } from "../api/admin-2fa";

export function useTwoFactor() {
  const { data: statusResponse, isLoading, refetch } = useQuery({
    queryKey: ["two-factor-status"],
    queryFn: () => getTwoFactorStatus(),
  });

  return {
    status: statusResponse?.data,
    isLoading,
    isEnabled: statusResponse?.data?.enabled || false,
    refetch,
  };
}
