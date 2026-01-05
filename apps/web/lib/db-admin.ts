import "server-only";

import { createClient } from "@supabase/supabase-js";

import { logger } from "./logger";
import { Database } from "./supabase";

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
  },
);

// Test the connection only in development mode and skip if env vars are missing
async function testConnection() {
  // Skip connection test in production or if env vars are missing
  if (
    process.env.NODE_ENV === "production" ||
    !supabaseUrl ||
    !supabaseServiceKey
  ) {
    return;
  }

  try {
    const { error } = await supabaseAdmin
      .from("users")
      .select("count")
      .limit(1);

    if (error) {
      // Only log as warning in development, not as error
      logger.warn("Supabase admin client connection test warning", {
        code: error.code,
        message: error.message,
      });
    } else {
      logger.debug("Supabase admin client connected successfully");
    }
  } catch (error) {
    // Only log as warning in development
    logger.warn("Supabase connection test failed", error);
  }
}

// Run the test but don't block initialization - only in development
if (process.env.NODE_ENV === "development") {
  testConnection().catch(() => {
    // Silently fail - connection test is not critical
  });
}

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
