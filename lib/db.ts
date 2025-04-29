import "server-only"
import { createClient } from '@supabase/supabase-js'
import { Database } from './supabase'

// Create a Supabase client for server-side operations using the service role key
// This client bypasses RLS policies for database operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    }
  }
)

// Test the connection
try {
  supabaseAdmin.from('users').select('count').then(
    response => {
      if (response.error) {
        console.error('Supabase admin client error:', response.error);
      }
    }
  );
} catch (error) {
  console.error('Failed to connect to Supabase:', error);
}

// Export the admin client for server operations
export { supabaseAdmin }
