import { getSession } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { cache } from "react";
import { NextRequest, NextResponse } from "next/server";
import { syncUserWithDatabase } from "@/lib/auth-sync";

export const auth = cache(async () => {
  try {
    // Get the session using the existing session utility
    const session = await getSession();
    
    if (!session) {
      return null;
    }
    
    // Ensure user exists in the database
    await syncUserWithDatabase(session.user);
    
    // Get user data from database to get the proper name
    const supabase = await getSupabaseServer();
    const { data: dbUser } = await supabase
      .from('users')
      .select('name')
      .eq('id', session.user.id)
      .single();
    
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        // Prioritize the database name
        name: dbUser?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
      }
    };
  } catch (error) {
    console.error("Error in auth function:", error);
    return null;
  }
});

// Add NextAuth compatible handlers
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  
  // Handle OAuth callback or session check
  try {
    const supabase = await getSupabaseServer();
    
    if (code) {
      // This is an OAuth callback
      await supabase.auth.exchangeCodeForSession(code);
    }
    
    // Return the session data
    const { data: { session } } = await supabase.auth.getSession();
    
    return NextResponse.json({ session }, { status: 200 });
  } catch (error) {
    console.error("Auth GET error:", error);
    return NextResponse.json({ error: "Authentication error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const action = requestUrl.searchParams.get("action");
    const body = await request.json();
    const supabase = await getSupabaseServer();
    
    switch (action) {
      case "signout":
        await supabase.auth.signOut();
        return NextResponse.json({ success: true }, { status: 200 });
        
      case "signin":
        const { data, error } = await supabase.auth.signInWithPassword({
          email: body.email,
          password: body.password,
        });
        
        if (error) throw error;
        return NextResponse.json(data, { status: 200 });
        
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Auth POST error:", error);
    return NextResponse.json(
      { error: "Authentication error" },
      { status: 500 }
    );
  }
}

// Re-export the getSession function for convenience
export { getSession }; 