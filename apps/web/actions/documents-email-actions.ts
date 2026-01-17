"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";
import { resend } from "@/lib/email";
import { logger } from "@/lib/logger";
import { generateAndUploadPDF } from "@/lib/pdf/generator-vercel";
import { getCurrentUser } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";

import { getDocument } from "./documents-actions";

export interface SendDocumentEmailInput {
  documentId: string;
  recipientEmail: string;
  subject?: string;
  message?: string;
}

/**
 * Sends a document (invoice/quote) via email with PDF attachment
 */
export async function sendDocumentEmail(
  input: SendDocumentEmailInput
): Promise<{ success: boolean; messageId?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    // Get locale from cookie or default
    const cookieStore = await cookies();
    const savedLocale = cookieStore.get("NEXT_LOCALE")?.value;
    const locale =
      savedLocale && routing.locales.includes(savedLocale as any)
        ? savedLocale
        : routing.defaultLocale;

    const t = await getTranslations({ locale, namespace: "Documents" });

    // Get document
    let document = await getDocument(input.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Ensure PDF exists - generate directly using pdf-lib
    if (!document.pdf_url) {
      try {
        // Generate and upload PDF directly (pdf-lib doesn't need HTML)
        const pdfUrl = await generateAndUploadPDF(document, "");

        // Update document with PDF URL in database
        const supabase = await getSupabaseServer();
        await supabase
          .from("documents")
          .update({ pdf_url: pdfUrl })
          .eq("id", document.id)
          .eq("user_id", user.id);

        // Reload document to get updated pdf_url
        const updatedDocument = await getDocument(input.documentId);
        if (!updatedDocument?.pdf_url) {
          throw new Error("Failed to generate PDF");
        }
        document = updatedDocument;
      } catch (error) {
        logger.error("Error generating PDF for email:", error);
        throw new Error(
          error instanceof Error
            ? `Error generating PDF: ${error.message}`
            : "Error generating PDF"
        );
      }
    }

    // Fetch PDF from URL and validate it's actually a PDF
    let pdfResponse = await fetch(document.pdf_url!);
    if (!pdfResponse.ok) {
      throw new Error("Failed to fetch PDF");
    }
    let pdfBuffer = await pdfResponse.arrayBuffer();

    // Validate that we got a PDF (starts with %PDF)
    const buffer = Buffer.from(pdfBuffer);
    if (buffer.length < 4 || buffer.toString("ascii", 0, 4) !== "%PDF") {
      // PDF is invalid (probably old HTML format), regenerate it
      logger.warn(
        "Invalid PDF detected (possibly old HTML format), regenerating with pdf-lib..."
      );
      const pdfUrl = await generateAndUploadPDF(document, "");
      const supabase = await getSupabaseServer();
      await supabase
        .from("documents")
        .update({ pdf_url: pdfUrl })
        .eq("id", document.id)
        .eq("user_id", user.id);

      // Fetch the new PDF
      pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) {
        throw new Error("Failed to fetch regenerated PDF");
      }
      pdfBuffer = await pdfResponse.arrayBuffer();

      // Validate the new PDF
      const newBuffer = Buffer.from(pdfBuffer);
      if (
        newBuffer.length < 4 ||
        newBuffer.toString("ascii", 0, 4) !== "%PDF"
      ) {
        throw new Error("Regenerated PDF is still invalid");
      }
    }

    const documentType =
      document.type === "invoice" ? t("invoice") : t("quote");
    const subject =
      input.subject ||
      (document.type === "invoice"
        ? t("email.invoiceSubject", { number: document.document_number })
        : t("email.quoteSubject", { number: document.document_number }));

    const defaultMessage =
      document.type === "invoice"
        ? t("email.invoiceBody", {
            number: document.document_number,
            name: user.name || siteConfig.name,
          })
        : t("email.quoteBody", {
            number: document.document_number,
            name: user.name || siteConfig.name,
          });

    const message = input.message || defaultMessage;

    // Create email HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${siteConfig.name}</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="margin-top: 0;">Hallo,</p>
            <div style="white-space: pre-wrap; margin: 20px 0;">${message}</div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              ${t("closing")},<br>
              ${user.name || siteConfig.name}
            </p>
          </div>
        </body>
      </html>
    `;

    // Determine recipient email
    const recipientEmail =
      process.env.NODE_ENV === "development"
        ? "delivered@resend.dev"
        : input.recipientEmail;

    logger.info(
      `Sending ${documentType} email to ${input.recipientEmail} (actual: ${recipientEmail})`
    );

    // Send email with PDF attachment
    const { data, error } = await resend.emails.send({
      from: `${user.name || siteConfig.name} <hello@cenety.com>`,
      to: recipientEmail,
      reply_to: user.email || "hello@cenety.com",
      subject,
      html: htmlContent,
      attachments: [
        {
          filename: `${document.document_number}.pdf`,
          content: Buffer.from(pdfBuffer),
        },
      ],
      headers: {
        "X-Entity-Ref-ID": Date.now().toString(),
      },
    });

    if (error) {
      logger.error("Failed to send document email", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    // Log email sent in database (optional - create email_logs table if needed)
    // For now, we'll just log it

    logger.info(
      `Document email sent: ${documentType} ${document.document_number} to ${input.recipientEmail}`
    );

    // Create notification for document sent
    try {
      const { createDocumentNotification } = await import(
        "@/lib/notifications"
      );
      await createDocumentNotification({
        userId: user.id,
        documentId: document.id,
        action: "sent",
        documentType: documentType,
        documentNumber: document.document_number,
      });
    } catch (notificationError) {
      // Don't fail the operation if notification fails
      logger.error("Failed to create document notification", notificationError);
    }

    revalidatePath(`/dashboard/documents/${document.id}`);

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    logger.error("Error sending document email", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "An error occurred while sending the email."
    );
  }
}

/**
 * Gets email history for a document (if implemented)
 */
export async function getDocumentEmailHistory(_documentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // This would query an email_logs table if it exists
  // For now, return empty array
  return [];
}
