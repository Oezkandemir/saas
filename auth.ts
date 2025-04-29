import { getSession } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { cache } from "react";

export const auth = cache(async () => {
  try {
    // Get the session using the existing session utility
    const session = await getSession();
    
    if (!session) {
      return null;
    }
    
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
      }
    };
  } catch (error) {
    console.error("Error in auth function:", error);
    return null;
  }
});

// Re-export the getSession function for convenience
export { getSession }; 