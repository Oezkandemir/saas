import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { getDocument } from "@/actions/documents-actions";

import { applyAPIMiddleware } from "@/lib/api-middleware";
import { logger } from "@/lib/logger";
import { generateAndUploadPDF } from "@/lib/pdf/generator-vercel";
import { getSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds - needed for PDF generation

/**
 * GET /api/documents/[id]/pdf
 * Generates and returns PDF for a document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Apply middleware (auth + rate limiting)
    const middleware = await applyAPIMiddleware(request, {
      requireAuth: true,
      rateLimit: {
        endpoint: "/api/documents/[id]/pdf",
        useUserBasedLimit: true,
      },
    });

    if (!middleware.valid) {
      return middleware.response;
    }

    const user = middleware.user!;

    const { id } = await params;
    const document = await getDocument(id);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check if PDF already exists - validate it first
    if (document.pdf_url) {
      const url = new URL(request.url);
      // Only regenerate if explicitly requested with ?force=true
      if (url.searchParams.get("force") !== "true") {
        // Validate existing PDF is actually a PDF (not HTML/CSS)
        try {
          const pdfResponse = await fetch(document.pdf_url);
          if (pdfResponse.ok) {
            const pdfBuffer = await pdfResponse.arrayBuffer();
            const buffer = Buffer.from(pdfBuffer);
            // Check if it's a valid PDF (starts with %PDF)
            if (
              buffer.length >= 4 &&
              buffer.toString("ascii", 0, 4) === "%PDF"
            ) {
              // Valid PDF, return it
              return NextResponse.json({ pdfUrl: document.pdf_url });
            } else {
              // Invalid PDF (probably old HTML), regenerate it
              logger.warn("Invalid PDF detected, regenerating");
            }
          }
        } catch (error) {
          // Error fetching PDF, regenerate it
          logger.warn(
            `Error validating PDF, regenerating: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    }

    // PDF doesn't exist or force regeneration requested
    // Generate and upload PDF using pdf-lib (no HTML needed)
    const pdfUrl = await generateAndUploadPDF(document, "");

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
    logger.error("Error generating PDF:", error);

    // Always provide detailed error in development, simplified in production
    let errorMessage = "Fehler beim Generieren des PDFs";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error && typeof error === "object") {
      errorMessage =
        (error as any).message ||
        (error as any).error ||
        (error as any).toString?.() ||
        "Unbekannter Fehler beim Generieren des PDFs";
    }

    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        message: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents/[id]/pdf
 * Forces regeneration of PDF
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Apply middleware (auth + rate limiting)
    const middleware = await applyAPIMiddleware(request, {
      requireAuth: true,
      rateLimit: {
        endpoint: "/api/documents/[id]/pdf",
        useUserBasedLimit: true,
      },
    });

    if (!middleware.valid) {
      return middleware.response;
    }

    const user = middleware.user!;

    const { id } = await params;
    const document = await getDocument(id);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Generate and upload PDF using pdf-lib (force regeneration)
    const pdfUrl = await generateAndUploadPDF(document, "");

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
    logger.error("Error regenerating PDF:", error);

    // Always provide detailed error in development, simplified in production
    let errorMessage = "Fehler beim Regenerieren des PDFs";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error && typeof error === "object") {
      errorMessage =
        (error as any).message ||
        (error as any).error ||
        (error as any).toString?.() ||
        "Unbekannter Fehler beim Regenerieren des PDFs";
    }

    return NextResponse.json(
      {
        error: "Failed to regenerate PDF",
        message: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
