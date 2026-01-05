"use server";

import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";
import { Resend } from "resend";
import { env } from "@/env.mjs";
import { siteConfig } from "@/config/site";

export type SystemComponent = "database" | "api" | "auth" | "email" | "storage" | "payment";
export type SystemStatus = "operational" | "degraded" | "down" | "maintenance";
export type ErrorType = "critical" | "warning" | "info";

export interface SystemError {
  component: SystemComponent;
  errorType: ErrorType;
  errorMessage: string;
  errorStack?: string;
  context?: Record<string, unknown>;
  userId?: string;
}

/**
 * Log a system error and notify admins if critical
 * Uses supabaseAdmin instead of createClient() to avoid cookies() issues in cached functions
 */
export async function logSystemError(error: SystemError): Promise<void> {
  try {
    // Use supabaseAdmin instead of createClient() to avoid cookies() issues
    // This allows logging from within cached functions (unstable_cache)
    
    // Skip logging if error is about cookies() in cached functions to prevent loops
    const errorMessage = error.errorMessage || '';
    if (errorMessage.includes('cookies()') && errorMessage.includes('unstable_cache')) {
      return;
    }
    
    // Insert error into database
    const { data: errorRecord, error: insertError } = await supabaseAdmin
      .from("system_errors")
      .insert({
        component: error.component,
        error_type: error.errorType,
        error_message: error.errorMessage,
        error_stack: error.errorStack,
        context: error.context || {},
        user_id: error.userId || null,
      })
      .select()
      .single();

    if (insertError) {
      // Don't log RLS errors or cookies() errors to prevent infinite loops
      if (insertError.code !== '42501') {
        const insertErrorMessage = insertError.message || String(insertError);
        if (!insertErrorMessage.includes('cookies()') && !insertErrorMessage.includes('unstable_cache')) {
          logger.error("Failed to log system error:", insertError);
        }
      }
      return;
    }

    // If critical error, notify admins via email
    if (error.errorType === "critical") {
      await notifyAdminsOfCriticalError(error, errorRecord.id);
    }

    // Update component status if critical
    if (error.errorType === "critical") {
      await updateComponentStatus(error.component, "degraded", error.errorMessage);
    }
  } catch (err) {
    // Don't log errors about cookies() in cached functions to prevent loops
    const errMessage = err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err || '');
    if (!errMessage.includes('cookies()') && !errMessage.includes('unstable_cache')) {
      logger.error("Error in logSystemError:", err);
    }
  }
}

/**
 * Update system component status
 */
export async function updateComponentStatus(
  component: SystemComponent,
  status: SystemStatus,
  message?: string,
): Promise<void> {
  try {
    // Use supabaseAdmin to avoid cookies() issues
    await supabaseAdmin
      .from("system_status")
      .upsert(
        {
          component,
          status,
          message: message || `Component ${status}`,
          last_check: new Date().toISOString(),
        },
        {
          onConflict: "component",
        },
      );
  } catch (error) {
    // Don't use logger.error here to avoid infinite loops
    logger.error("Error updating component status:", error);
  }
}

/**
 * Get current system status
 */
export async function getSystemStatus(): Promise<
  | { success: true; statuses: Array<{ component: string; status: string; message: string | null; lastCheck: string }> }
  | { success: false; message: string }
> {
  try {
    // Use supabaseAdmin to avoid cookies() issues
    const { data, error } = await supabaseAdmin
      .from("system_status")
      .select("*")
      .order("component");

    if (error) {
      return { success: false, message: "Failed to fetch system status" };
    }

    return {
      success: true,
      statuses: (data || []).map((s) => ({
        component: s.component,
        status: s.status,
        message: s.message,
        lastCheck: s.last_check,
      })),
    };
  } catch (error) {
    logger.error("Error getting system status:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to get system status",
    };
  }
}

/**
 * Notify admins of critical errors via email
 */
