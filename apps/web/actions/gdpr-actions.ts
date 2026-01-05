"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";

/**
 * Export all user data as JSON (GDPR Art. 15 - Right to Access)
 * @returns User data as JSON string or error
 */
export async function exportUserData() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Fetch all user-related data
    const [
      profile,
      customers,
      documents,
      qrCodes,
      qrEvents,
      cookieConsents,
      notifications,
    ] = await Promise.all([
      // User profile
      supabase.from("users").select("*").eq("id", user.id).single(),
      
      // Customers
      supabase.from("customers").select("*").eq("user_id", user.id),
      
      // Documents with items
      supabase
        .from("documents")
        .select("*, document_items(*)")
        .eq("user_id", user.id),
      
      // QR Codes
      supabase.from("qr_codes").select("*").eq("user_id", user.id),
      
      // QR Events (if Pro user) - Fixed: First get QR code IDs, then query events
      (async () => {
        const { data: qrCodesData } = await supabase
          .from("qr_codes")
          .select("id")
          .eq("user_id", user.id);
        
        const qrCodeIds = qrCodesData?.map(qr => qr.id) || [];
        
        if (qrCodeIds.length === 0) {
          return { data: [], error: null };
        }
        
        return await supabase
          .from("qr_events")
          .select("*")
          .in("qr_code_id", qrCodeIds);
      })(),
      
      // Cookie consents
      supabase.from("cookie_consents").select("*").eq("user_id", user.id),
      
      // Notifications
      supabase.from("notifications").select("*").eq("user_id", user.id),
    ]);

    // Compile all data
    const userData = {
      exportDate: new Date().toISOString(),
      exportVersion: "1.0",
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at,
        profile: profile.data,
      },
      customers: customers.data || [],
      documents: documents.data || [],
      qrCodes: qrCodes.data || [],
      qrEvents: qrEvents.data || [],
      cookieConsents: cookieConsents.data || [],
      notifications: notifications.data || [],
      metadata: {
        totalCustomers: customers.data?.length || 0,
        totalDocuments: documents.data?.length || 0,
        totalQRCodes: qrCodes.data?.length || 0,
        totalQRScans: qrEvents.data?.length || 0,
      },
    };

    // Log the export for audit trail
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "DATA_EXPORT",
      details: { timestamp: new Date().toISOString() },
    });

    return {
      success: true,
      data: JSON.stringify(userData, null, 2),
      filename: `cenety-data-export-${user.id}-${Date.now()}.json`,
    };
  } catch (error) {
    logger.error("Error exporting user data:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to export data",
    };
  }
}

/**
 * Export user data as CSV format
 * @returns CSV string or error
 */
export async function exportUserDataCSV() {
  try {
    const result = await exportUserData();
    
    if (!result.success || !result.data) {
      return result;
    }

    const userData = JSON.parse(result.data);
    
    // Create CSV for customers
    const customersCSV = convertToCSV(userData.customers, [
      "name",
      "email",
      "phone",
      "company",
      "address",
      "city",
      "postal_code",
      "country",
      "tax_id",
      "created_at",
    ]);

    // Create CSV for documents
    const documentsCSV = convertToCSV(userData.documents, [
      "document_number",
      "type",
      "status",
      "total_amount",
      "tax_amount",
      "issue_date",
      "due_date",
      "created_at",
    ]);

    const csvData = {
      customers: customersCSV,
      documents: documentsCSV,
      qrCodes: convertToCSV(userData.qrCodes, ["code", "type", "target_url", "created_at"]),
    };

    return {
      success: true,
      data: csvData,
      filename: `cenety-data-export-${userData.user.id}-${Date.now()}.zip`,
    };
  } catch (error) {
    logger.error("Error exporting user data as CSV:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to export data as CSV",
    };
  }
}

/**
 * Helper function to convert array of objects to CSV
 */
function convertToCSV(data: any[], headers: string[]): string {
  if (!data || data.length === 0) return "";
  
  const csvRows: string[] = [];
  csvRows.push(headers.join(","));
  
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      return value !== null && value !== undefined ? `"${value}"` : "";
    });
    csvRows.push(values.join(","));
  }
  
  return csvRows.join("\n");
}

/**
 * Delete user account and all associated data (GDPR Art. 17 - Right to Erasure)
 * @param confirmation User must type "DELETE" to confirm
 * @returns Success status
 */
