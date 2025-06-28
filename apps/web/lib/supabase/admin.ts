import { createClient } from "@supabase/supabase-js";

import { env } from "@/env.mjs";

// Create a Supabase client with the service role key for admin access
// This client should only be used on the server side
const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export { supabaseAdmin };
