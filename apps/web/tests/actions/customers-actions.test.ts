import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type CustomerInput,
} from "@/actions/customers-actions";
import { getCurrentUser } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";
import { enforcePlanLimit } from "@/lib/plan-limits";

// Mock dependencies
vi.mock("@/lib/session");
vi.mock("@/lib/supabase-server");
vi.mock("@/lib/plan-limits");

describe("Customers Actions", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    role: "USER" as const,
  };

  const mockCustomer = {
    id: "customer-123",
    user_id: "user-123",
    company_profile_id: null,
    name: "Test Customer",
    email: "customer@example.com",
    phone: "+1234567890",
    company: null,
    address_line1: null,
    address_line2: null,
    city: null,
    postal_code: null,
    country: null,
    tax_id: null,
    notes: null,
    qr_code: "ABC123",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(enforcePlanLimit).mockResolvedValue(undefined);
  });

  describe("getCustomers", () => {
    it("should return empty array when user is not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      const result = await getCustomers();

      expect(result).toEqual([]);
    });

    it("should return customers for authenticated user", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockCustomer],
          error: null,
        }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      const result = await getCustomers();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject(mockCustomer);
    });

    it("should filter by company profile when provided", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockCustomer],
          error: null,
        }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      await getCustomers("company-profile-123");

      expect(mockSupabase.eq).toHaveBeenCalledWith("company_profile_id", "company-profile-123");
    });

    it("should return empty array on error", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error", code: "PGRST_ERROR" },
        }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      const result = await getCustomers();

      expect(result).toEqual([]);
    });
  });

  describe("getCustomer", () => {
    it("should throw error when user is not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      await expect(getCustomer("customer-123")).rejects.toThrow("Unauthorized");
    });

    it("should return customer when found", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCustomer,
          error: null,
        }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      const result = await getCustomer("customer-123");

      expect(result).toMatchObject(mockCustomer);
    });

    it("should return null when customer not found", async () => {
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

      const result = await getCustomer("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("createCustomer", () => {
    const customerInput: CustomerInput = {
      name: "New Customer",
      email: "new@example.com",
      phone: "+1234567890",
    };

    it("should throw error when user is not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      await expect(createCustomer(customerInput)).rejects.toThrow("Unauthorized");
    });

    it("should create customer successfully", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockCustomer, ...customerInput },
          error: null,
        }),
        rpc: vi.fn().mockResolvedValue({ data: "ABC123", error: null }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      const result = await createCustomer(customerInput);

      expect(result).toBeDefined();
      expect(result.name).toBe(customerInput.name);
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it("should enforce plan limits", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCustomer,
          error: null,
        }),
        rpc: vi.fn().mockResolvedValue({ data: "ABC123", error: null }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      await createCustomer(customerInput);

      expect(enforcePlanLimit).toHaveBeenCalledWith("customers", mockUser.id);
    });
  });

  describe("updateCustomer", () => {
    const updateInput: CustomerInput = {
      name: "Updated Customer",
      email: "updated@example.com",
    };

    it("should throw error when user is not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      await expect(updateCustomer("customer-123", updateInput)).rejects.toThrow("Unauthorized");
    });

    it("should update customer successfully", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockCustomer, ...updateInput },
          error: null,
        }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      const result = await updateCustomer("customer-123", updateInput);

      expect(result).toBeDefined();
      expect(result.name).toBe(updateInput.name);
      expect(mockSupabase.update).toHaveBeenCalled();
    });
  });

  describe("deleteCustomer", () => {
    it("should throw error when user is not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      await expect(deleteCustomer("customer-123")).rejects.toThrow("Unauthorized");
    });

    it("should delete customer successfully", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      await deleteCustomer("customer-123");

      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "customer-123");
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", mockUser.id);
    });
  });
});



