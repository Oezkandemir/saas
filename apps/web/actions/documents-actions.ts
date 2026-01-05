"use server";

import { revalidatePath } from "next/cache";
import { hasCompanyProfilePermission } from "@/actions/company-profile-team-actions";

import { logger } from "@/lib/logger";
import { enforcePlanLimit } from "@/lib/plan-limits";
import { getCurrentUser } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";

export type DocumentType = "quote" | "invoice";
export type DocumentStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "declined"
  | "paid"
  | "overdue";

export type DocumentItem = {
  id: string;
  document_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  position: number;
  created_at: string;
};

export type DocumentItemInput = {
  description: string;
  quantity: number;
  unit_price: number;
};

export type Document = {
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
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
  } | null;
  items?: DocumentItem[];
};

export type DocumentInput = {
  customer_id?: string;
  document_date: string;
  due_date?: string;
  tax_rate?: number;
  notes?: string;
  items: DocumentItemInput[];
  company_profile_id?: string;
};

export async function getDocuments(
  type?: DocumentType,
  customerId?: string,
  companyProfileId?: string,
): Promise<Document[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();

  // If company profile is provided, check if user is owner or member
  let query = supabase.from("documents").select(
    `
      *,
      customer:customers(id, name, email, address_line1, address_line2, city, postal_code, country),
      document_items(*)
    `,
  );

  if (companyProfileId) {
    // Get the company profile to check ownership
    const { data: profile, error: profileError } = await supabase
      .from("company_profiles")
      .select("user_id")
      .eq("id", companyProfileId)
      .eq("user_id", user.id) // Must be owned by current user
      .single();

    if (profileError || !profile) {
      throw new Error("Firmenprofil nicht gefunden oder keine Berechtigung");
    }

    // Filter by company_profile_id and user_id
    query = query
      .eq("user_id", user.id)
      .eq("company_profile_id", companyProfileId);
  } else {
    // If no company profile specified, show only user's own documents
    query = query.eq("user_id", user.id);
  }

  query = query.order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  if (customerId) {
    query = query.eq("customer_id", customerId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Items are already loaded via join, just need to sort them
  const documentsWithItems = (data || []).map((doc) => {
    const items = (doc.document_items || []).sort(
      (a: DocumentItem, b: DocumentItem) =>
        (a.position || 0) - (b.position || 0),
    );
    return { ...doc, items };
  });

  return documentsWithItems;
}

/**
 * Check if user has permission to access a document
 */
async function checkDocumentPermission(
  documentId: string,
  userId: string,
  permission: "view" | "edit_documents" | "delete_documents",
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  // Get document with company_profile_id
  const { data: document, error } = await supabase
    .from("documents")
    .select("user_id, company_profile_id")
    .eq("id", documentId)
    .single();

  if (error || !document) {
    return false;
  }

  // If user owns the document, they have full access
  if (document.user_id === userId) {
    return true;
  }

  // If document has a company_profile_id, check team permissions
  if (document.company_profile_id) {
    return await hasCompanyProfilePermission(
      document.company_profile_id,
      permission === "view" ? "view" : permission,
    );
  }

  // No company profile, only owner can access
  return false;
}

export async function getDocument(id: string): Promise<Document | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Check permission
  const hasAccess = await checkDocumentPermission(id, user.id, "view");
  if (!hasAccess) {
    throw new Error("Keine Berechtigung für dieses Dokument");
  }

  const supabase = await getSupabaseServer();

  // Get document - check if user is owner OR member of company profile
  const { data, error } = await supabase
    .from("documents")
    .select(
      `
      *,
      customer:customers(id, name, email, address_line1, address_line2, city, postal_code, country),
      document_items(*)
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  // Additional check: user must be owner
  if (data.user_id !== user.id) {
    throw new Error("Keine Berechtigung für dieses Dokument");
  }

  // Items are already loaded via join, just need to sort them
  const items = (data.document_items || []).sort(
    (a: DocumentItem, b: DocumentItem) => (a.position || 0) - (b.position || 0),
  );

  return { ...data, items };
}

export async function createDocument(
  type: DocumentType,
  input: DocumentInput,
): Promise<Document> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();

  // Validate company profile ownership if provided
  if (input.company_profile_id) {
    // Get the company profile to check ownership
    const { data: profile, error: profileError } = await supabase
      .from("company_profiles")
      .select("user_id")
      .eq("id", input.company_profile_id)
      .eq("user_id", user.id) // Must be owned by current user
      .single();

    if (profileError || !profile) {
      throw new Error("Firmenprofil nicht gefunden oder keine Berechtigung");
    }
  }

  // Check plan limits before creating document
  await enforcePlanLimit(user.id, "documents");

  // Validate items
  if (!input.items || input.items.length === 0) {
    throw new Error("At least one item is required");
  }

  // Get next document number
  const { data: docNumberData, error: docNumberError } = await supabase.rpc(
    "get_next_document_number",
    {
      p_user_id: user.id,
      p_type: type,
    },
  );

  if (docNumberError) throw docNumberError;

  const document_number =
    docNumberData || (type === "quote" ? "A1001" : "R1001");

  // Create document with current user's ID
  const { data: document, error: docError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id, // Always use current user's ID
      company_profile_id: input.company_profile_id || null,
      customer_id: input.customer_id || null,
      document_number,
      type,
      status: "draft",
      document_date: input.document_date,
      due_date: input.due_date || null,
      tax_rate: input.tax_rate || 19.0,
      notes: input.notes?.trim() || null,
    })
    .select()
    .single();

  if (docError) throw docError;

  // Create items
  const items = input.items.map((item, index) => ({
    document_id: document.id,
    description: item.description.trim(),
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.quantity * item.unit_price,
    position: index,
  }));

  const { error: itemsError } = await supabase
    .from("document_items")
    .insert(items);

  if (itemsError) throw itemsError;

  // Trigger totals update
  const { error: totalsError } = await supabase.rpc("update_document_totals", {
    p_document_id: document.id,
  });

  if (totalsError) throw totalsError;

  // Fetch complete document
  const completeDoc = await getDocument(document.id);
  if (!completeDoc) throw new Error("Failed to fetch created document");

  // Create notification for document creation (use document owner's ID)
  try {
    const { createDocumentNotification } = await import("@/lib/notifications");
    await createDocumentNotification({
      userId: user.id, // Notify the document owner (current user)
      documentId: document.id,
      action: "created",
      documentType: type === "quote" ? "Quote" : "Invoice",
      documentNumber: document_number,
    });
  } catch (notificationError) {
    // Don't fail the operation if notification fails
    const { logger } = await import("@/lib/logger");
    logger.error("Failed to create document notification", notificationError);
  }

  // Generate PDF in background (non-blocking)
  // Don't await - let it run in the background
  import("@/lib/pdf/generator-vercel")
    .then(({ generatePDFInBackground }) => {
      import("@/lib/pdf/templates")
        .then(({ generateInvoiceHTMLAsync }) => {
          generateInvoiceHTMLAsync(completeDoc)
            .then((htmlContent) => {
              generatePDFInBackground(completeDoc, htmlContent).catch(
                async (err) => {
                  const { logger } = await import("@/lib/logger");
                  logger.error("Background PDF generation failed:", err);
                },
              );
            })
            .catch(async (err) => {
              const { logger } = await import("@/lib/logger");
              logger.error("Failed to generate HTML for PDF:", err);
            });
        })
        .catch(async (err) => {
          const { logger } = await import("@/lib/logger");
          logger.error("Failed to load PDF templates:", err);
        });
    })
    .catch(async (err) => {
      const { logger } = await import("@/lib/logger");
      logger.error("Failed to load PDF generator:", err);
    });

  revalidatePath("/dashboard/documents");
  return completeDoc;
}

export async function updateDocument(
  id: string,
  input: Partial<DocumentInput> & {
    status?: DocumentStatus;
    company_profile_id?: string;
  },
): Promise<Document> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Check permission
  const hasAccess = await checkDocumentPermission(
    id,
    user.id,
    "edit_documents",
  );
  if (!hasAccess) {
    throw new Error("Keine Berechtigung zum Bearbeiten dieses Dokuments");
  }

  const supabase = await getSupabaseServer();

  // Update document fields
  const updateData: any = {};
  if (input.customer_id !== undefined)
    updateData.customer_id = input.customer_id;
  if (input.company_profile_id !== undefined)
    updateData.company_profile_id = input.company_profile_id;
  if (input.document_date) updateData.document_date = input.document_date;
  if (input.due_date !== undefined) updateData.due_date = input.due_date;
  if (input.tax_rate !== undefined) updateData.tax_rate = input.tax_rate;
  if (input.notes !== undefined) updateData.notes = input.notes?.trim() || null;
  if (input.status) updateData.status = input.status;

  if (Object.keys(updateData).length > 0) {
    // Get document to check ownership or team membership
    const { data: doc } = await supabase
      .from("documents")
      .select("user_id, company_profile_id")
      .eq("id", id)
      .single();

    if (!doc) {
      throw new Error("Dokument nicht gefunden");
    }

    // Build query - owner can always update, team members need permission
    let updateQuery = supabase
      .from("documents")
      .update(updateData)
      .eq("id", id);

    if (doc.user_id === user.id) {
      // Owner
      updateQuery = updateQuery.eq("user_id", user.id);
    } else if (doc.company_profile_id) {
      // Team member - permission already checked above
      // Just update without user_id filter
    } else {
      throw new Error("Keine Berechtigung zum Bearbeiten dieses Dokuments");
    }

    const { error: updateError } = await updateQuery;

    if (updateError) throw updateError;
  }

  // Update items if provided
  if (input.items) {
    // Delete existing items
    await supabase.from("document_items").delete().eq("document_id", id);

    // Insert new items
    const items = input.items.map((item, index) => ({
      document_id: id,
      description: item.description.trim(),
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
      position: index,
    }));

    const { error: itemsError } = await supabase
      .from("document_items")
      .insert(items);

    if (itemsError) throw itemsError;

    // Trigger totals update
    await supabase.rpc("update_document_totals", { p_document_id: id });
  }

  const updatedDoc = await getDocument(id);
  if (!updatedDoc) throw new Error("Failed to fetch updated document");

  // Create notification for document update
  try {
    const { createDocumentNotification } = await import("@/lib/notifications");
    await createDocumentNotification({
      userId: user.id,
      documentId: id,
      action: "updated",
      documentType: updatedDoc.type === "quote" ? "Quote" : "Invoice",
      documentNumber: updatedDoc.document_number,
    });
  } catch (notificationError) {
    // Don't fail the operation if notification fails
    const { logger } = await import("@/lib/logger");
    logger.error("Failed to create document notification", notificationError);
  }

  // Regenerate PDF in background when document is updated (non-blocking)
  // Don't await - let it run in the background
  import("@/lib/pdf/generator")
    .then(({ generatePDFInBackground }) => {
      import("@/lib/pdf/templates")
        .then(({ generateInvoiceHTMLAsync }) => {
          generateInvoiceHTMLAsync(updatedDoc)
            .then((htmlContent) => {
              generatePDFInBackground(updatedDoc, htmlContent).catch((err) => {
                logger.error("Background PDF regeneration failed:", err);
              });
            })
            .catch((err) => {
              logger.error("Failed to generate HTML for PDF:", err);
            });
        })
        .catch((err) => {
          logger.error("Failed to load PDF templates:", err);
        });
    })
    .catch((err) => {
      logger.error("Failed to load PDF generator:", err);
    });

  revalidatePath("/dashboard/documents");
  return updatedDoc;
}

export async function convertQuoteToInvoice(
  quoteId: string,
): Promise<Document> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const quote = await getDocument(quoteId);
  if (!quote || quote.type !== "quote") {
    throw new Error("Document not found or not a quote");
  }

  const supabase = await getSupabaseServer();

  // Get next invoice number
  const { data: invoiceNumber, error: docNumberError } = await supabase.rpc(
    "get_next_document_number",
    {
      p_user_id: user.id,
      p_type: "invoice",
    },
  );

  if (docNumberError) throw docNumberError;

  // Create invoice from quote
  const { data: invoice, error: invoiceError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      customer_id: quote.customer_id,
      document_number: invoiceNumber || "R1001",
      type: "invoice",
      status: "draft",
      document_date: quote.document_date,
      due_date: quote.due_date,
      tax_rate: quote.tax_rate,
      subtotal: quote.subtotal,
      tax_amount: quote.tax_amount,
      total: quote.total,
      notes: quote.notes,
    })
    .select()
    .single();

  if (invoiceError) throw invoiceError;

  // Copy items
  if (quote.items && quote.items.length > 0) {
    const items = quote.items.map((item, index) => ({
      document_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
      position: index,
    }));

    const { error: itemsError } = await supabase
      .from("document_items")
      .insert(items);

    if (itemsError) throw itemsError;
  }

  const completeInvoice = await getDocument(invoice.id);
  if (!completeInvoice) throw new Error("Failed to fetch created invoice");

  // Generate PDF in background (non-blocking)
  import("@/lib/pdf/generator")
    .then(({ generatePDFInBackground }) => {
      import("@/lib/pdf/templates")
        .then(({ generateInvoiceHTMLAsync }) => {
          generateInvoiceHTMLAsync(completeInvoice)
            .then((htmlContent) => {
              generatePDFInBackground(completeInvoice, htmlContent).catch(
                (err) => {
                  logger.error("Background PDF generation failed:", err);
                },
              );
            })
            .catch((err) => {
              logger.error("Failed to generate HTML for PDF:", err);
            });
        })
        .catch((err) => {
          logger.error("Failed to load PDF templates:", err);
        });
    })
    .catch((err) => {
      logger.error("Failed to load PDF generator:", err);
    });

  revalidatePath("/dashboard/documents");
  return completeInvoice;
}

export async function deleteDocument(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Check permission
  const hasAccess = await checkDocumentPermission(
    id,
    user.id,
    "delete_documents",
  );
  if (!hasAccess) {
    throw new Error("Keine Berechtigung zum Löschen dieses Dokuments");
  }

  const supabase = await getSupabaseServer();

  // Get document info before deleting for notification
  const { data: document } = await supabase
    .from("documents")
    .select("document_number, type, user_id, company_profile_id")
    .eq("id", id)
    .single();

  if (!document) {
    throw new Error("Dokument nicht gefunden");
  }

  // Build delete query - owner can always delete, team members need permission
  let deleteQuery = supabase.from("documents").delete().eq("id", id);

  if (document.user_id === user.id) {
    // Owner
    deleteQuery = deleteQuery.eq("user_id", user.id);
  } else if (document.company_profile_id) {
    // Team member - permission already checked above
    // Just delete without user_id filter
  } else {
    throw new Error("Keine Berechtigung zum Löschen dieses Dokuments");
  }

  const { error } = await deleteQuery;

  if (error) throw error;

  // Create notification for document deletion
  if (document) {
    try {
      const { createDocumentNotification } = await import(
        "@/lib/notifications"
      );
      await createDocumentNotification({
        userId: user.id,
        documentId: id,
        action: "deleted",
        documentType: document.type === "quote" ? "Quote" : "Invoice",
        documentNumber: document.document_number,
      });
    } catch (notificationError) {
      // Don't fail the operation if notification fails
      const { logger } = await import("@/lib/logger");
      logger.error("Failed to create document notification", notificationError);
    }
  }

  revalidatePath("/dashboard/documents");
}

export async function duplicateDocument(id: string): Promise<Document> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const originalDoc = await getDocument(id);
  if (!originalDoc) {
    throw new Error("Document not found");
  }

  const supabase = await getSupabaseServer();

  // Get next document number
  const { data: docNumberData, error: docNumberError } = await supabase.rpc(
    "get_next_document_number",
    {
      p_user_id: user.id,
      p_type: originalDoc.type,
    },
  );

  if (docNumberError) throw docNumberError;

  const document_number =
    docNumberData || (originalDoc.type === "quote" ? "A1001" : "R1001");

  // Create duplicate document
  const { data: document, error: docError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      customer_id: originalDoc.customer_id,
      document_number,
      type: originalDoc.type,
      status: "draft", // Always duplicate as draft
      document_date: originalDoc.document_date,
      due_date: originalDoc.due_date,
      tax_rate: originalDoc.tax_rate,
      notes: originalDoc.notes,
    })
    .select()
    .single();

  if (docError) throw docError;

  // Copy items
  if (originalDoc.items && originalDoc.items.length > 0) {
    const items = originalDoc.items.map((item, index) => ({
      document_id: document.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
      position: index,
    }));

    const { error: itemsError } = await supabase
      .from("document_items")
      .insert(items);

    if (itemsError) throw itemsError;
  }

  // Trigger totals update
  const { error: totalsError } = await supabase.rpc("update_document_totals", {
    p_document_id: document.id,
  });

  if (totalsError) throw totalsError;

  const completeDoc = await getDocument(document.id);
  if (!completeDoc) throw new Error("Failed to fetch duplicated document");

  // Generate PDF in background (non-blocking)
  import("@/lib/pdf/generator")
    .then(({ generatePDFInBackground }) => {
      import("@/lib/pdf/templates")
        .then(({ generateInvoiceHTMLAsync }) => {
          generateInvoiceHTMLAsync(completeDoc)
            .then((htmlContent) => {
              generatePDFInBackground(completeDoc, htmlContent).catch((err) => {
                logger.error("Background PDF generation failed:", err);
              });
            })
            .catch((err) => {
              logger.error("Failed to generate HTML for PDF:", err);
            });
        })
        .catch((err) => {
          logger.error("Failed to load PDF templates:", err);
        });
    })
    .catch((err) => {
      logger.error("Failed to load PDF generator:", err);
    });

  revalidatePath("/dashboard/documents");
  return completeDoc;
}
