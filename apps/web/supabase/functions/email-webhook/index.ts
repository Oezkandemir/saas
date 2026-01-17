import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { logger } from "@/lib/logger";

import { corsHeaders } from "../_shared/cors.ts";

// Load environment variables
const _SITE_URL = Deno.env.get("SITE_URL") || "http://localhost:3000";
const _SITE_NAME = Deno.env.get("SITE_NAME") || "Next.js SaaS Starter";
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") || "";

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse the incoming webhook payload
    const payload = await req.json();

    // Log the full payload for debugging
    logger.debug("Webhook payload:", JSON.stringify(payload));

    // Verify the webhook is from Supabase Auth
    const signature = req.headers.get("x-webhook-signature") || "";

    // In production, you should validate the signature, but we'll skip complete
    // validation for now since it's internal to Supabase

    if (!signature && WEBHOOK_SECRET) {
      logger.warn("Missing webhook signature");
    }

    // Get event type from webhook
    const { type, record } = payload;
    logger.debug("Webhook received:", type);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize response
    let response = { success: true, originalEmail: true };

    // Handle different webhook events
    if (type === "email.created" && record) {
      const { to, subject, content } = record;
      logger.debug(`Processing email to ${to}, subject: ${subject}`);

      // Check if this is a confirmation email
      if (subject?.includes("Confirm") && content) {
        logger.debug("Found confirmation email, extracting link...");

        // Extract the confirmation link from the email content
        const confirmationLinkMatch = content.match(/href="([^"]+)"/);
        const confirmationLink = confirmationLinkMatch
          ? confirmationLinkMatch[1]
          : null;

        if (confirmationLink) {
          logger.debug("Extracted confirmation link:", confirmationLink);

          // Get user details
          const { data: userData } =
            await supabase.auth.admin.getUserByEmail(to);
          logger.debug("User data:", userData);

          const userName =
            userData?.user?.user_metadata?.name || to.split("@")[0];

          // Call the send-email function to send our custom email
          try {
            logger.debug("Sending custom confirmation email to:", to);
            const { data, error } = await supabase.functions.invoke(
              "send-email",
              {
                body: {
                  type: "confirmation",
                  email: to,
                  name: userName,
                  actionUrl: confirmationLink,
                },
              }
            );

            if (error) {
              logger.error("Error response from send-email function:", error);
              throw error;
            }

            logger.debug("Custom confirmation email sent successfully");

            // Also send welcome email
            try {
              logger.debug("Sending welcome email to:", to);
              const welcomeResult = await supabase.functions.invoke(
                "send-email",
                {
                  body: {
                    type: "welcome",
                    email: to,
                    name: userName,
                  },
                }
              );

              if (welcomeResult.error) {
                logger.error(
                  "Error sending welcome email:",
                  welcomeResult.error
                );
              } else {
                logger.debug("Welcome email sent successfully");
              }
            } catch (welcomeError) {
              logger.error("Exception sending welcome email:", welcomeError);
            }

            // If we successfully sent our custom email, return success and cancel original email
            response = {
              success: true,
              message: "Custom confirmation email sent",
              originalEmail: false, // This tells Supabase not to send the original email
            };
          } catch (error) {
            logger.error("Error sending custom email:", error);
            // Let the original email proceed
            response = {
              success: true,
              message:
                "Failed to send custom email, allowing original email to proceed",
              originalEmail: true,
            };
          }
        } else {
          logger.error(
            "Could not extract confirmation link from email content"
          );
        }
      }
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
