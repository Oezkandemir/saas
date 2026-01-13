import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";

// Disable body parsing to get raw body for signature verification
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Resend Inbound Email Webhook Route
 * Handles incoming emails from Resend Inbound
 * 
 * Webhook payload format:
 * {
 *   "type": "email.received",
 *   "created_at": "2024-02-22T23:41:12.126Z",
 *   "data": {
 *     "email_id": "56761188-7520-42d8-8898-ff6fc54ce618",
 *     "created_at": "2024-02-22T23:41:11.894719+00:00",
 *     "from": "Acme <onboarding@resend.dev>",
 *     "to": ["delivered@resend.dev"],
 *     "bcc": [],
 *     "cc": [],
 *     "message_id": "<example+123>",
 *     "subject": "Sending this example",
 *     "text": "Plain text content",
 *     "html": "<html>...</html>",
 *     "attachments": [
 *       {
 *         "id": "2a0c9ce0-3112-4728-976e-47ddcd16a318",
 *         "filename": "avatar.png",
 *         "content_type": "image/png",
 *         "content_disposition": "inline",
 *         "content_id": "img001"
 *       }
 *     ]
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Read body as text first (needed for signature verification)
    const bodyText = await req.text();
    
    // Log incoming webhook for debugging
    logger.info("Resend Inbound webhook received", {
      url: req.url,
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      bodyLength: bodyText.length,
    });

    // Parse JSON body
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (parseError) {
      logger.error("Failed to parse webhook body as JSON", parseError);
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }
    
    logger.info(
      `Processing Resend Inbound webhook: type=${body.type}, email_id=${body.data?.email_id}`,
    );

    // Verify webhook type
    if (body.type !== "email.received") {
      logger.warn(`Unhandled webhook type: ${body.type}`);
      return NextResponse.json(
        { received: true, message: `Unhandled type: ${body.type}` },
        { status: 200 },
      );
    }

    const emailData = body.data;

    if (!emailData || !emailData.email_id) {
      logger.error("Invalid webhook payload: missing email_id");
      return NextResponse.json(
        { error: "Invalid payload: email_id is required" },
        { status: 400 },
      );
    }

    // Parse sender information
    const fromString = emailData.from || "";
    let fromEmail = "";
    let fromName = null;

    // Parse "Name <email@example.com>" or just "email@example.com"
    const fromMatch = fromString.match(/^(.+?)\s*<(.+?)>$|^(.+?)$/);
    if (fromMatch) {
      fromName = fromMatch[1]?.trim() || fromMatch[3]?.trim() || null;
      fromEmail = fromMatch[2] || fromMatch[3] || fromString;
    } else {
      fromEmail = fromString;
    }

    // Ensure fromEmail is set
    if (!fromEmail) {
      logger.error("Invalid webhook payload: missing from email");
      return NextResponse.json(
        { error: "Invalid payload: from email is required" },
        { status: 400 },
      );
    }

    // Ensure to array exists
    const toArray = Array.isArray(emailData.to) ? emailData.to : [emailData.to].filter(Boolean);
    if (toArray.length === 0) {
      logger.error("Invalid webhook payload: missing recipients");
      return NextResponse.json(
        { error: "Invalid payload: recipients are required" },
        { status: 400 },
      );
    }

    // Check if email already exists (idempotency)
    const { data: existingEmail } = await supabaseAdmin
      .from("inbound_emails")
      .select("id")
      .eq("email_id", emailData.email_id)
      .single();

    if (existingEmail) {
      logger.info(`Email ${emailData.email_id} already exists, skipping`);
      return NextResponse.json({
        received: true,
        message: "Email already processed",
        email_id: emailData.email_id,
      });
    }

    // Insert email into database
    const { data: insertedEmail, error: emailError } = await supabaseAdmin
      .from("inbound_emails")
      .insert({
        email_id: emailData.email_id,
        message_id: emailData.message_id || null,
        from_email: fromEmail,
        from_name: fromName,
        to: toArray,
        cc: Array.isArray(emailData.cc) ? emailData.cc : emailData.cc ? [emailData.cc] : [],
        bcc: Array.isArray(emailData.bcc) ? emailData.bcc : emailData.bcc ? [emailData.bcc] : [],
        subject: emailData.subject || null,
        text_content: emailData.text || null,
        html_content: emailData.html || null,
        raw_payload: body,
        received_at: emailData.created_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (emailError) {
      logger.error("Error inserting inbound email:", emailError);
      return NextResponse.json(
        { error: "Failed to save email", message: emailError.message },
        { status: 500 },
      );
    }

    logger.info(`Successfully saved inbound email: ${emailData.email_id}`);

    // Handle attachments if present
    if (Array.isArray(emailData.attachments) && emailData.attachments.length > 0) {
      const attachments = emailData.attachments.map((attachment: any) => ({
        inbound_email_id: insertedEmail.id,
        attachment_id: attachment.id,
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
        // Don't fail the whole request if attachments fail
      } else {
        logger.info(`Saved ${attachments.length} attachment(s) for email ${emailData.email_id}`);
      }
    }

    return NextResponse.json(
      {
        received: true,
        message: "Email processed successfully",
        email_id: emailData.email_id,
      },
      { status: 200 },
    );
  } catch (error: any) {
    logger.error("Error processing Resend Inbound webhook:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // Return 200 to prevent Resend from retrying on processing errors
    // But log the error for debugging
    return NextResponse.json(
      {
        error: "Webhook processing failed",
        message: error.message || "Unknown error",
      },
      { status: 200 }, // Return 200 to prevent retries, but log the error
    );
  }
}

// Handle GET requests (for webhook verification/testing)
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: "Resend Inbound Email Webhook Endpoint",
    status: "active",
    endpoint: "/api/webhooks/resend/inbound",
  });
}
