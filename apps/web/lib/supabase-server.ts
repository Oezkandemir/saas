import { type ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import "server-only";

import { type Database } from "./supabase";

// Check if environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

// Log environment variable status for debugging
if (!supabaseUrl || !supabaseAnonKey || !supabaseJwtSecret) {
  console.error("Supabase server environment variables missing:", {
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
    console.error("Error creating Supabase server client:", error);
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
    console.error("Error getting Supabase server instance:", error);
    // Don't throw immediately - let the calling code handle it
    // This prevents the spawn EBADF error from crashing the entire request
    const cookieStore = await cookies();
    return createSupabaseServerClient(cookieStore);
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
    console.error("Error creating static Supabase client:", error);
    throw error;
  }
};
