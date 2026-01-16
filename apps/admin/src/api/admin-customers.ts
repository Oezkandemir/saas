import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface Customer {
  id: string;
  user_id: string;
  company_profile_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  tax_id: string | null;
  notes: string | null;
  qr_code: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface CustomerStats {
  total: number;
  byCountry: Array<{ country: string; count: number }>;
  recent: number; // Last 30 days
  withEmail: number;
  withPhone: number;
}

export interface CustomerInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  tax_id?: string;
  notes?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get all customers with pagination (admin only)
 */
export async function getAllCustomers(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  country?: string;
}): Promise<ApiResponse<PaginatedResponse<Customer>>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 50;
    const search = options?.search?.toLowerCase().trim() || undefined;
    const country = options?.country;

    // Build query with optimized select (only necessary fields)
    // Use explicit foreign key syntax to avoid ambiguity
    let query = supabase
      .from("customers")
      .select(
        `
        id,
        user_id,
        company_profile_id,
        name,
        email,
        phone,
        company,
        city,
        country,
        created_at,
        updated_at,
        users!customers_user_id_fkey (
          id,
          email,
          name
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // Apply search filter (only if search string is not empty)
    if (search && search.length > 0) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,id.ilike.%${search}%`
      );
    }

    // Apply country filter
    if (country && country !== "all") {
      query = query.eq("country", country);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let { data, error, count } = await query.range(from, to);

    // If foreign key join fails, try without join and load profiles separately
    if (error && error.message?.includes("does not exist")) {
      console.warn("Foreign key join failed, trying without join:", error.message);
      
      // Retry without user_profiles join
      let fallbackQuery = supabase
        .from("customers")
        .select(
          `
          id,
          user_id,
          company_profile_id,
          name,
          email,
          phone,
          company,
          city,
          country,
          created_at,
          updated_at
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      if (search && search.length > 0) {
        fallbackQuery = fallbackQuery.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,id.ilike.%${search}%`
        );
      }

      if (country && country !== "all") {
        fallbackQuery = fallbackQuery.eq("country", country);
      }

      const fallbackResult = await fallbackQuery.range(from, to);
      
      if (fallbackResult.error) {
        console.error("Error fetching customers:", fallbackResult.error);
        return { data: null, error: fallbackResult.error };
      }

      data = fallbackResult.data;
      count = fallbackResult.count;
      error = null;

      // Load user info separately from users table (user_profiles doesn't have email/name)
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((c: any) => c.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from("users")
            .select("id, email, name")
            .in("id", userIds);

          // Map users to customers (format as user_profiles for compatibility)
          const userMap = new Map((users || []).map((u: any) => [u.id, u]));
          data = data.map((c: any) => ({
            ...c,
            user_profiles: userMap.get(c.user_id) || null,
          }));
        }
      }
    }

    if (error) {
      console.error("Error fetching customers:", error);
      return { data: null, error };
    }

    // Debug: Check if count doesn't match data length
    if (count && count > 0 && (!data || data.length === 0)) {
      console.warn("Warning: Count is", count, "but no data returned. Page:", page, "PageSize:", pageSize);
    }

    console.log("Fetched customers:", { 
      dataLength: data?.length || 0, 
      count, 
      page, 
      pageSize,
      from,
      to 
    });

    // Map customers with user info
    const customers: Customer[] = (data || []).map((c: any) => {
      // Handle user_profiles - could be array, object, or null
      let profile = null;
      if (c.user_profiles) {
        if (Array.isArray(c.user_profiles)) {
          profile = c.user_profiles.length > 0 ? c.user_profiles[0] : null;
        } else {
          profile = c.user_profiles;
        }
      }

      return {
        ...c,
        // Add missing fields with null defaults
        address_line1: c.address_line1 || null,
        address_line2: c.address_line2 || null,
        postal_code: c.postal_code || null,
        tax_id: c.tax_id || null,
        notes: c.notes || null,
        qr_code: c.qr_code || null,
        user: profile
          ? {
              id: c.user_id,
              email: profile.email || "",
              name: profile.name || null,
            }
          : undefined,
      };
    });

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      data: {
        data: customers,
        total,
        page,
        pageSize,
        totalPages,
      },
      error: null,
    };
  });
}

/**
 * Get customer by ID
 */
export async function getCustomerById(
  id: string
): Promise<ApiResponse<Customer>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("customers")
      .select(`
        *,
        users!customers_user_id_fkey (
          id,
          email,
          name
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      return { data: null, error };
    }

    // Handle users - could be array, object, or null
    let user = null;
    if (data.users) {
      if (Array.isArray(data.users)) {
        user = data.users.length > 0 ? data.users[0] : null;
      } else {
        user = data.users;
      }
    }

    // If user join failed, fetch separately
    if (!user && data.user_id) {
      const { data: userData } = await supabase
        .from("users")
        .select("id, email, name")
        .eq("id", data.user_id)
        .single();
      
      user = userData || null;
    }

    const customer: Customer = {
      ...data,
      user: user
        ? {
            id: data.user_id,
            email: user.email || "",
            name: user.name || null,
          }
        : undefined,
    };

    return { data: customer, error: null };
  });
}

/**
 * Update customer
 */
export async function updateCustomer(
  id: string,
  input: CustomerInput
): Promise<ApiResponse<Customer>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("customers")
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Customer, error: null };
  });
}

/**
 * Delete customer
 */
export async function deleteCustomer(id: string): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase.from("customers").delete().eq("id", id);

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}

/**
 * Get customer statistics
 */
export async function getCustomerStats(): Promise<ApiResponse<CustomerStats>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // Get total count
    const { count: total, error: totalError } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true });

    if (totalError) {
      return { data: null, error: totalError };
    }

    // Get recent count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: recent, error: recentError } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (recentError) {
      return { data: null, error: recentError };
    }

    // Get customers with email
    const { count: withEmail, error: emailError } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .not("email", "is", null);

    if (emailError) {
      return { data: null, error: emailError };
    }

    // Get customers with phone
    const { count: withPhone, error: phoneError } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .not("phone", "is", null);

    if (phoneError) {
      return { data: null, error: phoneError };
    }

    // Get by country
    const { data: countryData, error: countryError } = await supabase
      .from("customers")
      .select("country")
      .not("country", "is", null);

    if (countryError) {
      return { data: null, error: countryError };
    }

    // Count by country
    const countryMap = new Map<string, number>();
    (countryData || []).forEach((c: any) => {
      const country = c.country || "Unknown";
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });

    const byCountry = Array.from(countryMap.entries()).map(([country, count]) => ({
      country,
      count,
    }));

    const stats: CustomerStats = {
      total: total || 0,
      recent: recent || 0,
      withEmail: withEmail || 0,
      withPhone: withPhone || 0,
      byCountry: byCountry.sort((a, b) => b.count - a.count),
    };

    return { data: stats, error: null };
  });
}
