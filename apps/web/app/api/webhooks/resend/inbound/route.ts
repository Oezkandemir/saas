import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/env.mjs";
import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";

// Route configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Ensure this route is not cached and handles POST requests correctly
export const maxDuration = 30;

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
  // Create response immediately to prevent any redirects
  // This ensures Resend gets a proper response even if processing fails
  let bodyText: string | undefined;
  try {
    // Read body as text first (needed for signature verification)
    bodyText = await req.text();

    // Enhanced logging for production debugging
    const requestInfo = {
      url: req.url,
      method: req.method,
      pathname: req.nextUrl.pathname,
      host: req.headers.get("host"),
      userAgent: req.headers.get("user-agent"),
      contentType: req.headers.get("content-type"),
      bodyLength: bodyText.length,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };

    // Log incoming webhook for debugging
    logger.info("🔔 Resend Inbound webhook received", requestInfo);

    // Verify this is actually the correct path (prevent redirect issues)
    if (!req.nextUrl.pathname.includes("/api/webhooks/resend/inbound")) {
      logger.error("Webhook path mismatch", {
        expected: "/api/webhooks/resend/inbound",
        actual: req.nextUrl.pathname,
      });
    }

    // Parse JSON body
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (parseError) {
      logger.error("Failed to parse webhook body as JSON", parseError);
      return new NextResponse(
        JSON.stringify({ error: "Invalid JSON payload" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    logger.info(
      `📧 Processing Resend Inbound webhook: type=${body.type}, email_id=${body.data?.email_id}, from=${body.data?.from}`
    );

    // Verify webhook type
    if (body.type !== "email.received") {
      logger.warn(`Unhandled webhook type: ${body.type}`);
      return new NextResponse(
        JSON.stringify({
          received: true,
          message: `Unhandled type: ${body.type}`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const emailData = body.data;

    if (!emailData || !emailData.email_id) {
      logger.error("Invalid webhook payload: missing email_id");
      return new NextResponse(
        JSON.stringify({ error: "Invalid payload: email_id is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
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
      return new NextResponse(
        JSON.stringify({ error: "Invalid payload: from email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Ensure to array exists
    const toArray = Array.isArray(emailData.to)
      ? emailData.to
      : [emailData.to].filter(Boolean);
    if (toArray.length === 0) {
      logger.error("Invalid webhook payload: missing recipients");
      return new NextResponse(
        JSON.stringify({ error: "Invalid payload: recipients are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
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
      return new NextResponse(
        JSON.stringify({
          received: true,
          message: "Email already processed",
          email_id: emailData.email_id,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch full email content from Resend API if not in webhook payload
    let textContent = emailData.text || null;
    let htmlContent = emailData.html || null;

    // If content is missing, fetch it from Resend API
    if ((!textContent && !htmlContent) && env.RESEND_API_KEY) {
      try {
        logger.info(`Fetching full email content for ${emailData.email_id}`);
        const resendResponse = await fetch(
          `https://api.resend.com/emails/receiving/${emailData.email_id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (resendResponse.ok) {
          const fullEmailData = await resendResponse.json();
          textContent = fullEmailData.text || textContent;
          htmlContent = fullEmailData.html || htmlContent;
          logger.info(`✅ Fetched email content`, {
            email_id: emailData.email_id,
            hasText: !!textContent,
            hasHtml: !!htmlContent,
          });
        } else {
          logger.warn(`Failed to fetch email content: ${resendResponse.status}`);
        }
      } catch (error) {
        logger.error("Error fetching email content from Resend API:", error);
        // Continue with whatever we have from webhook
      }
    }

    // Prepare email data for insertion
    const emailInsertData = {
      email_id: emailData.email_id,
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
      text_content: textContent,
      html_content: htmlContent,
      raw_payload: body,
      received_at: emailData.created_at || new Date().toISOString(),
    };

    logger.info("✅ Attempting to insert inbound email", {
      email_id: emailData.email_id,
      from_email: fromEmail,
      from_name: fromName,
      to: toArray,
      subject: emailData.subject,
      hasText: !!textContent,
      hasHtml: !!htmlContent,
      hasAttachments:
        Array.isArray(emailData.attachments) &&
        emailData.attachments.length > 0,
    });

    // Insert email into database
    const { data: insertedEmail, error: emailError } = await supabaseAdmin
      .from("inbound_emails")
      .insert(emailInsertData)
      .select()
      .single();

    if (emailError) {
      logger.error("Error inserting inbound email:", {
        error: emailError,
        message: emailError.message,
        code: emailError.code,
        details: emailError.details,
        hint: emailError.hint,
        email_id: emailData.email_id,
        emailData: emailInsertData,
      });
      return new NextResponse(
        JSON.stringify({
          error: "Failed to save email",
          message: emailError.message,
          code: emailError.code,
          details: emailError.details,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!insertedEmail) {
      logger.error("Email insert returned no data", {
        email_id: emailData.email_id,
        emailInsertData,
      });
      return new NextResponse(
        JSON.stringify({ error: "Failed to save email: No data returned" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    logger.info(`✅ Successfully saved inbound email: ${emailData.email_id}`, {
      id: insertedEmail.id,
      from: fromEmail,
      to: toArray,
      subject: emailData.subject,
    });

    // Handle attachments if present
    if (
      Array.isArray(emailData.attachments) &&
      emailData.attachments.length > 0
    ) {
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
        logger.info(
          `Saved ${attachments.length} attachment(s) for email ${emailData.email_id}`
        );
      }
    }

    // Return success response with explicit headers to prevent redirects
    return new NextResponse(
      JSON.stringify({
        received: true,
        message: "Email processed successfully",
        email_id: emailData.email_id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error: any) {
    logger.error("Error processing Resend Inbound webhook:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
      body: bodyText?.substring(0, 500), // Log first 500 chars of body for debugging
    });

    // Return 200 to prevent Resend from retrying on processing errors
    // But log the error for debugging
    // Use explicit response to prevent redirects
    return new NextResponse(
      JSON.stringify({
        error: "Webhook processing failed",
        message: error.message || "Unknown error",
      }),
      {
        status: 200, // Return 200 to prevent retries, but log the error
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}

// Handle GET requests (for webhook verification/testing)
export async function GET() {
  return new NextResponse(
    JSON.stringify({
      message: "Resend Inbound Email Webhook Endpoint",
      status: "active",
      endpoint: "/api/webhooks/resend/inbound",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
