import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { render } from "https://esm.sh/react-email@1.9.4";
import { MagicLinkEmail } from "../../../emails/magic-link-email.tsx";
import { SignupConfirmationEmail } from "../../../emails/signup-confirmation.tsx";

// Load environment variables
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SITE_URL = Deno.env.get("SITE_URL") || "http://localhost:3000";
const SITE_NAME = Deno.env.get("SITE_NAME") || "Next.js SaaS Starter";

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, email, name, actionUrl, emailType } = await req.json();
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let htmlContent = "";
    let subject = "";

    // Generate the appropriate email content based on the type
    if (type === "signup") {
      // For new user signup confirmation
      subject = `Complete your ${SITE_NAME} registration`;
      htmlContent = render(
        SignupConfirmationEmail({
          name: name || email.split("@")[0],
          actionUrl: actionUrl || `${SITE_URL}/auth/confirm`,
          siteName: SITE_NAME,
        })
      );
    } else if (type === "magic-link") {
      // For magic link authentication
      const mailType = emailType || "login";
      subject = mailType === "login" 
        ? `Sign-in link for ${SITE_NAME}` 
        : `Activate your ${SITE_NAME} account`;
        
      htmlContent = render(
        MagicLinkEmail({
          firstName: name || email.split("@")[0],
          actionUrl: actionUrl || `${SITE_URL}/auth/callback`,
          mailType: mailType === "login" ? "login" : "register",
          siteName: SITE_NAME,
        })
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid email type" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send email using Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${SITE_NAME} <no-reply@${Deno.env.get("EMAIL_DOMAIN") || "example.com"}>`,
        to: Deno.env.get("NODE_ENV") === "development" ? "delivered@resend.dev" : email,
        subject: subject,
        html: htmlContent,
        headers: {
          "X-Entity-Ref-ID": new Date().getTime() + "",
        },
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(resendData.message || "Failed to send email");
    }

    return new Response(
      JSON.stringify({ success: true, data: resendData }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});