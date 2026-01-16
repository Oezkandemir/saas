import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface EventType {
  id: string;
  company_profile_id: string | null;
  owner_user_id: string;
  slug: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  location_type: "google_meet" | "zoom" | "custom_link" | "phone" | "in_person";
  location_value: string | null;
  minimum_notice_hours: number;
  booking_window_days: number;
  is_active: boolean;
  price_amount: number | null;
  price_currency: string | null;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    email: string;
    name: string | null;
  };
  company?: {
    id: string;
    name: string;
  };
}

/**
 * Get all event types (admin only)
 */
export async function getAllEventTypes(): Promise<ApiResponse<EventType[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // First, get all event types
    let { data: eventTypesData, error } = await supabase
      .from("event_types")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error };
    }

    if (!eventTypesData || eventTypesData.length === 0) {
      return { data: [], error: null };
    }

    // Get unique user IDs and company profile IDs
    const userIds = [...new Set(eventTypesData.map((et: any) => et.owner_user_id).filter(Boolean))];
    const companyIds = [...new Set(eventTypesData.map((et: any) => et.company_profile_id).filter(Boolean))];

    // Fetch users separately
    const userMap = new Map();
    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from("users")
        .select("id, email, name")
        .in("id", userIds);

      if (usersData) {
        usersData.forEach((user: any) => {
          userMap.set(user.id, user);
        });
      }
    }

    // Fetch company profiles separately
    const companyMap = new Map();
    if (companyIds.length > 0) {
      const { data: companiesData } = await supabase
        .from("company_profiles")
        .select("id, company_name")
        .in("id", companyIds);

      if (companiesData) {
        companiesData.forEach((company: any) => {
          companyMap.set(company.id, company);
        });
      }
    }

    // Map event types with user and company data
    const eventTypes: EventType[] = eventTypesData.map((et: any) => {
      const user = userMap.get(et.owner_user_id);
      const company = companyMap.get(et.company_profile_id);

      return {
        ...et,
        // Set default values for missing fields
        buffer_before_minutes: et.buffer_before_minutes ?? 0,
        buffer_after_minutes: et.buffer_after_minutes ?? 0,
        minimum_notice_hours: et.minimum_notice_hours ?? 2,
        booking_window_days: et.booking_window_days ?? 30,
        owner: user
          ? {
              id: et.owner_user_id,
              email: user.email || "",
              name: user.name || null,
            }
          : undefined,
        company: company
          ? {
              id: et.company_profile_id,
              name: company.company_name || "",
            }
          : undefined,
      };
    });

    return { data: eventTypes, error: null };
  });
}

/**
 * Get event type by ID
 */
export async function getEventType(
  id: string
): Promise<ApiResponse<EventType>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("event_types")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return { data: null, error };
    }

    // Fetch user separately
    let owner = undefined;
    if (data.owner_user_id) {
      const { data: userData } = await supabase
        .from("users")
        .select("id, email, name")
        .eq("id", data.owner_user_id)
        .single();

      if (userData) {
        owner = {
          id: data.owner_user_id,
          email: userData.email || "",
          name: userData.name || null,
        };
      }
    }

    // Fetch company separately
    let company = undefined;
    if (data.company_profile_id) {
      const { data: companyData } = await supabase
        .from("company_profiles")
        .select("id, company_name")
        .eq("id", data.company_profile_id)
        .single();

      if (companyData) {
        company = {
          id: data.company_profile_id,
          name: companyData.company_name || "",
        };
      }
    }

    const eventType: EventType = {
      ...data,
      buffer_before_minutes: data.buffer_before_minutes ?? 0,
      buffer_after_minutes: data.buffer_after_minutes ?? 0,
      minimum_notice_hours: data.minimum_notice_hours ?? 2,
      booking_window_days: data.booking_window_days ?? 30,
      owner,
      company,
    };

    return { data: eventType, error: null };
  });
}

/**
 * Update event type (admin only)
 */
export async function updateEventType(
  id: string,
  updates: Partial<EventType>
): Promise<ApiResponse<EventType>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("event_types")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as EventType, error: null };
  });
}

/**
 * Create event type (admin only)
 */
