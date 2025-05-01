import { getSupabaseServer } from "@/lib/supabase-server";
import { type Session } from "@supabase/supabase-js";
import "server-only";
import { syncUserWithDatabase } from "./auth-sync";

export async function getCurrentUser() {
  try {
    const supabase = await getSupabaseServer();
    
    // Verwende getUser statt getSession für sicherere Authentifizierung
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }
    
    // Ensure the user exists in the database table
    await syncUserWithDatabase(user);
    
    // Auch Benutzerdaten aus der Datenbank abrufen für zusätzliche Felder wie avatar_url
    const { data: dbUser } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return {
      ...user,
      id: user.id,
      // Prioritize name from database, then fallback to metadata or email
      name: dbUser?.name || user.user_metadata?.name || user.email?.split('@')[0] || null,
      role: user.user_metadata?.role || "USER", // Default to USER role if not set
      email: user.email,
      // Zusätzliche Informationen aus der Datenbank
      avatar_url: dbUser?.avatar_url || user.user_metadata?.avatar_url || null,
      status: dbUser?.status || "active"
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
    
    // If session exists, ensure the user is synced
    if (session?.user) {
      await syncUserWithDatabase(session.user);
    }
    
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

// Safe version for static pages that doesn't use cookies
export async function getStaticPageUser() {
  return {
    id: null,
    name: null,
    role: "USER",
    email: null,
    avatar_url: null,
    status: "active"
  };
}