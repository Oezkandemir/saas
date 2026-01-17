import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";

// Validation schema for email check
const emailCheckSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = emailCheckSchema.parse(body);

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists in auth.users
    const { data: existingUsers, error: checkError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (checkError) {
      logger.error("Error checking for existing users:", checkError);
      // Return false if check fails - allow signup to proceed
      return NextResponse.json({ exists: false });
    }

    const existingUser = existingUsers?.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (existingUser) {
      logger.info("User already exists in auth.users", {
        email: normalizedEmail,
        userId: existingUser.id,
        emailConfirmed: !!existingUser.email_confirmed_at,
      });

      return NextResponse.json({
        exists: true,
        emailConfirmed: !!existingUser.email_confirmed_at,
      });
    }

    // Also check in public.users table
    const { data: existingDbUser } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingDbUser) {
      logger.info("User already exists in database", {
        email: normalizedEmail,
        userId: existingDbUser.id,
      });

      return NextResponse.json({
        exists: true,
        emailConfirmed: false, // We don't know from this check
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    logger.error("Error checking email:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    // Return false on error to allow signup to proceed
    return NextResponse.json({ exists: false });
  }
}
