import { redirect } from "next/navigation";
import { getLocale, setRequestLocale } from "next-intl/server";
import { env } from "@/env.mjs";
import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";

export async function generateMetadata() {
  const locale = await getLocale();
  setRequestLocale(locale);

  return constructMetadata({
    title: "Email Webhook Debug",
    description: "Debug inbound email configuration",
  });
}

export default async function AdminEmailsDebugPage() {
  const user = await getCurrentUser();

  if (!user?.id) redirect("/login");

  // Check for ADMIN role
  const isAdmin = user.role === "ADMIN";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Check environment configuration
  const checks = {
    resendApiKey: !!env.RESEND_API_KEY,
    resendApiKeyLength: env.RESEND_API_KEY?.length || 0,
    emailFrom: env.EMAIL_FROM || "Not set",
    appUrl: env.NEXT_PUBLIC_APP_URL,
    webhookUrl: `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/resend/inbound`,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceRoleKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">
        Email Webhook Configuration Debug
      </h1>

      <div className="space-y-6">
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">RESEND_API_KEY configured:</span>
              <span
                className={
                  checks.resendApiKey ? "text-green-600" : "text-red-600"
                }
              >
                {checks.resendApiKey ? "✓ Yes" : "✗ No"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">RESEND_API_KEY length:</span>
              <span>{checks.resendApiKeyLength} characters</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">EMAIL_FROM:</span>
              <span className="font-mono text-sm">{checks.emailFrom}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">NEXT_PUBLIC_APP_URL:</span>
              <span className="font-mono text-sm">{checks.appUrl}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Supabase Service Role Key:</span>
              <span
                className={
                  checks.hasServiceRoleKey ? "text-green-600" : "text-red-600"
                }
              >
                {checks.hasServiceRoleKey ? "✓ Configured" : "✗ Missing"}
              </span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-4">Webhook Configuration</h2>
          <div className="space-y-3">
            <div>
              <p className="font-medium mb-2">Expected Webhook URL:</p>
              <code className="block p-3 bg-muted rounded text-sm break-all">
                {checks.webhookUrl}
              </code>
            </div>
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ Resend Configuration Steps:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
                <li>
                  Go to{" "}
                  <a
                    href="https://resend.com/domains"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Resend Domains
                  </a>
                </li>
                <li>Click on your domain (e.g., cenety.com)</li>
                <li>Go to "Inbound" tab</li>
                <li>Click "Add Inbound Route"</li>
                <li>Set destination to the webhook URL above</li>
                <li>
                  Match pattern: Use "*@cenety.com" or specific email like
                  "support@cenety.com"
                </li>
                <li>Make sure the route is enabled</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-4">DNS Configuration</h2>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              For inbound emails, you need an MX record pointing to Resend's
              mail servers:
            </p>
            <div className="bg-muted p-4 rounded space-y-2 font-mono text-sm">
              <div>
                <span className="font-semibold">Type:</span> MX
              </div>
              <div>
                <span className="font-semibold">Name:</span> @ (or your
                subdomain)
              </div>
              <div>
                <span className="font-semibold">Value:</span>{" "}
                feedback-smtp.resend.com
              </div>
              <div>
                <span className="font-semibold">Priority:</span> 10
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Note: Check your Resend domain settings for the exact MX records
              you need.
            </p>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-4">Testing</h2>
          <div className="space-y-3">
            <div>
              <p className="font-medium mb-2">
                1. Health Check (Detailed Status):
              </p>
              <a
                href="/api/webhooks/resend/health"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Check Configuration Health
              </a>
              <p className="text-xs text-muted-foreground mt-2">
                Returns detailed JSON with all configuration checks and database
                connectivity
              </p>
            </div>
            <div className="mt-4">
              <p className="font-medium mb-2">
                2. Test Webhook Endpoint (GET):
              </p>
              <a
                href="/api/webhooks/resend/inbound"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Test Webhook Endpoint
              </a>
              <p className="text-xs text-muted-foreground mt-2">
                Should return:{" "}
                {`{"message":"Resend Inbound Email Webhook Endpoint","status":"active"}`}
              </p>
            </div>
            <div className="mt-4">
              <p className="font-medium mb-2">3. Send Test Email:</p>
              <p className="text-sm text-muted-foreground">
                Send an email to your configured inbound address (e.g.,
                support@cenety.com) from an external email account. Check the
                admin emails page to see if it appears.
              </p>
            </div>
            <div className="mt-4">
              <p className="font-medium mb-2">4. Check Resend Logs:</p>
              <p className="text-sm text-muted-foreground">
                Go to{" "}
                <a
                  href="https://resend.com/logs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600"
                >
                  Resend Logs
                </a>{" "}
                to see webhook delivery attempts and any errors.
              </p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <h2 className="text-xl font-semibold mb-4 text-red-800 dark:text-red-200">
            Common Issues
          </h2>
          <ul className="space-y-2 text-sm text-red-700 dark:text-red-300">
            <li>
              <strong>1. Webhook URL mismatch:</strong> Make sure the webhook
              URL in Resend matches your production domain exactly
            </li>
            <li>
              <strong>2. Missing MX records:</strong> DNS must have MX records
              pointing to Resend's servers
            </li>
            <li>
              <strong>3. Route not enabled:</strong> Check that the inbound
              route is enabled in Resend dashboard
            </li>
            <li>
              <strong>4. Email pattern mismatch:</strong> The "from" pattern in
              Resend route must match incoming emails
            </li>
            <li>
              <strong>5. Environment variables:</strong> Make sure
              RESEND_API_KEY and other vars are set in production
            </li>
            <li>
              <strong>6. Supabase connection:</strong> Check that Supabase
              credentials are correct in production
            </li>
            <li>
              <strong>7. Function timeout:</strong> Vercel serverless functions
              have a 10s timeout by default
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
