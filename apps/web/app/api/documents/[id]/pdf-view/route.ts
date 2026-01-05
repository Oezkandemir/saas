import { NextRequest, NextResponse } from "next/server";
import { getDocument } from "@/actions/documents-actions";

import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/documents/[id]/pdf-view
 * Proxies PDF for iframe preview (handles CORS and CSP)
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
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    if (!document.pdf_url) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    // Fetch PDF from storage
    let pdfResponse;
    try {
      pdfResponse = await fetch(document.pdf_url, {
        headers: {
          Accept: "application/pdf",
        },
      });
    } catch (fetchError) {
      logger.error("Error fetching PDF from storage:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch PDF from storage" },
        { status: 500 },
      );
    }

    if (!pdfResponse.ok) {
      logger.error("PDF fetch failed", {
        status: pdfResponse.status,
        statusText: pdfResponse.statusText,
      });
      return NextResponse.json(
        {
          error: `Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`,
        },
        { status: pdfResponse.status },
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // SECURITY: Get origin from request for CORS
    const origin = request.headers.get("origin");
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      // Add other allowed origins from env if needed
      ...(process.env.ALLOWED_ORIGINS?.split(",") || []),
    ].filter(Boolean) as string[];

    // SECURITY: Only allow same-origin or explicitly allowed origins
    const isAllowedOrigin =
      !origin ||
      origin === request.nextUrl.origin ||
      (origin && allowedOrigins.some((allowed) => origin.startsWith(allowed)));

    // Return PDF with proper headers for iframe embedding
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${document.document_number}.pdf"`,
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        // Allow iframe embedding only from same origin
        "X-Frame-Options": "SAMEORIGIN",
        // SECURITY: CORS headers - only allow same-origin or explicitly allowed origins
        ...(isAllowedOrigin
          ? {
              "Access-Control-Allow-Origin": origin || request.nextUrl.origin,
              "Access-Control-Allow-Methods": "GET",
              "Access-Control-Allow-Credentials": "true",
            }
          : {}),
      },
    });
  } catch (error) {
    logger.error("Error proxying PDF:", error);
    return NextResponse.json({ error: "Failed to load PDF" }, { status: 500 });
  }
}
