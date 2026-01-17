import "server-only";

import { createClient } from "@supabase/supabase-js";

import { logger } from "./logger";
import type { Database } from "./supabase";

// Check if environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error("Supabase environment variables are missing!", {
    url: supabaseUrl ? "Set" : "Missing",
    serviceKey: supabaseServiceKey ? "Set" : "Missing",
  });
}

// Create a Supabase client for server-side operations using the service role key
// This client bypasses RLS policies for database operations
const supabaseAdmin = createClient<Database>(
  supabaseUrl!,
  supabaseServiceKey!,
  {
    auth: {
      persistSession: false,
    },
  }
);

// Connection test removed to reduce log spam
// The client will fail gracefully if there are connection issues

// Export the admin client for server operations
export { supabaseAdmin };

// Server-only versions of user functions
export const getServerUserByEmail = async (email: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("name, emailVerified")
      .eq("email", email)
      .single();

    if (error) {
      logger.error("Error fetching user by email", error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error("Exception fetching user by email", error);
    return null;
  }
};

export const getServerUserById = async (id: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      logger.error("Error fetching user by id", error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error("Exception fetching user by id", error);
    return null;
  }
};
