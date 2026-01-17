import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export interface DocumentTemplate {
  id: string;
  user_id: string;
  name: string;
  type: string;
  is_default: boolean;
  company_name?: string | null;
  company_address?: string | null;
  company_city?: string | null;
  company_postal_code?: string | null;
  company_country?: string | null;
  company_tax_id?: string | null;
  company_email?: string | null;
  company_phone?: string | null;
  company_website?: string | null;
  company_iban?: string | null;
  company_bic?: string | null;
  company_bank_name?: string | null;
  logo_url?: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  show_logo: boolean;
  show_payment_info: boolean;
  show_footer: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get all document templates with pagination (admin only)
 */
export async function getAllDocumentTemplates(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  userId?: string;
  type?: string;
}): Promise<ApiResponse<PaginatedResponse<DocumentTemplate>>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 50;
    const search = options?.search?.toLowerCase().trim();
    const userId = options?.userId;
    const type = options?.type;

    let query = supabase
      .from("document_templates")
      .select(
        `
        *,
        users!document_templates_user_id_fkey (
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

    if (type) {
      query = query.eq("type", type);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%`);
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

    const templates: DocumentTemplate[] = (data || []).map((t: any) => ({
      ...t,
      user: t.users
        ? {
            id: t.users.id,
            email: t.users.email || "",
            name: t.users.name,
          }
        : undefined,
    }));

    return {
      data: {
        data: templates,
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
 * Delete a document template
 */
export async function deleteDocumentTemplate(
  id: string
): Promise<ApiResponse<boolean>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { error } = await supabase
      .from("document_templates")
      .delete()
      .eq("id", id);

    if (error) {
      return { data: null, error };
    }

    return { data: true, error: null };
  });
}
