import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllQRCodes,
  getQRCodeAnalytics,
  getQRCodeScans,
  toggleQRCodeStatus,
  getQRCodeStats,
  type QRCode,
} from "../api/admin-qr-codes";
import { toast } from "sonner";

export function useQRCodes() {
  return useQuery({
    queryKey: ["qr-codes"],
    queryFn: () => getAllQRCodes(),
  });
}

export function useQRCodeAnalytics(qrCodeId: string) {
  return useQuery({
    queryKey: ["qr-code-analytics", qrCodeId],
    queryFn: () => getQRCodeAnalytics(qrCodeId),
    enabled: !!qrCodeId,
  });
}

export function useQRCodeScans(qrCodeId: string, limit?: number) {
  return useQuery({
    queryKey: ["qr-code-scans", qrCodeId, limit],
    queryFn: () => getQRCodeScans(qrCodeId, limit),
    enabled: !!qrCodeId,
  });
}

export function useQRCodeStats() {
  return useQuery({
    queryKey: ["qr-code-stats"],
    queryFn: () => getQRCodeStats(),
  });
}

export function useToggleQRCodeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => toggleQRCodeStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qr-codes"] });
      queryClient.invalidateQueries({ queryKey: ["qr-code-stats"] });
      toast.success("QR code status updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update QR code status");
    },
  });
}
