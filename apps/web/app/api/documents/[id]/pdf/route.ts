import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getDocument } from "@/actions/documents-actions";
import { generateAndUploadPDF } from "@/lib/pdf/generator";
import { generateInvoiceHTML } from "@/lib/pdf/templates";
import { getSupabaseServer } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds - needed for PDF generation

/**
 * GET /api/documents/[id]/pdf
 * Generates and returns PDF for a document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const document = await getDocument(id);

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check if PDF already exists - return it immediately if available
    if (document.pdf_url) {
      const url = new URL(request.url);
      // Only regenerate if explicitly requested with ?force=true
      if (url.searchParams.get("force") !== "true") {
        // Return existing PDF URL - it's always ready!
        return NextResponse.json({ pdfUrl: document.pdf_url });
      }
    }

    // PDF doesn't exist or force regeneration requested
    // Generate HTML content
    const htmlContent = generateInvoiceHTML(document);

    // Generate and upload PDF
    const pdfUrl = await generateAndUploadPDF(document, htmlContent);

    // Update document with PDF URL
    const supabase = await getSupabaseServer();
    await supabase
      .from("documents")
      .update({ pdf_url: pdfUrl })
      .eq("id", id)
      .eq("user_id", user.id);

    revalidatePath(`/dashboard/documents/${id}`);

    return NextResponse.json({ pdfUrl });
  } catch (error) {
    console.error("Error generating PDF:", error);
    
    // Always provide detailed error in development, simplified in production
    let errorMessage = "Fehler beim Generieren des PDFs";
    let errorDetails: any = null;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        message: error.message,
        name: error.name,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      };
    } else if (typeof error === "string") {
      errorMessage = error;
      errorDetails = { message: error };
    } else if (error && typeof error === "object") {
      errorDetails = error;
      errorMessage = (error as any).message || 
                     (error as any).error || 
                     (error as any).toString?.() ||
                     "Unbekannter Fehler beim Generieren des PDFs";
    }
    
    // Log full error details for debugging
    if (process.env.NODE_ENV === "development") {
      console.error("Full error details:", JSON.stringify(errorDetails, null, 2));
    }
    
    return NextResponse.json(
      { 
        error: "Failed to generate PDF",
        message: errorMessage,
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/documents/[id]/pdf
 * Forces regeneration of PDF
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const document = await getDocument(id);

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Generate HTML content
    const htmlContent = generateInvoiceHTML(document);

    // Generate and upload PDF (force regeneration)
    const pdfUrl = await generateAndUploadPDF(document, htmlContent);

    // Update document with PDF URL
    const supabase = await getSupabaseServer();
    await supabase
      .from("documents")
      .update({ pdf_url: pdfUrl })
      .eq("id", id)
      .eq("user_id", user.id);

    revalidatePath(`/dashboard/documents/${id}`);

    return NextResponse.json({ pdfUrl });
  } catch (error) {
    console.error("Error regenerating PDF:", error);
    
    // Always provide detailed error in development, simplified in production
    let errorMessage = "Fehler beim Regenerieren des PDFs";
    let errorDetails: any = null;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        message: error.message,
        name: error.name,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      };
    } else if (typeof error === "string") {
      errorMessage = error;
      errorDetails = { message: error };
    } else if (error && typeof error === "object") {
      errorDetails = error;
      errorMessage = (error as any).message || 
                     (error as any).error || 
                     (error as any).toString?.() ||
                     "Unbekannter Fehler beim Regenerieren des PDFs";
    }
    
    // Log full error details for debugging
    if (process.env.NODE_ENV === "development") {
      console.error("Full error details:", JSON.stringify(errorDetails, null, 2));
    }
    
    return NextResponse.json(
      { 
        error: "Failed to regenerate PDF",
        message: errorMessage,
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}

