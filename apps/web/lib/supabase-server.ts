import { type ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import "server-only";

import { logger } from "@/lib/logger";

import { type Database } from "./supabase";

// Check if environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

// Log environment variable status for debugging
if (!supabaseUrl || !supabaseAnonKey || !supabaseJwtSecret) {
  logger.error("Supabase server environment variables missing:", {
    url: supabaseUrl ? "Set" : "Missing",
    anonKey: supabaseAnonKey ? "Set" : "Missing",
    jwtSecret: supabaseJwtSecret ? "Set" : "Missing",
  });
}

// For use on the server-side
export const createSupabaseServerClient = (
  cookieStore: ReadonlyRequestCookies,
) => {
  try {
    const supabaseClient = createServerClient<Database>(
      supabaseUrl as string,
      supabaseAnonKey as string,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      },
    );
    return supabaseClient;
  } catch (error) {
    logger.error("Error creating Supabase server client:", error);
    throw error;
  }
};

// Server-side supabase instance
export const getSupabaseServer = async () => {
  try {
    const cookieStore = await cookies();
    const client = createSupabaseServerClient(cookieStore);
    return client;
  } catch (error) {
    // If cookies() fails (e.g., outside request scope), fall back to static client
    // This happens during build time or in contexts without request scope
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("request scope") ||
      errorMessage.includes("cookies") ||
      errorMessage.includes("AsyncLocalStorage")
    ) {
      // Silently fall back to static client - this is expected in some contexts
      return getSupabaseStatic();
    }
    // For other errors, log and fall back to static client
    logger.warn("Error getting Supabase server instance, falling back to static client:", errorMessage);
    return getSupabaseStatic();
  }
};

// Static supabase client that doesn't use cookies (for static pages)
export const getSupabaseStatic = () => {
  try {
    // Create a serverless client with no cookie handling
    const supabaseClient = createServerClient<Database>(
      supabaseUrl as string,
      supabaseAnonKey as string,
      {
        cookies: {
          get: () => "",
          set: () => {},
          remove: () => {},
        },
      },
    );
    return supabaseClient;
  } catch (error) {
    logger.error("Error creating static Supabase client:", error);
    throw error;
  }
};
