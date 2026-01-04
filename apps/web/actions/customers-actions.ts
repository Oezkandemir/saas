"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer, getSupabaseStatic } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/session";
import { enforcePlanLimit } from "@/lib/plan-limits";
import { logger } from "@/lib/logger";

export type Customer = {
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
};

export type CustomerInput = {
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
  company_profile_id?: string;
};

export async function getCustomers(companyProfileId?: string): Promise<Customer[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      logger.error("Error fetching customers: Unauthorized - no user found");
      return [];
    }

    const supabase = await getSupabaseServer();
    
    // Verify authentication before querying
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      logger.error("Error fetching customers: Authentication failed", {
        authError: authError?.message || "No auth user",
        userId: user.id,
      });
      return [];
    }

    // If company profile is provided, check if user owns it
    if (companyProfileId) {
      // Get the company profile to check ownership
      const { data: profile, error: profileError } = await supabase
        .from("company_profiles")
        .select("user_id")
        .eq("id", companyProfileId)
        .eq("user_id", user.id) // Must be owned by current user
        .single();

      if (profileError || !profile) {
        logger.error("Error fetching company profile or no permission", { profileError, companyProfileId });
        return [];
      }

      // Build query: filter by company_profile_id and user_id
      // Show customers with this profile_id OR customers without profile_id (for backward compatibility)
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id)
        .or(`company_profile_id.eq.${companyProfileId},company_profile_id.is.null`)
        .order("created_at", { ascending: false });
      
      if (error) {
        logger.error("Error fetching customers for profile", { error, companyProfileId });
        return [];
      }

      return (data || []) as Customer[];
    }

    // If no company profile provided, show all customers for the user
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      // Log detailed error information - ensure all fields are properly serialized
      const errorInfo: Record<string, any> = {
        userId: user.id,
        authUserId: authUser.id,
        errorType: 'SupabaseQueryError',
        timestamp: new Date().toISOString(),
      };
      
      // Always include error object properties, even if they're undefined
      errorInfo.message = error.message || '(no message)';
      errorInfo.code = error.code || '(no code)';
      errorInfo.details = error.details || null;
      errorInfo.hint = error.hint || null;
      
      // Check if error object has any enumerable properties
      const errorKeys = Object.keys(error);
      errorInfo.errorKeys = errorKeys.length > 0 ? errorKeys : ['(empty object)'];
      
      // Log the detailed error info
      logger.error("Error fetching customers", errorInfo);
      
      // Also log raw error for debugging
      try {
        console.error("Raw Supabase error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      } catch (e) {
        console.error("Raw Supabase error object (stringified):", String(error));
        console.error("Error object type:", typeof error);
        console.error("Error object constructor:", error?.constructor?.name);
      }
      
      // Return empty array instead of throwing to prevent UI breakage
      return [];
    }
    
    return data || [];
  } catch (error) {
    // Log detailed error information with proper serialization
    const errorDetails: Record<string, any> = {
      errorType: 'Exception',
      timestamp: new Date().toISOString(),
    };
    
    if (error instanceof Error) {
      errorDetails.message = error.message || '(no message)';
      errorDetails.name = error.name || '(no name)';
      if (error.stack) errorDetails.stack = error.stack;
      errorDetails.errorType = 'Error';
    } else if (error && typeof error === 'object') {
      // Try to extract properties from error object
      const errorKeys = Object.keys(error);
      errorDetails.errorKeys = errorKeys.length > 0 ? errorKeys : ['(empty object)'];
      errorDetails.error = String(error);
      errorDetails.errorType = typeof error;
      
      // Try to get common error properties
      if ('message' in error) errorDetails.message = String((error as any).message);
      if ('code' in error) errorDetails.code = String((error as any).code);
    } else {
      errorDetails.error = String(error);
      errorDetails.errorType = typeof error;
    }
    
    // Also log the raw error
    logger.error("Error in getCustomers", errorDetails);
    
    try {
      console.error("Raw caught error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } catch {
      console.error("Raw caught error (stringified):", String(error));
      console.error("Error type:", typeof error);
    }
    
    // Return empty array on any error to prevent UI breakage
    return [];
  }
}