export async function createEventType(
  input: {
    title: string;
    slug: string;
    description?: string | null;
    duration_minutes: number;
    buffer_before_minutes?: number;
    buffer_after_minutes?: number;
    location_type: "google_meet" | "zoom" | "custom_link" | "phone" | "in_person";
    location_value?: string | null;
    minimum_notice_hours?: number;
    booking_window_days?: number;
    is_active?: boolean;
    price_amount?: number | null;
    price_currency?: string | null;
    owner_user_id: string;
    company_profile_id?: string | null;
  }
): Promise<ApiResponse<EventType>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // Build insert object - conditionally include booking_window_days
    // Note: If booking_window_days column doesn't exist in schema, it will be excluded
    const insertData: Record<string, any> = {
      title: input.title,
      slug: input.slug,
      description: input.description || null,
      duration_minutes: input.duration_minutes,
      buffer_before_minutes: input.buffer_before_minutes ?? 0,
      buffer_after_minutes: input.buffer_after_minutes ?? 0,
      location_type: input.location_type,
      location_value: input.location_value || null,
      minimum_notice_hours: input.minimum_notice_hours ?? 2,
      is_active: input.is_active ?? true,
      price_amount: input.price_amount ? Number(input.price_amount) : null,
      price_currency: input.price_currency || "EUR",
      owner_user_id: input.owner_user_id,
      company_profile_id: input.company_profile_id || null,
    };

    // Try to include booking_window_days - if schema doesn't support it, we'll retry without it
    const { data, error } = await supabase
      .from("event_types")
      .insert({
        ...insertData,
        booking_window_days: input.booking_window_days ?? 30,
      })
      .select()
      .single();

    // If error is about missing booking_window_days column, retry without it
    if (error && error.message?.includes("booking_window_days")) {
      console.warn("booking_window_days column not found in schema, retrying without it");
      const { data: retryData, error: retryError } = await supabase
        .from("event_types")
        .insert(insertData)
        .select()
        .single();

      if (retryError) {
        console.error("Error creating event type in database (retry):", retryError);
        console.error("Error details:", JSON.stringify(retryError, null, 2));
        return { 
          data: null, 
          error: retryError.message || retryError.details || JSON.stringify(retryError) || "Failed to create event type" 
        };
      }

      // Continue with retryData
      if (!retryData) {
        console.error("No data returned after creating event type (retry)");
        return { data: null, error: "No data returned after creation" };
      }

      // Fetch user and company data for retryData
      let owner = undefined;
      if (retryData.owner_user_id) {
        const { data: userData } = await supabase
          .from("users")
          .select("id, email, raw_user_meta_data")
          .eq("id", retryData.owner_user_id)
          .single();
        if (userData) {
          owner = {
            id: userData.id,
            email: userData.email || "",
            name: (userData.raw_user_meta_data as any)?.name || null,
          };
        }
      }

      let company = undefined;
      if (retryData.company_profile_id) {
        const { data: companyData } = await supabase
          .from("company_profiles")
          .select("id, name")
          .eq("id", retryData.company_profile_id)
          .single();
        if (companyData) {
          company = {
            id: companyData.id,
            name: companyData.name,
          };
        }
      }

      return {
        data: {
          ...retryData,
          booking_window_days: input.booking_window_days ?? 30, // Set default in response
          owner,
          company,
        },
        error: null,
      };
    }

    if (error) {
      console.error("Error creating event type in database:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      console.error("Input data:", JSON.stringify({
        title: input.title,
        slug: input.slug,
        description: input.description,
        duration_minutes: input.duration_minutes,
        buffer_before_minutes: input.buffer_before_minutes,
        buffer_after_minutes: input.buffer_after_minutes,
        location_type: input.location_type,
        location_value: input.location_value,
        minimum_notice_hours: input.minimum_notice_hours,
        booking_window_days: input.booking_window_days,
        is_active: input.is_active,
        price_amount: input.price_amount,
        price_currency: input.price_currency,
        owner_user_id: input.owner_user_id,
        company_profile_id: input.company_profile_id,
      }, null, 2));
      return { 
        data: null, 
        error: error.message || error.details || JSON.stringify(error) || "Failed to create event type" 
      };
    }

    if (!data) {
      console.error("No data returned after creating event type");
      return { data: null, error: "No data returned after creation" };
    }

    // Fetch user and company data
    let owner = undefined;
    if (data.owner_user_id) {
      const { data: userData } = await supabase
        .from("users")
        .select("id, email, name")
        .eq("id", data.owner_user_id)
        .single();

      if (userData) {
        owner = {
          id: data.owner_user_id,
          email: userData.email || "",
          name: userData.name || null,
        };
      }
    }

    let company = undefined;
    if (data.company_profile_id) {
      const { data: companyData } = await supabase
        .from("company_profiles")
        .select("id, company_name")
        .eq("id", data.company_profile_id)
        .single();

      if (companyData) {
        company = {
          id: data.company_profile_id,
          name: companyData.company_name || "",
        };
      }
    }

    const eventType: EventType = {
      ...data,
      buffer_before_minutes: data.buffer_before_minutes ?? 0,
      buffer_after_minutes: data.buffer_after_minutes ?? 0,
      minimum_notice_hours: data.minimum_notice_hours ?? 2,
      booking_window_days: data.booking_window_days ?? 30,
      owner,
      company,
    };

    return { data: eventType, error: null };
  });
}

/**
 * Delete event type (admin only)
 */
export async function deleteEventType(
  id: string
): Promise<ApiResponse<null>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase
      .from("event_types")
      .delete()
      .eq("id", id);

    if (error) {
      return { data: null, error };
    }

    return { data: null, error: null };
  });
}
