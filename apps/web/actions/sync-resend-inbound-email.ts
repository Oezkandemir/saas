"use server";

import { env } from "@/env.mjs";
import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";

/**
 * Manually sync an inbound email from Resend by email_id
 * This can be used to manually process emails that failed webhook delivery
 */
export async function syncResendInboundEmail(emailId: string): Promise<{
  success: boolean;
  message: string;
  emailId?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        message: "Unauthorized: Admin access required",
      };
    }

    if (!env.RESEND_API_KEY) {
      return {
        success: false,
        message: "RESEND_API_KEY is not configured",
      };
    }

    // Fetch inbound email from Resend API
    // Use the correct endpoint for inbound/received emails
    const response = await fetch(
      `https://api.resend.com/emails/receiving/${emailId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error("Failed to fetch email from Resend", {
        status: response.status,
        error: errorData,
      });
      return {
        success: false,
        message: `Failed to fetch email from Resend: ${response.status} ${errorData.message || ""}`,
      };
    }

    const emailData = await response.json();

    logger.info("Fetched email from Resend API", {
      emailId,
      hasData: !!emailData,
      keys: Object.keys(emailData || {}),
    });

    // Check if email already exists
    const { data: existingEmail } = await supabaseAdmin
      .from("inbound_emails")
      .select("id")
      .eq("email_id", emailId)
      .single();

    if (existingEmail) {
      return {
        success: true,
        message: "Email already exists in database",
        emailId,
      };
    }

    // Parse sender information
    const fromString = emailData.from || "";
    let fromEmail = "";
    let fromName = null;

    const fromMatch = fromString.match(/^(.+?)\s*<(.+?)>$|^(.+?)$/);
    if (fromMatch) {
      fromName = fromMatch[1]?.trim() || fromMatch[3]?.trim() || null;
      fromEmail = fromMatch[2] || fromMatch[3] || fromString;
    } else {
      fromEmail = fromString;
    }

    // Ensure to array exists
    const toArray = Array.isArray(emailData.to)
      ? emailData.to
      : emailData.to
        ? [emailData.to]
        : [];

    if (toArray.length === 0) {
      logger.warn("No recipients found in email data", { emailData });
      return {
        success: false,
        message: "No recipients found in email data",
      };
    }

    // Insert email into database
    const { data: insertedEmail, error: emailError } = await supabaseAdmin
      .from("inbound_emails")
      .insert({
        email_id: emailId,
        message_id: emailData.message_id || null,
        from_email: fromEmail,
        from_name: fromName,
        to: toArray,
        cc: Array.isArray(emailData.cc)
          ? emailData.cc
          : emailData.cc
            ? [emailData.cc]
            : [],
        bcc: Array.isArray(emailData.bcc)
          ? emailData.bcc
          : emailData.bcc
            ? [emailData.bcc]
            : [],
        subject: emailData.subject || null,
        text_content: emailData.text || null,
        html_content: emailData.html || null,
        raw_payload: emailData,
        received_at: emailData.created_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (emailError) {
      logger.error("Error inserting inbound email:", emailError);
      return {
        success: false,
        message: `Failed to save email: ${emailError.message}`,
      };
    }

    logger.info(`Successfully synced inbound email: ${emailId}`);

    // Handle attachments if present
    if (
      Array.isArray(emailData.attachments) &&
      emailData.attachments.length > 0
    ) {
      const attachments = emailData.attachments.map((attachment: any) => ({
        inbound_email_id: insertedEmail.id,
        attachment_id: attachment.id || attachment.filename,
        filename: attachment.filename || "attachment",
        content_type: attachment.content_type || null,
        content_disposition: attachment.content_disposition || "attachment",
        size: attachment.size || null,
      }));

      const { error: attachmentError } = await supabaseAdmin
        .from("inbound_email_attachments")
        .insert(attachments);

      if (attachmentError) {
        logger.error("Error inserting attachments:", attachmentError);
      } else {
        logger.info(
          `Saved ${attachments.length} attachment(s) for email ${emailId}`
        );
      }
    }

    return {
      success: true,
      message: "Email synced successfully",
      emailId,
    };
  } catch (error: any) {
    logger.error("Error syncing Resend inbound email:", error);
    return {
      success: false,
      message: `Error: ${error.message || "Unknown error"}`,
    };
  }
}
