import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getDocument } from "@/actions/documents-actions";

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
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!document.pdf_url) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    // Fetch PDF from storage
    let pdfResponse;
    try {
      pdfResponse = await fetch(document.pdf_url, {
        headers: {
          "Accept": "application/pdf",
        },
      });
    } catch (fetchError) {
      console.error("Error fetching PDF from storage:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch PDF from storage" },
        { status: 500 },
      );
    }
    
    if (!pdfResponse.ok) {
      console.error("PDF fetch failed:", pdfResponse.status, pdfResponse.statusText);
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}` },
        { status: pdfResponse.status },
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Return PDF with proper headers for iframe embedding
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${document.document_number}.pdf"`,
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        // Allow iframe embedding
        "X-Frame-Options": "SAMEORIGIN",
        // CORS headers for iframe
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
    });
  } catch (error) {
    console.error("Error proxying PDF:", error);
    return NextResponse.json(
      { error: "Failed to load PDF" },
      { status: 500 },
    );
  }
}

