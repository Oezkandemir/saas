import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { logger } from "@/lib/logger";

import { Database } from "../supabase";

export const createClient = async () => {
  try {
    const cookieStore = await cookies();

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      },
    );
  } catch (error) {
    logger.error("Error creating Supabase server client:", error);
    throw error;
  }
};
