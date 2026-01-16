import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInboundEmails,
  getInboundEmailStats,
  getInboundEmailReplies,
  markEmailRead,
  toggleEmailStarred,
  archiveEmail,
  deleteEmail,
  sendEmail,
  type SendEmailParams,
} from "../api/admin-emails";
import { toast } from "sonner";

export function useInboundEmails(options?: {
  page?: number;
  limit?: number;
  filter?: "all" | "unread" | "read" | "starred" | "archived" | "trash";
}) {
  return useQuery({
    queryKey: ["inbound-emails", options],
    queryFn: () => getInboundEmails(options),
  });
}

export function useInboundEmailStats() {
  return useQuery({
    queryKey: ["inbound-email-stats"],
    queryFn: () => getInboundEmailStats(),
  });
}

export function useInboundEmailReplies(emailId: string) {
  return useQuery({
    queryKey: ["inbound-email-replies", emailId],
    queryFn: () => getInboundEmailReplies(emailId),
    enabled: !!emailId,
  });
}

export function useMarkEmailRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ emailId, isRead }: { emailId: string; isRead: boolean }) =>
      markEmailRead(emailId, isRead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound-emails"] });
      queryClient.invalidateQueries({ queryKey: ["inbound-email-stats"] });
    },
  });
}

export function useToggleEmailStarred() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (emailId: string) => toggleEmailStarred(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound-emails"] });
    },
  });
}

export function useArchiveEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (emailId: string) => archiveEmail(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound-emails"] });
      queryClient.invalidateQueries({ queryKey: ["inbound-email-stats"] });
      toast.success("Email archived");
    },
  });
}

export function useDeleteEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (emailId: string) => deleteEmail(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound-emails"] });
      queryClient.invalidateQueries({ queryKey: ["inbound-email-stats"] });
      toast.success("Email deleted");
    },
  });
}

export function useSendEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SendEmailParams) => sendEmail(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbound-emails"] });
      queryClient.invalidateQueries({ queryKey: ["inbound-email-stats"] });
      queryClient.invalidateQueries({ queryKey: ["inbound-email-replies"] });
      toast.success("Email sent successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send email");
    },
  });
}
