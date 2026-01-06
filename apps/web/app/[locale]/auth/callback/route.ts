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
      // Use SQL function as primary method since updateUserById fails due to missing logs table trigger
      const confirmationTimestamp = new Date().toISOString();
      
      // Try using SQL function first (more reliable)
      let emailConfirmed = false;
      try {
        const { data: sqlResult, error: sqlError } = await supabaseAdmin.rpc('confirm_user_email', {
          user_id: userId
        });
        
        if (sqlError) {
          logger.error("SQL function failed:", sqlError);
        } else if (sqlResult) {
          logger.info("Email confirmed using SQL function");
          emailConfirmed = true;
        }
      } catch (sqlError) {
        logger.error("SQL function exception:", sqlError);
      }
      
      // If SQL function failed, try Admin API as fallback
      if (!emailConfirmed) {
        logger.info("SQL function failed, trying Admin API");
        const existingMetadata = userData.user.user_metadata || {};
        
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          email_confirm: true,
          user_metadata: {
            ...existingMetadata,
            email_confirmed: true,
          },
        });

        if (updateError) {
          logger.error("Admin API also failed:", {
            error: updateError,
            message: updateError.message,
            code: updateError.code,
            status: updateError.status,
          });
          
          // Last resort: try to update directly in database
          try {
            const { error: dbUpdateError } = await supabaseAdmin
              .from("users")
              .update({ emailVerified: confirmationTimestamp })
              .eq("id", userId);
            
            if (dbUpdateError) {
              logger.error("Database update also failed:", dbUpdateError);
              return NextResponse.redirect(
                new URL(
                  `/${locale}/login?error=${encodeURIComponent("Failed to confirm email. Please contact support.")}`,
                  requestUrl.origin,
                ),
              );
            } else {
              logger.warn("Updated emailVerified in database as last resort");
              // Still redirect to verified page since we updated the database
              return NextResponse.redirect(
                new URL(`/${locale}/auth/verified?userId=${userId}&confirmed=true&warning=true`, requestUrl.origin),
              );
            }
          } catch (fallbackError) {
            logger.error("All confirmation methods failed:", fallbackError);
            return NextResponse.redirect(
              new URL(
                `/${locale}/login?error=${encodeURIComponent("Failed to confirm email. Please contact support.")}`,
                requestUrl.origin,
              ),
            );
          }
        } else {
          logger.info("Email confirmed using Admin API");
          emailConfirmed = true;
        }
      }

      // Verify the confirmation actually worked by checking the user again
      // Wait a moment for the update to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: verifiedUserData, error: verifyError } =
        await supabaseAdmin.auth.admin.getUserById(userId);

      if (verifyError || !verifiedUserData?.user) {
        logger.error("Error verifying user after confirmation:", verifyError);
        // Still update database as fallback
        try {
          await supabaseAdmin
            .from("users")
            .update({ emailVerified: confirmationTimestamp })
            .eq("id", userId);
          logger.warn("Updated emailVerified in database as fallback");
        } catch (dbError) {
          logger.error("Database update failed:", dbError);
        }
        
        return NextResponse.redirect(
          new URL(`/${locale}/auth/verified?userId=${userId}&confirmed=true&warning=true`, requestUrl.origin),
        );
      }

      // Check if email_confirmed_at was actually set
      if (!verifiedUserData.user.email_confirmed_at) {
        logger.error(`Email confirmation failed - email_confirmed_at is still null for user ${userId}`);
        
        // Try SQL function one more time
        try {
          const { data: retryResult } = await supabaseAdmin.rpc('confirm_user_email', {
            user_id: userId
          });
          
          if (!retryResult) {
            // Update database as fallback
            await supabaseAdmin
              .from("users")
              .update({ emailVerified: confirmationTimestamp })
              .eq("id", userId);
            
            logger.warn("Updated emailVerified in database as fallback after retry");
            return NextResponse.redirect(
              new URL(`/${locale}/auth/verified?userId=${userId}&confirmed=true&warning=true`, requestUrl.origin),
            );
          }
          
          // Verify again after retry
          await new Promise(resolve => setTimeout(resolve, 500));
          const { data: retryVerifiedData } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (!retryVerifiedData?.user?.email_confirmed_at) {
            logger.error("Email confirmation still failed after SQL retry");
            // Update database as fallback
            await supabaseAdmin
              .from("users")
              .update({ emailVerified: confirmationTimestamp })
              .eq("id", userId);
            
            return NextResponse.redirect(
              new URL(`/${locale}/auth/verified?userId=${userId}&confirmed=true&warning=true`, requestUrl.origin),
            );
          }
        } catch (retryError) {
          logger.error("Retry also failed:", retryError);
          // Update database as fallback
          await supabaseAdmin
            .from("users")
            .update({ emailVerified: confirmationTimestamp })
            .eq("id", userId);
          
          return NextResponse.redirect(
            new URL(`/${locale}/auth/verified?userId=${userId}&confirmed=true&warning=true`, requestUrl.origin),
          );
        }
      }

      const confirmedTimestamp = verifiedUserData.user.email_confirmed_at || confirmationTimestamp;
      logger.info(`Email confirmed at: ${confirmedTimestamp} for user ${userId}`);

      // Also update the user table
      const { error: dbError } = await supabaseAdmin
        .from("users")
        .update({ emailVerified: confirmedTimestamp })
        .eq("id", userId);

      if (dbError) {
        logger.error("Error updating user in database:", dbError);
        // Don't fail here, since the auth update was successful
      } else {
        logger.info(`Successfully updated emailVerified for user ${userId} in public.users`);
      }

      logger.info(`Email verified successfully for user ${userId}`);

      // Redirect to verified page - user will be redirected to login after 3 seconds
      // User is NOT automatically logged in - they need to sign in manually
      return NextResponse.redirect(
        new URL(`/${locale}/auth/verified?userId=${userId}&confirmed=true`, requestUrl.origin),
      );
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
