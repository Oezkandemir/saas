import { supabase, createAdminClient } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export type ProfileType = "personal" | "team";

export interface CompanyProfile {
  id: string;
  user_id: string;
  profile_name: string;
  is_default: boolean;
  profile_type: ProfileType;
  company_name: string;
  company_address?: string | null;
  company_address_line2?: string | null;
  company_postal_code?: string | null;
  company_city?: string | null;
  company_country: string;
  company_tax_id?: string | null;
  company_vat_id?: string | null;
  company_registration_number?: string | null;
  company_email: string;
  company_phone?: string | null;
  company_mobile?: string | null;
  company_website?: string | null;
  contact_person_name?: string | null;
  contact_person_position?: string | null;
  bank_name?: string | null;
  bank_account_holder?: string | null;
  iban?: string | null;
  bic?: string | null;
  logo_url?: string | null;
  primary_color: string;
  secondary_color: string;
  default_tax_rate?: number | null;
  default_payment_days?: number | null;
  payment_on_receipt?: boolean | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface CompanyStats {
  total: number;
  personal: number;
  team: number;
  defaults: number;
  recent: number; // Last 30 days
  byCountry: Array<{ country: string; count: number }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get all company profiles with pagination (admin only)
 */
export async function getCompanyProfiles(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  userId?: string;
  profileType?: string;
  country?: string;
}): Promise<ApiResponse<PaginatedResponse<CompanyProfile>>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 50;
    const search = options?.search?.toLowerCase().trim();
    const userId = options?.userId;
    const profileType = options?.profileType;
    const country = options?.country;

    let query = supabase
      .from("company_profiles")
      .select(
        `
        *,
        users!company_profiles_user_id_fkey (
          id,
          email,
          name
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (profileType && profileType !== "all") {
      query = query.eq("profile_type", profileType);
    }

    if (country && country !== "all") {
      query = query.eq("company_country", country);
    }

    if (search) {
      query = query.or(
        `company_name.ilike.%${search}%,company_email.ilike.%${search}%,profile_name.ilike.%${search}%,company_city.ilike.%${search}%`
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) {
      if (error.code === "PGRST116") {
        return {
          data: {
            data: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
          },
          error: null,
        };
      }
      return { data: null, error };
    }

    const companies: CompanyProfile[] = (data || []).map((c: any) => ({
      ...c,
      user: c.users
        ? {
            id: c.users.id,
            email: c.users.email || "",
            name: c.users.name,
          }
        : undefined,
    }));

    return {
      data: {
        data: companies,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      error: null,
    };
  });
}

/**
 * Get all company profiles (legacy - for backward compatibility)
 */
export async function getAllCompanyProfiles(): Promise<
  ApiResponse<CompanyProfile[]>
> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("company_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error && error.code !== "PGRST116") {
      return { data: null, error };
    }

    return { data: (data || []) as CompanyProfile[], error: null };
  });
}

/**
 * Get company profile by ID
 */
export async function getCompanyProfile(
  id: string
): Promise<ApiResponse<CompanyProfile>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as CompanyProfile, error: null };
  });
}

/**
 * Get company profiles by user ID
 */
export async function getCompanyProfilesByUser(
  userId: string
): Promise<ApiResponse<CompanyProfile[]>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error && error.code !== "PGRST116") {
      return { data: null, error };
    }

    return { data: (data || []) as CompanyProfile[], error: null };
  });
}

/**
 * Update company profile
 */
export async function updateCompanyProfile(
  id: string,
  updates: Partial<CompanyProfile>
): Promise<ApiResponse<CompanyProfile>> {
  await ApiClient.ensureAdmin();

  // Use admin client with service role key to bypass RLS
  const adminClient = createAdminClient();

  return ApiClient.fetch(async () => {
    const { data, error } = await adminClient
      .from("company_profiles")
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

    return { data: data as CompanyProfile, error: null };
  });
}

/**
 * Set default company profile for user
 */
export async function setDefaultCompanyProfile(
  userId: string,
  profileId: string
): Promise<ApiResponse<void>> {
  await ApiClient.ensureAdmin();

  // Use admin client with service role key to bypass RLS
  const adminClient = createAdminClient();

  return ApiClient.fetch(async () => {
    // First, unset all defaults for this user
    await adminClient
      .from("company_profiles")
      .update({ is_default: false })
      .eq("user_id", userId);

    // Then set the new default
    const { error } = await adminClient
      .from("company_profiles")
      .update({ is_default: true })
      .eq("id", profileId)
      .eq("user_id", userId);

    if (error) {
      return { data: null, error };
    }

    return { data: undefined, error: null };
  });
}

/**
 * Get company profile statistics
 */
export async function getCompanyStats(): Promise<ApiResponse<CompanyStats>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data: companies, error } = await supabase
      .from("company_profiles")
      .select("profile_type, is_default, company_country, created_at");

    if (error) {
      if (error.code === "PGRST116") {
        return {
          data: {
            total: 0,
            personal: 0,
            team: 0,
            defaults: 0,
            recent: 0,
            byCountry: [],
          },
          error: null,
        };
      }
      return { data: null, error };
    }

    const companyList = companies || [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats: CompanyStats = {
      total: companyList.length,
      personal: companyList.filter((c) => c.profile_type === "personal").length,
      team: companyList.filter((c) => c.profile_type === "team").length,
      defaults: companyList.filter((c) => c.is_default).length,
      recent: companyList.filter(
        (c) => new Date(c.created_at) >= thirtyDaysAgo
      ).length,
      byCountry: [],
    };

    // Group by country
    const countryMap = new Map<string, number>();
    companyList.forEach((c) => {
      const country = c.company_country || "Unknown";
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });

    stats.byCountry = Array.from(countryMap.entries()).map(([country, count]) => ({
      country,
      count,
    }));

    return { data: stats, error: null };
  });
}
