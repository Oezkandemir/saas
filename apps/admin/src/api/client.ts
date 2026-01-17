import { supabase } from "../lib/supabase";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Base API client for admin operations
 */
export class ApiClient {
  /**
   * Get current user - must be admin
   */
  static async ensureAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "ADMIN") {
      throw new Error("Forbidden: Admin access required");
    }

    return user;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  static async fetch<T>(
    fn: () => Promise<{ data: T | null; error: any }>
  ): Promise<ApiResponse<T>> {
    try {
      const result = await fn();
      if (result.error) {
        const errorMessage = result.error.message || result.error.details || JSON.stringify(result.error) || "An error occurred";
        console.error("ApiClient.fetch error:", result.error);
        return {
          success: false,
          error: errorMessage,
        };
      }
      return {
        success: true,
        data: result.data as T,
      };
    } catch (error) {
      console.error("ApiClient.fetch exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      };
    }
  }
}
