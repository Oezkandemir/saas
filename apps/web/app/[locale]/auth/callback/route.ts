import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

import { logger } from "@/lib/logger";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const userId = requestUrl.searchParams.get("id");

  // Get the locale from the URL or use default
  const locale =
    requestUrl.pathname.match(/^\/(en|de)(?:\/|$)/)?.[1] ||
    routing.defaultLocale;

  const supabase = await getSupabaseServer();

  // Handle auto-login after email confirmation (from magic link)
  const autoLogin = requestUrl.searchParams.get("autoLogin");
  if (autoLogin === "true" && code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        logger.error("Error exchanging code for session during auto-login:", {
          message: error.message,
        });
        return NextResponse.redirect(
          new URL(
            `/${locale}/login?error=${encodeURIComponent(error.message)}`,
            requestUrl.origin,
          ),
        );
      }

      // Create login session and log to history
      if (data.session && data.user) {
        const { createLoginSession } = await import("@/lib/session-tracking");
        const expiresAt = new Date(data.session.expires_at! * 1000);
        await createLoginSession(data.user.id, expiresAt);
      }

      // Redirect to dashboard after successful auto-login
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard`, requestUrl.origin),
      );
    } catch (error) {
      logger.error("Unexpected error during auto-login callback", error);
      return NextResponse.redirect(
        new URL(
          `/${locale}/login?error=${encodeURIComponent("Auto-login failed")}`,
          requestUrl.origin,
        ),
      );
    }
  }

  // Handle standard OAuth or magic link callback with code
  if (code) {
    // Exchange code for session
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        logger.error("Error exchanging code for session", {
          message: error.message,
        });
        return NextResponse.redirect(
          new URL(
            `/${locale}/login?error=${encodeURIComponent(error.message)}`,
            requestUrl.origin,
          ),
        );
      }

      // If user was just verified (email confirmation), update emailVerified in public.users
      if (data.user && data.user.email_confirmed_at) {
        try {
          const { supabaseAdmin } = await import("@/lib/db");
          await supabaseAdmin
            .from("users")
            .update({ emailVerified: data.user.email_confirmed_at })
            .eq("id", data.user.id);
          
          logger.info(`Email verified for user ${data.user.id}`);
        } catch (dbError) {
          // Log but don't fail - the trigger should handle this
          logger.warn("Could not update emailVerified in database:", dbError);
        }
      }

      // Create login session and log to history
      if (data.session && data.user) {
        const { createLoginSession } = await import("@/lib/session-tracking");
        const expiresAt = new Date(data.session.expires_at! * 1000);
        await createLoginSession(data.user.id, expiresAt);
      }

      // Redirect to dashboard after successful authentication
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard`, requestUrl.origin),
      );
    } catch (error) {
      logger.error("Unexpected error during auth callback", error);
      return NextResponse.redirect(
        new URL(
          `/${locale}/login?error=${encodeURIComponent("Authentication failed")}`,
          requestUrl.origin,
        ),
      );
    }
  }

  // Handle custom signup callback with user ID
  if (type === "signup" && userId) {
    try {
      logger.info(`Processing email confirmation for user ${userId}`, {
        url: requestUrl.toString(),
        type,
        userId,
      });

      // Import admin client for user confirmation
      const { supabaseAdmin } = await import("@/lib/db");

      // Get user details
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.getUserById(userId);

      if (userError || !userData?.user) {
        logger.error("Error getting user:", userError);
        return NextResponse.redirect(
          new URL(
            `/${locale}/login?error=${encodeURIComponent("User not found")}`,
            requestUrl.origin,
          ),
        );
      }

      logger.info(`Found user ${userId}, email: ${userData.user.email}, already confirmed: ${!!userData.user.email_confirmed_at}`);

      // Check if already confirmed
      if (userData.user.email_confirmed_at) {
        logger.info(`User ${userId} already confirmed, updating database only`);
        // Still update database to ensure consistency
        await supabaseAdmin
          .from("users")
          .update({ emailVerified: userData.user.email_confirmed_at })
          .eq("id", userId);
        
        return NextResponse.redirect(
          new URL(`/${locale}/auth/verified?userId=${userId}`, requestUrl.origin),
        );
      }

      // Update user's email confirmation status in Auth
      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          email_confirm: true,
          user_metadata: {
            ...userData.user.user_metadata,
            email_confirmed: true,
          },
        });

      if (updateError) {
        logger.error("Error updating user auth status:", updateError);
        return NextResponse.redirect(
          new URL(
            `/${locale}/login?error=${encodeURIComponent("Failed to confirm email: " + updateError.message)}`,
            requestUrl.origin,
          ),
        );
      }

      logger.info(`Successfully confirmed email for user ${userId} in auth.users`);

      // Also update the user table
      const { error: dbError } = await supabaseAdmin
        .from("users")
        .update({ emailVerified: new Date().toISOString() })
        .eq("id", userId);

      if (dbError) {
        logger.error("Error updating user in database:", dbError);
        // Don't fail here, since the auth update was successful
      } else {
        logger.info(`Successfully updated emailVerified for user ${userId} in public.users`);
      }

      logger.info(`Email verified successfully for user ${userId}`);

      // After confirming email, generate a magic link to automatically sign in the user
      // This creates a session without requiring the password
      try {
        const { data: magicLinkData, error: magicLinkError } =
          await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: userData.user.email!,
            options: {
              redirectTo: `${requestUrl.origin}/${locale}/auth/callback?autoLogin=true`,
            },
          });

        if (magicLinkError || !magicLinkData?.properties?.action_link) {
          logger.error("Error generating magic link for auto-login:", magicLinkError);
          // Fallback: redirect to verified page where user can manually log in
          return NextResponse.redirect(
            new URL(`/${locale}/auth/verified?userId=${userId}`, requestUrl.origin),
          );
        }

        // Redirect to the magic link - Supabase will handle the session creation
        logger.info(`Redirecting user ${userId} to magic link for auto-login`);
        return NextResponse.redirect(magicLinkData.properties.action_link);
      } catch (autoLoginError) {
        logger.error("Error during auto-login after confirmation:", autoLoginError);
        // Fallback: redirect to verified page where user can manually log in
        return NextResponse.redirect(
          new URL(`/${locale}/auth/verified?userId=${userId}`, requestUrl.origin),
        );
      }
    } catch (error) {
      logger.error("Error handling signup callback", error);
      return NextResponse.redirect(
        new URL(
          `/${locale}/login?error=${encodeURIComponent("Verification failed: " + (error instanceof Error ? error.message : "Unknown error"))}`,
          requestUrl.origin,
        ),
      );
    }
  }

  // If no code or other valid parameters, redirect to sign-in page
  return NextResponse.redirect(new URL(`/${locale}/login`, requestUrl.origin));
}
