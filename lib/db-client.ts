import { createClient } from "@supabase/supabase-js";

import { Database } from "./supabase";

// Create a client-safe Supabase client function
// This uses the anon key which is safe for client-side usage
export function getClientDbAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase environment variables are missing!");
    throw new Error("Supabase environment variables are required");
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}

// Helper functions that work in both client and server environments
export async function getUserByEmail(email: string) {
  try {
    const client = getClientDbAdmin();
    const { data, error } = await client
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
}

export async function getUserById(id: string) {
  try {
    const client = getClientDbAdmin();
    const { data, error } = await client
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
}
