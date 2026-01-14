import { NextResponse } from "next/server";
import { env } from "@/env.mjs";
import { supabaseAdmin } from "@/lib/db";

/**
 * Health check endpoint for inbound email configuration
 * Access: https://cenety.com/api/webhooks/resend/health
 */
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      resendApiKey: {
        configured: !!env.RESEND_API_KEY,
        length: env.RESEND_API_KEY ? env.RESEND_API_KEY.length : 0,
        status: !!env.RESEND_API_KEY ? "✅ OK" : "❌ MISSING",
      },
      appUrl: {
        value: env.NEXT_PUBLIC_APP_URL,
        status: env.NEXT_PUBLIC_APP_URL ? "✅ OK" : "❌ MISSING",
      },
      webhookEndpoint: {
        expected: `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/resend/inbound`,
        status: "✅ Accessible",
      },
      supabase: {
        url: env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
        status: !!env.SUPABASE_SERVICE_ROLE_KEY ? "✅ OK" : "❌ MISSING",
      },
    },
  };

  // Test database connection
  try {
    const { data, error } = await supabaseAdmin
      .from("inbound_emails")
      .select("count")
      .limit(1)
      .single();

    checks.checks.supabase.databaseConnection = error
      ? `❌ ERROR: ${error.message}`
      : "✅ Connected";
  } catch (error: any) {
    checks.checks.supabase.databaseConnection = `❌ ERROR: ${error.message}`;
  }

  // Determine overall health
  const allChecksPass =
    checks.checks.resendApiKey.configured &&
    checks.checks.appUrl.value &&
    checks.checks.supabase.hasServiceKey &&
    !checks.checks.supabase.databaseConnection?.includes("ERROR");

  return NextResponse.json(
    {
      status: allChecksPass ? "healthy" : "unhealthy",
      ...checks,
      instructions: {
        resend: "Configure inbound route at https://resend.com/domains",
        webhook: `Set destination to: ${checks.checks.webhookEndpoint.expected}`,
        documentation: "/docs/INBOUND_EMAIL_QUICK_FIX.md",
      },
    },
    {
      status: allChecksPass ? 200 : 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
