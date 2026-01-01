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
 * Generates a PDF using a headless browser service or @vercel/og
 * This is a placeholder - you need to implement your chosen solution:
 * 
 * Options:
 * 1. Use @vercel/og for simple PDFs (already installed)
 * 2. Use a third-party service like PDFShift, DocRaptor, or Browserless
 * 3. Use pdf-lib for client-side generation
 * 4. Use a separate microservice with Puppeteer
 */
export async function generatePDFFromHTML(
  html: string,
  options: PDFOptions = {},
): Promise<Buffer> {
  // Option 1: Use external service (recommended for production)
  if (process.env.PDF_SERVICE_URL) {
    try {
      const response = await fetch(process.env.PDF_SERVICE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.PDF_SERVICE_API_KEY && {
            "Authorization": `Bearer ${process.env.PDF_SERVICE_API_KEY}`
          })
        },
        body: JSON.stringify({
          html,
          options: { ...DEFAULT_OPTIONS, ...options }
        })
      });

      if (!response.ok) {
        throw new Error(`PDF service returned ${response.status}: ${await response.text()}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("Error calling PDF service:", error);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Option 2: Fallback - throw error with instructions
  throw new Error(
    "PDF generation is not configured. Please set up one of the following:\n" +
    "1. Set PDF_SERVICE_URL environment variable to use an external PDF service\n" +
    "2. Deploy a separate microservice with Puppeteer\n" +
    "3. Use a service like PDFShift (https://pdfshift.io), DocRaptor, or Browserless\n" +
    "4. Implement client-side PDF generation with pdf-lib\n\n" +
    "Puppeteer was removed from this app because it adds 10+ minutes to Vercel deployments."
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
 */
export async function generateAndUploadPDF(
  document: Document,
  htmlContent: string,
  options?: PDFOptions,
): Promise<string> {
  try {
    // Generate PDF buffer
    const pdfBuffer = await generatePDFFromHTML(htmlContent, options);

    // Upload to storage
    const pdfUrl = await uploadPDFToStorage(
      pdfBuffer,
      document.id,
      document.user_id,
    );

    return pdfUrl;
  } catch (error) {
    console.error("Error generating and uploading PDF:", error);
    throw error;
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
    console.error(`Failed to generate PDF in background for document ${document.id}:`, error);
    
    // Try to extract error message
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error && typeof error === "object") {
      const err = error as any;
      errorMessage = err.message || err.error || String(error);
    }
    
    console.error(`PDF generation error details: ${errorMessage}`);
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

