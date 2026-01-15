import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { logger } from "@/lib/logger";

import type { Database } from "./supabase";

// For use in route handlers (e.g. app/api/*)
export async function getSupabaseRouteHandlerClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        async get(name: string) {
          try {
            const cookieStore = await cookies();
            return cookieStore.get(name)?.value;
          } catch (error) {
            logger.error("Error reading cookie:", error);
            return undefined;
          }
        },
        async set(name: string, value: string, options: any) {
          try {
            const cookieStore = await cookies();
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            logger.error("Error setting cookie:", error);
          }
        },
        async remove(name: string, options: any) {
          try {
            const cookieStore = await cookies();
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            logger.error("Error removing cookie:", error);
          }
        },
      },
    }
  );
}
