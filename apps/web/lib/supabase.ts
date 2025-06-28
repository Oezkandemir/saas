import { createClient } from "@supabase/supabase-js";

// Define your database types here based on Prisma schema
export type Database = {
  public: {
    tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          emailVerified: Date | null;
          image: string | null;
          created_at: Date;
          updated_at: Date;
          role: "ADMIN" | "USER";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          stripe_current_period_end: Date | null;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email?: string | null;
          emailVerified?: Date | null;
          image?: string | null;
          created_at?: Date;
          updated_at?: Date;
          role?: "ADMIN" | "USER";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          stripe_current_period_end?: Date | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          emailVerified?: Date | null;
          image?: string | null;
          created_at?: Date;
          updated_at?: Date;
          role?: "ADMIN" | "USER";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          stripe_current_period_end?: Date | null;
        };
      };
      accounts: {
        Row: {
          id: string;
          userId: string;
          type: string;
          provider: string;
          providerAccountId: string;
          refresh_token: string | null;
          access_token: string | null;
          expires_at: number | null;
          token_type: string | null;
          scope: string | null;
          id_token: string | null;
          session_state: string | null;
          created_at: Date;
          updated_at: Date;
        };
        Insert: {
          id?: string;
          userId: string;
          type: string;
          provider: string;
          providerAccountId: string;
          refresh_token?: string | null;
          access_token?: string | null;
          expires_at?: number | null;
          token_type?: string | null;
          scope?: string | null;
          id_token?: string | null;
          session_state?: string | null;
          created_at?: Date;
          updated_at?: Date;
        };
        Update: {
          id?: string;
          userId?: string;
          type?: string;
          provider?: string;
          providerAccountId?: string;
          refresh_token?: string | null;
          access_token?: string | null;
          expires_at?: number | null;
          token_type?: string | null;
          scope?: string | null;
          id_token?: string | null;
          session_state?: string | null;
          created_at?: Date;
          updated_at?: Date;
        };
      };
      sessions: {
        Row: {
          id: string;
          sessionToken: string;
          userId: string;
          expires: Date;
        };
        Insert: {
          id?: string;
          sessionToken: string;
          userId: string;
          expires: Date;
        };
        Update: {
          id?: string;
          sessionToken?: string;
          userId?: string;
          expires?: Date;
        };
      };
      verification_tokens: {
        Row: {
          identifier: string;
          token: string;
          expires: Date;
        };
        Insert: {
          identifier: string;
          token: string;
          expires: Date;
        };
        Update: {
          identifier?: string;
          token?: string;
          expires?: Date;
        };
      };
    };
  };
};

// For use on the client-side
export const createSupabaseBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  return createClient<Database>(supabaseUrl, supabaseKey);
};

// Singleton pattern to handle client-side supabase instance
let clientSupabase: ReturnType<typeof createSupabaseBrowserClient> | null =
  null;

export const getSupabaseClient = () => {
  if (!clientSupabase) {
    clientSupabase = createSupabaseBrowserClient();
  }
  return clientSupabase;
};
