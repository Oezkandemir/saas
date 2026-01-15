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
    const response = await fetch(
      "https://api.resend.com/emails/receiving?limit=100",
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
      existingEmails?.map((e) => e.email_id) || []
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

        // Fetch full email content if not in list response
        let fullEmailData = emailData;
        if (!emailData.text && !emailData.html) {
          try {
            const fullResponse = await fetch(
              `https://api.resend.com/emails/receiving/${emailId}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${env.RESEND_API_KEY}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (fullResponse.ok) {
              fullEmailData = await fullResponse.json();
            }
          } catch (fetchError) {
            logger.warn(`Failed to fetch full content for ${emailId}`, fetchError);
            // Continue with list data
          }
        }

        // Check if email already exists and needs content update
        const { data: existingEmail } = await supabaseAdmin
          .from("inbound_emails")
          .select("id, text_content, html_content")
          .eq("email_id", emailId)
          .single();

        if (existingEmail) {
          // Update if missing content
          if (!existingEmail.text_content && !existingEmail.html_content) {
            if (fullEmailData.text || fullEmailData.html) {
              const { error: updateError } = await supabaseAdmin
                .from("inbound_emails")
                .update({
                  text_content: fullEmailData.text || null,
                  html_content: fullEmailData.html || null,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingEmail.id);

              if (!updateError) {
                synced++;
                continue;
              }
            }
          }
          skipped++;
          continue;
        }

        // Parse sender information
        const fromString = fullEmailData.from || "";
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
        const toArray = Array.isArray(fullEmailData.to)
          ? fullEmailData.to
          : fullEmailData.to
            ? [fullEmailData.to]
            : [];

        if (toArray.length === 0) {
          logger.warn("No recipients found in email data", {
            emailId,
            emailData,
          });
          errors++;
          continue;
        }

        // Insert email into database
        const { data: insertedEmail, error: emailError } = await supabaseAdmin
          .from("inbound_emails")
          .insert({
            email_id: emailId,
            message_id: fullEmailData.message_id || null,
            from_email: fromEmail,
            from_name: fromName,
            to: toArray,
            cc: Array.isArray(fullEmailData.cc)
              ? fullEmailData.cc
              : fullEmailData.cc
                ? [fullEmailData.cc]
                : [],
            bcc: Array.isArray(fullEmailData.bcc)
              ? fullEmailData.bcc
              : fullEmailData.bcc
                ? [fullEmailData.bcc]
                : [],
            subject: fullEmailData.subject || null,
            text_content: fullEmailData.text || null,
            html_content: fullEmailData.html || null,
            raw_payload: fullEmailData,
            received_at: fullEmailData.created_at || new Date().toISOString(),
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
        if (
          Array.isArray(fullEmailData.attachments) &&
          fullEmailData.attachments.length > 0
        ) {
          const attachments = fullEmailData.attachments.map((attachment: any) => ({
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

    logger.info(
      `Sync completed: ${synced} synced, ${skipped} skipped, ${errors} errors`
    );

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
