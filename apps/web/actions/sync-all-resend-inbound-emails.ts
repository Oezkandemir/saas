"use server";

import { env } from "@/env.mjs";
import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";

/**
 * Sync all inbound emails from Resend API
 * This fetches all received emails from Resend and syncs them to the database
 */
export async function syncAllResendInboundEmails(): Promise<{
  success: boolean;
  message: string;
  synced: number;
  skipped: number;
  errors: number;
}> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        message: "Unauthorized: Admin access required",
        synced: 0,
        skipped: 0,
        errors: 0,
      };
    }

    if (!env.RESEND_API_KEY) {
      return {
        success: false,
        message: "RESEND_API_KEY is not configured",
        synced: 0,
        skipped: 0,
        errors: 0,
      };
    }

    logger.info("Starting sync of all Resend inbound emails");

    // Fetch all inbound emails from Resend API
    // Resend API supports pagination with limit parameter (max 100 per request)
    const response = await fetch("https://api.resend.com/emails/receiving?limit=100", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error("Failed to fetch emails from Resend", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      return {
        success: false,
        message: `Failed to fetch emails from Resend: ${response.status} ${errorData.message || response.statusText || "Unknown error"}`,
        synced: 0,
        skipped: 0,
        errors: 0,
      };
    }

    const resendData = await response.json();
    const emails = resendData.data || [];

    logger.info(`Fetched ${emails.length} emails from Resend API`, {
      hasMore: resendData.has_more || false,
      totalFetched: emails.length,
    });

    if (emails.length === 0) {
      return {
        success: true,
        message: "No emails found in Resend",
        synced: 0,
        skipped: 0,
        errors: 0,
      };
    }

    // Get existing email IDs from database
    const { data: existingEmails } = await supabaseAdmin
      .from("inbound_emails")
      .select("email_id");

    const existingEmailIds = new Set(
      existingEmails?.map((e) => e.email_id) || [],
    );

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    // Process each email
    for (const emailData of emails) {
      try {
        const emailId = emailData.id;

        if (!emailId) {
          logger.warn("Email missing ID, skipping", { emailData });
          errors++;
          continue;
        }

        // Skip if already exists
        if (existingEmailIds.has(emailId)) {
          skipped++;
          continue;
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
          logger.warn("No recipients found in email data", { emailId, emailData });
          errors++;
          continue;
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
            cc: Array.isArray(emailData.cc) ? emailData.cc : emailData.cc ? [emailData.cc] : [],
            bcc: Array.isArray(emailData.bcc) ? emailData.bcc : emailData.bcc ? [emailData.bcc] : [],
            subject: emailData.subject || null,
            text_content: emailData.text || null,
            html_content: emailData.html || null,
            raw_payload: emailData,
            received_at: emailData.created_at || new Date().toISOString(),
          })
          .select()
          .single();

        if (emailError) {
          logger.error("Error inserting inbound email:", {
            emailId,
            error: emailError,
          });
          errors++;
          continue;
        }

        if (!insertedEmail) {
          logger.error("Email insert returned no data", { emailId });
          errors++;
          continue;
        }

        // Handle attachments if present
        if (Array.isArray(emailData.attachments) && emailData.attachments.length > 0) {
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
            logger.error("Error inserting attachments:", {
              emailId,
              error: attachmentError,
            });
            // Don't count attachment errors as email errors
          }
        }

        synced++;
        existingEmailIds.add(emailId); // Add to set to avoid duplicates in same sync

        logger.debug(`Synced email: ${emailId}`);
      } catch (error: any) {
        logger.error("Error processing email:", {
          emailId: emailData.id,
          error: error.message,
        });
        errors++;
      }
    }

    logger.info(`Sync completed: ${synced} synced, ${skipped} skipped, ${errors} errors`);

    return {
      success: true,
      message: `Sync completed: ${synced} emails synced, ${skipped} already existed, ${errors} errors`,
      synced,
      skipped,
      errors,
    };
  } catch (error: any) {
    logger.error("Error syncing all Resend inbound emails:", error);
    return {
      success: false,
      message: `Error: ${error.message || "Unknown error"}`,
      synced: 0,
      skipped: 0,
      errors: 0,
    };
  }
}
