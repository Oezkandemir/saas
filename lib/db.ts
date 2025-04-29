import "server-only"
import { createClient } from '@supabase/supabase-js'
import { Database } from './supabase'

// Check if environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase environment variables are missing!', {
    url: supabaseUrl ? 'Set' : 'Missing',
    serviceKey: supabaseServiceKey ? 'Set' : 'Missing'
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
    }
  }
)

// Test the connection
async function testConnection() {
  try {
    const { data, error } = await supabaseAdmin.from('users').select('count');
    
    if (error) {
      console.error('Supabase admin client connection test failed:', error);
    } else {
      console.log('Supabase admin client connected successfully');
    }
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
  }
}

// Run the test but don't block initialization
testConnection().catch(err => {
  console.error('Unexpected error testing Supabase connection:', err);
});

// Export the admin client for server operations
export { supabaseAdmin }
