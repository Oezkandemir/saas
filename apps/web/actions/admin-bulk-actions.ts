"use server";

import { supabaseAdmin } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { logger } from "@/lib/logger";
import { createAuditLog } from "@/actions/admin-audit-actions";
import { z } from "zod";

const bulkUserActionSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
  action: z.enum(["ban", "unban", "delete", "change_role", "change_plan"]),
  value: z.string().optional(), // Role or plan ID
});

export interface BulkActionResult {
  success: boolean;
  processed: number;
  failed: number;
  errors?: string[];
  message?: string;
}

/**
 * Bulk user actions
 */
export async function bulkUserActions(
  userIds: string[],
  action: "ban" | "unban" | "delete" | "change_role" | "change_plan",
  value?: string
): Promise<BulkActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return {
        success: false,
        processed: 0,
        failed: 0,
        errors: ["Unauthorized: Admin access required"],
      };
    }

    // Validate input
    const validation = bulkUserActionSchema.safeParse({
      userIds,
      action,
      value,
    });

    if (!validation.success) {
      return {
        success: false,
        processed: 0,
        failed: 0,
        errors: validation.error.errors.map((e) => e.message),
      };
    }

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const userId of userIds) {
      try {
        switch (action) {
          case "ban":
            await supabaseAdmin.rpc("ban_user", { user_id: userId });
            await createAuditLog("user_banned", "user", userId, undefined, { bulk: true });
            break;
          case "unban":
            await supabaseAdmin.rpc("unban_user", { user_id: userId });
            await createAuditLog("user_unbanned", "user", userId, undefined, { bulk: true });
            break;
          case "delete":
            await supabaseAdmin.from("users").delete().eq("id", userId);
            await createAuditLog("user_deleted", "user", userId, undefined, { bulk: true });
            break;
          case "change_role":
            if (!value) {
              errors.push(`Missing role value for user ${userId}`);
              failed++;
              continue;
            }
            await supabaseAdmin
              .from("users")
              .update({ role: value })
              .eq("id", userId);
            await createAuditLog("role_changed", "user", userId, undefined, { new_role: value, bulk: true });
            break;
          case "change_plan":
            if (!value) {
              errors.push(`Missing plan value for user ${userId}`);
              failed++;
              continue;
            }
            // Update subscription plan
            await supabaseAdmin
              .from("subscriptions")
              .update({ plan: value as any })
              .eq("user_id", userId);
            await createAuditLog("plan_changed", "subscription", userId, undefined, { new_plan: value, bulk: true });
            break;
        }
        processed++;
      } catch (error: any) {
        failed++;
        errors.push(`Failed to ${action} user ${userId}: ${error.message}`);
        logger.error(`Bulk action failed for user ${userId}:`, error);
      }
    }

    return {
      success: processed > 0,
      processed,
      failed,
      errors: errors.length > 0 ? errors : undefined,
      message: `Processed ${processed} users, ${failed} failed`,
    };
  } catch (error) {
    logger.error("Error in bulkUserActions:", error);
    return {
      success: false,
      processed: 0,
      failed: userIds.length,
      errors: ["An unexpected error occurred"],
    };
  }
}

/**
 * Bulk export users data
 */
export async function bulkExportUsers(
  userIds: string[]
): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .in("id", userIds);

    if (error) {
      logger.error("Error exporting users:", error);
      return { success: false, error: error.message };
    }

    await createAuditLog("bulk_export", "user", undefined, undefined, {
      count: userIds.length,
    });

    return { success: true, data: data || [] };
  } catch (error) {
    logger.error("Error in bulkExportUsers:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Bulk send email to users
 */
export async function bulkSendEmail(
  userIds: string[],
  subject: string,
  body: string
): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  errors?: string[];
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, sent: 0, failed: 0, errors: ["Unauthorized"] };
    }

    // Get user emails
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .in("id", userIds);

    if (error || !users) {
      return { success: false, sent: 0, failed: userIds.length, errors: [error?.message || "Failed to fetch users"] };
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // In a real implementation, you would send emails here
    // For now, we'll just log it
    for (const user of users) {
      if (user.email) {
        try {
          // TODO: Implement actual email sending
          logger.info(`Would send email to ${user.email}: ${subject}`);
          sent++;
        } catch (error: any) {
          failed++;
          errors.push(`Failed to send email to ${user.email}: ${error.message}`);
        }
      } else {
        failed++;
        errors.push(`User ${user.id} has no email`);
      }
    }

    await createAuditLog("bulk_email_sent", "user", undefined, undefined, {
      count: userIds.length,
      subject,
    });

    return { success: sent > 0, sent, failed, errors: errors.length > 0 ? errors : undefined };
  } catch (error) {
    logger.error("Error in bulkSendEmail:", error);
    return { success: false, sent: 0, failed: userIds.length, errors: ["An unexpected error occurred"] };
  }
}


