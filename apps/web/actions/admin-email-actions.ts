"use server";

import { getCurrentUser } from "@/lib/session";
import { env } from "@/env.mjs";
import { siteConfig } from "@/config/site";
import { logger } from "@/lib/logger";
import { getSupabaseClient } from "@/lib/supabase";

export type EmailTemplate = {
  id: string;
  name: string;
  description: string;
  type: "magic-link" | "welcome" | "signup-confirmation" | "newsletter-confirmation" | "newsletter-unsubscribe";
  component: string;
};

export type ResendConfigStatus = {
  apiKeyConfigured: boolean;
  emailFromConfigured: boolean;
  status: "configured" | "partial" | "not_configured";
  message: string;
};

export async function getResendConfigStatus(): Promise<ResendConfigStatus> {
  const apiKeyConfigured = !!env.RESEND_API_KEY && env.RESEND_API_KEY.length > 0;
  const emailFromConfigured = !!env.EMAIL_FROM && env.EMAIL_FROM.length > 0;

  let status: "configured" | "partial" | "not_configured" = "not_configured";
  let message = "";

  if (apiKeyConfigured && emailFromConfigured) {
    status = "configured";
    message = "Resend ist vollständig konfiguriert";
  } else if (apiKeyConfigured || emailFromConfigured) {
    status = "partial";
    message = "Resend ist teilweise konfiguriert";
    if (!apiKeyConfigured) {
      message += " - RESEND_API_KEY fehlt";
    }
    if (!emailFromConfigured) {
      message += " - EMAIL_FROM fehlt";
    }
  } else {
    message = "Resend ist nicht konfiguriert - RESEND_API_KEY und EMAIL_FROM fehlen";
  }

  return {
    apiKeyConfigured,
    emailFromConfigured,
    status,
    message,
  };
}

export async function testResendConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const configStatus = await getResendConfigStatus();
  if (configStatus.status === "not_configured") {
    return {
      success: false,
      message: "Resend ist nicht konfiguriert. Bitte konfigurieren Sie RESEND_API_KEY und EMAIL_FROM.",
    };
  }

  try {
    // Try to verify the API key by checking Resend API
    const response = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      return {
        success: true,
        message: "Resend-Verbindung erfolgreich! Die API-Konfiguration ist korrekt.",
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        message: `Resend-Verbindung fehlgeschlagen: ${errorData.message || "Unbekannter Fehler"}`,
      };
    }
  } catch (error) {
    logger.error("Error testing Resend connection", error);
    return {
      success: false,
      message: `Fehler beim Testen der Resend-Verbindung: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
    };
  }
}

export async function sendTestEmail(
  templateType: EmailTemplate["type"],
  testEmail: string,
): Promise<{
  success: boolean;
  message: string;
  messageId?: string;
}> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const configStatus = await getResendConfigStatus();
  if (configStatus.status === "not_configured") {
    return {
      success: false,
      message: "Resend ist nicht konfiguriert. Bitte konfigurieren Sie RESEND_API_KEY und EMAIL_FROM.",
    };
  }

  try {
    // Use the Supabase Edge Function to send test emails
    const supabase = getSupabaseClient();
    
    // Prepare test data based on template type
    const testData: any = {
      type: templateType === "signup-confirmation" ? "confirmation" : templateType,
      email: testEmail,
      name: user.name || "Test User",
    };

    if (templateType === "magic-link" || templateType === "signup-confirmation") {
      testData.actionUrl = `${siteConfig.url}/auth/callback?token=test-token`;
      if (templateType === "magic-link") {
        testData.emailType = "login";
      }
    }

    if (templateType === "welcome") {
      testData.dashboardUrl = `${siteConfig.url}/dashboard`;
    }

    const { data, error } = await supabase.functions.invoke("send-email", {
      body: testData,
    });

    if (error) {
      logger.error("Error sending test email via edge function", error);
      return {
        success: false,
        message: `Fehler beim Senden der Test-E-Mail: ${error.message}`,
      };
    }

    logger.info(`Test email sent successfully for template ${templateType} to ${testEmail}`);
    return {
      success: true,
      message: `Test-E-Mail erfolgreich an ${testEmail} gesendet!`,
      messageId: data?.data?.id,
    };
  } catch (error) {
    logger.error("Error sending test email", error);
    return {
      success: false,
      message: `Fehler beim Senden der Test-E-Mail: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
    };
  }
}

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  return [
    {
      id: "magic-link",
      name: "Magic Link",
      description: "E-Mail für Login-Links und Account-Aktivierung",
      type: "magic-link",
      component: "magic-link-email.tsx",
    },
    {
      id: "welcome",
      name: "Welcome E-Mail",
      description: "Willkommens-E-Mail für neue Benutzer",
      type: "welcome",
      component: "welcome-email.tsx",
    },
    {
      id: "signup-confirmation",
      name: "Signup Confirmation",
      description: "Bestätigungs-E-Mail für neue Registrierungen",
      type: "signup-confirmation",
      component: "signup-confirmation.tsx",
    },
    {
      id: "newsletter-confirmation",
      name: "Newsletter Confirmation",
      description: "Bestätigungs-E-Mail für Newsletter-Anmeldungen",
      type: "newsletter-confirmation",
      component: "newsletter-confirmation.tsx",
    },
    {
      id: "newsletter-unsubscribe",
      name: "Newsletter Unsubscribe",
      description: "E-Mail für Newsletter-Abmeldungen",
      type: "newsletter-unsubscribe",
      component: "newsletter-unsubscribe.tsx",
    },
  ];
}

