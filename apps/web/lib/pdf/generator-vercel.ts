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
 * Generates a PDF using a headless browser service or simple HTML-to-PDF conversion
 * 
 * Options:
 * 1. Use external service (recommended for production) - set PDF_SERVICE_URL
 * 2. Use simple HTML-to-PDF conversion (fallback) - works without external services
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

  // Option 2: Simple HTML-to-PDF conversion using a basic approach
  // This creates a minimal PDF structure from HTML
  try {
    return await generateSimplePDFFromHTML(html, options);
  } catch (error) {
    console.error("Error generating simple PDF:", error);
    throw new Error(
      "PDF generation failed. Please set PDF_SERVICE_URL environment variable to use an external PDF service.\n" +
      "Recommended services: PDFShift (https://pdfshift.io), DocRaptor, or Browserless."
    );
  }
}

/**
 * Simple PDF generation from HTML using basic PDF structure
 * This is a fallback solution that works without external services
 */
async function generateSimplePDFFromHTML(
  html: string,
  options: PDFOptions = {},
): Promise<Buffer> {
  // Create a minimal PDF structure
  // This is a very basic implementation - for production, use a proper PDF service
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Extract text content from HTML (simple approach)
  const textContent = html
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Create a minimal PDF structure
  // PDF format: %PDF-1.4 header, objects, xref table, trailer
  const pdfLines: string[] = [];
  
  // PDF Header
  pdfLines.push('%PDF-1.4');
  
  // Catalog object (object 1)
  pdfLines.push('1 0 obj');
  pdfLines.push('<< /Type /Catalog /Pages 2 0 R >>');
  pdfLines.push('endobj');
  
  // Pages object (object 2)
  pdfLines.push('2 0 obj');
  pdfLines.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  pdfLines.push('endobj');
  
  // Page object (object 3)
  const pageWidth = mergedOptions.format === 'Letter' ? 612 : 595.28; // A4 width in points
  const pageHeight = mergedOptions.format === 'Letter' ? 792 : 841.89; // A4 height in points
  
  pdfLines.push('3 0 obj');
  pdfLines.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>`);
  pdfLines.push('endobj');
  
  // Content stream (object 4) - simple text rendering
  const content = `BT
/F1 12 Tf
50 ${pageHeight - 50} Td
(${escapePDFString(textContent.substring(0, 2000))}) Tj
ET`;
  
  pdfLines.push('4 0 obj');
  pdfLines.push(`<< /Length ${content.length} >>`);
  pdfLines.push('stream');
  pdfLines.push(content);
  pdfLines.push('endstream');
  pdfLines.push('endobj');
  
  // Font object (object 5) - Helvetica
  pdfLines.push('5 0 obj');
  pdfLines.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  pdfLines.push('endobj');
  
  // Cross-reference table
  const xrefOffset = pdfLines.join('\n').length;
  pdfLines.push('xref');
  pdfLines.push('0 6');
  pdfLines.push('0000000000 65535 f ');
  pdfLines.push('0000000009 00000 n ');
  pdfLines.push('0000000058 00000 n ');
  pdfLines.push('0000000115 00000 n ');
  pdfLines.push('0000000300 00000 n ');
  pdfLines.push('0000000400 00000 n ');
  
  // Trailer
  pdfLines.push('trailer');
  pdfLines.push('<< /Size 6 /Root 1 0 R >>');
  pdfLines.push('startxref');
  pdfLines.push(String(xrefOffset));
  pdfLines.push('%%EOF');
  
  return Buffer.from(pdfLines.join('\n'), 'utf-8');
}

/**
 * Escape special characters for PDF strings
 */
function escapePDFString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
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

