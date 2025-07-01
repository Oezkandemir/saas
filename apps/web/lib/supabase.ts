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
          default_team_id: string | null;
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
          default_team_id?: string | null;
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
          default_team_id?: string | null;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          billing_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          billing_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          billing_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: "OWNER" | "ADMIN" | "MEMBER";
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: "OWNER" | "ADMIN" | "MEMBER";
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role?: "OWNER" | "ADMIN" | "MEMBER";
          created_at?: string;
        };
      };
      team_invitations: {
        Row: {
          id: string;
          team_id: string;
          email: string;
          role: "ADMIN" | "MEMBER";
          status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
          invited_by: string;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          email: string;
          role?: "ADMIN" | "MEMBER";
          status?: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
          invited_by: string;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          email?: string;
          role?: "ADMIN" | "MEMBER";
          status?: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
          invited_by?: string;
          created_at?: string;
          expires_at?: string;
        };
      };
      team_projects: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          description: string | null;
          status: "active" | "archived" | "deleted";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          name: string;
          description?: string | null;
          status?: "active" | "archived" | "deleted";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          name?: string;
          description?: string | null;
          status?: "active" | "archived" | "deleted";
          created_at?: string;
          updated_at?: string;
        };
      };
      team_activities: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          action: string;
          details: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          action: string;
          details?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          action?: string;
          details?: Record<string, any> | null;
          created_at?: string;
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
    Functions: {
      create_team: {
        Args: {
          name: string;
          description?: string;
          logo_url?: string;
          owner_id?: string;
        };
        Returns: string;
      };
      add_team_member: {
        Args: {
          team_id: string;
          user_id: string;
          member_role?: string;
          inviter_id?: string;
        };
        Returns: boolean;
      };
      generate_team_slug: {
        Args: {
          team_name: string;
        };
        Returns: string;
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
