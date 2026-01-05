import { NextRequest, NextResponse } from "next/server";
import { getSupabaseStatic } from "@/lib/supabase-server";
import { trackCustomerQRCodeScan, getCustomerByQRCode } from "@/actions/customers-actions";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    if (!code) {
      return new NextResponse("QR-Code nicht gefunden", { status: 404 });
    }

    // Get customer by QR code
    const customer = await getCustomerByQRCode(code);

    if (!customer) {
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
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">❌</div>
    <h1>QR-Code nicht gefunden</h1>
    <p>Der gescannte QR-Code konnte nicht gefunden werden. Bitte überprüfen Sie den Code und versuchen Sie es erneut.</p>
  </div>
</body>
</html>`,
        {
          status: 404,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        }
      );
    }

    // Track scan (async, don't wait)
    const userAgent = request.headers.get("user-agent") || undefined;
    const referrer = request.headers.get("referer") || undefined;
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || 
                     request.headers.get("x-real-ip") || undefined;

    trackCustomerQRCodeScan(customer.qr_code!, customer.id, {
      user_agent: userAgent,
      referrer,
      ip_address: ipAddress,
    }).catch(() => {
      // Silently fail tracking
    });

    // Build address string
    const addressParts = [
      customer.address_line1,
      customer.address_line2,
      customer.postal_code && customer.city 
        ? `${customer.postal_code} ${customer.city}`
        : customer.city || customer.postal_code,
      customer.country,
    ].filter(Boolean);
    const address = addressParts.join(", ");

    // Render beautiful customer page
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${customer.name}${customer.company ? ` - ${customer.company}` : ""}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 600px;
      width: 100%;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      font-weight: bold;
      margin: 0 auto 20px;
      border: 3px solid rgba(255,255,255,0.3);
    }
    h1 {
      font-size: 28px;
      margin-bottom: 8px;
      font-weight: 700;
    }
    .company {
      font-size: 18px;
      opacity: 0.9;
      font-weight: 400;
    }
    .content {
      padding: 30px;
    }
    .info-section {
      margin-bottom: 24px;
    }
    .info-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;
      padding: 12px;
      background: #f7fafc;
      border-radius: 8px;
      transition: background 0.2s;
    }
    .info-item:hover {
      background: #edf2f7;
    }
    .info-icon {
      font-size: 20px;
      margin-right: 12px;
      min-width: 24px;
    }
    .info-content {
      flex: 1;
    }
    .info-label {
      font-size: 12px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .info-value {
      font-size: 16px;
      color: #2d3748;
      font-weight: 500;
      word-break: break-word;
    }
    .info-value a {
      color: #667eea;
      text-decoration: none;
    }
    .info-value a:hover {
      text-decoration: underline;
    }
    .footer {
      padding: 20px 30px;
      background: #f7fafc;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #a0aec0;
    }
    @media (max-width: 640px) {
      .header { padding: 30px 20px; }
      .content { padding: 20px; }
      h1 { font-size: 24px; }
      .company { font-size: 16px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="avatar">${customer.name.charAt(0).toUpperCase()}</div>
      <h1>${escapeHtml(customer.name)}</h1>
      ${customer.company ? `<div class="company">${escapeHtml(customer.company)}</div>` : ""}
    </div>
    <div class="content">
      ${customer.email ? `
      <div class="info-section">
        <div class="info-item">
          <div class="info-icon">📧</div>
          <div class="info-content">
            <div class="info-label">E-Mail</div>
            <div class="info-value"><a href="mailto:${escapeHtml(customer.email)}">${escapeHtml(customer.email)}</a></div>
          </div>
        </div>
      </div>
      ` : ""}
      ${customer.phone ? `
      <div class="info-section">
        <div class="info-item">
          <div class="info-icon">📱</div>
          <div class="info-content">
            <div class="info-label">Telefon</div>
            <div class="info-value"><a href="tel:${escapeHtml(customer.phone)}">${escapeHtml(customer.phone)}</a></div>
          </div>
        </div>
      </div>
      ` : ""}
      ${address ? `
      <div class="info-section">
        <div class="info-item">
          <div class="info-icon">📍</div>
          <div class="info-content">
            <div class="info-label">Adresse</div>
            <div class="info-value">${escapeHtml(address)}</div>
          </div>
        </div>
      </div>
      ` : ""}
      ${customer.tax_id ? `
      <div class="info-section">
        <div class="info-item">
          <div class="info-icon">🏢</div>
          <div class="info-content">
            <div class="info-label">Steuernummer</div>
            <div class="info-value">${escapeHtml(customer.tax_id)}</div>
          </div>
        </div>
      </div>
      ` : ""}
    </div>
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
      }
    );
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
      }
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
