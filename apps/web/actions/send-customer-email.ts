"use server";

import { siteConfig } from "@/config/site";
import { resend } from "@/lib/email";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";

import { getCustomer } from "./customers-actions";

export interface SendCustomerEmailInput {
  customerId: string;
  subject: string;
  body: string;
  htmlBody?: string;
  attachDocumentId?: string;
}

export async function sendCustomerEmail(input: SendCustomerEmailInput) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    // Get customer details
    const customer = await getCustomer(input.customerId);
    if (!customer) {
      throw new Error("Kunde nicht gefunden");
    }

    if (!customer.email) {
      throw new Error("Kunde hat keine E-Mail-Adresse");
    }

    // Prepare email content
    const htmlContent =
      input.htmlBody ||
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${input.subject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${siteConfig.name}</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="margin-top: 0;">Hallo ${customer.name},</p>
            <div style="white-space: pre-wrap; margin: 20px 0;">${input.body}</div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Mit freundlichen Grüßen,<br>
              ${user.name || siteConfig.name}
            </p>
          </div>
        </body>
      </html>
    `;

    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      logger.warn("RESEND_API_KEY is not configured");
      throw new Error(
        "E-Mail-Dienst ist nicht konfiguriert. Bitte kontaktieren Sie den Administrator.",
      );
    }

    // Determine recipient email
    // In development, send to delivered@resend.dev for testing, but also log the actual recipient
    const recipientEmail =
      process.env.NODE_ENV === "development"
        ? "delivered@resend.dev"
        : customer.email;

    logger.info(
      `Sending email to ${customer.email} (actual recipient: ${recipientEmail})`,
    );

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: `${user.name || siteConfig.name} <hello@cenety.com>`,
      to: recipientEmail,
      reply_to: user.email || "hello@cenety.com",
      subject: input.subject,
      html: htmlContent,
      headers: {
        "X-Entity-Ref-ID": new Date().getTime().toString(),
      },
    });

    if (error) {
      logger.error("Failed to send customer email", error);
      throw new Error(`E-Mail konnte nicht gesendet werden: ${error.message}`);
    }

    logger.info(`Email sent to customer ${customer.id} (${customer.email})`);

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    logger.error("Error sending customer email", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Ein Fehler ist beim Senden der E-Mail aufgetreten.",
    );
  }
}
