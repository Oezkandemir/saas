import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

// Load environment variables
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SITE_URL = Deno.env.get("SITE_URL") || "http://localhost:3000";
const SITE_NAME = Deno.env.get("SITE_NAME") || "Next.js SaaS Starter";
// Set the email domain to cenety.com instead of example.com
const EMAIL_DOMAIN = Deno.env.get("EMAIL_DOMAIN") || "cenety.com";

// Helper function to generate basic HTML email templates
const generateEmailTemplate = (type: string, data: any) => {
  switch (type) {
    case "signup":
    case "confirmation":
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Confirm your ${data.siteName} account</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: sans-serif; margin: 0; padding: 0; background-color: #f9f9f9;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #111827;">${data.siteName}</h1>
              </div>
              <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <p style="margin-bottom: 15px; font-size: 16px; color: #374151;">Hi ${data.name},</p>
                <p style="margin-bottom: 15px; font-size: 16px; color: #374151;">Welcome to ${data.siteName}! To complete your registration and verify your email address, please click the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${data.actionUrl}" style="background-color: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 500; display: inline-block;">Confirm Email Address</a>
                </div>
                <p style="margin-bottom: 15px; font-size: 14px; color: #6B7280;">This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
                <p style="margin-bottom: 15px; font-size: 14px; color: #6B7280;">After confirming your email, you'll gain full access to all ${data.siteName} features and receive a welcome guide to help you get started.</p>
              </div>
              <div style="text-align: center; margin-top: 30px; font-size: 14px; color: #6B7280;">
                <p>© ${new Date().getFullYear()} ${data.siteName}. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    case "welcome":
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Welcome to ${data.siteName}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: sans-serif; margin: 0; padding: 0; background-color: #f9f9f9;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #111827;">${data.siteName}</h1>
              </div>
              <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <p style="margin-bottom: 15px; font-size: 16px; color: #374151;">Hi ${data.name},</p>
                <p style="margin-bottom: 15px; font-size: 18px; color: #111827; font-weight: 500;">Welcome to ${data.siteName}! 🎉</p>
                <p style="margin-bottom: 25px; font-size: 16px; color: #374151;">We're thrilled to have you join our community. Your account has been successfully created and is ready to use.</p>
                
                <div style="margin-bottom: 25px;">
                  <p style="margin-bottom: 10px; font-size: 16px; color: #111827; font-weight: 500;">Here's what you can do now:</p>
                  <ul style="color: #374151; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Complete your profile information</li>
                    <li style="margin-bottom: 8px;">Explore our features and services</li>
                    <li style="margin-bottom: 8px;">Set up your workspace preferences</li>
                    <li style="margin-bottom: 8px;">Check out our documentation and help center</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${data.dashboardUrl}" style="background-color: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 500; display: inline-block;">Go to Dashboard</a>
                </div>
                
                <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                  <p style="margin-top: 0; margin-bottom: 10px; font-size: 16px; color: #111827; font-weight: 500;">Need help getting started?</p>
                  <p style="margin-bottom: 10px; font-size: 14px; color: #374151;">Our support team is always here to help. Feel free to reach out if you have any questions or need assistance.</p>
                  <p style="margin-bottom: 0; font-size: 14px; color: #374151;">Visit our <a href="${data.siteUrl}/docs" style="color: #2563eb; text-decoration: underline;">documentation</a> for detailed guides and tutorials.</p>
                </div>
                
                <p style="margin-bottom: 0; font-size: 16px; color: #374151;">Thanks for choosing ${data.siteName}. We're excited to see what you'll achieve!</p>
              </div>
              <div style="text-align: center; margin-top: 30px; font-size: 14px; color: #6B7280;">
                <p>© ${new Date().getFullYear()} ${data.siteName}. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    case "magic-link":
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${data.mailType === "login" ? "Sign-in link" : "Activate your account"}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: sans-serif; margin: 0; padding: 0; background-color: #f9f9f9;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #111827;">${data.siteName}</h1>
              </div>
              <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <p style="margin-bottom: 15px; font-size: 16px; color: #374151;">Hi ${data.firstName},</p>
                <p style="margin-bottom: 15px; font-size: 16px; color: #374151;">
                  ${
                    data.mailType === "login"
                      ? `Use this link to sign in to your ${data.siteName} account.`
                      : `Use this link to activate your ${data.siteName} account.`
                  }
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${data.actionUrl}" style="background-color: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 500; display: inline-block;">
                    ${data.mailType === "login" ? "Sign In" : "Activate Account"}
                  </a>
                </div>
                <p style="margin-bottom: 15px; font-size: 16px; color: #374151;">This link expires in 24 hours and can only be used once.</p>
                <p style="margin-bottom: 15px; font-size: 16px; color: #374151;">If you did not request this email, you can safely ignore it.</p>
              </div>
              <div style="text-align: center; margin-top: 30px; font-size: 14px; color: #6B7280;">
                <p>Powered by ${data.siteName}</p>
              </div>
            </div>
          </body>
        </html>
      `;
    default:
      return "";
  }
};

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
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let htmlContent = "";
    let subject = "";

    // Generate the appropriate email content based on the type
    if (type === "signup" || type === "confirmation") {
      // For new user signup confirmation
      subject = `Confirm your ${SITE_NAME} account`;
      htmlContent = generateEmailTemplate("confirmation", {
        name: name || email.split("@")[0],
        actionUrl: actionUrl || `${SITE_URL}/auth/confirm`,
        siteName: SITE_NAME,
      });
    } else if (type === "welcome") {
      // For new user welcome email after successful registration
      subject = `Welcome to ${SITE_NAME}!`;
      htmlContent = generateEmailTemplate("welcome", {
        name: name || email.split("@")[0],
        dashboardUrl: `${SITE_URL}/dashboard`,
        siteName: SITE_NAME,
        siteUrl: SITE_URL,
      });
    } else if (type === "magic-link") {
      // For magic link authentication
      const mailType = emailType || "login";
      subject =
        mailType === "login"
          ? `Sign-in link for ${SITE_NAME}`
          : `Activate your ${SITE_NAME} account`;

      htmlContent = generateEmailTemplate("magic-link", {
        firstName: name || email.split("@")[0],
        actionUrl: actionUrl || `${SITE_URL}/auth/callback`,
        mailType: mailType === "login" ? "login" : "register",
        siteName: SITE_NAME,
      });
    } else {
      return new Response(JSON.stringify({ error: "Invalid email type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send email using Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${SITE_NAME} <no-reply@${EMAIL_DOMAIN}>`,
        to:
          Deno.env.get("NODE_ENV") === "development"
            ? "delivered@resend.dev"
            : email,
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

    return new Response(JSON.stringify({ success: true, data: resendData }), {
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