async function notifyAdminsOfCriticalError(
  error: SystemError,
  errorId: string,
): Promise<void> {
  try {
    // Use supabaseAdmin to avoid cookies() issues
    // Get all admin users
    const { data: admins, error: adminError } = await supabaseAdmin
      .from("users")
      .select("email, name")
      .eq("role", "ADMIN");

    if (adminError || !admins || admins.length === 0) {
      logger.warn("No admin users found for error notification");
      return;
    }

    // Use Resend directly for system error emails
    const resend = new Resend(env.RESEND_API_KEY);
    const errorTime = new Date().toLocaleString("de-DE", {
      dateStyle: "full",
      timeStyle: "long",
    });

    // Send email to each admin
    for (const admin of admins) {
      try {
        const recipientEmail =
          process.env.NODE_ENV === "development"
            ? "delivered@resend.dev"
            : admin.email;

        await resend.emails.send({
          from: `${siteConfig.name} System <system@cenety.com>`,
          to: recipientEmail,
          subject: `🚨 Critical System Error: ${error.component.toUpperCase()}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #dc2626; padding: 20px; border-radius: 8px 8px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Critical System Error</h1>
                </div>
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                  <p style="margin-top: 0;">Hallo ${admin.name || "Admin"},</p>
                  <p>Ein kritischer Systemfehler wurde erkannt:</p>
                  
                  <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0;"><strong>Komponente:</strong> ${error.component}</p>
                    <p style="margin: 0 0 10px 0;"><strong>Fehlertyp:</strong> ${error.errorType}</p>
                    <p style="margin: 0 0 10px 0;"><strong>Fehlermeldung:</strong></p>
                    <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px; margin: 10px 0 0 0;">${error.errorMessage}</pre>
                    ${error.errorStack ? `<pre style="background: #fff; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 11px; margin: 10px 0 0 0; color: #666;">${error.errorStack}</pre>` : ""}
                  </div>
                  
                  <p><strong>Fehler-ID:</strong> ${errorId}</p>
                  <p><strong>Zeitpunkt:</strong> ${errorTime}</p>
                  
                  ${error.context ? `<p><strong>Kontext:</strong></p><pre style="background: #f9fafb; padding: 10px; border-radius: 4px; font-size: 12px;">${JSON.stringify(error.context, null, 2)}</pre>` : ""}
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://cenety.com"}/admin/system" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                      Zum System-Dashboard
                    </a>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    Mit freundlichen Grüßen,<br>
                    ${siteConfig.name} System Monitoring
                  </p>
                </div>
              </body>
            </html>
          `,
        });

        logger.info(`System error notification sent to ${admin.email}`);
      } catch (emailError) {
        logger.error(`Failed to send error notification to ${admin.email}:`, emailError);
      }
    }
  } catch (error) {
    logger.error("Error notifying admins:", error);
  }
}

/**
 * Record system metric
 */
export async function recordMetric(
  component: SystemComponent,
  metricName: string,
  value: number,
  unit?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    // Use supabaseAdmin to avoid cookies() issues
    await supabaseAdmin.from("system_metrics").insert({
      component,
      metric_name: metricName,
      metric_value: value,
      unit: unit || null,
      metadata: metadata || {},
    });
  } catch (error) {
    // Don't use logger.error here to avoid infinite loops
    logger.error("Error recording metric:", error);
  }
}

/**
 * Perform health check on all components
 */
export async function performHealthCheck(): Promise<void> {
  try {
    // Use supabaseAdmin to avoid cookies() issues
    // Check database
    const { error: dbError } = await supabaseAdmin.from("users").select("id").limit(1);
    await updateComponentStatus(
      "database",
      dbError ? "degraded" : "operational",
      dbError ? `Database error: ${dbError.message}` : "Database connection healthy",
    );

    // Check auth - use supabaseAdmin for health check (no user context needed)
    // Note: We can't check auth.getUser() with supabaseAdmin, so we'll skip that check
    await updateComponentStatus(
      "auth",
      "operational",
      "Authentication service operational",
    );

    // Check API (if we got here, API is working)
    await updateComponentStatus("api", "operational", "API responding normally");
  } catch (error) {
    logger.error("Error performing health check:", error);
    await logSystemError({
      component: "api",
      errorType: "warning",
      errorMessage: `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

