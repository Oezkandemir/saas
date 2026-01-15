"use server";

import { revalidatePath } from "next/cache";

import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export interface PaymentReminderData {
  documentId: string;
  reminderType:
    | "reminder"
    | "first_dunning"
    | "second_dunning"
    | "final_notice";
  reminderLevel: number;
  scheduledDate: string;
  feeAmount?: number;
}

/**
 * Create automatic payment reminder for overdue document
 */
export async function createPaymentReminder(data: PaymentReminderData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Insert reminder
    const { data: reminder, error } = await supabase
      .from("payment_reminders")
      .insert({
        document_id: data.documentId,
        user_id: user.id,
        reminder_type: data.reminderType,
        reminder_level: data.reminderLevel,
        scheduled_date: data.scheduledDate,
        fee_amount: data.feeAmount || 0,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/documents");
    return { success: true, data: reminder };
  } catch (error) {
    logger.error("Error creating payment reminder:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create reminder",
    };
  }
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminder(reminderId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Get reminder with document details
    const { data: reminder, error: reminderError } = await supabase
      .from("payment_reminders")
      .select(
        `
        *,
        documents (
          *,
          customers (*)
        )
      `
      )
      .eq("id", reminderId)
      .single();

    if (reminderError || !reminder) {
      throw new Error("Reminder not found");
    }

    // TODO: Send email via Resend or your email service
    // await sendEmail({
    //   to: reminder.documents.customers.email,
    //   subject: getReminder Subject(reminder.reminder_type),
    //   body: generateReminderEmail(reminder)
    // });

    // Update reminder status
    const { error: updateError } = await supabase
      .from("payment_reminders")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", reminderId);

    if (updateError) throw updateError;

    // Log action
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "PAYMENT_REMINDER_SENT",
      details: {
        reminder_id: reminderId,
        document_id: reminder.document_id,
        reminder_type: reminder.reminder_type,
      },
    });

    revalidatePath("/dashboard/documents");
    return { success: true, message: "Reminder sent successfully" };
  } catch (error) {
    logger.error("Error sending payment reminder:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to send reminder",
    };
  }
}

/**
 * Get all payment reminders for a document
 */
export async function getPaymentReminders(documentId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("payment_reminders")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    logger.error("Error getting payment reminders:", error);
    return {
      success: false,
      data: [],
      message:
        error instanceof Error ? error.message : "Failed to get reminders",
    };
  }
}

/**
 * Cancel a scheduled payment reminder
 */
export async function cancelPaymentReminder(reminderId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    const { error } = await supabase
      .from("payment_reminders")
      .update({ status: "cancelled" })
      .eq("id", reminderId)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/dashboard/documents");
    return { success: true, message: "Reminder cancelled" };
  } catch (error) {
    logger.error("Error cancelling payment reminder:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to cancel reminder",
    };
  }
}

/**
 * Auto-create reminders for overdue documents
 */
export async function autoCreateRemindersForOverdue() {
  try {
    const supabase = await createClient();

    // Find overdue documents without reminders
    const { data: overdueDocuments, error } = await supabase
      .from("documents")
      .select("id, user_id, due_date")
      .eq("type", "invoice")
      .in("status", ["sent"])
      .lt("due_date", new Date().toISOString())
      .is("deleted_at", null);

    if (error) throw error;

    const results: Array<{ success: boolean; data?: any; message?: string }> =
      [];

    for (const doc of overdueDocuments || []) {
      // Check if reminder already exists
      const { data: existing } = await supabase
        .from("payment_reminders")
        .select("id")
        .eq("document_id", doc.id)
        .single();

      if (!existing) {
        // Create first reminder
        const daysOverdue = Math.floor(
          (Date.now() - new Date(doc.due_date).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        let reminderType: PaymentReminderData["reminderType"] = "reminder";
        let reminderLevel = 1;

        if (daysOverdue >= 30) {
          reminderType = "final_notice";
          reminderLevel = 4;
        } else if (daysOverdue >= 20) {
          reminderType = "second_dunning";
          reminderLevel = 3;
        } else if (daysOverdue >= 10) {
          reminderType = "first_dunning";
          reminderLevel = 2;
        }

        const result = await createPaymentReminder({
          documentId: doc.id,
          reminderType,
          reminderLevel,
          scheduledDate: new Date().toISOString().split("T")[0] || "",
          feeAmount: reminderLevel > 1 ? 5.0 : 0,
        });

        if (result.success) {
          results.push(result);
        }
      }
    }

    return { success: true, created: results.length };
  } catch (error) {
    logger.error("Error auto-creating reminders:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create reminders",
    };
  }
}
