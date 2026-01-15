"use server";

import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type InboundEmail = {
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
  received_at: string;
  created_at: string;
  updated_at: string;
  attachments?: InboundEmailAttachment[];
};

export type InboundEmailAttachment = {
  id: string;
  inbound_email_id: string;
  attachment_id: string;
  filename: string;
  content_type: string | null;
  content_disposition: string | null;
  size: number | null;
  created_at: string;
};

export type InboundEmailReply = {
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
  user_name?: string;
  user_email?: string;
};

export type InboundEmailStats = {
  total: number;
  unread: number;
  today: number;
  thisWeek: number;
};

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Get all inbound emails with pagination
 */
export async function getInboundEmails(options?: {
  page?: number;
  limit?: number;
  filter?: "all" | "unread" | "read";
}): Promise<ActionResult<{ emails: InboundEmail[]; total: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const filter = options?.filter || "all";

    // Build query - get count first for accurate total
    let countQuery = supabase
      .from("inbound_emails")
      .select("*", { count: "exact", head: true });

    // Apply filter to count query
    if (filter === "unread") {
      countQuery = countQuery.eq("is_read", false);
    } else if (filter === "read") {
      countQuery = countQuery.eq("is_read", true);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      logger.error("Error fetching email count:", countError);
    }

    // Build data query
    let query = supabase
      .from("inbound_emails")
      .select("*, inbound_email_attachments(*)")
      .order("received_at", { ascending: false });

    // Apply filter
    if (filter === "unread") {
      query = query.eq("is_read", false);
    } else if (filter === "read") {
      query = query.eq("is_read", true);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      logger.error("Error fetching inbound emails:", {
        error,
        message: error.message,
        code: error.code,
        details: error.details,
        filter,
        page,
        limit,
      });
      return {
        success: false,
        error: error.message,
      };
    }

    logger.debug("Fetched inbound emails", {
      count: data?.length || 0,
      total: count || 0,
      filter,
      page,
      limit,
    });

    // Transform data to include attachments
    const emails: InboundEmail[] = (data || []).map((email: any) => ({
      id: email.id,
      email_id: email.email_id,
      message_id: email.message_id,
      from_email: email.from_email,
      from_name: email.from_name,
      to: email.to || [],
      cc: email.cc || [],
      bcc: email.bcc || [],
      subject: email.subject,
      text_content: email.text_content,
      html_content: email.html_content,
      is_read: email.is_read,
      received_at: email.received_at,
      created_at: email.created_at,
      updated_at: email.updated_at,
      attachments: email.inbound_email_attachments || [],
    }));

    return {
      success: true,
      data: {
        emails,
        total: count || 0,
      },
    };
  } catch (error) {
    logger.error("Error in getInboundEmails:", error);
    return {
      success: false,
      error: "Failed to fetch inbound emails",
    };
  }
}

/**
 * Get a single inbound email by ID
 */
export async function getInboundEmailById(
  id: string
): Promise<ActionResult<InboundEmail>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("inbound_emails")
      .select("*, inbound_email_attachments(*)")
      .eq("id", id)
      .single();

    if (error) {
      logger.error("Error fetching inbound email:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data) {
      return {
        success: false,
        error: "Email not found",
      };
    }

    const email: InboundEmail = {
      id: data.id,
      email_id: data.email_id,
      message_id: data.message_id,
      from_email: data.from_email,
      from_name: data.from_name,
      to: data.to || [],
      cc: data.cc || [],
      bcc: data.bcc || [],
      subject: data.subject,
      text_content: data.text_content,
      html_content: data.html_content,
      is_read: data.is_read,
      received_at: data.received_at,
      created_at: data.created_at,
      updated_at: data.updated_at,
      attachments: data.inbound_email_attachments || [],
    };

    return {
      success: true,
      data: email,
    };
  } catch (error) {
    logger.error("Error in getInboundEmailById:", error);
    return {
      success: false,
      error: "Failed to fetch inbound email",
    };
  }
}

