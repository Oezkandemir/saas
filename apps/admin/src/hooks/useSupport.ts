import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTickets,
  getTicket,
  getTicketMessages,
  updateTicketStatus,
  addTicketMessage,
} from "../api/admin-support";
import { toast } from "sonner";

export function useTickets() {
  return useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => getTickets(),
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ["support-ticket", id],
    queryFn: () => getTicket(id),
    enabled: !!id,
  });
}

export function useTicketMessages(ticketId: string) {
  return useQuery({
    queryKey: ["support-ticket-messages", ticketId],
    queryFn: () => getTicketMessages(ticketId),
    enabled: !!ticketId,
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      status,
    }: {
      ticketId: string;
      status: "open" | "in_progress" | "resolved" | "closed";
    }) => updateTicketStatus(ticketId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Ticket status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update ticket status");
    },
  });
}

export function useAddTicketMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) =>
      addTicketMessage(ticketId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-ticket-messages"] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Message sent");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send message");
    },
  });
}
