import { cache } from "react";
import { type Session } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import { getSupabaseServer } from "@/lib/supabase-server";

import "server-only";

import { syncUserWithDatabase } from "./auth-sync";

// Internal function that performs the actual user fetch
async function _getCurrentUserInternal() {
  try {
    const supabase = await getSupabaseServer();

    // Verwende getUser statt getSession für sicherere Authentifizierung
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    // Ensure the user exists in the database table
    await syncUserWithDatabase(user);

    // IMPORTANT: Get role from database, not metadata
    // This ensures admin checks use the database role, not metadata
    const { data: dbUserRole, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    // If database query fails, log error but don't fail the whole request
    if (roleError) {
      logger.error("Error fetching user role from database:", roleError);
    }

    // Auch Benutzerdaten aus der Datenbank abrufen für zusätzliche Felder wie avatar_url
    const { data: dbUser } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return {
      ...user,
      id: user.id,
      // Prioritize name from database, then fallback to metadata or email
      name:
        dbUser?.name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        null,
      // IMPORTANT: Use role from database, not metadata
      // This prevents showing admin features to non-admin users
      // If database query failed or role is null, default to USER for security
      role: (dbUserRole?.role as string) || "USER",
      email: user.email,
      // Zusätzliche Informationen aus der Datenbank
      avatar_url: dbUser?.avatar_url || user.user_metadata?.avatar_url || null,
      status: dbUser?.status || "active",
    };
  } catch (error) {
    logger.error("Error getting current user:", error);
    return null;
  }
}

// Cached version using React cache() for request-level deduplication
// This ensures that multiple calls to getCurrentUser within the same request
// will only execute the database query once
export const getCurrentUser = cache(_getCurrentUserInternal);

export async function getSession(): Promise<Session | null> {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // If session exists, ensure the user is synced
    if (session?.user) {
      await syncUserWithDatabase(session.user);
    }

    return session;
  } catch (error) {
    logger.error("Error getting session:", error);
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
    status: "active",
  };
}