/**
 * Mark email as read
 */
export async function markEmailAsRead(id: string): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("inbound_emails")
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      logger.error("Error marking email as read:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/admin/emails");
    return {
      success: true,
    };
  } catch (error) {
    logger.error("Error in markEmailAsRead:", error);
    return {
      success: false,
      error: "Failed to mark email as read",
    };
  }
}

/**
 * Mark email as unread
 */
export async function markEmailAsUnread(
  id: string
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("inbound_emails")
      .update({ is_read: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      logger.error("Error marking email as unread:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/admin/emails");
    return {
      success: true,
    };
  } catch (error) {
    logger.error("Error in markEmailAsUnread:", error);
    return {
      success: false,
      error: "Failed to mark email as unread",
    };
  }
}

/**
 * Delete an inbound email
 */
export async function deleteInboundEmail(
  id: string
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("inbound_emails")
      .delete()
      .eq("id", id);

    if (error) {
      logger.error("Error deleting inbound email:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/admin/emails");
    return {
      success: true,
    };
  } catch (error) {
    logger.error("Error in deleteInboundEmail:", error);
    return {
      success: false,
      error: "Failed to delete inbound email",
    };
  }
}

/**
 * Get inbound email statistics
 */
export async function getInboundEmailStats(): Promise<
  ActionResult<InboundEmailStats>
> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    // Get total count with error handling
    let total = 0;
    try {
      const { count, error: totalError } = await supabase
        .from("inbound_emails")
        .select("*", { count: "exact", head: true });

      if (totalError) {
        logger.error("Error fetching total count:", totalError);
      } else {
        total = count || 0;
      }
    } catch (error) {
      logger.error("Error fetching total count:", error);
    }

    // Get unread count with error handling
    let unread = 0;
    try {
      const { count, error: unreadError } = await supabase
        .from("inbound_emails")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);

      if (unreadError) {
        logger.error("Error fetching unread count:", unreadError);
      } else {
        unread = count || 0;
      }
    } catch (error) {
      logger.error("Error fetching unread count:", error);
    }

    // Get today's count with error handling
    let todayCount = 0;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count, error: todayError } = await supabase
        .from("inbound_emails")
        .select("*", { count: "exact", head: true })
        .gte("received_at", today.toISOString());

      if (todayError) {
        logger.error("Error fetching today count:", todayError);
      } else {
        todayCount = count || 0;
      }
    } catch (error) {
      logger.error("Error fetching today count:", error);
    }

    // Get this week's count with error handling
    let weekCount = 0;
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count, error: weekError } = await supabase
        .from("inbound_emails")
        .select("*", { count: "exact", head: true })
        .gte("received_at", weekAgo.toISOString());

      if (weekError) {
        logger.error("Error fetching week count:", weekError);
      } else {
        weekCount = count || 0;
      }
    } catch (error) {
      logger.error("Error fetching week count:", error);
    }

    return {
      success: true,
      data: {
        total,
        unread,
        today: todayCount,
        thisWeek: weekCount,
      },
    };
  } catch (error: any) {
    logger.error("Error in getInboundEmailStats:", {
      error: error.message,
      stack: error.stack,
    });
    // Return default values instead of failing completely
    return {
      success: true,
      data: {
        total: 0,
        unread: 0,
        today: 0,
        thisWeek: 0,
      },
    };
  }
}

/**
 * Get replies for an inbound email
 */
export async function getInboundEmailReplies(
  inboundEmailId: string
): Promise<ActionResult<InboundEmailReply[]>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

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
      logger.error("Error fetching email replies:", error);
      return {
        success: false,
        error: error.message,
      };
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

    return {
      success: true,
      data: replies,
    };
  } catch (error) {
    logger.error("Error in getInboundEmailReplies:", error);
    return {
      success: false,
      error: "Failed to fetch email replies",
    };
  }
}