export async function getCustomer(id: string): Promise<Customer | null> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    if (!id || id.trim().length === 0) {
      return null;
    }

    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      logger.error("Error fetching customer", error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    logger.error("Error in getCustomer", error);
    return null;
  }
}

/**
 * Generate a unique QR code for a customer
 * Uses a combination of timestamp and random string for uniqueness
 */
function generateUniqueQRCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CUST-${timestamp}-${random}`;
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    // Check plan limits before creating customer
    await enforcePlanLimit(user.id, "customers");

    // Validate required fields
    if (!input.name || input.name.trim().length === 0) {
      throw new Error("Name ist erforderlich");
    }

    // Validate email format if provided
    if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      throw new Error("Ungültige E-Mail-Adresse");
    }

    const supabase = await getSupabaseServer();
    
    // Generate unique QR code directly (no RPC call needed - faster and safer)
    let qrCode = generateUniqueQRCode();
    let attempts = 0;
    const maxAttempts = 5;

    // Ensure QR code is unique by checking database
    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("qr_code", qrCode)
        .limit(1)
        .single();

      if (!existing) {
        // QR code is unique, break the loop
        break;
      }

      // Generate new QR code if collision detected
      qrCode = generateUniqueQRCode();
      attempts++;
    }

    // Insert customer with generated QR code
    const { data, error } = await supabase
      .from("customers")
      .insert({
        user_id: user.id,
        company_profile_id: input.company_profile_id || null,
        name: input.name.trim(),
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        company: input.company?.trim() || null,
        address_line1: input.address_line1?.trim() || null,
        address_line2: input.address_line2?.trim() || null,
        city: input.city?.trim() || null,
        postal_code: input.postal_code?.trim() || null,
        country: input.country?.trim() || "DE",
        tax_id: input.tax_id?.trim() || null,
        notes: input.notes?.trim() || null,
        qr_code: qrCode,
      })
      .select()
      .single();

    if (error) {
      // Provide user-friendly error messages
      if (error.code === "23505") {
        throw new Error("Ein Kunde mit diesen Daten existiert bereits");
      }
      if (error.code === "23503") {
        throw new Error("Ungültige Benutzer-ID");
      }
      throw new Error(`Fehler beim Erstellen des Kunden: ${error.message}`);
    }

    if (!data) {
      throw new Error("Kunde konnte nicht erstellt werden");
    }

    // Create notification for customer creation
    try {
      const { createCustomerNotification } = await import("@/lib/notifications");
      await createCustomerNotification({
        userId: user.id,
        customerId: data.id,
        action: "created",
        customerName: data.name,
      });
    } catch (notificationError) {
      // Don't fail the operation if notification fails
      const { logger } = await import("@/lib/logger");
      logger.error("Failed to create customer notification", notificationError);
    }

    revalidatePath("/dashboard/customers");
    return data;
  } catch (error) {
    // Re-throw validation errors as-is
    if (error instanceof Error && (
      error.message.includes("erforderlich") ||
      error.message.includes("Ungültige") ||
      error.message.includes("Unauthorized")
    )) {
      throw error;
    }
    
    // Wrap other errors with user-friendly message
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut."
    );
  }
}

export async function updateCustomer(
  id: string,
  input: CustomerInput,
): Promise<Customer> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    if (!id || id.trim().length === 0) {
      throw new Error("Ungültige Kunden-ID");
    }

    // Validate required fields
    if (!input.name || input.name.trim().length === 0) {
      throw new Error("Name ist erforderlich");
    }

    // Validate email format if provided
    if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      throw new Error("Ungültige E-Mail-Adresse");
    }

    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from("customers")
      .update({
        name: input.name.trim(),
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        company: input.company?.trim() || null,
        address_line1: input.address_line1?.trim() || null,
        address_line2: input.address_line2?.trim() || null,
        city: input.city?.trim() || null,
        postal_code: input.postal_code?.trim() || null,
        country: input.country?.trim() || "DE",
        tax_id: input.tax_id?.trim() || null,
        notes: input.notes?.trim() || null,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Kunde nicht gefunden");
      }
      throw new Error(`Fehler beim Aktualisieren: ${error.message}`);
    }

    if (!data) {
      throw new Error("Kunde konnte nicht aktualisiert werden");
    }

    // Create notification for customer update
    try {
      const { createCustomerNotification } = await import("@/lib/notifications");
      await createCustomerNotification({
        userId: user.id,
        customerId: id,
        action: "updated",
        customerName: data.name,
      });
    } catch (notificationError) {
      // Don't fail the operation if notification fails
      const { logger } = await import("@/lib/logger");
      logger.error("Failed to create customer notification", notificationError);
    }

    revalidatePath("/dashboard/customers");
    revalidatePath(`/dashboard/customers/${id}`);
    return data;
  } catch (error) {
    // Re-throw validation errors as-is
    if (error instanceof Error && (
      error.message.includes("erforderlich") ||
      error.message.includes("Ungültige") ||
      error.message.includes("Unauthorized") ||
      error.message.includes("nicht gefunden")
    )) {
      throw error;
    }
    
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut."
    );
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    if (!id || id.trim().length === 0) {
      throw new Error("Ungültige Kunden-ID");
    }

    const supabase = await getSupabaseServer();
    
    // Get customer info before deleting for notification
    const { data: customer } = await supabase
      .from("customers")
      .select("name")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      if (error.code === "23503") {
        throw new Error("Kunde kann nicht gelöscht werden, da er noch verwendet wird");
      }
      throw new Error(`Fehler beim Löschen: ${error.message}`);
    }

    // Create notification for customer deletion
    // Note: customerId is set to null since the customer no longer exists
    if (customer) {
      try {
        const { createCustomerNotification } = await import("@/lib/notifications");
        await createCustomerNotification({
          userId: user.id,
          customerId: null, // Customer no longer exists after deletion
          action: "deleted",
          customerName: customer.name,
        });
      } catch (notificationError) {
        // Don't fail the operation if notification fails
        const { logger } = await import("@/lib/logger");
        logger.error("Failed to create customer notification", notificationError);
      }
    }

    revalidatePath("/dashboard/customers");
  } catch (error) {
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Ein Fehler ist beim Löschen aufgetreten. Bitte versuchen Sie es erneut."
    );
  }
}

/**
 * Track a customer QR code scan (public function, no auth required)
 */
export async function trackCustomerQRCodeScan(
  qrCode: string,
  customerId: string,
  metadata?: {
    user_agent?: string;
    referrer?: string;
    country?: string;
    ip_address?: string;
  },
): Promise<void> {
  try {
    // Use static client for public tracking (no authentication required)
    const supabase = getSupabaseStatic();
    
    // Insert scan event
    await supabase.from("customer_qr_events").insert({
      customer_id: customerId,
      qr_code: qrCode,
      user_agent: metadata?.user_agent || null,
      referrer: metadata?.referrer || null,
      country: metadata?.country || null,
      ip_address: metadata?.ip_address || null,
    });
  } catch (error) {
    // Silently fail tracking - don't break the user experience
    logger.error("Error tracking customer QR code scan", error);
  }
}

/**
 * Get customer by QR code (public function for QR code scanning)
 */
export async function getCustomerByQRCode(qrCode: string): Promise<Customer | null> {
  try {
    const supabase = getSupabaseStatic();
    
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("qr_code", qrCode)
      .single();

    if (error || !data) {
      return null;
    }
    
    return data;
  } catch (error) {
    logger.error("Error fetching customer by QR code", error);
    return null;
  }
}

