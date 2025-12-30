import "server-only";

import { createClient } from "@supabase/supabase-js";

import { Database } from "./supabase";
import { logger } from "./logger";

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
export const supabaseAdmin = createClient<Database>(
  supabaseUrl!,
  supabaseServiceKey!,
  {
    auth: {
      persistSession: false,
    },
  },
);

// Test the connection
async function testConnection() {
  try {
    const { data, error } = await supabaseAdmin.from("users").select("count");

    if (error) {
      logger.error("Supabase admin client connection test failed", error);
    } else {
      logger.info("Supabase admin client connected successfully");
    }
  } catch (error) {
    logger.error("Failed to connect to Supabase", error);
  }
}

// Run the test but don't block initialization
testConnection().catch((err) => {
  logger.error("Unexpected error testing Supabase connection", err);
});

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
