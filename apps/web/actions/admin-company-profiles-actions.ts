"use server";

import type { CompanyProfile } from "@/actions/company-profiles-actions";

import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";

export interface UserWithCompanyProfile {
  user_id: string;
  user_email: string;
  user_name: string | null;
  user_role: string;
  user_created_at: string;
  company_profile_id: string;
  company_name: string;
  profile_name: string;
  company_email: string;
  company_city: string | null;
  company_country: string;
  customer_count: number;
  invoice_count: number;
  quote_count: number;
  total_revenue: number;
}

export interface CompanyProfileDetails {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    created_at: string;
  };
  companyProfile: CompanyProfile;
  statistics: {
    customerCount: number;
    invoiceCount: number;
    quoteCount: number;
    totalRevenue: number;
    paidInvoices: number;
    unpaidInvoices: number;
    acceptedQuotes: number;
    declinedQuotes: number;
  };
  customers: Array<{
    id: string;
    name: string;
    email: string | null;
    company: string | null;
    created_at: string;
  }>;
  invoices: Array<{
    id: string;
    document_number: string;
    total: number;
    status: string;
    document_date: string;
    due_date: string | null;
  }>;
  quotes: Array<{
    id: string;
    document_number: string;
    total: number;
    status: string;
    document_date: string;
  }>;
}

/**
 * Get all users with company profiles
 */
export async function getUsersWithCompanyProfiles(): Promise<{
  success: boolean;
  data?: UserWithCompanyProfile[];
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    // Get users with company profiles and their statistics
    const { data, error } = await supabaseAdmin.rpc(
      "get_users_with_company_profiles_stats",
    );

    if (error) {
      // Fallback to manual query if RPC doesn't exist
      logger.warn("RPC function not found, using fallback query");

      const { data: profiles, error: profilesError } = await supabaseAdmin.from(
        "company_profiles",
      ).select(`
          id,
          user_id,
          company_name,
          profile_name,
          company_email,
          company_city,
          company_country,
          users:user_id (
            id,
            email,
            name,
            role,
            created_at
          )
        `);

      if (profilesError) {
        logger.error("Error fetching company profiles", profilesError);
        return { success: false, error: profilesError.message };
      }

      // Get statistics for each user
      const usersWithStats = await Promise.all(
        (profiles || []).map(async (profile: any) => {
          const userId = profile.user_id;

          // Get customer count
          const { count: customerCount } = await supabaseAdmin
            .from("customers")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId);

          // Get document counts
          const { count: invoiceCount } = await supabaseAdmin
            .from("documents")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("type", "invoice");

          const { count: quoteCount } = await supabaseAdmin
            .from("documents")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("type", "quote");

          // Get total revenue
          const { data: invoices } = await supabaseAdmin
            .from("documents")
            .select("total")
            .eq("user_id", userId)
            .eq("type", "invoice")
            .in("status", ["paid"]);

          const totalRevenue =
            invoices?.reduce((sum, inv) => sum + Number(inv.total || 0), 0) ||
            0;

          return {
            user_id: userId,
            user_email: profile.users?.email || "",
            user_name: profile.users?.name || null,
            user_role: profile.users?.role || "USER",
            user_created_at: profile.users?.created_at || "",
            company_profile_id: profile.id,
            company_name: profile.company_name,
            profile_name: profile.profile_name,
            company_email: profile.company_email,
            company_city: profile.company_city,
            company_country: profile.company_country,
            customer_count: customerCount || 0,
            invoice_count: invoiceCount || 0,
            quote_count: quoteCount || 0,
            total_revenue: totalRevenue,
          };
        }),
      );

      return { success: true, data: usersWithStats };
    }

    // Ensure total_revenue is always a number, not null
    const normalizedData = (data || []).map((item: any) => ({
      ...item,
      total_revenue: Number(item.total_revenue || 0),
      customer_count: Number(item.customer_count || 0),
      invoice_count: Number(item.invoice_count || 0),
      quote_count: Number(item.quote_count || 0),
    }));

    return { success: true, data: normalizedData };
  } catch (error) {
    logger.error("Error in getUsersWithCompanyProfiles", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get detailed company profile information for a specific user
 */
export async function getCompanyProfileDetails(userId: string): Promise<{
  success: boolean;
  data?: CompanyProfileDetails;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    // Get user info
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, name, role, created_at")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return { success: false, error: "User not found" };
    }

    // Get company profile (get default or first one)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("company_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (profileError || !profileData) {
      return { success: false, error: "Company profile not found" };
    }

    // Get statistics
    const { count: customerCount } = await supabaseAdmin
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: invoiceCount } = await supabaseAdmin
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "invoice");

    const { count: quoteCount } = await supabaseAdmin
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "quote");

    const { count: paidInvoices } = await supabaseAdmin
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "invoice")
      .eq("status", "paid");

    const { count: unpaidInvoices } = await supabaseAdmin
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "invoice")
      .in("status", ["draft", "sent", "overdue"]);

    const { count: acceptedQuotes } = await supabaseAdmin
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "quote")
      .eq("status", "accepted");

    const { count: declinedQuotes } = await supabaseAdmin
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "quote")
      .eq("status", "declined");

    // Get total revenue
    const { data: paidInvoicesData } = await supabaseAdmin
      .from("documents")
      .select("total")
      .eq("user_id", userId)
      .eq("type", "invoice")
      .in("status", ["paid"]);

    const totalRevenue =
      paidInvoicesData?.reduce((sum, inv) => sum + Number(inv.total || 0), 0) ||
      0;

    // Get customers list
    const { data: customersData } = await supabaseAdmin
      .from("customers")
      .select("id, name, email, company, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Get invoices list
    const { data: invoicesData } = await supabaseAdmin
      .from("documents")
      .select("id, document_number, total, status, document_date, due_date")
      .eq("user_id", userId)
      .eq("type", "invoice")
      .order("created_at", { ascending: false })
      .limit(20);

    // Get quotes list
    const { data: quotesData } = await supabaseAdmin
      .from("documents")
      .select("id, document_number, total, status, document_date")
      .eq("user_id", userId)
      .eq("type", "quote")
      .order("created_at", { ascending: false })
      .limit(20);

    return {
      success: true,
      data: {
        user: {
          id: userData.id,
          email: userData.email || "",
          name: userData.name,
          role: userData.role || "USER",
          created_at: userData.created_at || "",
        },
        companyProfile: profileData as CompanyProfile,
        statistics: {
          customerCount: customerCount || 0,
          invoiceCount: invoiceCount || 0,
          quoteCount: quoteCount || 0,
          totalRevenue,
          paidInvoices: paidInvoices || 0,
          unpaidInvoices: unpaidInvoices || 0,
          acceptedQuotes: acceptedQuotes || 0,
          declinedQuotes: declinedQuotes || 0,
        },
        customers: (customersData || []).map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          company: c.company,
          created_at: c.created_at || "",
        })),
        invoices: (invoicesData || []).map((inv) => ({
          id: inv.id,
          document_number: inv.document_number,
          total: Number(inv.total || 0),
          status: inv.status,
          document_date: inv.document_date,
          due_date: inv.due_date,
        })),
        quotes: (quotesData || []).map((q) => ({
          id: q.id,
          document_number: q.document_number,
          total: Number(q.total || 0),
          status: q.status,
          document_date: q.document_date,
        })),
      },
    };
  } catch (error) {
    logger.error("Error in getCompanyProfileDetails", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
