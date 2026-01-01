import { NextRequest, NextResponse } from "next/server";
import { getSupabaseStatic } from "@/lib/supabase-server";
import { trackQRCodeScan } from "@/actions/qr-codes-actions";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code: codeParam } = await params;
    const code = codeParam.toUpperCase();
    const supabase = getSupabaseStatic();

    // Get QR code
    const { data: qrCode, error } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .single();

    if (error || !qrCode) {
      return new NextResponse("QR-Code nicht gefunden", { status: 404 });
    }

    // Track scan (async, don't wait)
    const userAgent = request.headers.get("user-agent") || undefined;
    const referrer = request.headers.get("referer") || undefined;
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || 
                     request.headers.get("x-real-ip") || undefined;

    trackQRCodeScan(qrCode.code, {
      user_agent: userAgent,
      referrer,
      ip_address: ipAddress,
    }).catch(() => {
      // Silently fail tracking
    });

    // Handle different types
    switch (qrCode.type) {
      case "url":
        // Validate URL to prevent open redirects
        const url = qrCode.destination;
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          return new NextResponse("Ungültige URL", { status: 400 });
        }
        return NextResponse.redirect(url, { status: 302 });

      case "pdf":
        // Redirect to PDF URL
        const pdfUrl = qrCode.destination;
        if (!pdfUrl.startsWith("http://") && !pdfUrl.startsWith("https://")) {
          return new NextResponse("Ungültige PDF-URL", { status: 400 });
        }
        return NextResponse.redirect(pdfUrl, { status: 302 });

      case "text":
        // Render text page
        return new NextResponse(
          `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR-Code Inhalt</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 600px;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .text {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 16px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="text">${qrCode.destination.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
  </div>
</body>
</html>`,
          {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
            },
          },
        );

      case "whatsapp":
        // Build WhatsApp URL
        const phone = qrCode.destination.replace(/[^0-9+]/g, "");
        const whatsappUrl = `https://wa.me/${phone}`;
        return NextResponse.redirect(whatsappUrl, { status: 302 });

      case "maps":
        // Build Google Maps URL
        const address = encodeURIComponent(qrCode.destination);
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${address}`;
        return NextResponse.redirect(mapsUrl, { status: 302 });

      default:
        return new NextResponse("Unbekannter QR-Code-Typ", { status: 400 });
    }
  } catch (error) {
    console.error("QR redirect error:", error);
    return new NextResponse("Fehler beim Verarbeiten des QR-Codes", {
      status: 500,
    });
  }
}

