"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getDocument } from "./documents-actions";
import { resend } from "@/lib/email";
import { siteConfig } from "@/config/site";
import { logger } from "@/lib/logger";
import { getSupabaseServer } from "@/lib/supabase-server";
import { generateInvoiceHTMLAsync } from "@/lib/pdf/templates";
import { generateAndUploadPDF } from "@/lib/pdf/generator-vercel";

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
  input: SendDocumentEmailInput,
): Promise<{ success: boolean; messageId?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    // Get document
    let document = await getDocument(input.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Ensure PDF exists - generate directly without HTTP fetch to avoid SSL issues
    if (!document.pdf_url) {
      try {
        // Generate HTML content with company profile data
        const htmlContent = await generateInvoiceHTMLAsync(document);
        
        // Generate and upload PDF directly
        const pdfUrl = await generateAndUploadPDF(document, htmlContent);
        
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
            ? `Fehler beim Generieren des PDFs: ${error.message}`
            : "Fehler beim Generieren des PDFs"
        );
      }
    }

    // Fetch PDF from URL
    const pdfResponse = await fetch(document.pdf_url!);
    if (!pdfResponse.ok) {
      throw new Error("Failed to fetch PDF");
    }
    const pdfBuffer = await pdfResponse.arrayBuffer();

    const documentType = document.type === "invoice" ? "Rechnung" : "Angebot";
    const subject =
      input.subject ||
      `${documentType} ${document.document_number} - ${siteConfig.name}`;

    const defaultMessage = document.type === "invoice"
      ? `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie die Rechnung ${document.document_number}.\n\nBei Fragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen\n${user.name || siteConfig.name}`
      : `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie unser Angebot ${document.document_number}.\n\nWir freuen uns auf Ihre Rückmeldung.\n\nMit freundlichen Grüßen\n${user.name || siteConfig.name}`;

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
              Mit freundlichen Grüßen,<br>
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
      `Sending ${documentType} email to ${input.recipientEmail} (actual: ${recipientEmail})`,
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
        "X-Entity-Ref-ID": new Date().getTime().toString(),
      },
    });

    if (error) {
      logger.error("Failed to send document email", error);
      throw new Error(`E-Mail konnte nicht gesendet werden: ${error.message}`);
    }

    // Log email sent in database (optional - create email_logs table if needed)
    // For now, we'll just log it

    logger.info(
      `Document email sent: ${documentType} ${document.document_number} to ${input.recipientEmail}`,
    );

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
        : "Ein Fehler ist beim Senden der E-Mail aufgetreten.",
    );
  }
}

/**
 * Gets email history for a document (if implemented)
 */
export async function getDocumentEmailHistory(documentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // This would query an email_logs table if it exists
  // For now, return empty array
  return [];
}


