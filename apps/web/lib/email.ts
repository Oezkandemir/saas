import "server-only";

import { MagicLinkEmail } from "@/emails/magic-link-email";
import { BookingConfirmationEmail } from "@/emails/booking-confirmation-email";
import { Resend } from "resend";

import { env } from "@/env.mjs";
import { siteConfig } from "@/config/site";

import { getServerUserByEmail, getServerUserById } from "./db-admin";
import { getSupabaseClient } from "./supabase";
import { logger } from "./logger";

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
    // Try to use direct Resend API as a fallback for some email types
    if (type === "welcome") {
      try {
        logger.info("Attempting to send welcome email directly via Resend API");
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
          logger.error("Resend API fallback error", error);
        } else {
          logger.info("Successfully sent welcome email via Resend API fallback");
          return data;
        }
      } catch (fallbackError) {
        logger.error("Fallback email sending failed", fallbackError);
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
      logger.warn(
        "Edge function failed, falling back to Resend direct",
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

/**
 * Send booking confirmation email to customer
 */
export const sendBookingConfirmationEmail = async ({
  inviteeEmail,
  inviteeName,
  eventTitle,
  eventDescription,
  startAt,
  endAt,
  durationMinutes,
  locationType,
  locationValue,
  hostUserId,
  priceAmount,
  priceCurrency,
  numberOfParticipants,
  participantNames,
  inviteeNotes,
  cancelToken,
  rescheduleToken,
  eventSlug,
}: {
  inviteeEmail: string;
  inviteeName: string;
  eventTitle: string;
  eventDescription?: string | null;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  locationType?: "google_meet" | "zoom" | "custom_link" | "phone" | "in_person" | null;
  locationValue?: string | null;
  hostUserId: string;
  priceAmount?: number | null;
  priceCurrency?: string | null;
  numberOfParticipants: number;
  participantNames?: string[] | null;
  inviteeNotes?: string | null;
  cancelToken: string;
  rescheduleToken?: string | null;
  eventSlug: string;
}) => {
  try {
    logger.info("sendBookingConfirmationEmail called", { inviteeEmail, eventTitle });
    
    // Check if Resend is configured
    if (!env.RESEND_API_KEY) {
      logger.error("RESEND_API_KEY is not configured, cannot send booking confirmation email");
      return { success: false, error: "Email service not configured" };
    }

    // Get host user information
    const hostUser = await getServerUserById(hostUserId);
    const hostName = hostUser?.name || null;
    const hostEmail = hostUser?.email || null;

    // Build booking URL
    const bookingUrl = `${env.NEXT_PUBLIC_APP_URL}/book/${hostUserId}/${eventSlug}`;

    // Use the same logic as other working emails (send-customer-email.ts, documents-email-actions.ts)
    // In development, send to delivered@resend.dev for testing, but also log the actual recipient
    const recipientEmail = process.env.NODE_ENV === "development" 
      ? "delivered@resend.dev" 
      : inviteeEmail;

    const fromEmail = env.EMAIL_FROM || "hello@cenety.com";
    
    logger.info(`Sending booking confirmation email to ${inviteeEmail} (actual recipient: ${recipientEmail})`, {
      inviteeEmail,
      recipientEmail,
      fromEmail,
      hasResendKey: !!env.RESEND_API_KEY,
      hostUserId,
      eventTitle,
      eventSlug,
    });

    // Send email via Resend - same pattern as other working emails
    const { data, error } = await resend.emails.send({
      from: `${siteConfig.name} <${fromEmail}>`,
      to: recipientEmail,
      reply_to: hostEmail || fromEmail,
      subject: `Buchungsbestätigung: ${eventTitle}`,
      react: BookingConfirmationEmail({
        inviteeName,
        eventTitle,
        eventDescription,
        startAt,
        endAt,
        durationMinutes,
        locationType,
        locationValue,
        hostName,
        hostEmail,
        priceAmount,
        priceCurrency,
        numberOfParticipants,
        participantNames,
        inviteeNotes,
        cancelToken,
        bookingUrl,
        rescheduleToken,
      }),
      headers: {
        "X-Entity-Ref-ID": new Date().getTime().toString(),
      },
    });

    if (error) {
      logger.error("Failed to send booking confirmation email via Resend", {
        error: error.message,
        errorDetails: JSON.stringify(error),
        inviteeEmail,
        recipientEmail,
        fromEmail,
        hasResendKey: !!env.RESEND_API_KEY,
      });
      return { success: false, error: error.message || "Unknown error" };
    }

    if (!data || !data.id) {
      logger.error("Resend returned no data or message ID", {
        inviteeEmail,
        recipientEmail,
        response: data,
      });
      return { success: false, error: "No message ID returned from Resend" };
    }

    logger.info(`Booking confirmation email sent successfully`, {
      inviteeEmail,
      recipientEmail,
      messageId: data.id,
      fromEmail,
    });
    
    return { success: true, messageId: data.id };
  } catch (error) {
    logger.error("Exception in sendBookingConfirmationEmail", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      inviteeEmail,
    });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send booking confirmation email" 
    };
  }
};
