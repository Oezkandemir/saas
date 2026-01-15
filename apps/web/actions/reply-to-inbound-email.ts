"use server";

import { revalidatePath } from "next/cache";
import { siteConfig } from "@/config/site";
import { env } from "@/env.mjs";
import { supabaseAdmin } from "@/lib/db";
import { resend } from "@/lib/email";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { getInboundEmailById } from "./inbound-email-actions";

export interface ReplyToInboundEmailInput {
  inboundEmailId: string;
  subject: string;
  body: string;
  htmlBody?: string;
}

/**
 * Reply to an inbound email with proper thread referencing
 */
export async function replyToInboundEmail(
  input: ReplyToInboundEmailInput
): Promise<{
  success: boolean;
  message: string;
  messageId?: string;
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

    // Get the original inbound email
    const emailResult = await getInboundEmailById(input.inboundEmailId);
    if (!emailResult.success || !emailResult.data) {
      return {
        success: false,
        message: emailResult.error || "Email not found",
      };
    }

    const originalEmail = emailResult.data;

    // Prepare reply subject - use input.subject but ensure it has "Re:" prefix if not present
    const replySubject = input.subject?.startsWith("Re:")
      ? input.subject
      : `Re: ${input.subject || originalEmail.subject || "No Subject"}`;

    // Prepare HTML content with quoted original message
    const quotedOriginal = originalEmail.html_content
      ? `<div style="border-left: 3px solid #ccc; padding-left: 15px; margin: 20px 0; color: #666; font-size: 14px;">
          <p style="margin: 0 0 10px 0;"><strong>Von:</strong> ${originalEmail.from_name || originalEmail.from_email} &lt;${originalEmail.from_email}&gt;</p>
          <p style="margin: 0 0 10px 0;"><strong>Datum:</strong> ${new Date(originalEmail.received_at).toLocaleString("de-DE")}</p>
          <p style="margin: 0 0 10px 0;"><strong>Betreff:</strong> ${originalEmail.subject || "(Kein Betreff)"}</p>
          <div style="margin-top: 15px;">
            ${originalEmail.html_content}
          </div>
        </div>`
      : originalEmail.text_content
        ? `<div style="border-left: 3px solid #ccc; padding-left: 15px; margin: 20px 0; color: #666; font-size: 14px;">
            <p style="margin: 0 0 10px 0;"><strong>Von:</strong> ${originalEmail.from_name || originalEmail.from_email} &lt;${originalEmail.from_email}&gt;</p>
            <p style="margin: 0 0 10px 0;"><strong>Datum:</strong> ${new Date(originalEmail.received_at).toLocaleString("de-DE")}</p>
            <p style="margin: 0 0 10px 0;"><strong>Betreff:</strong> ${originalEmail.subject || "(Kein Betreff)"}</p>
            <pre style="white-space: pre-wrap; margin-top: 15px; font-family: inherit;">${originalEmail.text_content}</pre>
          </div>`
        : "";

    const htmlContent =
      input.htmlBody ||
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${replySubject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${siteConfig.name}</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <div style="white-space: pre-wrap; margin: 20px 0;">${input.body.replace(/\n/g, "<br>")}</div>
            ${quotedOriginal}
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Mit freundlichen Grüßen,<br>
              ${user.name || siteConfig.name}
            </p>
          </div>
        </body>
      </html>
    `;

    // Prepare email headers for thread referencing
    const headers: Record<string, string> = {
      "X-Entity-Ref-ID": Date.now().toString(),
    };

    // Add thread headers if message_id exists
    if (originalEmail.message_id) {
      headers["In-Reply-To"] = originalEmail.message_id;
      headers.References = originalEmail.message_id;
    }

    // Determine recipient email
    const recipientEmail =
      process.env.NODE_ENV === "development"
        ? "delivered@resend.dev"
        : originalEmail.from_email;

    logger.info(
      `Sending reply to ${originalEmail.from_email} (actual recipient: ${recipientEmail})`
    );

    // Validate and extract email from EMAIL_FROM
    const fromEmail = env.EMAIL_FROM || "hello@cenety.com";
    let validFromEmail = "hello@cenety.com";
    if (fromEmail && typeof fromEmail === "string" && fromEmail.includes("@")) {
      // Extract email from format like "Name <email@example.com>" or just "email@example.com"
      const emailMatch = fromEmail.match(
        /<?([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})>?/
      );
      if (emailMatch?.[1]) {
        validFromEmail = emailMatch[1];
      } else if (fromEmail.includes("@") && !fromEmail.includes("<")) {
        validFromEmail = fromEmail.trim();
      }
    }

    // Sanitize name for email (remove any invalid characters)
    const sanitizedName =
      (user.name || siteConfig.name || "Cenety")
        .replace(/[<>"']/g, "") // Remove <, >, ", '
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim() || "Cenety"; // Fallback if empty

    // Send reply email via Resend
    const { data, error } = await resend.emails.send({
      from: `${sanitizedName} <${validFromEmail}>`,
      to: recipientEmail,
      reply_to: originalEmail.from_email,
      subject: replySubject,
      html: htmlContent,
      headers,
    });

    if (error) {
      logger.error("Failed to send reply email", error);
      return {
        success: false,
        message: `E-Mail konnte nicht gesendet werden: ${error.message}`,
      };
    }

    logger.info(
      `Reply email sent successfully to ${originalEmail.from_email}, messageId: ${data?.id}`
    );

    // Save reply to database
    try {
      const { error: replyError } = await supabaseAdmin
        .from("inbound_email_replies")
        .insert({
          inbound_email_id: input.inboundEmailId,
          user_id: user.id,
          subject: replySubject,
          body: input.body,
          html_body: htmlContent,
          message_id: data?.id || null,
          sent_at: new Date().toISOString(),
        });

      if (replyError) {
        logger.error("Failed to save reply to database", replyError);
        // Don't fail the whole operation if saving reply fails
      } else {
        logger.info(
          `Reply saved to database for email ${input.inboundEmailId}`
        );
      }
    } catch (saveError) {
      logger.error("Error saving reply to database", saveError);
      // Don't fail the whole operation if saving reply fails
    }

    // Mark original email as read (since we replied)
    // This is optional but makes sense UX-wise
    try {
      const { markEmailAsRead } = await import("./inbound-email-actions");
      await markEmailAsRead(input.inboundEmailId);
    } catch (markError) {
      // Don't fail if marking as read fails
      logger.warn("Failed to mark email as read after reply", markError);
    }

    revalidatePath("/admin/emails");

    return {
      success: true,
      message: "Antwort erfolgreich gesendet",
      messageId: data?.id,
    };
  } catch (error: any) {
    logger.error("Error replying to inbound email:", error);
    return {
      success: false,
      message: `Fehler beim Senden der Antwort: ${error.message || "Unbekannter Fehler"}`,
    };
  }
}
