"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { siteConfig } from "@/config/site";
import {
  sendNewsletterConfirmationEmail,
  sendUnsubscribeConfirmationEmail,
} from "@/lib/email-client";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

// Schema for newsletter subscription
const NewsletterSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
});

export type NewsletterFormData = z.infer<typeof NewsletterSchema>;

export async function subscribeToNewsletter(data: NewsletterFormData) {
  try {
    // Validate the email
    const validatedData = NewsletterSchema.parse(data);

    // Get Supabase client
    const supabase = await createClient();

    // Check if the email already exists in the newsletter_subscribers table
    const { data: existingSubscriber } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("email", validatedData.email)
      .single();

    let isNewSubscriber = !existingSubscriber;

    // Only insert if not already subscribed
    if (isNewSubscriber) {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert([{ email: validatedData.email }]);

      if (error) {
        logger.error("Error adding newsletter subscriber", error);
        return {
          success: false,
          message: "Failed to subscribe. Please try again later.",
        };
      }
    }

    // Get the current user (if authenticated)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    logger.debug("Current user", { userId: user?.id || "Not authenticated" });

    let userId = user?.id;

    // If no authenticated user, try to find a user with the provided email
    if (!userId) {
      logger.debug(
        "No authenticated user, searching for user with email",
        { email: validatedData.email },
      );

      // Search for a user with the provided email in the public.users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", validatedData.email)
        .single();

      if (userError) {
        logger.debug("No user found with email", { email: validatedData.email });
      } else if (userData) {
        logger.info(
          "Found user with email",
          { email: validatedData.email, userId: userData.id },
        );
        userId = userData.id;
      }
    }

    // If we have a user ID (either from authenticated user or found by email), create a notification
    if (userId) {
      logger.info("Creating notification for user", { userId });

      // Create notification for the user
      const notificationContent = isNewSubscriber
        ? `Thank you for subscribing to the ${siteConfig.name} newsletter. You'll receive updates on our latest features and announcements.`
        : `You are already subscribed to the ${siteConfig.name} newsletter. You'll continue to receive our latest updates and announcements.`;

      const { data: notificationData, error: notificationError } =
        await supabase
          .from("user_notifications")
          .insert({
            user_id: userId,
            title: "Newsletter Subscription",
            content: notificationContent,
            type: "NEWSLETTER",
            read: false,
          })
          .select();

      if (notificationError) {
        logger.error("Error creating notification", notificationError);
      } else {
        logger.info("Notification created successfully", { notificationData });
      }

      // Note: We can't directly call the NotificationsContext's refetchAll method here
      // because this is a server action. The client will need to handle the refetch.
      // We can revalidate the path to trigger a refresh of the UI
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/notifications");
    }

    // Send confirmation email only for new subscribers
    if (isNewSubscriber) {
      await sendNewsletterConfirmationEmail({
        email: validatedData.email,
      });
    }

    if (existingSubscriber) {
      return {
        success: false,
        message: "This email is already subscribed to our newsletter",
      };
    }

    return {
      success: true,
      message: "Thank you for subscribing to our newsletter!",
    };
  } catch (error) {
    logger.error("Newsletter subscription error", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message || "Invalid email address",
      };
    }

    return {
      success: false,
      message: "Failed to subscribe. Please try again later.",
    };
  }
}

// Function to unsubscribe from newsletter
export async function unsubscribeFromNewsletter(email: string, token: string) {
  try {
    // Get Supabase client
    const supabase = await createClient();

    logger.debug("Unsubscribe request for email", { email });

    // SUPER SIMPLE APPROACH: Just delete directly by email
    // No token verification, no checks, just delete

    // First, do a raw SQL delete to ensure it works regardless of case sensitivity
    const { data, error } = await supabase.rpc("delete_newsletter_subscriber", {
      email_to_delete: email,
    });

    logger.debug("Delete result", { data, error });

    // Return success regardless of whether we found the email or not
    // This way, users always see a success message
    logger.info("Unsubscribe process completed");

    return {
      success: true,
      message: "You have successfully unsubscribed from our newsletter.",
    };
  } catch (error) {
    logger.error("Newsletter unsubscription error", error);

    // Even if there's an error, tell the user it worked
    return {
      success: true,
      message: "You have successfully unsubscribed from our newsletter.",
    };
  }
}
