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
  is_deleted?: boolean;
  is_starred?: boolean;
  is_archived?: boolean;
  deleted_at?: string | null;
  archived_at?: string | null;
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
  filter?: "all" | "unread" | "read" | "starred" | "archived" | "deleted";
  includeDeleted?: boolean;
  includeArchived?: boolean;
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
    const includeDeleted = options?.includeDeleted || false;
    const includeArchived = options?.includeArchived || false;

    // Build query - get count first for accurate total
    let countQuery = supabase
      .from("inbound_emails")
      .select("*", { count: "exact", head: true });

    // Exclude deleted emails by default (unless viewing deleted filter or explicitly requested)
    if (filter !== "deleted" && !includeDeleted) {
      countQuery = countQuery.eq("is_deleted", false);
    }

    // Apply filter to count query
    if (filter === "unread") {
      countQuery = countQuery.eq("is_read", false);
    } else if (filter === "read") {
      countQuery = countQuery.eq("is_read", true);
    } else if (filter === "starred") {
      countQuery = countQuery.eq("is_starred", true);
    } else if (filter === "archived") {
      countQuery = countQuery.eq("is_archived", true);
    } else if (filter === "deleted") {
      countQuery = countQuery.eq("is_deleted", true);
    }

    // Exclude archived emails from inbox by default (unless viewing archived or deleted filter or explicitly requested)
    if (filter !== "archived" && filter !== "deleted" && !includeArchived) {
      countQuery = countQuery.eq("is_archived", false);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      logger.error("Error fetching email count:", countError);
    }

    // Build data query - only select fields needed for list view
    // Include text_content for preview, but skip html_content and attachments for better performance
    // html_content and attachments will be fetched when viewing email detail
    // Note: New fields (is_starred, is_archived, is_deleted) are selected but may not exist until migration is run
    let query = supabase
      .from("inbound_emails")
      .select(
        "id, email_id, message_id, from_email, from_name, to, cc, bcc, subject, text_content, is_read, is_starred, is_archived, is_deleted, received_at, created_at, updated_at"
      )
      .order("received_at", { ascending: false });

    // Exclude deleted emails by default (unless viewing deleted filter)
    if (filter !== "deleted" && !includeDeleted) {
      query = query.eq("is_deleted", false);
    }

    // Apply filter
    if (filter === "unread") {
      query = query.eq("is_read", false);
    } else if (filter === "read") {
      query = query.eq("is_read", true);
    } else if (filter === "starred") {
      query = query.eq("is_starred", true);
    } else if (filter === "archived") {
      query = query.eq("is_archived", true);
    } else if (filter === "deleted") {
      query = query.eq("is_deleted", true);
    }

    // Exclude archived emails from inbox by default (unless viewing archived or deleted filter)
    if (filter !== "archived" && filter !== "deleted" && !includeArchived) {
      query = query.eq("is_archived", false);
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

    // Transform data - html_content and attachments not fetched in list view for better performance
    // text_content is included for preview in list view
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
      text_content: email.text_content, // Included for preview
      html_content: null, // Not fetched in list view for performance - fetched in detail view
      is_read: email.is_read,
      is_starred: email.is_starred || false,
      is_archived: email.is_archived || false,
      is_deleted: email.is_deleted || false,
      received_at: email.received_at,
      created_at: email.created_at,
      updated_at: email.updated_at,
      attachments: [], // Not fetched in list view for performance - fetched in detail view
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
      is_starred: data.is_starred || false,
      is_archived: data.is_archived || false,
      is_deleted: data.is_deleted || false,
      deleted_at: data.deleted_at || null,
      archived_at: data.archived_at || null,
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
 * Delete an inbound email (soft delete - marks as deleted to prevent re-sync)
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

    // Soft delete - mark as deleted instead of actually deleting
    const { error } = await supabase
      .from("inbound_emails")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
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
 * Restore a deleted email (un-delete)
 */
export async function restoreDeletedEmail(
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

    // Restore - unmark as deleted
    const { error } = await supabase
      .from("inbound_emails")
      .update({
        is_deleted: false,
        deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      logger.error("Error restoring deleted email:", error);
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
    logger.error("Error in restoreDeletedEmail:", error);
    return {
      success: false,
      error: "Failed to restore email",
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
      // Don't fail completely - return empty array instead
      // This allows the email to load even if replies fail
      return {
        success: true,
        data: [],
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

/**
 * Toggle star/favorite status of an email
 */
export async function toggleEmailStar(
  id: string
): Promise<ActionResult<{ is_starred: boolean }>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    // Get current star status
    const { data: email } = await supabase
      .from("inbound_emails")
      .select("is_starred")
      .eq("id", id)
      .single();

    if (!email) {
      return {
        success: false,
        error: "Email not found",
      };
    }

    const newStarStatus = !email.is_starred;

    // Update star status
    const { error } = await supabase
      .from("inbound_emails")
      .update({
        is_starred: newStarStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      logger.error("Error toggling email star:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/admin/emails");
    return {
      success: true,
      data: { is_starred: newStarStatus },
    };
  } catch (error) {
    logger.error("Error in toggleEmailStar:", error);
    return {
      success: false,
      error: "Failed to toggle email star",
    };
  }
}

/**
 * Archive an email
 */
export async function archiveEmail(
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
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      logger.error("Error archiving email:", error);
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
    logger.error("Error in archiveEmail:", error);
    return {
      success: false,
      error: "Failed to archive email",
    };
  }
}

/**
 * Unarchive an email
 */
export async function unarchiveEmail(
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
      .update({
        is_archived: false,
        archived_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      logger.error("Error unarchiving email:", error);
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
    logger.error("Error in unarchiveEmail:", error);
    return {
      success: false,
      error: "Failed to unarchive email",
    };
  }
}

/**
 * Bulk actions for multiple emails
 */
export async function bulkMarkAsRead(
  ids: string[]
): Promise<ActionResult<{ updated: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    const { error, count } = await supabase
      .from("inbound_emails")
      .update({
        is_read: true,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids)
      .eq("is_deleted", false);

    if (error) {
      logger.error("Error bulk marking as read:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/admin/emails");
    return {
      success: true,
      data: { updated: count || ids.length },
    };
  } catch (error) {
    logger.error("Error in bulkMarkAsRead:", error);
    return {
      success: false,
      error: "Failed to mark emails as read",
    };
  }
}

export async function bulkMarkAsUnread(
  ids: string[]
): Promise<ActionResult<{ updated: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    const { error, count } = await supabase
      .from("inbound_emails")
      .update({
        is_read: false,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids)
      .eq("is_deleted", false);

    if (error) {
      logger.error("Error bulk marking as unread:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/admin/emails");
    return {
      success: true,
      data: { updated: count || ids.length },
    };
  } catch (error) {
    logger.error("Error in bulkMarkAsUnread:", error);
    return {
      success: false,
      error: "Failed to mark emails as unread",
    };
  }
}

export async function bulkDelete(
  ids: string[]
): Promise<ActionResult<{ deleted: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    // Soft delete - mark as deleted
    const { error, count } = await supabase
      .from("inbound_emails")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in("id", ids);

    if (error) {
      logger.error("Error bulk deleting:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/admin/emails");
    return {
      success: true,
      data: { deleted: count || ids.length },
    };
  } catch (error) {
    logger.error("Error in bulkDelete:", error);
    return {
      success: false,
      error: "Failed to delete emails",
    };
  }
}

export async function bulkRestore(
  ids: string[]
): Promise<ActionResult<{ restored: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    // Restore - unmark as deleted
    const { error, count } = await supabase
      .from("inbound_emails")
      .update({
        is_deleted: false,
        deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids);

    if (error) {
      logger.error("Error bulk restoring:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/admin/emails");
    return {
      success: true,
      data: { restored: count || ids.length },
    };
  } catch (error) {
    logger.error("Error in bulkRestore:", error);
    return {
      success: false,
      error: "Failed to restore emails",
    };
  }
}

export async function bulkArchive(
  ids: string[]
): Promise<ActionResult<{ archived: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    const { error, count } = await supabase
      .from("inbound_emails")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in("id", ids)
      .eq("is_deleted", false);

    if (error) {
      logger.error("Error bulk archiving:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/admin/emails");
    return {
      success: true,
      data: { archived: count || ids.length },
    };
  } catch (error) {
    logger.error("Error in bulkArchive:", error);
    return {
      success: false,
      error: "Failed to archive emails",
    };
  }
}

export async function bulkToggleStar(
  ids: string[],
  star: boolean
): Promise<ActionResult<{ updated: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized: Admin access required",
      };
    }

    const supabase = await createClient();

    const { error, count } = await supabase
      .from("inbound_emails")
      .update({
        is_starred: star,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids)
      .eq("is_deleted", false);

    if (error) {
      logger.error("Error bulk toggling star:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/admin/emails");
    return {
      success: true,
      data: { updated: count || ids.length },
    };
  } catch (error) {
    logger.error("Error in bulkToggleStar:", error);
    return {
      success: false,
      error: "Failed to toggle email stars",
    };
  }
}

/**
 * Search emails by query (sender, subject, content)
 */
export async function searchInboundEmails(options?: {
  query?: string;
  page?: number;
  limit?: number;
  filter?: "all" | "unread" | "read" | "starred" | "archived" | "deleted";
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
    const searchQuery = options?.query?.toLowerCase().trim() || "";

    // Build base query - exclude deleted emails
    let query = supabase
      .from("inbound_emails")
      .select(
        "id, email_id, message_id, from_email, from_name, to, cc, bcc, subject, text_content, is_read, is_starred, is_archived, is_deleted, received_at, created_at, updated_at",
        { count: "exact" }
      )
      .order("received_at", { ascending: false });
    
    // Exclude deleted emails by default (unless viewing deleted filter)
    if (filter !== "deleted") {
      query = query.eq("is_deleted", false);
    }

    // Apply search query if provided
    if (searchQuery) {
      query = query.or(
        `from_email.ilike.%${searchQuery}%,from_name.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%,text_content.ilike.%${searchQuery}%`
      );
    }

    // Apply filter
    if (filter === "unread") {
      query = query.eq("is_read", false);
    } else if (filter === "read") {
      query = query.eq("is_read", true);
    } else if (filter === "starred") {
      query = query.eq("is_starred", true);
    } else if (filter === "archived") {
      query = query.eq("is_archived", true);
    } else if (filter === "deleted") {
      query = query.eq("is_deleted", true);
    }

    // Exclude archived emails from inbox by default (unless viewing archived or deleted filter)
    if (filter !== "archived" && filter !== "deleted") {
      query = query.eq("is_archived", false);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      logger.error("Error searching inbound emails:", error);
      return {
        success: false,
        error: error.message,
      };
    }

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
      html_content: null,
      is_read: email.is_read,
      is_starred: email.is_starred || false,
      is_archived: email.is_archived || false,
      is_deleted: email.is_deleted || false,
      received_at: email.received_at,
      created_at: email.created_at,
      updated_at: email.updated_at,
      attachments: [],
    }));

    return {
      success: true,
      data: {
        emails,
        total: count || 0,
      },
    };
  } catch (error) {
    logger.error("Error in searchInboundEmails:", error);
    return {
      success: false,
      error: "Failed to search emails",
    };
  }
}

/**
 * Get all sent emails (replies) with pagination
 */
export async function getSentEmails(options?: {
  page?: number;
  limit?: number;
}): Promise<ActionResult<{ emails: InboundEmailReply[]; total: number }>> {
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

    // Get count
    const { count, error: countError } = await supabase
      .from("inbound_email_replies")
      .select("*", { count: "exact", head: true });

    if (countError) {
      logger.error("Error fetching sent emails count:", countError);
    }

    // Get data
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from("inbound_email_replies")
      .select(`
        *,
        users:user_id (
          name,
          email
        )
      `)
      .order("sent_at", { ascending: false })
      .range(from, to);

    if (error) {
      logger.error("Error fetching sent emails:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    const emails: InboundEmailReply[] = (data || []).map((reply: any) => ({
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
      data: {
        emails,
        total: count || 0,
      },
    };
  } catch (error) {
    logger.error("Error in getSentEmails:", error);
    return {
      success: false,
      error: "Failed to fetch sent emails",
    };
  }
}
