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

      // Check if this is a confirmation email
      if (subject && subject.includes("Confirm") && content) {
        // Extract the confirmation link from the email content
        const confirmationLinkMatch = content.match(/href="([^"]+)"/);
        const confirmationLink = confirmationLinkMatch
          ? confirmationLinkMatch[1]
          : null;

        if (confirmationLink) {
          // Get user details
          const { data: userData } =
            await supabase.auth.admin.getUserByEmail(to);
          const userName =
            userData?.user?.user_metadata?.name || to.split("@")[0];

          // Call the send-email function to send our custom email
          try {
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
              throw error;
            }

            // If we successfully sent our custom email, return success
            response = {
              success: true,
              message: "Custom confirmation email sent",
              originalEmail: false,
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
        }
      }
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
