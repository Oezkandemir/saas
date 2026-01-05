import { NextRequest, NextResponse } from "next/server";
import { trackQRCodeScan } from "@/actions/qr-codes-actions";

import { logger } from "@/lib/logger";
import { getSupabaseStatic } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

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
      logger.error("QR code not found:", { code, error });
      return new NextResponse(
        `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR-Code nicht gefunden</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 500px;
      width: 100%;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    h1 {
      color: #1a202c;
      font-size: 24px;
      margin-bottom: 12px;
    }
    p {
      color: #718096;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 8px;
    }
    .code {
      font-family: monospace;
      background: #f7fafc;
      padding: 8px 12px;
      border-radius: 6px;
      color: #2d3748;
      font-size: 14px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">❌</div>
    <h1>QR-Code nicht gefunden</h1>
    <p>Der gescannte QR-Code konnte nicht gefunden werden.</p>
    <p>Bitte überprüfen Sie den Code und versuchen Sie es erneut.</p>
    <div class="code">Code: ${escapeHtml(code)}</div>
  </div>
</body>
</html>`,
        {
          status: 404,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        },
      );
    }

    // Track scan (async, don't wait)
    const userAgent = request.headers.get("user-agent") || undefined;
    const referrer = request.headers.get("referer") || undefined;
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      undefined;

    trackQRCodeScan(qrCode.code, {
      user_agent: userAgent,
      referrer,
      ip_address: ipAddress,
    }).catch(() => {
      // Silently fail tracking
    });

    // Handle different types
    switch (qrCode.type) {
      case "url": {
        // Validate URL to prevent open redirects
        const url = qrCode.destination;
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          return new NextResponse("Ungültige URL", { status: 400 });
        }
        return NextResponse.redirect(url, { status: 302 });
      }

      case "pdf": {
        // Redirect to PDF URL
        const pdfUrl = qrCode.destination;
        if (!pdfUrl.startsWith("http://") && !pdfUrl.startsWith("https://")) {
          return new NextResponse("Ungültige PDF-URL", { status: 400 });
        }
        return NextResponse.redirect(pdfUrl, { status: 302 });
      }

      case "text": {
        // Render text page
        const escapedText = qrCode.destination
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");

        return new NextResponse(
          `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR-Code Inhalt</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      max-width: 600px;
      width: 100%;
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e2e8f0;
    }
    .header h1 {
      font-size: 24px;
      color: #2d3748;
      margin-bottom: 8px;
    }
    .header p {
      font-size: 14px;
      color: #718096;
    }
    .text {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 18px;
      line-height: 1.8;
      color: #2d3748;
      text-align: center;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
    }
    .footer-text {
      font-size: 12px;
      color: #a0aec0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(qrCode.name)}</h1>
      <p>QR-Code Inhalt</p>
    </div>
    <div class="text">${escapedText}</div>
    <div class="footer">
      <div class="footer-text">Gescannt via Cenety QR-Code</div>
    </div>
  </div>
</body>
</html>`,
          {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
            },
          },
        );
      }

      case "whatsapp": {
        // Build WhatsApp URL
        const phone = qrCode.destination.replace(/[^0-9+]/g, "");
        const whatsappUrl = `https://wa.me/${phone}`;
        return NextResponse.redirect(whatsappUrl, { status: 302 });
      }

      case "maps": {
        // Build Google Maps URL
        const address = encodeURIComponent(qrCode.destination);
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${address}`;
        return NextResponse.redirect(mapsUrl, { status: 302 });
      }

      default:
        return new NextResponse("Unbekannter QR-Code-Typ", { status: 400 });
    }
  } catch (error) {
    logger.error("QR redirect error:", error);
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fehler</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 500px;
      width: 100%;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    h1 {
      color: #1a202c;
      font-size: 24px;
      margin-bottom: 12px;
    }
    p {
      color: #718096;
      font-size: 16px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">⚠️</div>
    <h1>Fehler beim Verarbeiten</h1>
    <p>Es ist ein Fehler beim Verarbeiten des QR-Codes aufgetreten. Bitte versuchen Sie es später erneut.</p>
  </div>
</body>
</html>`,
      {
        status: 500,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      },
    );
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
