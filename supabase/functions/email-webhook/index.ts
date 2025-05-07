import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

// Load environment variables
const SITE_URL = Deno.env.get("SITE_URL") || "http://localhost:3000";
const SITE_NAME = Deno.env.get("SITE_NAME") || "Next.js SaaS Starter";
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
    console.log("Webhook payload:", JSON.stringify(payload));

    // Verify the webhook is from an authorized source (implement proper validation in production)
    const signature = req.headers.get("x-webhook-signature") || "";

    // For development, we're skipping rigorous signature validation
    // In production, implement proper HMAC validation

    // Get event type from webhook
    const { type, record } = payload;
    console.log("Webhook received:", type);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize response
    let response = { success: true };

    // Handle different webhook events
    if (type === "email.created" && record) {
      const { to, subject, content } = record;
      console.log(`Processing email to ${to}, subject: ${subject}`);

      // Check if this is a confirmation email
      if (subject && subject.includes("Confirm") && content) {
        console.log("Found confirmation email, extracting link...");

        // Extract the confirmation link from the email content
        const confirmationLinkMatch = content.match(/href="([^"]+)"/);
        const confirmationLink = confirmationLinkMatch
          ? confirmationLinkMatch[1]
          : null;

        if (confirmationLink) {
          console.log("Extracted confirmation link:", confirmationLink);

          // Get user details
          const { data: userData } =
            await supabase.auth.admin.getUserByEmail(to);
          console.log("User data:", userData);

          const userName =
            userData?.user?.user_metadata?.name || to.split("@")[0];

          // Call the send-email function to send our custom email
          try {
            console.log("Sending custom confirmation email to:", to);
            const { data, error } = await supabase.functions.invoke(
              "send-email",
              {
                body: {
                  type: "confirmation",
                  email: to,
                  name: userName,
                  actionUrl: confirmationLink,
                },
              },
            );

            if (error) {
              console.error("Error response from send-email function:", error);
              throw error;
            }

            console.log("Custom confirmation email sent successfully");

            // Also send welcome email
            try {
              console.log("Sending welcome email to:", to);
              const welcomeResult = await supabase.functions.invoke(
                "send-email",
                {
                  body: {
                    type: "welcome",
                    email: to,
                    name: userName,
                  },
                },
              );

              if (welcomeResult.error) {
                console.error(
                  "Error sending welcome email:",
                  welcomeResult.error,
                );
              } else {
                console.log("Welcome email sent successfully");
              }
            } catch (welcomeError) {
              console.error("Exception sending welcome email:", welcomeError);
            }

            // If we successfully sent our custom email, return success and cancel original email
            response = {
              success: true,
              message: "Custom confirmation email sent",
              originalEmail: false, // This tells Supabase not to send the original email
            };
          } catch (error) {
            console.error("Error sending custom email:", error);
            // Let the original email proceed
            response = {
              success: true,
              message:
                "Failed to send custom email, allowing original email to proceed",
              originalEmail: true,
            };
          }
        } else {
          console.error(
            "Could not extract confirmation link from email content",
          );
        }
      }
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
