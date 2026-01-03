import { supabaseAdmin } from "@/lib/db";
import type { Document } from "@/actions/documents-actions";

export interface PDFOptions {
  format?: "A4" | "Letter";
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  displayHeaderFooter?: boolean;
  printBackground?: boolean;
}

const DEFAULT_OPTIONS: PDFOptions = {
  format: "A4",
  margin: {
    top: "20mm",
    right: "15mm",
    bottom: "20mm",
    left: "15mm",
  },
  displayHeaderFooter: false,
  printBackground: true,
};

/**
 * Generates a PDF using @react-pdf/renderer (no external services needed!)
 * 
 * This is a pure JavaScript solution that works without API keys or external services.
 * It uses React components to generate PDFs server-side.
 */
export async function generatePDFFromHTML(
  html: string,
  options: PDFOptions = {},
): Promise<Buffer> {
  // This function is kept for compatibility but we use generatePDFFromDocument instead
  // HTML-based generation is not supported with @react-pdf/renderer
  // We need to use the React component approach
  throw new Error(
    "generatePDFFromHTML wird nicht mehr unterstützt.\n\n" +
    "Bitte verwenden Sie generatePDFFromDocument mit React-PDF-Komponenten."
  );
}


/**
 * Uploads PDF to Supabase Storage and returns public URL
 */
export async function uploadPDFToStorage(
  pdfBuffer: Buffer,
  documentId: string,
  userId: string,
): Promise<string> {
  try {
    const fileName = `documents/${userId}/${documentId}.pdf`;

    console.log("Uploading PDF to Supabase storage...", {
      fileName,
      bufferSize: pdfBuffer.length,
      bucket: "documents"
    });

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("documents")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
        cacheControl: "3600",
      });

    if (error) {
      console.error("Supabase storage upload error:", {
        error,
        errorMessage: error.message,
        errorName: error.name,
        fileName
      });
      throw new Error(`Failed to upload PDF to storage: ${error.message || JSON.stringify(error)}`);
    }

    console.log("PDF uploaded successfully to storage:", data);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("documents").getPublicUrl(fileName);

    console.log("Generated public URL:", publicUrl);

    return publicUrl;
  } catch (error) {
    console.error("Error in uploadPDFToStorage:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to upload PDF: ${String(error)}`);
  }
}

/**
 * Generates PDF for a document and uploads it to storage
 * Uses PDFKit - pure JavaScript, works perfectly on Vercel and locally!
 * No external services or API keys needed.
 */
export async function generateAndUploadPDF(
  document: Document,
  htmlContent: string, // Kept for compatibility but not used
  options?: PDFOptions,
): Promise<string> {
  try {
    console.log("Starting PDF generation for document:", document.id);
    
    // Import pdf-lib generator
    const { generatePDFFromDocument } = await import("./pdf-lib-generator");
    const { convertCompanyProfileToInfo, DEFAULT_COMPANY_INFO } = await import("./templates");
    
    // Get company info from the document (we need it for the PDF)
    // Try to load company profile
    let companyInfo;
    try {
      const { getDefaultCompanyProfile } = await import("@/actions/company-profiles-actions");
      const defaultProfile = await getDefaultCompanyProfile();
      companyInfo = convertCompanyProfileToInfo(defaultProfile);
      console.log("Loaded company profile:", companyInfo?.name || "none");
    } catch (error) {
      console.warn("Could not load company profile, using defaults:", error);
    }
    
    // Use default company info if none found
    if (!companyInfo) {
      companyInfo = DEFAULT_COMPANY_INFO;
      console.log("Using default company info");
    }

    console.log("Generating PDF buffer with pdf-lib...");
    // Generate PDF buffer using pdf-lib
    const pdfBuffer = await generatePDFFromDocument(document, companyInfo);
    
    // Validate PDF buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error("PDF buffer is empty");
    }
    
    // Check if it's a valid PDF (starts with %PDF)
    const pdfHeader = pdfBuffer.toString("ascii", 0, Math.min(4, pdfBuffer.length));
    if (pdfHeader !== "%PDF") {
      throw new Error(`Invalid PDF generated. Header: ${pdfHeader}, Buffer length: ${pdfBuffer.length}`);
    }
    
    console.log("PDF generated successfully, size:", pdfBuffer.length, "bytes");

    // Upload to storage
    console.log("Uploading PDF to storage...");
    const pdfUrl = await uploadPDFToStorage(
      pdfBuffer,
      document.id,
      document.user_id,
    );

    console.log("PDF uploaded successfully, URL:", pdfUrl);
    return pdfUrl;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    // Only log as warning if it's a known/expected error
    if (errorMessage.includes("Failed to load Puppeteer") || 
        errorMessage.includes("Puppeteer not available")) {
      console.warn("PDF generation skipped (Puppeteer not available)", {
        documentId: document.id
      });
    } else {
      console.error("Error generating and uploading PDF:", {
        message: errorMessage,
        stack: errorStack,
        documentId: document.id,
      });
    }
    throw new Error(`PDF-Generierung fehlgeschlagen: ${errorMessage}`);
  }
}

/**
 * Generates PDF for a document in the background and updates the database
 * This function doesn't throw errors - it logs them instead
 * Use this for automatic PDF generation when documents are created/updated
 */
export async function generatePDFInBackground(
  document: Document,
  htmlContent: string,
): Promise<void> {
  try {
    const pdfUrl = await generateAndUploadPDF(document, htmlContent);
    
    // Update document with PDF URL in database
    await supabaseAdmin
      .from("documents")
      .update({ pdf_url: pdfUrl })
      .eq("id", document.id)
      .eq("user_id", document.user_id);
    
    console.log(`PDF generated successfully for document ${document.id}`);
  } catch (error) {
    // Log error but don't throw - we don't want to break document creation/update
    // Extract error message
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error && typeof error === "object") {
      const err = error as any;
      errorMessage = err.message || err.error || String(error);
    }
    
    // Only log as warning for background PDF generation failures (non-critical)
    if (errorMessage.includes("Failed to load Puppeteer") || 
        errorMessage.includes("Puppeteer not available")) {
      console.debug(`Background PDF generation skipped (Puppeteer not available) for document ${document.id}`);
    } else {
      console.warn(`Background PDF generation failed for document ${document.id}:`, errorMessage);
    }
    // Don't throw - let the document creation/update succeed even if PDF generation fails
  }
}

/**
 * Formats currency for display
 */
export function formatCurrency(amount: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Formats date for display
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
}

