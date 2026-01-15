import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getSupabaseServer } from "@/lib/supabase-server";

// Validation schema for signup
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = signupSchema.parse(body);

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists in auth.users
    const { data: existingUsers, error: checkError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (checkError) {
      logger.error("Error checking for existing users:", checkError);
      // Continue with signup if check fails - Supabase will handle duplicates
    } else {
      const existingUser = existingUsers?.users.find(
        (u) => u.email?.toLowerCase() === normalizedEmail
      );

      if (existingUser) {
        logger.warn("User already exists", {
          email: normalizedEmail,
          userId: existingUser.id,
          emailConfirmed: !!existingUser.email_confirmed_at,
        });

        return NextResponse.json(
          {
            error:
              "Ein Benutzer mit dieser E-Mail-Adresse existiert bereits. Bitte melde dich an oder verwende eine andere E-Mail-Adresse.",
          },
          { status: 409 } // Conflict
        );
      }
    }

    // Also check in public.users table
    const { data: existingDbUser } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingDbUser) {
      logger.warn("User already exists in database", {
        email: normalizedEmail,
        userId: existingDbUser.id,
      });

      return NextResponse.json(
        {
          error:
            "Ein Benutzer mit dieser E-Mail-Adresse existiert bereits. Bitte melde dich an oder verwende eine andere E-Mail-Adresse.",
        },
        { status: 409 } // Conflict
      );
    }

    const supabase = await getSupabaseServer();

    // Get locale from request headers or use default
    const locale = req.headers.get("x-locale") || "de";
    let origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    // Normalize origin URL - ensure localhost uses http:// instead of https://
    try {
      const url = new URL(origin);
      // If hostname is localhost or 127.0.0.1, force http:// protocol
      if (
        (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
        url.protocol === "https:"
      ) {
        url.protocol = "http:";
        origin = url.toString().replace(/\/$/, ""); // Remove trailing slash if present
      }
    } catch (_e) {
      // If URL parsing fails, fall back to string replacement
      if (
        (origin.includes("localhost") || origin.includes("127.0.0.1")) &&
        origin.startsWith("https://")
      ) {
        origin = origin.replace(/^https:\/\//, "http://");
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          name: name || email.split("@")[0],
          role: "USER",
        },
        // Disable automatic email - we'll send custom email instead
        emailRedirectTo: `${origin}/${locale}/auth/callback`,
      },
    });

    if (error) {
      logger.error("Supabase signup error:", error);

      // Check if error is due to user already existing
      if (
        error.message.includes("already registered") ||
        error.message.includes("already exists")
      ) {
        return NextResponse.json(
          {
            error:
              "Ein Benutzer mit dieser E-Mail-Adresse existiert bereits. Bitte melde dich an oder verwende eine andere E-Mail-Adresse.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data?.user) {
      logger.info("Supabase auth signup successful", { userId: data.user?.id });

      // Send custom confirmation and welcome emails
      try {
        const { sendSignupConfirmationEmail, sendWelcomeEmail } = await import(
          "@/lib/email-client"
        );
        const userName = name || normalizedEmail.split("@")[0];

        // Build confirmation URL with locale
        const confirmationUrl = `${origin}/${locale}/auth/callback?type=signup&id=${data.user.id}`;

        logger.info("Sending confirmation and welcome emails", {
          email: normalizedEmail,
          confirmationUrl,
          origin,
        });

        // Send confirmation email
        try {
          await sendSignupConfirmationEmail({
            email: normalizedEmail,
            name: userName,
            actionUrl: confirmationUrl,
          });
          logger.info("Confirmation email sent successfully", {
            userId: data.user.id,
          });
        } catch (confirmationError) {
          logger.error("Failed to send confirmation email:", confirmationError);
          // Continue even if confirmation email fails
        }

        // Send welcome email
        try {
          await sendWelcomeEmail({
            email: normalizedEmail,
            name: userName,
          });
          logger.info("Welcome email sent successfully", {
            userId: data.user.id,
          });
        } catch (welcomeError) {
          logger.error("Failed to send welcome email:", welcomeError);
          // Continue even if welcome email fails
        }
      } catch (emailError) {
        logger.error("Failed to send emails:", emailError);
        // Don't fail the signup if email fails - user can request resend
      }

      return NextResponse.json({
        user: data.user,
        session: data.session,
      });
    }

    // Should not happen but check for it
    logger.error("No user data returned from Supabase auth signup");
    return NextResponse.json(
      { error: "Failed to create user account" },
      { status: 500 }
    );
  } catch (error) {
    logger.error("Error during signup:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
