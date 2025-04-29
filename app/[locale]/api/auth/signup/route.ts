import { getSupabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { z } from "zod";

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

    const supabase = await getSupabaseServer();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      console.error('Supabase signup error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (data?.user) {
      console.log('Supabase auth signup successful:', data.user?.id);
      
      return NextResponse.json({
        user: data.user,
        session: data.session,
      });
    }

    // Should not happen but check for it
    console.error('No user data returned from Supabase auth signup');
    return NextResponse.json(
      { error: 'Failed to create user account' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error during signup:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 