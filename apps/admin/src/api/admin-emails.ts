import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface InboundEmail {
  id: string;
  email_id: string;
  message_id: string | null;
  from_email: string;
  from_name: string | null;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string | null;
  text_content: string | null;
  html_content: string | null;
  is_read: boolean;
  is_deleted?: boolean;
  is_starred?: boolean;
  is_archived?: boolean;
  deleted_at?: string | null;
  archived_at?: string | null;
  received_at: string;
  created_at: string;
  updated_at: string;
  attachments?: InboundEmailAttachment[];
}

export interface InboundEmailAttachment {
  id: string;
  inbound_email_id: string;
  attachment_id: string;
  filename: string;
  content_type: string | null;
  content_disposition: string | null;
  size: number | null;
  created_at: string;
}

export interface InboundEmailStats {
  total: number;
  unread: number;
  today: number;
  thisWeek: number;
}

export interface InboundEmailReply {
  id: string;
  inbound_email_id: string;
  user_id: string;
  subject: string;
  body: string;
  html_body: string | null;
  message_id: string | null;
  sent_at: string;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  user_email: string | null;
}

/**
 * Get inbound emails with pagination and filters
 */
export async function getInboundEmails(options?: {
  page?: number;
  limit?: number;
  filter?: "all" | "unread" | "read" | "starred" | "archived" | "trash";
}): Promise<ApiResponse<{ emails: InboundEmail[]; total: number }>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const filter = options?.filter || "all";

    let query = supabase.from("inbound_emails").select("*", { count: "exact" });

    // Apply filters
    if (filter === "unread") {
      query = query.eq("is_read", false).eq("is_deleted", false);
    } else if (filter === "read") {
      query = query.eq("is_read", true).eq("is_deleted", false);
    } else if (filter === "starred") {
      query = query.eq("is_starred", true).eq("is_deleted", false);
    } else if (filter === "archived") {
      query = query.eq("is_archived", true);
    } else if (filter === "trash") {
      query = query.eq("is_deleted", true);
    } else {
      query = query.eq("is_deleted", false).eq("is_archived", false);
    }

    const { data, error, count } = await query
      .order("received_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error && error.code !== "PGRST116") {
      return { data: null, error };
    }

    // Get attachments for emails
    const emailsWithAttachments = await Promise.all(
      (data || []).map(async (email) => {
        const { data: attachments } = await supabase
          .from("inbound_email_attachments")
          .select("*")
          .eq("inbound_email_id", email.id);

        return {
          ...email,
          to: Array.isArray(email.to) ? email.to : [],
          cc: Array.isArray(email.cc) ? email.cc : [],
          bcc: Array.isArray(email.bcc) ? email.bcc : [],
          attachments: attachments || [],
        };
      })
    );

    return {
      data: {
        emails: emailsWithAttachments as InboundEmail[],
        total: count || 0,
      },
      error: null,
    };
  });
}

/**
 * Get inbound email stats
 */
export async function getInboundEmailStats(): Promise<
  ApiResponse<InboundEmailStats>
> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data: allEmails, error } = await supabase
      .from("inbound_emails")
      .select("is_read, is_deleted, received_at");

    if (error && error.code !== "PGRST116") {
      return { data: null, error };
    }

    const emails = allEmails || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - 7);

    const stats: InboundEmailStats = {
      total: emails.filter((e) => !e.is_deleted).length,
      unread: emails.filter((e) => !e.is_read && !e.is_deleted).length,
      today: emails.filter(
        (e) => new Date(e.received_at) >= today && !e.is_deleted
      ).length,
      thisWeek: emails.filter(
        (e) => new Date(e.received_at) >= thisWeek && !e.is_deleted
      ).length,
    };

    return { data: stats, error: null };
  });
}

/**
 * Mark email as read/unread
 */
export async function markEmailRead(
  emailId: string,
  isRead: boolean
): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase
      .from("inbound_emails")
      .update({ is_read: isRead })
      .eq("id", emailId);

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}

/**
 * Toggle email starred status
 */
export async function toggleEmailStarred(
  emailId: string
): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // Get current starred status
    const { data: email } = await supabase
      .from("inbound_emails")
      .select("is_starred")
      .eq("id", emailId)
      .single();

    const { error } = await supabase
      .from("inbound_emails")
      .update({ is_starred: !email?.is_starred })
      .eq("id", emailId);

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}

/**
 * Archive email
 */
export async function archiveEmail(emailId: string): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase
      .from("inbound_emails")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq("id", emailId);

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}

/**
 * Delete email
 */
export async function deleteEmail(emailId: string): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase
      .from("inbound_emails")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", emailId);

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}

/**
 * Send email reply
 */
export interface SendEmailParams {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  htmlContent: string;
  textContent: string;
  replyToMessageId?: string;
  attachments?: File[];
}

/**
 * Get replies for an inbound email
 */
export async function getInboundEmailReplies(
  inboundEmailId: string
): Promise<ApiResponse<InboundEmailReply[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("inbound_email_replies")
      .select(`
        *,
        users:user_id (
          name,
          email
        )
      `)
      .eq("inbound_email_id", inboundEmailId)
      .order("sent_at", { ascending: true });

    if (error) {
      return { data: null, error };
    }

    const replies: InboundEmailReply[] = (data || []).map((reply: any) => ({
      id: reply.id,
      inbound_email_id: reply.inbound_email_id,
      user_id: reply.user_id,
      subject: reply.subject,
      body: reply.body,
      html_body: reply.html_body,
      message_id: reply.message_id,
      sent_at: reply.sent_at,
      created_at: reply.created_at,
      updated_at: reply.updated_at,
      user_name: reply.users?.name || null,
      user_email: reply.users?.email || null,
    }));

    return { data: replies, error: null };
  });
}

export async function sendEmail(
  params: SendEmailParams
): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // In a real implementation, you would call your email sending service here
    // For now, we'll just log it and return success
    // You should integrate with your email service (Resend, SendGrid, etc.)
    
    console.log("Sending email:", {
      to: params.to,
      cc: params.cc,
      bcc: params.bcc,
      subject: params.subject,
      replyToMessageId: params.replyToMessageId,
      hasAttachments: !!params.attachments?.length,
    });

    // TODO: Implement actual email sending via your email service
    // Example with fetch to your backend API:
    // const formData = new FormData();
    // formData.append('to', JSON.stringify(params.to));
    // if (params.cc) formData.append('cc', JSON.stringify(params.cc));
    // if (params.bcc) formData.append('bcc', JSON.stringify(params.bcc));
    // formData.append('subject', params.subject);
    // formData.append('htmlContent', params.htmlContent);
    // formData.append('textContent', params.textContent);
    // if (params.replyToMessageId) formData.append('replyToMessageId', params.replyToMessageId);
    // if (params.attachments) {
    //   params.attachments.forEach((file) => {
    //     formData.append('attachments', file);
    //   });
    // }
    // 
    // const response = await fetch('/api/emails/send', {
    //   method: 'POST',
    //   body: formData,
    // });
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to send email');
    // }

    // For now, simulate success
    return { data: undefined, error: null };
  });
}
