import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServer } from "@/lib/supabase-server";
import { createLoginSession, logFailedLogin } from "@/lib/session-tracking";

// Validation schema for signin
const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = signinSchema.parse(body);

    const supabase = await getSupabaseServer();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log failed login attempt
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();
      
      await logFailedLogin(userData?.id || null, error.message);
      
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Create login session and log to history
    if (data.session && data.user) {
      const expiresAt = new Date(data.session.expires_at! * 1000);
      await createLoginSession(
        data.user.id,
        expiresAt,
      );
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
