import "server-only";

import { MagicLinkEmail } from "@/emails/magic-link-email";
import { Resend } from "resend";

import { env } from "@/env.mjs";
import { siteConfig } from "@/config/site";

import { getServerUserByEmail } from "./db-admin";
import { getSupabaseClient } from "./supabase";

export const resend = new Resend(env.RESEND_API_KEY);

// Define our own email request interface for Supabase
interface VerificationRequestParams {
  identifier: string;
  url: string;
  provider: {
    from: string;
  };
}

// Function to call our Supabase Edge Function for sending emails
export const sendEmailWithEdgeFunction = async ({
  type,
  email,
  name,
  actionUrl,
  emailType,
}: {
  type: "signup" | "magic-link" | "welcome" | "confirmation";
  email: string;
  name?: string;
  actionUrl?: string;
  emailType?: "login" | "register";
}) => {
  try {
    console.log(`Sending ${type} email to ${email} via edge function`);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        type,
        email,
        name,
        actionUrl,
        emailType,
      },
    });

    if (error) {
      console.error("Edge function error:", error);
      throw new Error(`Failed to send ${type} email: ${error.message}`);
    }

    console.log(`Successfully sent ${type} email to ${email}`);
    return data;
  } catch (error) {
    console.error(`Failed to send ${type} email:`, error);
    // Try to use direct Resend API as a fallback for some email types
    if (type === "welcome") {
      try {
        console.log("Attempting to send welcome email directly via Resend API");
        const { data, error } = await resend.emails.send({
          from: `${siteConfig.name} <hello@cenety.com>`,
          to:
            process.env.NODE_ENV === "development"
              ? "delivered@resend.dev"
              : email,
          subject: `Welcome to ${siteConfig.name}!`,
          text: `Welcome to ${siteConfig.name}! We're excited to have you on board.`,
        });

        if (error) {
          console.error("Resend API fallback error:", error);
        } else {
          console.log(
            "Successfully sent welcome email via Resend API fallback",
          );
          return data;
        }
      } catch (fallbackError) {
        console.error("Fallback email sending failed:", fallbackError);
      }
    }

    throw new Error(`Failed to send ${type} email.`);
  }
};

export const sendVerificationRequest = async ({
  identifier,
  url,
  provider,
}: VerificationRequestParams) => {
  const user = await getServerUserByEmail(identifier);
  if (!user || !user.name) return;

  const userVerified = user?.emailVerified ? true : false;
  const authSubject = userVerified
    ? `Sign-in link for ${siteConfig.name}`
    : "Activate your account";

  try {
    // First try to use the Edge Function
    try {
      await sendEmailWithEdgeFunction({
        type: "magic-link",
        email: identifier,
        name: user?.name as string,
        actionUrl: url,
        emailType: userVerified ? "login" : "register",
      });
      return;
    } catch (edgeFunctionError) {
      console.warn(
        "Edge function failed, falling back to Resend direct:",
        edgeFunctionError,
      );
      // Continue with direct Resend API fallback
    }

    // Fallback to direct Resend API
    const { data, error } = await resend.emails.send({
      from: provider.from,
      to:
        process.env.NODE_ENV === "development"
          ? "delivered@resend.dev"
          : identifier,
      subject: authSubject,
      react: MagicLinkEmail({
        firstName: user?.name as string,
        actionUrl: url,
        mailType: userVerified ? "login" : "register",
        siteName: siteConfig.name,
      }),
      // Set this to prevent Gmail from threading emails.
      // More info: https://resend.com/changelog/custom-email-headers
      headers: {
        "X-Entity-Ref-ID": new Date().getTime() + "",
      },
    });

    if (error || !data) {
      throw new Error(error?.message);
    }

    // console.log(data)
  } catch (error) {
    throw new Error("Failed to send verification email.");
  }
};

// New function to send a signup confirmation email
export const sendSignupConfirmationEmail = async ({
  email,
  name,
  actionUrl,
}: {
  email: string;
  name?: string;
  actionUrl: string;
}) => {
  try {
    return await sendEmailWithEdgeFunction({
      type: "confirmation",
      email,
      name,
      actionUrl,
    });
  } catch (error) {
    console.error("Failed to send signup confirmation email:", error);
    throw new Error("Failed to send signup confirmation email.");
  }
};

// New function to send a welcome email after successful registration
export const sendWelcomeEmail = async ({
  email,
  name,
}: {
  email: string;
  name?: string;
}) => {
  try {
    return await sendEmailWithEdgeFunction({
      type: "welcome",
      email,
      name,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    throw new Error("Failed to send welcome email.");
  }
};
