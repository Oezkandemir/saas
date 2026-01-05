import { logger } from "./logger";
import { getSupabaseClient } from "./supabase";

// Function to call our Supabase Edge Function for sending emails (client-safe)
export const sendEmailWithEdgeFunction = async ({
  type,
  email,
  name,
  actionUrl,
  emailType,
}: {
  type:
    | "signup"
    | "magic-link"
    | "welcome"
    | "confirmation"
    | "newsletter"
    | "unsubscribe";
  email: string;
  name?: string;
  actionUrl?: string;
  emailType?: "login" | "register";
}) => {
  try {
    logger.info(`Sending ${type} email to ${email} via edge function`);
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
      logger.error("Edge function error", error);
      throw new Error(`Failed to send ${type} email: ${error.message}`);
    }

    logger.info(`Successfully sent ${type} email to ${email}`);
    return data;
  } catch (error) {
    logger.error(`Failed to send ${type} email`, error);
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
    logger.error("Failed to send signup confirmation email", error);
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
    logger.error("Failed to send welcome email", error);
    throw new Error("Failed to send welcome email.");
  }
};

// Function to send a newsletter confirmation email
export const sendNewsletterConfirmationEmail = async ({
  email,
}: {
  email: string;
}) => {
  try {
    return await sendEmailWithEdgeFunction({
      type: "newsletter",
      email,
    });
  } catch (error) {
    logger.error("Failed to send newsletter confirmation email", error);
    throw new Error("Failed to send newsletter confirmation email.");
  }
};

// Function to send a team invitation email
export const sendTeamInvitationEmail = async ({
  email,
  inviterName,
  inviterEmail,
  teamName,
  teamSlug,
  role,
  actionUrl,
}: {
  email: string;
  inviterName: string;
  inviterEmail: string;
  teamName: string;
  teamSlug: string;
  role: string;
  actionUrl?: string;
}) => {
  try {
    logger.info(`Sending team invitation email to ${email} via edge function`);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        type: "team-invitation",
        email,
        inviterName,
        inviterEmail,
        teamName,
        teamSlug,
        role,
        actionUrl,
      },
    });

    if (error) {
      logger.error("Edge function error", error);
      throw new Error(`Failed to send team invitation email: ${error.message}`);
    }

    logger.info(`Successfully sent team invitation email to ${email}`);
    return data;
  } catch (error) {
    logger.error("Failed to send team invitation email", error);
    throw new Error("Failed to send team invitation email.");
  }
};

// Function to send an unsubscribe confirmation email
export const sendUnsubscribeConfirmationEmail = async ({
  email,
}: {
  email: string;
}) => {
  try {
    return await sendEmailWithEdgeFunction({
      type: "unsubscribe",
      email,
    });
  } catch (error) {
    logger.error("Failed to send unsubscribe confirmation email", error);
    throw new Error("Failed to send unsubscribe confirmation email.");
  }
};