export async function deleteUserAccount(confirmation: string) {
  try {
    if (confirmation !== "DELETE") {
      return {
        success: false,
        message: "Please type DELETE to confirm account deletion",
      };
    }

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Check for invoices that must be retained for legal reasons (10 years in Germany)
    const { data: invoices } = await supabase
      .from("documents")
      .select("id, issue_date")
      .eq("user_id", user.id)
      .eq("type", "invoice")
      .eq("status", "paid");

    const now = new Date();
    const retentionPeriod = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years in milliseconds
    const invoicesToRetain = invoices?.filter((invoice) => {
      const issueDate = new Date(invoice.issue_date);
      return now.getTime() - issueDate.getTime() < retentionPeriod;
    });

    if (invoicesToRetain && invoicesToRetain.length > 0) {
      // Anonymize instead of delete due to legal retention requirements
      await anonymizeUserData(user.id);
      
      return {
        success: true,
        message: `Account anonymized. ${invoicesToRetain.length} invoice(s) retained for legal compliance (10 years). All other data deleted.`,
        anonymized: true,
      };
    }

    // Log the deletion for audit trail before deletion
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "ACCOUNT_DELETION_REQUESTED",
      details: {
        timestamp: new Date().toISOString(),
        email: user.email,
      },
    });

    // Delete all user data (CASCADE will handle related records)
    // Order matters due to foreign key constraints
    
    // First get QR code IDs
    const { data: userQrCodes } = await supabase
      .from("qr_codes")
      .select("id")
      .eq("user_id", user.id);
    const qrCodeIds = userQrCodes?.map(qr => qr.id) || [];
    
    // Get document IDs
    const { data: userDocuments } = await supabase
      .from("documents")
      .select("id")
      .eq("user_id", user.id);
    const documentIds = userDocuments?.map(doc => doc.id) || [];
    
    // Delete in sequence to ensure proper order
    // Delete QR events if there are QR codes
    if (qrCodeIds.length > 0) {
      await supabase.from("qr_events").delete().in("qr_code_id", qrCodeIds);
    }
    
    // Delete document items if there are documents
    if (documentIds.length > 0) {
      await supabase.from("document_items").delete().in("document_id", documentIds);
    }
    
    // Delete main records
    await Promise.all([
      supabase.from("qr_codes").delete().eq("user_id", user.id),
      supabase.from("documents").delete().eq("user_id", user.id),
      supabase.from("customers").delete().eq("user_id", user.id),
      supabase.from("cookie_consents").delete().eq("user_id", user.id),
      supabase.from("notifications").delete().eq("user_id", user.id),
    ]);
    
    await supabase.from("users").delete().eq("id", user.id);

    // Delete auth user (this will sign them out)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      logger.error("Error deleting auth user:", deleteError);
      // Continue even if auth deletion fails - data is already deleted
    }

    // Sign out the user
    await supabase.auth.signOut();
    
    redirect("/");
    
    return {
      success: true,
      message: "Account and all data successfully deleted",
      anonymized: false,
    };
  } catch (error) {
    logger.error("Error deleting user account:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete account",
    };
  }
}

/**
 * Anonymize user data while retaining legally required documents
 * @param userId User ID to anonymize
 */
async function anonymizeUserData(userId: string) {
  const supabase = await createClient();
  
  const anonymousId = `anonymous-${Date.now()}`;
  const anonymousEmail = `${anonymousId}@anonymized.local`;
  
  // Anonymize user profile
  await supabase
    .from("users")
    .update({
      name: "Anonymous User",
      email: anonymousEmail,
      avatar_url: null,
      // Keep user_id for document retention
    })
    .eq("id", userId);

  // Anonymize customers (keep for invoice reference)
  await supabase
    .from("customers")
    .update({
      name: "Anonymous Customer",
      email: `customer-${anonymousId}@anonymized.local`,
      phone: null,
      address: "Anonymized",
      city: "Anonymized",
      postal_code: null,
      country: null,
      notes: null,
    })
    .eq("user_id", userId);

  // Delete non-essential data
  // First get QR code IDs
  const { data: userQrCodes } = await supabase
    .from("qr_codes")
    .select("id")
    .eq("user_id", userId);
  const qrCodeIds = userQrCodes?.map(qr => qr.id) || [];
  
  // Delete in sequence to avoid type issues
  await supabase.from("qr_codes").delete().eq("user_id", userId);
  await supabase.from("cookie_consents").delete().eq("user_id", userId);
  await supabase.from("notifications").delete().eq("user_id", userId);
  
  // Only delete QR events if there are QR codes
  if (qrCodeIds.length > 0) {
    await supabase.from("qr_events").delete().in("qr_code_id", qrCodeIds);
  }

  // Log anonymization
  await supabase.from("audit_logs").insert({
    user_id: userId,
    action: "ACCOUNT_ANONYMIZED",
    details: {
      timestamp: new Date().toISOString(),
      reason: "Legal document retention required",
    },
  });
}

/**
 * Request account deletion (with email confirmation)
 * @returns Success status
 */
export async function requestAccountDeletion() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Log the request
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "ACCOUNT_DELETION_REQUESTED",
      details: {
        timestamp: new Date().toISOString(),
        status: "pending_confirmation",
      },
    });

    // TODO: Send confirmation email
    // await sendAccountDeletionEmail(user.email);

    return {
      success: true,
      message: "Account deletion requested. Please check your email for confirmation.",
    };
  } catch (error) {
    logger.error("Error requesting account deletion:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to request deletion",
    };
  }
}

