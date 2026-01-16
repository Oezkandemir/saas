import { supabase } from "../lib/supabase";
import { ApiClient, ApiResponse } from "./client";

export type DocumentType = "quote" | "invoice";
export type DocumentStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "declined"
  | "paid"
  | "overdue";

export interface DocumentItem {
  id: string;
  document_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  position: number;
  created_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  customer_id: string | null;
  document_number: string;
  type: DocumentType;
  status: DocumentStatus;
  document_date: string;
  due_date: string | null;
  tax_rate: number;
  subtotal: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  items?: DocumentItem[];
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface DocumentStats {
  total: number;
  byType: Array<{ type: DocumentType; count: number }>;
  byStatus: Array<{ status: DocumentStatus; count: number }>;
  totalRevenue: number;
  paidRevenue: number;
  overdueRevenue: number;
  conversionRate: number; // Quotes to invoices
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get all documents with pagination (admin only)
 * Note: document_items are not loaded by default - use getDocumentById for full details
 */
export async function getAllDocuments(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: DocumentType | "all";
  status?: DocumentStatus | "all";
}): Promise<ApiResponse<PaginatedResponse<Document>>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 50;
    const search = options?.search?.toLowerCase().trim();
    const type = options?.type;
    const status = options?.status;

    // Build query with optimized select (exclude items for list view)
    let query = supabase
      .from("documents")
      .select(
        `
        id,
        user_id,
        customer_id,
        document_number,
        type,
        status,
        document_date,
        due_date,
        tax_rate,
        subtotal,
        tax_amount,
        total,
        notes,
        pdf_url,
        created_at,
        updated_at,
        customer:customers(id, name, email)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(
        `document_number.ilike.%${search}%,customer:customers.name.ilike.%${search}%`
      );
    }

    // Apply type filter
    if (type && type !== "all") {
      query = query.eq("type", type);
    }

    // Apply status filter
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let { data, error, count } = await query.range(from, to);

    // If error, try without joins
    if (error && error.message?.includes("does not exist")) {
      console.warn("Join failed, trying without joins:", error.message);
      let fallbackQuery = supabase
        .from("documents")
        .select(
          `
          id,
          user_id,
          customer_id,
          document_number,
          type,
          status,
          document_date,
          due_date,
          tax_rate,
          subtotal,
          tax_amount,
          total,
          notes,
          pdf_url,
          created_at,
          updated_at
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      if (search) {
        fallbackQuery = fallbackQuery.or(
          `document_number.ilike.%${search}%`
        );
      }

      if (type && type !== "all") {
        fallbackQuery = fallbackQuery.eq("type", type);
      }

      if (status && status !== "all") {
        fallbackQuery = fallbackQuery.eq("status", status);
      }

      const fallbackResult = await fallbackQuery.range(from, to);
      data = fallbackResult.data;
      error = fallbackResult.error;
      count = fallbackResult.count;

      // Fetch customers and users separately if needed
      if (data && !error) {
        const customerIds = [...new Set(data.map((d: any) => d.customer_id).filter(Boolean))];
        const userIds = [...new Set(data.map((d: any) => d.user_id).filter(Boolean))];

        // Fetch customers
        if (customerIds.length > 0) {
          const { data: customersData } = await supabase
            .from("customers")
            .select("id, name, email")
            .in("id", customerIds);

          const customersMap = new Map(
            (customersData || []).map((c: any) => [c.id, c])
          );

          data = data.map((doc: any) => ({
            ...doc,
            customer: customersMap.get(doc.customer_id) || null,
          }));
        }

        // Fetch users for email/name
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from("users")
            .select("id, email, name")
            .in("id", userIds);

          const usersMap = new Map(
            (usersData || []).map((u: any) => [u.id, u])
          );

          data = data.map((doc: any) => ({
            ...doc,
            user: usersMap.get(doc.user_id)
              ? {
                  id: doc.user_id,
                  email: usersMap.get(doc.user_id).email || "",
                  name: usersMap.get(doc.user_id).name || null,
                }
              : doc.user_id
              ? {
                  id: doc.user_id,
                  email: "",
                  name: null,
                }
              : undefined,
          }));
        }
      }
    }

    if (error) {
      return { data: null, error };
    }

    // Map documents with user info (items loaded separately when needed)
    const documents: Document[] = (data || []).map((doc: any) => {
      return {
        ...doc,
        customer: doc.customer || null,
        items: undefined, // Not loaded in list view
        user: doc.user || (doc.user_id
          ? {
              id: doc.user_id,
              email: "",
              name: null,
            }
          : undefined),
      };
    });

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      data: {
        data: documents,
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
 * Get document by ID
 */
export async function getDocumentById(
  id: string
): Promise<ApiResponse<Document>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("documents")
      .select(`
        *,
        customer:customers(id, name, email),
        document_items(*),
        user_profiles!documents_user_id_fkey (
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

    const profile = Array.isArray(data.user_profiles)
      ? data.user_profiles[0]
      : data.user_profiles;

    const items = (data.document_items || []).sort(
      (a: DocumentItem, b: DocumentItem) =>
        (a.position || 0) - (b.position || 0)
    );

    const document: Document = {
      ...data,
      customer: data.customer || null,
      items: items.length > 0 ? items : undefined,
      user: profile
        ? {
            id: data.user_id,
            email: profile.email || "",
            name: profile.name || null,
          }
        : undefined,
    };

    return { data: document, error: null };
  });
}

/**
 * Update document status
 */
export async function updateDocumentStatus(
  id: string,
  status: DocumentStatus
): Promise<ApiResponse<Document>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("documents")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Document, error: null };
  });
}

/**
 * Get document statistics
 */
export async function getDocumentStats(): Promise<ApiResponse<DocumentStats>> {
  await ApiClient.ensureAdmin();

  return ApiClient.fetch(async () => {
    // Get all documents
    const { data: allDocs, error: allError } = await supabase
      .from("documents")
      .select("type, status, total");

    if (allError) {
      return { data: null, error: allError };
    }

    const documents = allDocs || [];

    // Count by type
    const typeMap = new Map<DocumentType, number>();
    documents.forEach((doc: any) => {
      typeMap.set(doc.type, (typeMap.get(doc.type) || 0) + 1);
    });

    // Count by status
    const statusMap = new Map<DocumentStatus, number>();
    documents.forEach((doc: any) => {
      statusMap.set(doc.status, (statusMap.get(doc.status) || 0) + 1);
    });

    // Calculate revenue
    const totalRevenue = documents.reduce(
      (sum, doc: any) => sum + (parseFloat(doc.total) || 0),
      0
    );

    const paidRevenue = documents
      .filter((doc: any) => doc.status === "paid")
      .reduce((sum, doc: any) => sum + (parseFloat(doc.total) || 0), 0);

    const overdueRevenue = documents
      .filter((doc: any) => doc.status === "overdue")
      .reduce((sum, doc: any) => sum + (parseFloat(doc.total) || 0), 0);

    // Calculate conversion rate (quotes to invoices)
    const quotes = documents.filter((doc: any) => doc.type === "quote");
    const invoices = documents.filter((doc: any) => doc.type === "invoice");
    const conversionRate =
      quotes.length > 0 ? (invoices.length / quotes.length) * 100 : 0;

    const stats: DocumentStats = {
      total: documents.length,
      byType: Array.from(typeMap.entries()).map(([type, count]) => ({
        type,
        count,
      })),
      byStatus: Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        count,
      })),
      totalRevenue,
      paidRevenue,
      overdueRevenue,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };

    return { data: stats, error: null };
  });
}
