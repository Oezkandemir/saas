import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface Plan {
  id: string;
  name: string; // Maps to title in DB
  description: string | null;
  price: number; // Maps to price_monthly or price_yearly based on interval
  currency: string;
  interval: "month" | "year";
  features: string[]; // Extracted from metadata.features
  limits: Record<string, number>; // Extracted from metadata.limits
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Additional fields from DB
  plan_key?: string;
  price_monthly?: number;
  price_yearly?: number;
  is_featured?: boolean;
  sort_order?: number;
}

export interface PlanInput {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  interval: "month" | "year";
  features?: string[];
  limits?: Record<string, number>;
  is_active?: boolean;
}

/**
 * Get all plans
 */
export async function getPlans(): Promise<ApiResponse<Plan[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("sort_order", { ascending: true });

    // Handle table doesn't exist error gracefully
    if (error) {
      if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
        console.warn("Plans table does not exist yet. Returning empty array.");
        return {
          data: [],
          error: null,
        };
      }
      console.error("Error fetching plans:", error);
      return { data: null, error };
    }

    console.log("Fetched plans:", {
      count: data?.length || 0,
      plans: data,
    });

    // Transform database structure to API structure
    return {
      data: (data || []).map((plan: any) => {
        const metadata = plan.metadata || {};
        const features = metadata.features || [];
        const limits = metadata.limits || {};
        
        // Default to monthly price/interval, but include both
        return {
          id: plan.id,
          name: plan.title || plan.name || "",
          description: plan.description || null,
          price: parseFloat(plan.price_monthly || "0") || 0,
          currency: plan.currency || "EUR",
          interval: "month" as const,
          features: Array.isArray(features) ? features : [],
          limits: typeof limits === "object" ? limits : {},
          is_active: plan.is_active ?? true,
          created_at: plan.created_at || new Date().toISOString(),
          updated_at: plan.updated_at || new Date().toISOString(),
          // Include additional fields
          plan_key: plan.plan_key,
          price_monthly: parseFloat(plan.price_monthly || "0") || 0,
          price_yearly: parseFloat(plan.price_yearly || "0") || 0,
          is_featured: plan.is_featured || false,
          sort_order: plan.sort_order || 0,
        } as Plan;
      }),
      error: null,
    };
  });
}

/**
 * Create a new plan
 */
export async function createPlan(
  input: PlanInput
): Promise<ApiResponse<Plan>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // Transform API input to database structure
    const metadata: any = {};
    if (input.features && input.features.length > 0) {
      metadata.features = input.features;
    }
    if (input.limits && Object.keys(input.limits).length > 0) {
      metadata.limits = input.limits;
    }

    const insertData: any = {
      title: input.name,
      description: input.description || null,
      currency: input.currency || "EUR",
      is_active: input.is_active ?? true,
      metadata: Object.keys(metadata).length > 0 ? metadata : {},
    };

    // Set price based on interval
    if (input.interval === "month") {
      insertData.price_monthly = input.price;
      insertData.price_yearly = input.price * 12; // Default yearly price
    } else {
      insertData.price_yearly = input.price;
      insertData.price_monthly = input.price / 12; // Default monthly price
    }

    const { data, error } = await supabase
      .from("plans")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating plan:", error);
      return { data: null, error };
    }

    // Transform back to API structure
    const metadata_result = data.metadata || {};
    return {
      data: {
        id: data.id,
        name: data.title || "",
        description: data.description || null,
        price: parseFloat(data.price_monthly || "0") || 0,
        currency: data.currency || "EUR",
        interval: "month" as const,
        features: Array.isArray(metadata_result.features) ? metadata_result.features : [],
        limits: typeof metadata_result.limits === "object" ? metadata_result.limits : {},
        is_active: data.is_active ?? true,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        plan_key: data.plan_key,
        price_monthly: parseFloat(data.price_monthly || "0") || 0,
        price_yearly: parseFloat(data.price_yearly || "0") || 0,
        is_featured: data.is_featured || false,
        sort_order: data.sort_order || 0,
      } as Plan,
      error: null,
    };
  });
}

/**
 * Update a plan
 */
export async function updatePlan(
  id: string,
  input: Partial<PlanInput>
): Promise<ApiResponse<Plan>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // First, get the current plan to merge metadata
    const { data: currentPlan, error: fetchError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    const updateData: any = {};
    if (input.name !== undefined) updateData.title = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    // Handle price updates based on interval
    if (input.price !== undefined && input.interval !== undefined) {
      if (input.interval === "month") {
        updateData.price_monthly = input.price;
      } else {
        updateData.price_yearly = input.price;
      }
    } else if (input.price !== undefined) {
      // If only price is provided, update monthly (default)
      updateData.price_monthly = input.price;
    }

    // Handle metadata (features and limits)
    const currentMetadata = currentPlan.metadata || {};
    if (input.features !== undefined || input.limits !== undefined) {
      updateData.metadata = {
        ...currentMetadata,
        ...(input.features !== undefined && { features: input.features }),
        ...(input.limits !== undefined && { limits: input.limits }),
      };
    }

    const { data, error } = await supabase
      .from("plans")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating plan:", error);
      return { data: null, error };
    }

    // Transform back to API structure
    const metadata_result = data.metadata || {};
    return {
      data: {
        id: data.id,
        name: data.title || "",
        description: data.description || null,
        price: parseFloat(data.price_monthly || "0") || 0,
        currency: data.currency || "EUR",
        interval: "month" as const,
        features: Array.isArray(metadata_result.features) ? metadata_result.features : [],
        limits: typeof metadata_result.limits === "object" ? metadata_result.limits : {},
        is_active: data.is_active ?? true,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        plan_key: data.plan_key,
        price_monthly: parseFloat(data.price_monthly || "0") || 0,
        price_yearly: parseFloat(data.price_yearly || "0") || 0,
        is_featured: data.is_featured || false,
        sort_order: data.sort_order || 0,
      } as Plan,
      error: null,
    };
  });
}

/**
 * Delete a plan
 */
export async function deletePlan(id: string): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase.from("plans").delete().eq("id", id);

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}
