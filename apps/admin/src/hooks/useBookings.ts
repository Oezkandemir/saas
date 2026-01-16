import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllBookings,
  getBookingDetails,
  cancelBooking,
  getBookingAnalytics,
  type Booking,
} from "../api/admin-bookings";
import { toast } from "sonner";

export function useBookings() {
  return useQuery({
    queryKey: ["bookings"],
    queryFn: () => getAllBookings(),
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: () => getBookingDetails(id),
    enabled: !!id,
  });
}

export function useBookingAnalytics() {
  return useQuery({
    queryKey: ["booking-analytics"],
    queryFn: () => getBookingAnalytics(),
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cancelBooking(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking-analytics"] });
      toast.success("Booking canceled successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to cancel booking");
    },
  });
}
