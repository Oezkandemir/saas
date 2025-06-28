import "server-only";

import { createClient } from "@supabase/supabase-js";

import { Database } from "./supabase";

// Check if environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Supabase environment variables are missing!", {
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

// Test the connection
async function testConnection() {
  try {
    const { data, error } = await supabaseAdmin.from("users").select("count");

    if (error) {
      console.error("Supabase admin client connection test failed:", error);
    } else {
      console.log("Supabase admin client connected successfully");
    }
  } catch (error) {
    console.error("Failed to connect to Supabase:", error);
  }
}

// Run the test but don't block initialization
testConnection().catch((err) => {
  console.error("Unexpected error testing Supabase connection:", err);
});

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
      console.error("Error fetching user by email:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Exception fetching user by email:", error);
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
      console.error("Error fetching user by id:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Exception fetching user by id:", error);
    return null;
  }
};
