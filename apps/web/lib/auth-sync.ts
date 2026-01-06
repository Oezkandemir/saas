import { User } from "@supabase/supabase-js";

import { supabaseAdmin } from "@/lib/db-admin";
import { logger } from "@/lib/logger";

/**
 * Ensures that a user record exists in the database users table
 * when a user authenticates with Supabase Auth
 */
export async function syncUserWithDatabase(user: User): Promise<User | null> {
  if (!user || !user.id || !user.email) {
    logger.error("Invalid user object provided to syncUserWithDatabase");
    return null;
  }

  try {
    logger.debug(`Checking if user ${user.id} exists in database...`);

    // First try to get the user by ID directly
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    // If we found the user, return success
    // IMPORTANT: Do NOT update the role - preserve the existing database role
    // This prevents admin roles from being reset to USER
    if (existingUser) {
      logger.debug(
        `User ${user.id} already exists in database with role ${existingUser.role}`,
      );
      return existingUser;
    }

    // Handle connection errors gracefully - these are often harmless (aborted requests, etc.)
    if (fetchError) {
      // PGRST116 = no rows returned (expected case)
      if (fetchError.code === "PGRST116") {
        // This is expected - user doesn't exist yet
      } else {
        // Check if it's a connection error (harmless)
        const errorMessage = fetchError.message || String(fetchError);
        const isConnectionError =
          errorMessage.includes("ECONNRESET") ||
          errorMessage.includes("aborted") ||
          errorMessage.includes("ECONNREFUSED") ||
          errorMessage.includes("socket hang up");

        if (isConnectionError) {
          // Log as warning, not error - these are often harmless
          logger.warn(
            `Connection error while checking user ${user.id} (likely aborted request):`,
            fetchError.message || fetchError,
          );
          // Return null to allow retry or graceful degradation
          return null;
        } else {
          // Other errors should be logged as errors
          logger.error("Error checking for existing user:", fetchError);
        }
      }
    }

    // If user not found by ID, try to find by email
    if (user.email) {
      try {
        const { data: userByEmail, error: emailError } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("email", user.email)
          .single();

        if (emailError && emailError.code !== "PGRST116") {
          logger.error("Error checking for user by email:", emailError);
        }

        if (userByEmail) {
          logger.info(
            `Found user with same email but different ID. Email: ${user.email}, DB ID: ${userByEmail.id}, Auth ID: ${user.id}`,
          );

          // Try to update the user ID to match the auth ID
          try {
            const { error: updateError } = await supabaseAdmin
              .from("users")
              .update({ id: user.id })
              .eq("id", userByEmail.id);

            if (updateError) {
              logger.error("Could not update user ID:", updateError);
            } else {
              logger.info(
                `Updated user ID from ${userByEmail.id} to ${user.id}`,
              );
              return user;
            }
          } catch (err) {
            logger.error("Error updating user ID:", err);
          }
        }
      } catch (emailLookupError) {
        // Handle connection errors gracefully
        const errorMessage =
          emailLookupError instanceof Error
            ? emailLookupError.message
            : String(emailLookupError);
        const isConnectionError =
          errorMessage.includes("ECONNRESET") ||
          errorMessage.includes("aborted") ||
          errorMessage.includes("ECONNREFUSED");

        if (isConnectionError) {
          logger.warn(
            "Connection error during email lookup (likely aborted request):",
            emailLookupError,
          );
        } else {
          logger.error("Error during email lookup:", emailLookupError);
        }
      }
    }

    // Stripe is deprecated - we use Polar.sh now
    // No Stripe customer creation needed
    let stripeCustomerId: string | null = null;

    // Try direct insert without email if it's causing conflicts
    logger.info(`Creating new user record for ${user.id}`);

    // Get avatar_url from user metadata
    const avatar_url = user.user_metadata?.avatar_url || null;

    // Prepare user data
    const userData = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split("@")[0] || null,
      role: (user.user_metadata?.role === "ADMIN" ? "ADMIN" : "USER") as any,
      avatar_url: avatar_url,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: null,
      stripe_price_id: null,
      stripe_current_period_end: null,
      payment_provider: "polar", // Default to Polar (Stripe is deprecated)
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // First try with all data
    try {
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from("users")
        .insert(userData)
        .select()
        .single();

      if (insertError) {
        logger.error("Error creating user record:", insertError);

        // If the error is due to ID conflict (user already exists), fetch the existing user
        // This can happen in race conditions where multiple requests try to create the same user
        if (
          insertError.code === "23505" &&
          (insertError.details?.includes("id") ||
            insertError.message?.includes("users_pkey"))
        ) {
          logger.info(
            `User ${user.id} already exists (race condition), fetching existing user`,
          );

          // Fetch the existing user to preserve their role
          const { data: existingUser, error: fetchError } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single();

          if (fetchError) {
            logger.error(
              "Error fetching existing user after conflict:",
              fetchError,
            );
            return null;
          }

          logger.info(
            `Retrieved existing user ${user.id} with role ${existingUser?.role}`,
          );
          return existingUser;
        }

        // If the error is due to email uniqueness, try without email
        if (
          insertError.code === "23505" &&
          insertError.details?.includes("email")
        ) {
          logger.info(
            "Trying insert without email due to uniqueness constraint",
          );

          // Remove email from userData
          const { email, ...userDataWithoutEmail } = userData;

          const { data: userWithoutEmail, error: insertNoEmailError } =
            await supabaseAdmin
              .from("users")
              .insert(userDataWithoutEmail)
              .select()
              .single();

          if (insertNoEmailError) {
            // If this also fails due to ID conflict, fetch existing user
            if (
              insertNoEmailError.code === "23505" &&
              (insertNoEmailError.details?.includes("id") ||
                insertNoEmailError.message?.includes("users_pkey"))
            ) {
              const { data: existingUser } = await supabaseAdmin
                .from("users")
                .select("*")
                .eq("id", user.id)
                .single();

              if (existingUser) {
                logger.info(
                  `Retrieved existing user ${user.id} after email conflict`,
                );
                return existingUser;
              }
            }

            logger.error(
              "Error creating user without email:",
              insertNoEmailError,
            );
            return null;
          }

          logger.info(
            `Successfully created user record for ${user.id} without email`,
          );
          return userWithoutEmail;
        }

        return null;
      }

      logger.info(`Successfully created user record for ${user.id}`);
      return newUser;
    } catch (insertError) {
      // Handle connection errors gracefully
      const errorMessage =
        insertError instanceof Error
          ? insertError.message
          : String(insertError);
      const isConnectionError =
        errorMessage.includes("ECONNRESET") ||
        errorMessage.includes("aborted") ||
        errorMessage.includes("ECONNREFUSED");

      if (isConnectionError) {
        logger.warn(
          "Connection error during user insert (likely aborted request):",
          insertError,
        );
        // Return null to allow retry
        return null;
      }

      logger.error("Exception during user insert:", insertError);

      // Try a more minimal insert as a last resort
      try {
        const minimalUserData = {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
          role: "USER" as any,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: minimalUser, error: minimalError } = await supabaseAdmin
          .from("users")
          .insert(minimalUserData)
          .select()
          .single();

        if (minimalError) {
          // If error is due to ID conflict, fetch existing user to preserve role
          if (
            minimalError.code === "23505" &&
            (minimalError.details?.includes("id") ||
              minimalError.message?.includes("users_pkey"))
          ) {
            logger.info(
              `User ${user.id} already exists, fetching to preserve role`,
            );
            const { data: existingUser } = await supabaseAdmin
              .from("users")
              .select("*")
              .eq("id", user.id)
              .single();

            if (existingUser) {
              return existingUser;
            }
          }

          logger.error("Error with minimal user insert:", minimalError);
          return null;
        }

        logger.info(`Successfully created minimal user record for ${user.id}`);
        return minimalUser;
      } catch (minimalError) {
        // Handle connection errors gracefully
        const errorMessage =
          minimalError instanceof Error
            ? minimalError.message
            : String(minimalError);
        const isConnectionError =
          errorMessage.includes("ECONNRESET") ||
          errorMessage.includes("aborted") ||
          errorMessage.includes("ECONNREFUSED");

        if (isConnectionError) {
          logger.warn(
            "Connection error during minimal user insert (likely aborted request):",
            minimalError,
          );
        } else {
          logger.error("Exception during minimal user insert:", minimalError);
        }
        return null;
      }
    }
  } catch (error) {
    // Handle connection errors gracefully
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const isConnectionError =
      errorMessage.includes("ECONNRESET") ||
      errorMessage.includes("aborted") ||
      errorMessage.includes("ECONNREFUSED");

    if (isConnectionError) {
      logger.warn(
        "Connection error in syncUserWithDatabase (likely aborted request):",
        error,
      );
    } else {
      logger.error("Unexpected error in syncUserWithDatabase:", error);
    }
    return null;
  }
}
