import { siteConfig } from "@/config/site";

import { getSupabaseClient } from "./supabase";

// Function to call our Supabase Edge Function for sending emails (client-safe)
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
    throw new Error(`Failed to send ${type} email.`);
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
