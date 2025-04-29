import { getSupabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for reset password request
const resetSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().url().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, redirectTo } = resetSchema.parse(body);

    const supabase = await getSupabaseServer();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-confirm`,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Password reset email sent",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 