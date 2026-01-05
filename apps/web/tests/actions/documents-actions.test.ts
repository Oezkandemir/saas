import {
  createDocument,
  deleteDocument,
  getDocument,
  getDocuments,
  type DocumentInput,
} from "@/actions/documents-actions";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";

// Mock dependencies
vi.mock("@/lib/session");
vi.mock("@/lib/supabase-server");

describe("Documents Actions", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    role: "USER" as const,
  };

  const mockDocument = {
    id: "doc-123",
    user_id: "user-123",
    customer_id: "customer-123",
    company_profile_id: null,
    document_number: "INV-001",
    type: "invoice" as const,
    status: "draft" as const,
    document_date: "2024-01-01",
    due_date: "2024-01-31",
    tax_rate: 19,
    subtotal: 1000,
    tax_amount: 190,
    total: 1190,
    notes: null,
    pdf_url: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    customer: {
      id: "customer-123",
      name: "Test Customer",
      email: "customer@example.com",
    },
    document_items: [
      {
        id: "item-1",
        document_id: "doc-123",
        description: "Test Item",
        quantity: 1,
        unit_price: 1000,
        total: 1000,
        position: 0,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
  });

  describe("getDocuments", () => {
    it("should throw error when user is not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      await expect(getDocuments()).rejects.toThrow("Unauthorized");
    });

    it("should return documents with items loaded via join", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockDocument],
          error: null,
        }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      const result = await getDocuments();

      expect(result).toHaveLength(1);
      expect(result[0].items).toBeDefined();
      expect(result[0].items).toHaveLength(1);
      // Verify items are sorted by position
      expect(result[0].items[0].position).toBe(0);
    });

    it("should filter by type when provided", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockDocument],
          error: null,
        }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      await getDocuments("invoice");

      // Verify type filter was applied
      expect(mockSupabase.eq).toHaveBeenCalledWith("type", "invoice");
    });

    it("should filter by customer when provided", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockDocument],
          error: null,
        }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      await getDocuments(undefined, "customer-123");

      expect(mockSupabase.eq).toHaveBeenCalledWith(
        "customer_id",
        "customer-123",
      );
    });
  });

  describe("getDocument", () => {
    it("should throw error when user is not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      await expect(getDocument("doc-123")).rejects.toThrow("Unauthorized");
    });

    it("should return document with items loaded via join", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockDocument,
          error: null,
        }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      const result = await getDocument("doc-123");

      expect(result).toBeDefined();
      expect(result?.items).toBeDefined();
      expect(result?.items).toHaveLength(1);
    });

    it("should return null when document not found", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      const result = await getDocument("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("createDocument", () => {
    const documentInput: DocumentInput = {
      customer_id: "customer-123",
      document_date: "2024-01-01",
      due_date: "2024-01-31",
      tax_rate: 19,
      notes: "Test notes",
      items: [
        {
          description: "Test Item",
          quantity: 1,
          unit_price: 1000,
        },
      ],
    };

    it("should throw error when user is not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        rpc: vi.fn().mockResolvedValue({ data: "INV-001", error: null }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      await expect(createDocument("invoice", documentInput)).rejects.toThrow(
        "Unauthorized",
      );
    });

    it("should create document successfully", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockDocument, ...documentInput },
          error: null,
        }),
        rpc: vi.fn().mockResolvedValue({ data: "INV-001", error: null }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      const result = await createDocument("invoice", documentInput);

      expect(result).toBeDefined();
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  describe("deleteDocument", () => {
    it("should throw error when user is not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      await expect(deleteDocument("doc-123")).rejects.toThrow("Unauthorized");
    });

    it("should delete document successfully", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      await deleteDocument("doc-123");

      expect(mockSupabase.delete).toHaveBeenCalled();
    });
  });
});

