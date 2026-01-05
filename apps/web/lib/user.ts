import {
  getUserByEmail as getServerUserByEmail,
  getUserById as getServerUserById,
} from "@/lib/db-client";

import { syncUserWithDatabase } from "./auth-sync";
import { sendSignupConfirmationEmail } from "./email-client";
import { getSupabaseClient } from "./supabase";
import { logger } from "@/lib/logger";

// Reexport client-safe versions of these functions
export const getUserByEmail = getServerUserByEmail;
export const getUserById = getServerUserById;

// New function to handle custom signup with email confirmation
export const signUpWithEmailConfirmation = async (
  email: string,
  password: string,
  name?: string,
) => {
  try {
    const supabase = getSupabaseClient();

    // Sign up the user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: {
          name: name || email.split("@")[0],
        },
      },
    });

    if (error) throw error;

    // If we have a user, sync them to the database
    if (data.user) {
      await syncUserWithDatabase(data.user);

      // Generate a confirmation OTP
      const { error: otpError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (otpError) {
        logger.error("Error requesting email confirmation:", otpError);
        return { success: false, error: otpError.message };
      }

      // Send custom confirmation email
      // Note: Since we can't easily get the actual token URL from the resend method,
      // we'll need to create a new token or handle this differently in a production app
      const confirmUrl = `${window.location.origin}/auth/confirm?email=${encodeURIComponent(email)}`;

      await sendSignupConfirmationEmail({
        email,
        name: name || email.split("@")[0],
        actionUrl: confirmUrl,
      });

      return { success: true, user: data.user };
    }

    return { success: false, error: "No user returned from sign up" };
  } catch (error) {
    logger.error("Error signing up user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred during sign up",
    };
  }
};
