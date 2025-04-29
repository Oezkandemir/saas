import { getSupabaseServer } from "@/lib/supabase-server";
import { type Session } from "@supabase/supabase-js";
import "server-only";

export async function getCurrentUser() {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }
    
    return {
      ...user,
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || null,
      role: user.user_metadata?.role || "USER", // Default to USER role if not set
      email: user.email
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  try {
    const supabase = await getSupabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}