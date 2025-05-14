"use server";

import { z } from "zod";

import { sendNewsletterConfirmationEmail } from "@/lib/email-client";
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

    if (existingSubscriber) {
      return {
        success: false,
        message: "This email is already subscribed to our newsletter",
      };
    }

    // Insert the new subscriber
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

    // Send confirmation email
    await sendNewsletterConfirmationEmail({
      email: validatedData.email,
    });

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
