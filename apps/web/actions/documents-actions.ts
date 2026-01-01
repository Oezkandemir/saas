"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/session";
import { enforcePlanLimit } from "@/lib/plan-limits";

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
};

export async function getDocuments(
  type?: DocumentType,
  customerId?: string,
): Promise<Document[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();
  let query = supabase
    .from("documents")
    .select(
      `
      *,
      customer:customers(id, name, email)
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  if (customerId) {
    query = query.eq("customer_id", customerId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Fetch items for each document
  const documentsWithItems = await Promise.all(
    (data || []).map(async (doc) => {
      const { data: items } = await supabase
        .from("document_items")
        .select("*")
        .eq("document_id", doc.id)
        .order("position", { ascending: true });

      return { ...doc, items: items || [] };
    }),
  );

  return documentsWithItems;
}

export async function getDocument(id: string): Promise<Document | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("documents")
    .select(
      `
      *,
      customer:customers(id, name, email)
    `,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  // Fetch items
  const { data: items } = await supabase
    .from("document_items")
    .select("*")
    .eq("document_id", id)
    .order("position", { ascending: true });

  return { ...data, items: items || [] };
}

export async function createDocument(
  type: DocumentType,
  input: DocumentInput,
): Promise<Document> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Check plan limits before creating document
  await enforcePlanLimit(user.id, "documents");

  // Validate items
  if (!input.items || input.items.length === 0) {
    throw new Error("At least one item is required");
  }

  const supabase = await getSupabaseServer();

  // Get next document number
  const { data: docNumberData, error: docNumberError } = await supabase.rpc(
    "get_next_document_number",
    {
      p_user_id: user.id,
      p_type: type,
    },
  );

  if (docNumberError) throw docNumberError;

  const document_number = docNumberData || (type === "quote" ? "A1001" : "R1001");

  // Create document
  const { data: document, error: docError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
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

  // Create notification for document creation
  try {
    const { createDocumentNotification } = await import("@/lib/notifications");
    await createDocumentNotification({
      userId: user.id,
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
              generatePDFInBackground(completeDoc, htmlContent).catch(async (err) => {
                const { logger } = await import("@/lib/logger");
                logger.error("Background PDF generation failed:", err);
              });
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
  input: Partial<DocumentInput> & { status?: DocumentStatus },
): Promise<Document> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();

  // Update document fields
  const updateData: any = {};
  if (input.customer_id !== undefined) updateData.customer_id = input.customer_id;
  if (input.document_date) updateData.document_date = input.document_date;
  if (input.due_date !== undefined) updateData.due_date = input.due_date;
  if (input.tax_rate !== undefined) updateData.tax_rate = input.tax_rate;
  if (input.notes !== undefined) updateData.notes = input.notes?.trim() || null;
  if (input.status) updateData.status = input.status;

  if (Object.keys(updateData).length > 0) {
    const { error: updateError } = await supabase
      .from("documents")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id);

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
                console.error("Background PDF regeneration failed:", err);
              });
            })
            .catch((err) => {
              console.error("Failed to generate HTML for PDF:", err);
            });
        })
        .catch((err) => {
          console.error("Failed to load PDF templates:", err);
        });
    })
    .catch((err) => {
      console.error("Failed to load PDF generator:", err);
    });

  revalidatePath("/dashboard/documents");
  return updatedDoc;
}

export async function convertQuoteToInvoice(quoteId: string): Promise<Document> {
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
              generatePDFInBackground(completeInvoice, htmlContent).catch((err) => {
                console.error("Background PDF generation failed:", err);
              });
            })
            .catch((err) => {
              console.error("Failed to generate HTML for PDF:", err);
            });
        })
        .catch((err) => {
          console.error("Failed to load PDF templates:", err);
        });
    })
    .catch((err) => {
      console.error("Failed to load PDF generator:", err);
    });

  revalidatePath("/dashboard/documents");
  return completeInvoice;
}

export async function deleteDocument(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await getSupabaseServer();
  
  // Get document info before deleting for notification
  const { data: document } = await supabase
    .from("documents")
    .select("document_number, type")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;

  // Create notification for document deletion
  if (document) {
    try {
      const { createDocumentNotification } = await import("@/lib/notifications");
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

  const document_number = docNumberData || (originalDoc.type === "quote" ? "A1001" : "R1001");

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
                console.error("Background PDF generation failed:", err);
              });
            })
            .catch((err) => {
              console.error("Failed to generate HTML for PDF:", err);
            });
        })
        .catch((err) => {
          console.error("Failed to load PDF templates:", err);
        });
    })
    .catch((err) => {
      console.error("Failed to load PDF generator:", err);
    });

  revalidatePath("/dashboard/documents");
  return completeDoc;
}

