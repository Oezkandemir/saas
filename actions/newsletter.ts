"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { siteConfig } from "@/config/site";
import {
  sendNewsletterConfirmationEmail,
  sendUnsubscribeConfirmationEmail,
} from "@/lib/email-client";
import { createClient } from "@/lib/supabase/server";

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
        console.error("Error adding newsletter subscriber:", error);
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

    console.log("Current user:", user?.id || "Not authenticated");

    let userId = user?.id;

    // If no authenticated user, try to find a user with the provided email
    if (!userId) {
      console.log(
        "No authenticated user, searching for user with email:",
        validatedData.email,
      );

      // Search for a user with the provided email in the public.users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", validatedData.email)
        .single();

      if (userError) {
        console.log("No user found with email:", validatedData.email);
      } else if (userData) {
        console.log(
          "Found user with email:",
          validatedData.email,
          "User ID:",
          userData.id,
        );
        userId = userData.id;
      }
    }

    // If we have a user ID (either from authenticated user or found by email), create a notification
    if (userId) {
      console.log("Creating notification for user:", userId);

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
        console.error("Error creating notification:", notificationError);
      } else {
        console.log("Notification created successfully:", notificationData);
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
    console.error("Newsletter subscription error:", error);
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

    // Verify the unsubscribe token matches the email
    // This is a simple verification to ensure the unsubscribe link is valid
    // In a production environment, you might want to use a more secure method
    const expectedToken = btoa(email);

    if (token !== expectedToken) {
      return {
        success: false,
        message: "Invalid unsubscribe link. Please contact support.",
      };
    }

    // Check if the email exists in the newsletter_subscribers table
    const { data: existingSubscriber } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("email", email)
      .single();

    if (!existingSubscriber) {
      return {
        success: false,
        message: "This email is not subscribed to our newsletter.",
      };
    }

    // Delete the subscriber
    const { error } = await supabase
      .from("newsletter_subscribers")
      .delete()
      .eq("email", email);

    if (error) {
      console.error("Error removing newsletter subscriber:", error);
      return {
        success: false,
        message: "Failed to unsubscribe. Please try again later.",
      };
    }

    // Get the current user (if authenticated)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userId = user?.id;

    // If no authenticated user, try to find a user with the provided email
    if (!userId) {
      // Search for a user with the provided email in the public.users table
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (userData) {
        userId = userData.id;
      }
    }

    // If we have a user ID, create a notification
    if (userId) {
      // Create notification for the user
      const notificationContent = `You have successfully unsubscribed from the ${siteConfig.name} newsletter. You can resubscribe at any time.`;

      await supabase.from("user_notifications").insert({
        user_id: userId,
        title: "Newsletter Unsubscription",
        content: notificationContent,
        type: "NEWSLETTER",
        read: false,
      });

      // Revalidate paths to trigger a refresh of the UI
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/notifications");
    }

    // Send unsubscribe confirmation email
    await sendUnsubscribeConfirmationEmail({
      email: email,
    });

    return {
      success: true,
      message: "You have successfully unsubscribed from our newsletter.",
    };
  } catch (error) {
    console.error("Newsletter unsubscription error:", error);

    return {
      success: false,
      message: "Failed to unsubscribe. Please try again later.",
    };
  }
}
